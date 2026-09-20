"""Tests for Appeal PDF generation and Preview/PDF content fidelity.
Verifies that downloaded PDFs accurately reflect preview content, contain no random/dropped glyphs,
and dynamically populate the policyholder's name.
"""
import io
import pymupdf
import pytest
from app.models.schemas import StructuredClaimRecord, Verdict
from app.generation.appeal_pdf import (
    build_appeal_pdf,
    generate_gro_appeal_text,
    generate_grounds_request_text,
)
from demo_cases.demo_data import DEMO_CASE_1, DEMO_CASE_3
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_gro_appeal_pdf_contains_preview_content():
    """Verify that the generated PDF contains the exact text and policyholder name from the preview."""
    claim = StructuredClaimRecord(**DEMO_CASE_1["claim_record"])
    verdict = Verdict(**DEMO_CASE_1["verdict"])

    pdf_bytes = build_appeal_pdf(claim, verdict, kind="gro_letter", language="en")
    assert pdf_bytes.startswith(b"%PDF-")

    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    assert len(doc) >= 1

    all_text = "\n".join([page.get_text() for page in doc])

    import re
    norm_text = re.sub(r"\s+", " ", all_text)

    # 1. Header
    assert "FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS" in norm_text
    assert "Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder" in norm_text

    # 2. Addressee
    assert "The Grievance Redressal Officer (GRO) / Claims Department" in norm_text
    assert "Star Health and Allied Insurance" in norm_text

    # 3. Subject
    assert "Subject: Contest and Demand for Reconsideration of Repudiated Claim Ref: CIR/2026/161114/098711" in norm_text

    # 4. Claim Particulars
    assert "CLAIM PARTICULARS" in norm_text
    assert "Policyholder Name: Rajesh Kumar" in norm_text
    assert "Policy Number: P/161114/01/2021/008742" in norm_text
    assert "Claim Reference ID: CIR/2026/161114/098711" in norm_text
    assert "Date of Repudiation: 2026-08-14" in norm_text
    assert "284,500.00" in norm_text

    # 5. Grounds
    assert "Statutory & Contractual Grounds:" in norm_text
    for reason in verdict.reasons:
        frag = reason[:40]
        assert frag in norm_text

    # 6. Evidence
    assert "Evidence & Document Citations:" in norm_text
    assert "IRDAI Master Circular 2024 cl. 13 / Moratorium Clause" in norm_text

    # 7. Demand & Escalation
    assert "15 calendar days" in norm_text
    assert "Insurance Ombudsman under Rule 14" in norm_text

    # 8. Signoff
    assert "Yours faithfully" in norm_text
    assert "Rajesh Kumar" in norm_text
    assert "Date: 2026-08-14" in norm_text


def test_gro_appeal_pdf_no_missing_glyphs():
    """Verify that Latin characters are not dropped and the PDF contains readable words, not random punctuation."""
    claim = StructuredClaimRecord(**DEMO_CASE_1["claim_record"])
    verdict = Verdict(**DEMO_CASE_1["verdict"])

    pdf_bytes = build_appeal_pdf(claim, verdict, kind="gro_letter", language="en")
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    text = doc[0].get_text()

    # The old bug caused Latin letters to disappear leaving lines like ' /2026/161114/098711'
    assert "Star Health" in text
    assert "Rajesh Kumar" in text
    assert "Grievance" in text or "GRIEVANCE" in text
    assert "Regulations" in text or "REGULATIONS" in text


def test_grounds_request_flow_c_pdf():
    """Verify Flow C Request for Grounds generates matching content."""
    claim = StructuredClaimRecord(**DEMO_CASE_3["claim_record"])
    verdict = Verdict(**DEMO_CASE_3["verdict"])

    pdf_bytes = build_appeal_pdf(claim, verdict, kind="grounds_request", language="en")
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    all_text = "\n".join([page.get_text() for page in doc])

    assert "REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION" in all_text
    assert "Policyholder Name: Vikram Malhotra" in all_text
    assert "HDFC ERGO General Insurance" in all_text
    assert "HD/REP/2026/8921" in all_text
    assert "Vikram Malhotra" in all_text


