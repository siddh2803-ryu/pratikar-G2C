"""Comprehensive validation tests for the 3 distinct cases, rejection clause detection,
clause/policy mismatch detection, verifiable evidence trail accuracy, and case independence.
"""
from pathlib import Path
import io
import pytest
from fastapi.testclient import TestClient
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.main import app
from app.extraction.extractor import ClaimExtractor, extract_rejection_clause_from_text
from app.ingestion.parser import parse_policy_pdf
from app.retrieval.retriever import ClauseRetriever, ClauseNotFoundError
from app.rules.rule_engine import IRDAIRuleEngine
from app.merge.grounding_gate import merge_and_assemble_verdict

client = TestClient(app)
assets_dir = Path(__file__).resolve().parent.parent / "demo_cases" / "demo_assets"


def test_three_cases_live_pipeline_distinct_verdicts():
    """Validates that all three reported cases produce logically distinct, document-grounded verdicts."""
    # 1. Case 1: Moratorium Violation (Strong)
    c1_let = (assets_dir / "case_1_rejection_letter.pdf").read_bytes()
    c1_pol = (assets_dir / "case_1_policy_wording.pdf").read_bytes()
    res1 = client.post("/api/analyses", files={
        "rejection_letter": ("c1_letter.pdf", c1_let, "application/pdf"),
        "policy_wording": ("c1_policy.pdf", c1_pol, "application/pdf"),
    })
    assert res1.status_code == 201
    id1 = res1.json()["analysis_id"]
    data1 = client.get(f"/api/analyses/{id1}").json()

    # Assert Case 1 specifics
    assert data1["claim_record"]["cited_clause_ref"] == "Clause 4.2"
    assert data1["claim_record"]["continuous_months"] == 65
    assert data1["verdict"]["level"] == "strong"
    assert data1["verdict"]["flow"] == "flow_a"
    assert data1["verdict"]["appeal_available"] is True
    # Verifiable evidence trail must contain policy span for Clause 4.2 with exact page number 14
    trail1 = data1["verdict"]["evidence_trail"]
    assert any(ev["source_type"] == "policy_span" and ev["page_number"] == 14 for ev in trail1)
    assert any(ev["source_type"] == "provision" and "Moratorium" in ev["provision_ref"] for ev in trail1)

    # 2. Case 2: Rejection Letter Does Not Specify a Rejection Clause (Moderate / Flow C)
    c2_let = (assets_dir / "case_2_rejection_letter.pdf").read_bytes()
    c2_pol = (assets_dir / "case_2_policy_wording.pdf").read_bytes()
    res2 = client.post("/api/analyses", files={
        "rejection_letter": ("c2_letter.pdf", c2_let, "application/pdf"),
        "policy_wording": ("c2_policy.pdf", c2_pol, "application/pdf"),
    })
    assert res2.status_code == 201
    id2 = res2.json()["analysis_id"]
    data2 = client.get(f"/api/analyses/{id2}").json()

    # Assert Case 2 specifics
    assert data2["claim_record"]["cited_clause_ref"] is None
    assert data2["verdict"]["level"] == "moderate"
    assert data2["verdict"]["flow"] == "flow_c"
    assert data2["verdict"]["grounds_letter_available"] is True
    assert data2["verdict"]["appeal_available"] is False
    assert "without specifying any contractual policy clause" in data2["verdict"]["summary"]
    # Evidence trail must contain ONLY relevant IRDAI provision, NO arbitrary or fabricated policy spans
    trail2 = data2["verdict"]["evidence_trail"]
    assert len(trail2) >= 1
    for ev in trail2:
        assert ev["source_type"] == "provision"
        assert "policy_span" not in ev["source_type"]
        assert ev["page_number"] is None

    # 3. Case 3: Rejection Letter Cites a Clause That Does Not Exist in the Policy (Strong / Mismatch)
    c3_let = (assets_dir / "case_3_rejection_letter.pdf").read_bytes()
    c3_pol = (assets_dir / "case_3_policy_wording.pdf").read_bytes()
    res3 = client.post("/api/analyses", files={
        "rejection_letter": ("c3_letter.pdf", c3_let, "application/pdf"),
        "policy_wording": ("c3_policy.pdf", c3_pol, "application/pdf"),
    })
    assert res3.status_code == 201
    id3 = res3.json()["analysis_id"]
    data3 = client.get(f"/api/analyses/{id3}").json()

    # Assert Case 3 specifics
    assert data3["claim_record"]["cited_clause_ref"] == "Clause 5.9"
    assert data3["verdict"]["level"] == "strong"
    assert data3["verdict"]["flow"] == "flow_a"
    assert data3["verdict"]["appeal_available"] is True
    assert "Clause/Policy Mismatch" in data3["verdict"]["summary"]
    # Evidence trail must show the actual relevant evidence establishing mismatch (audit + fair repudiation standard)
    trail3 = data3["verdict"]["evidence_trail"]
    assert len(trail3) >= 2
    assert any("Policy Document Audit" in ev["provision_ref"] for ev in trail3)
    assert any("Fair Repudiation Norms" in ev["provision_ref"] or "IRDAI" in ev["provision_ref"] for ev in trail3)
    # Must NOT contain arbitrary text extracted from policy
    for ev in trail3:
        assert ev["source_type"] != "policy_span"

    # Confirm logical distinction across all 3 cases
    assert (data1["verdict"]["level"], data1["verdict"]["flow"]) == ("strong", "flow_a")
    assert (data2["verdict"]["level"], data2["verdict"]["flow"]) == ("moderate", "flow_c")
    assert (data3["verdict"]["level"], data3["verdict"]["flow"]) == ("strong", "flow_a")
    assert data1["verdict"]["summary"] != data2["verdict"]["summary"]
    assert data2["verdict"]["summary"] != data3["verdict"]["summary"]
    assert data1["verdict"]["summary"] != data3["verdict"]["summary"]


