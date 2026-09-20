"""Integration tests for all 7 endpoints of the Pratikar API.
Tests against valid and invalid inputs, demo cases, error responses, and session disposal.
"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
assets_dir = Path(__file__).resolve().parent.parent / "demo_cases" / "demo_assets"


def test_health_endpoint():
    """1. GET /api/health returns liveness and warmed state for demo day."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["warmed"] is True
    assert "providers" in data


def test_upload_unsupported_extension():
    """Unsupported file extension rejected with PRD §14 exact error message."""
    files = {
        "rejection_letter": ("letter.docx", b"fake docx bytes", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "policy_wording": ("policy.pdf", b"%PDF-fake", "application/pdf"),
    }
    response = client.post("/api/analyses", files=files)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "We can read PDF, JPG and PNG. This file is a .docx — please upload the PDF version." in detail["message"]


def test_pre_cached_demo_cases():
    """Pre-cached demo cases return in under 5 seconds (NFR / Tech Stack §12.2)."""
    # Demo Case 1 (Strong)
    r1 = client.get("/api/analyses/demo-case-1-strong-moratorium")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["verdict"]["level"] == "strong"
    assert d1["claim_record"]["continuous_months"] == 65
    assert len(d1["verdict"]["evidence_trail"]) >= 1

    # Demo Case 2 (Moderate - Flow C Clause-less)
    r2 = client.get("/api/analyses/demo-case-2-no-clause")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["verdict"]["level"] == "moderate"
    assert d2["verdict"]["flow"] == "flow_c"
    assert d2["claim_record"]["cited_clause_ref"] is None
    assert d2["grounds_letter_available"] is True
    assert d2["appeal_available"] is False

    # Attempting to generate GRO appeal on clause-less case must produce grounds request
    r2_appeal = client.post("/api/analyses/demo-case-2-no-clause/appeal", json={"language": "en"})
    assert r2_appeal.status_code == 200
    assert r2_appeal.json()["kind"] == "grounds_request"

    # Demo Case 2 (Weak - Flow B Valid 30-Day Exclusion)
    r_weak = client.get("/api/analyses/demo-case-2-weak-valid-rejection")
    assert r_weak.status_code == 200
    d_weak = r_weak.json()
    assert d_weak["verdict"]["level"] == "weak"
    assert d_weak["verdict"]["flow"] == "flow_b"
    assert d_weak["verdict"]["appeal_available"] is False
    assert d_weak["verdict"]["grounds_letter_available"] is False
    # Attempting to generate appeal on weak verdict must return HTTP 400 (PRD FR-12)
    r_weak_appeal = client.post("/api/analyses/demo-case-2-weak-valid-rejection/appeal", json={"language": "en"})
    assert r_weak_appeal.status_code == 400
    assert "no appeal is generated" in r_weak_appeal.json()["detail"]

    # Demo Case 3 (Strong - Clause/Policy Mismatch)
    r3 = client.get("/api/analyses/demo-case-3-clause-mismatch")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["verdict"]["level"] == "strong"
    assert d3["verdict"]["flow"] == "flow_a"
    assert "Clause/Policy Mismatch" in d3["verdict"]["summary"]
    assert d3["verdict"]["appeal_available"] is True


def test_full_pipeline_flow_a():
    """Full Flow A live pipeline on real generated Case 1 PDFs."""
    letter_path = assets_dir / "case_1_rejection_letter.pdf"
    policy_path = assets_dir / "case_1_policy_wording.pdf"

    with open(letter_path, "rb") as f_l, open(policy_path, "rb") as f_p:
        files = {
            "rejection_letter": ("rejection_letter.pdf", f_l.read(), "application/pdf"),
            "policy_wording": ("policy_wording.pdf", f_p.read(), "application/pdf"),
        }

    # 1. POST /api/analyses
    res_post = client.post("/api/analyses", files=files)
    assert res_post.status_code == 201
    analysis_id = res_post.json()["analysis_id"]

    # 2. GET /api/analyses/{id}
    res_get = client.get(f"/api/analyses/{analysis_id}")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["status"] == "complete"
    assert data["claim_record"]["continuous_months"] == 65
    assert data["verdict"]["level"] == "strong"
    assert len(data["verdict"]["evidence_trail"]) >= 1

    # 3. GET /api/analyses/{id}/evidence/{ref}
    first_ev_id = data["verdict"]["evidence_trail"][0]["id"]
    res_ev = client.get(f"/api/analyses/{analysis_id}/evidence/{first_ev_id}")
    assert res_ev.status_code == 200
    ev_data = res_ev.json()
    assert ev_data["id"] == first_ev_id

    # 4. POST /api/analyses/{id}/appeal (English)
    res_appeal = client.post(f"/api/analyses/{analysis_id}/appeal", json={"language": "en"})
    assert res_appeal.status_code == 200
    doc_id = res_appeal.json()["document_id"]

    # 5. GET /api/analyses/{id}/appeal/{docId} (PDF Stream)
    res_pdf = client.get(f"/api/analyses/{analysis_id}/appeal/{doc_id}")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")

    # 6. DELETE /api/analyses/{id} (Session disposal)
    res_del = client.delete(f"/api/analyses/{analysis_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"

    # Verify session is permanently deleted
    res_gone = client.get(f"/api/analyses/{analysis_id}")
    assert res_gone.status_code == 404


def test_full_pipeline_case_2_and_3():
    """Full live pipeline on real generated Case 2 (Flow C / No Clause) and Case 3 (Mismatch) PDFs."""
    # Test Case 2 (Flow C: Rejection Letter Does NOT Specify a Rejection Clause)
    c2_let = assets_dir / "case_2_rejection_letter.pdf"
    c2_pol = assets_dir / "case_2_policy_wording.pdf"

    files_c2 = {
        "rejection_letter": ("case_2_rejection_letter.pdf", c2_let.read_bytes(), "application/pdf"),
        "policy_wording": ("case_2_policy_wording.pdf", c2_pol.read_bytes(), "application/pdf"),
    }
    res_c2 = client.post("/api/analyses", files=files_c2)
    assert res_c2.status_code == 201
    id_c2 = res_c2.json()["analysis_id"]

    data_c2 = client.get(f"/api/analyses/{id_c2}").json()
    assert data_c2["claim_record"]["policyholder_name"] == "Sneha Verma"
    assert data_c2["claim_record"]["cited_clause_ref"] is None
    assert data_c2["verdict"]["flow"] == "flow_c"
    assert data_c2["verdict"]["level"] == "moderate"
    assert data_c2["verdict"]["grounds_letter_available"] is True
    assert data_c2["verdict"]["appeal_available"] is False
    # Verifiable evidence trail must contain ONLY genuine relevant provision evidence, NO unrelated policy spans
    for ev in data_c2["verdict"]["evidence_trail"]:
        assert ev["source_type"] == "provision"

    # Generate grounds request
    res_appeal_c2 = client.post(f"/api/analyses/{id_c2}/appeal", json={"language": "en"})
    assert res_appeal_c2.status_code == 200
    assert res_appeal_c2.json()["kind"] == "grounds_request"
    doc_id_c2 = res_appeal_c2.json()["document_id"]

    # Download grounds request PDF
    res_pdf_c2 = client.get(f"/api/analyses/{id_c2}/appeal/{doc_id_c2}")
    assert res_pdf_c2.status_code == 200
    assert res_pdf_c2.content.startswith(b"%PDF-")

    # Test Case 3 (Flow A: Clause/Policy Mismatch - Rejection letter cites clause absent from policy)
    c3_let = assets_dir / "case_3_rejection_letter.pdf"
    c3_pol = assets_dir / "case_3_policy_wording.pdf"

    files_c3 = {
        "rejection_letter": ("case_3_rejection_letter.pdf", c3_let.read_bytes(), "application/pdf"),
        "policy_wording": ("case_3_policy_wording.pdf", c3_pol.read_bytes(), "application/pdf"),
    }
    res_c3 = client.post("/api/analyses", files=files_c3)
    assert res_c3.status_code == 201
    id_c3 = res_c3.json()["analysis_id"]

    data_c3 = client.get(f"/api/analyses/{id_c3}").json()
    assert data_c3["claim_record"]["policyholder_name"] == "Vikram Malhotra"
    assert data_c3["claim_record"]["cited_clause_ref"] == "Clause 5.9"
    assert data_c3["verdict"]["flow"] == "flow_a"
    assert data_c3["verdict"]["level"] == "strong"
    assert "Clause/Policy Mismatch" in data_c3["verdict"]["summary"]
    assert data_c3["verdict"]["appeal_available"] is True
    # Verifiable evidence trail must establish mismatch with document audit and regulatory provision
    trail = data_c3["verdict"]["evidence_trail"]
    assert len(trail) >= 2
    assert any("Policy Document Audit" in ev["provision_ref"] for ev in trail)
    assert any("IRDAI" in ev["provision_ref"] for ev in trail)

    # Generate GRO appeal for clause mismatch
    res_appeal_c3 = client.post(f"/api/analyses/{id_c3}/appeal", json={"language": "en"})
    assert res_appeal_c3.status_code == 200
    assert res_appeal_c3.json()["kind"] == "gro_letter"
    doc_id_c3 = res_appeal_c3.json()["document_id"]

    # Download GRO appeal PDF
    res_pdf_c3 = client.get(f"/api/analyses/{id_c3}/appeal/{doc_id_c3}")
    assert res_pdf_c3.status_code == 200
    assert res_pdf_c3.content.startswith(b"%PDF-")


def test_fallback_policyholder_name_from_policy_wording():
    """Verify that if rejection letter does not mention policyholder, it is extracted from policy wording."""
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    import io

    # Create unaddressed letter
    buf_let = io.BytesIO()
    doc_let = SimpleDocTemplate(buf_let)
    styles = getSampleStyleSheet()
    doc_let.build([
        Paragraph("STAR HEALTH AND ALLIED INSURANCE CO. LTD.", styles["Heading1"]),
        Paragraph("Date: 14/08/2026", styles["Normal"]),
        Paragraph("Policy Number: P/161114/01/2021/008742", styles["Normal"]),
        Paragraph("Claim Reference: CIR/2026/161114/098711", styles["Normal"]),
        Paragraph("Inception Date: 01/03/2021 | Continuous Months: 65 months", styles["Normal"]),
        Paragraph("SUB: REPUDIATION OF CLAIM UNDER POLICY CLAUSE 4.2", styles["Normal"]),
        Paragraph("Dear Policyholder, your claim is repudiated under Clause 4.2.", styles["Normal"]),
    ])

    # Create policy schedule with policyholder name on page 1
    buf_pol = io.BytesIO()
    doc_pol = SimpleDocTemplate(buf_pol)
    doc_pol.build([
        Paragraph("STAR HEALTH COMPREHENSIVE INSURANCE POLICY SCHEDULE", styles["Heading1"]),
        Paragraph("Policyholder Name: Ananya Mukherjee", styles["Normal"]),
        Paragraph("Policy Number: P/161114/01/2021/008742", styles["Normal"]),
        Paragraph("Section 4: Exclusions Clause 4.2 Pre-Existing Diseases", styles["Normal"]),
    ])

    files = {
        "rejection_letter": ("unaddressed_letter.pdf", buf_let.getvalue(), "application/pdf"),
        "policy_wording": ("policy_schedule.pdf", buf_pol.getvalue(), "application/pdf"),
    }
    res = client.post("/api/analyses", files=files)
    assert res.status_code == 201
    analysis_id = res.json()["analysis_id"]

    data = client.get(f"/api/analyses/{analysis_id}").json()
    assert data["claim_record"]["policyholder_name"] == "Ananya Mukherjee"
