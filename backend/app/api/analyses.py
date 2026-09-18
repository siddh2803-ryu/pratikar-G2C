"""Core analyses API router for Pratikar.
Implements the 6 session-scoped endpoints specified in Tech Stack §5.4 and PRD §8.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, status
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from app.db.database import db
from app.ingestion.validator import validate_file_upload, ValidationError
from app.ingestion.parser import parse_policy_pdf
from app.extraction.extractor import ClaimExtractor
from app.rules.rule_engine import IRDAIRuleEngine
from app.retrieval.retriever import ClauseRetriever, ClauseNotFoundError
from app.merge.grounding_gate import merge_and_assemble_verdict, GroundingGateError
from app.generation.appeal_pdf import build_appeal_pdf
from demo_cases.demo_data import DEMO_REGISTRY
from app.models.schemas import AnalysisResponse, Verdict, StructuredClaimRecord

router = APIRouter(prefix="/api/analyses", tags=["analyses"])
rule_engine = IRDAIRuleEngine()
extractor = ClaimExtractor()
retriever = ClauseRetriever()


class AppealRequest(BaseModel):
    language: str = "en"


@router.post("", status_code=status.HTTP_201_CREATED)
async def start_analysis(
    rejection_letter: UploadFile = File(...),
    policy_wording: UploadFile = File(...),
    language: str = Form("en"),
):
    """1. POST /api/analyses: Starts an analysis from the two documents (PRD FR-01)."""
    # 1. Read files
    letter_bytes = await rejection_letter.read()
    policy_bytes = await policy_wording.read()

    # 2. Validate files (Format, size, signatures)
    try:
        validate_file_upload(rejection_letter.filename, letter_bytes)
        validate_file_upload(policy_wording.filename, policy_bytes)
    except ValidationError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": ve.code, "message": ve.message},
        )

    # 3. Create Session
    analysis_id = db.create_session()
    db.store_document(analysis_id, "rejection_letter", rejection_letter.filename, letter_bytes)
    db.store_document(analysis_id, "policy_wording", policy_wording.filename, policy_bytes)

    # 4. Parse policy PDF into page-scoped chunks (preserves page numbers)
    try:
        policy_chunks = parse_policy_pdf(policy_bytes, document_id=f"pol_{analysis_id[:8]}")
    except ValidationError as ve:
        db.update_session(analysis_id, {"status": "failed", "error": {"code": ve.code, "message": ve.message}})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": ve.code, "message": ve.message},
        )
    except Exception as e:
        db.update_session(analysis_id, {"status": "failed", "error": {"code": "PARSE_ERROR", "message": str(e)}})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PARSE_ERROR", "message": f"Could not parse policy wording PDF: {str(e)}"},
        )

    # 5. Extract structured claim record from rejection letter
    try:
        claim_record = extractor.extract(letter_bytes, rejection_letter.filename)
    except ValidationError as ve:
        db.update_session(analysis_id, {"status": "failed", "error": {"code": ve.code, "message": ve.message}})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": ve.code, "message": ve.message},
        )

    # 6. Path A: Evaluate IRDAI Rules (Deterministic, no model)
    rule_results = rule_engine.evaluate_all(claim_record)

    # 7. Path B: Retrieve cited clause verbatim with page reference
    policy_span = None
    clause_error_msg = None
    if claim_record.cited_clause_ref:
        try:
            policy_span = retriever.retrieve_clause(
                chunks=policy_chunks,
                clause_ref=claim_record.cited_clause_ref,
                stated_ground=claim_record.stated_ground,
            )
        except ClauseNotFoundError as cne:
            clause_error_msg = cne.message

    # 8. Merge and Grounding Gate
    try:
        verdict = merge_and_assemble_verdict(
            claim=claim_record,
            rule_results=rule_results,
            policy_span=policy_span,
            clause_error_msg=clause_error_msg,
        )
    except GroundingGateError as gge:
        db.update_session(analysis_id, {"status": "failed", "error": {"code": "UNGROUNDABLE", "message": gge.message}})
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "UNGROUNDABLE", "message": gge.message},
        )

    # 9. Update DB session state
    db.update_session(
        analysis_id,
        {
            "status": "complete",
            "claim_record": claim_record,
            "policy_chunks": policy_chunks,
            "verdict": verdict,
            "language": language,
        },
    )

    return {
        "analysis_id": analysis_id,
        "status": "complete",
        "message": "Analysis completed successfully with zero grounding violations.",
    }


@router.get("/{analysis_id}")
def get_analysis(analysis_id: str):
    """2. GET /api/analyses/{id}: Poll status / retrieve claim record, verdict, and evidence items."""
    # Check if pre-cached demo case requested
    if analysis_id in DEMO_REGISTRY:
        demo = DEMO_REGISTRY[analysis_id]
        return {
            "analysis_id": demo["analysis_id"],
            "status": demo["status"],
            "claim_record": demo["claim_record"],
            "verdict": demo["verdict"],
            "appeal_available": demo["verdict"]["appeal_available"],
            "grounds_letter_available": demo["verdict"]["grounds_letter_available"],
        }

    session = db.get_session(analysis_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Analysis session not found or expired."},
        )

    return {
        "analysis_id": session["analysis_id"],
        "status": session["status"],
        "claim_record": session["claim_record"],
        "verdict": session["verdict"],
        "error": session.get("error"),
    }


@router.get("/{analysis_id}/evidence/{evidence_ref}")
def resolve_evidence(analysis_id: str, evidence_ref: str):
    """3. GET /api/analyses/{id}/evidence/{ref}: Resolve citation to exact source text and page."""
    # Check demo cases
    if analysis_id in DEMO_REGISTRY:
        demo = DEMO_REGISTRY[analysis_id]
        for ev in demo["verdict"]["evidence_trail"]:
            if ev["id"] == evidence_ref or str(ev["ordinal"]) == evidence_ref:
                return ev

    session = db.get_session(analysis_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis session not found.")

    verdict: Optional[Verdict] = session.get("verdict")
    if not verdict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verdict not yet generated.")

    for ev in verdict.evidence_trail:
        if ev.id == evidence_ref or str(ev.ordinal) == evidence_ref:
            return ev.model_dump()

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Evidence reference '{evidence_ref}' not found.",
    )


@router.post("/{analysis_id}/appeal")
def generate_appeal(analysis_id: str, request: AppealRequest):
    """4. POST /api/analyses/{id}/appeal: Generates the appeal document (en or hi)."""
    lang = request.language

    # Handle demo cases
    if analysis_id in DEMO_REGISTRY:
        demo = DEMO_REGISTRY[analysis_id]
        verdict_dict = demo["verdict"]
        if not verdict_dict.get("appeal_available") and not verdict_dict.get("grounds_letter_available"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Where the rejection is valid (Weak verdict), no appeal is generated (PRD FR-12).",
            )
        claim = StructuredClaimRecord(**demo["claim_record"])
        verdict = Verdict(**verdict_dict)
        kind = "grounds_request" if verdict.flow == "flow_c" else "gro_letter"
        pdf_bytes = build_appeal_pdf(claim, verdict, kind=kind, language=lang)
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        db.store_generated_doc(analysis_id, doc_id, kind, pdf_bytes, language=lang)
        return {"document_id": doc_id, "kind": kind, "language": lang, "status": "ready"}

    session = db.get_session(analysis_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis session not found.")

    verdict: Optional[Verdict] = session.get("verdict")
    claim: Optional[StructuredClaimRecord] = session.get("claim_record")
    if not verdict or not claim:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Analysis not complete.")

    if not verdict.appeal_available and not verdict.grounds_letter_available:
        # Flow B / Weak verdict enforcement (PRD FR-12)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Where the rejection is valid (Weak verdict), no appeal is generated (PRD FR-12).",
        )

    kind = "grounds_request" if verdict.flow == "flow_c" else "gro_letter"
    pdf_bytes = build_appeal_pdf(claim, verdict, kind=kind, language=lang)
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    db.store_generated_doc(analysis_id, doc_id, kind, pdf_bytes, language=lang)

    return {"document_id": doc_id, "kind": kind, "language": lang, "status": "ready"}


@router.get("/{analysis_id}/appeal/{doc_id}")
def download_appeal(analysis_id: str, doc_id: str):
    """5. GET /api/analyses/{id}/appeal/{docId}: Download appeal as PDF."""
    doc_info = db.get_generated_doc(analysis_id, doc_id)
    if not doc_info:
        # If demo case and not yet generated in session, generate on the fly
        if analysis_id in DEMO_REGISTRY:
            demo = DEMO_REGISTRY[analysis_id]
            claim = StructuredClaimRecord(**demo["claim_record"])
            verdict = Verdict(**demo["verdict"])
            kind = "grounds_request" if verdict.flow == "flow_c" else "gro_letter"
            pdf_bytes = build_appeal_pdf(claim, verdict, kind=kind)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=pratikar_appeal_{analysis_id}.pdf"},
            )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated document not found.")

    filename = f"pratikar_{doc_info['kind']}_{analysis_id[:8]}.pdf"
    return Response(
        content=doc_info["bytes"],
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/{analysis_id}")
def dispose_session(analysis_id: str):
    """6. DELETE /api/analyses/{id}: Discards session and uploaded documents (PRD FR-13)."""
    success = db.delete_session(analysis_id)
    return {
        "status": "success" if success else "not_found",
        "message": "Session and uploaded documents permanently deleted.",
    }