def test_rejection_clause_detection_filters_incidental_clauses():
    """Verify that incidental clauses (grievance, ombudsman, definitions) are NOT treated as rejection clauses."""
    # Rejection letter with non-rejection clause mentions in footer/grievance
    letter_text = """
    NATIONAL INSURANCE COMPANY LIMITED
    Date: 15/09/2026
    To: Amit Sharma
    Claim Ref: NIC/CLM/2026/8892
    
    SUBJECT: CLAIM NOTIFICATION
    
    Dear Mr. Sharma,
    We regret to inform you that your claim for reimbursement has been repudiated after careful evaluation per company policy.
    
    Please refer to Clause 1.1 of Definitions for terms used herein.
    In case of grievance, under Clause 15.2 you may contact our Grievance Redressal Officer.
    As per Insurance Ombudsman Rules 2017 Clause 14, escalations may be submitted within 1 year.
    
    Yours faithfully,
    Authorized Signatory
    """
    detected_clause = extract_rejection_clause_from_text(letter_text)
    assert detected_clause is None, f"Expected None but got '{detected_clause}'"


def test_case_independence_and_no_cross_contamination():
    """Verify that multiple consecutive analyses on different cases do not leak or cache data."""
    c1_let = (assets_dir / "case_1_rejection_letter.pdf").read_bytes()
    c1_pol = (assets_dir / "case_1_policy_wording.pdf").read_bytes()
    c2_let = (assets_dir / "case_2_rejection_letter.pdf").read_bytes()
    c2_pol = (assets_dir / "case_2_policy_wording.pdf").read_bytes()

    # Run Case 1
    res1 = client.post("/api/analyses", files={
        "rejection_letter": ("c1.pdf", c1_let, "application/pdf"),
        "policy_wording": ("c1_p.pdf", c1_pol, "application/pdf"),
    })
    d1 = client.get(f"/api/analyses/{res1.json()['analysis_id']}").json()

    # Run Case 2
    res2 = client.post("/api/analyses", files={
        "rejection_letter": ("c2.pdf", c2_let, "application/pdf"),
        "policy_wording": ("c2_p.pdf", c2_pol, "application/pdf"),
    })
    d2 = client.get(f"/api/analyses/{res2.json()['analysis_id']}").json()

    # Run Case 1 again
    res3 = client.post("/api/analyses", files={
        "rejection_letter": ("c1_again.pdf", c1_let, "application/pdf"),
        "policy_wording": ("c1_p_again.pdf", c1_pol, "application/pdf"),
    })
    d3 = client.get(f"/api/analyses/{res3.json()['analysis_id']}").json()

    # Verify complete independence
    assert d1["claim_record"]["policyholder_name"] == "Rajesh Kumar"
    assert d2["claim_record"]["policyholder_name"] == "Sneha Verma"
    assert d3["claim_record"]["policyholder_name"] == "Rajesh Kumar"

    assert d1["verdict"]["level"] == "strong"
    assert d2["verdict"]["level"] == "moderate"
    assert d3["verdict"]["level"] == "strong"

    assert d2["claim_record"]["cited_clause_ref"] is None
    assert d3["claim_record"]["cited_clause_ref"] == "Clause 4.2"