def test_hindi_pdf_generation():
    """Verify Hindi PDF generates properly without glyph drop or character loss."""
    claim = StructuredClaimRecord(**DEMO_CASE_1["claim_record"])
    verdict = Verdict(**DEMO_CASE_1["verdict"])

    pdf_bytes = build_appeal_pdf(claim, verdict, kind="gro_letter", language="hi")
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    all_text = "\n".join([page.get_text() for page in doc])

    assert "शिकायत" in all_text
    assert "Rajesh Kumar" in all_text
    assert "P/161114/01/2021/008742" in all_text
    assert "CIR/2026/161114/098711" in all_text
    assert "15" in all_text


def test_api_appeal_download_contains_policyholder_name():
    """Integration test: API POST /appeal then GET /appeal/{docId} returns synchronized PDF."""
    res_gen = client.post("/api/analyses/demo-case-1-strong-moratorium/appeal", json={"language": "en"})
    assert res_gen.status_code == 200
    doc_id = res_gen.json()["document_id"]

    res_dl = client.get(f"/api/analyses/demo-case-1-strong-moratorium/appeal/{doc_id}")
    assert res_dl.status_code == 200
    assert res_dl.headers["content-type"] == "application/pdf"

    doc = pymupdf.open(stream=res_dl.content, filetype="pdf")
    all_text = "\n".join([page.get_text() for page in doc])
    assert "Rajesh Kumar" in all_text
    assert "Star Health and Allied Insurance" in all_text
    assert "CIR/2026/161114/098711" in all_text


def test_api_appeal_download_hindi_preserved():
    """Integration test: Hindi language is preserved when downloading demo appeal PDF."""
    res_gen = client.post("/api/analyses/demo-case-1-strong-moratorium/appeal", json={"language": "hi"})
    assert res_gen.status_code == 200
    doc_id = res_gen.json()["document_id"]

    res_dl = client.get(f"/api/analyses/demo-case-1-strong-moratorium/appeal/{doc_id}")
    assert res_dl.status_code == 200
    assert res_dl.headers["content-type"] == "application/pdf"

    doc = pymupdf.open(stream=res_dl.content, filetype="pdf")
    all_text = "\n".join([page.get_text() for page in doc])
    assert "शिकायत" in all_text
    assert "Rajesh Kumar" in all_text


def test_name_extractor_varieties():
    """Verify various formats of policyholder/insured/proposer names are extracted accurately."""
    from app.extraction.extractor import extract_policyholder_name_from_text

    cases = [
        ("Policyholder Name: Rajesh Kumar", "Rajesh Kumar"),
        ("Policy Holder Name: Sneha Verma", "Sneha Verma"),
        ("Name of Policyholder: Vikram Malhotra", "Vikram Malhotra"),
        ("Insured Person: Dr. A. K. Sharma", "A. K. Sharma"),
        ("Proposer Name: Mary-Jane Watson", "Mary-Jane Watson"),
        ("Name of Claimant: Patrick O'Connor", "Patrick O'Connor"),
        ("Patient: Abdul-Rahim Khan", "Abdul-Rahim Khan"),
        ("To: Ms. Priya Nair", "Priya Nair"),
        ("Dear Mr. Amit Shah,", "Amit Shah"),
        ("Policyholder: Sunita Roy", "Sunita Roy"),
        ("Policyholder Name | Rajesh Kumar", "Rajesh Kumar"),
    ]
    for text, expected in cases:
        assert extract_policyholder_name_from_text(text) == expected


def test_text_generators_match_preview():
    """Verify plain text appeal generator matches preview card text."""
    claim = StructuredClaimRecord(**DEMO_CASE_1["claim_record"])
    verdict = Verdict(**DEMO_CASE_1["verdict"])

    txt_en = generate_gro_appeal_text(claim, verdict, language="en")
    assert "Rajesh Kumar" in txt_en
    assert "P/161114/01/2021/008742" in txt_en
    assert "CIR/2026/161114/098711" in txt_en
    assert "Yours faithfully,\n\nRajesh Kumar" in txt_en

    txt_hi = generate_gro_appeal_text(claim, verdict, language="hi")
    assert "Rajesh Kumar" in txt_hi
    assert "भवदीय,\n\nRajesh Kumar" in txt_hi
