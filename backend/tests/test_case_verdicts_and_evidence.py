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
from app.models.schemas import PolicySpan

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


def test_table_of_contents_filtering_selects_operative_page_not_index():
    """Validates that ClauseRetriever ignores Table of Contents on Page 2 and extracts
    the true operative clause from Page 14.
    """
    styles = getSampleStyleSheet()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    
    story = [
        # Page 1: Cover
        Paragraph("STAR HEALTH INSURANCE POLICY WORDING", styles["Heading1"]),
        Paragraph("Policy Terms and Conditions Document", styles["Normal"]),
        PageBreak(),
        
        # Page 2: Table of Contents (Index)
        Paragraph("TABLE OF CONTENTS", styles["Heading1"]),
        Paragraph("1. Definitions .................................................... Page 3", styles["Normal"]),
        Paragraph("2. Scope of Cover ................................................ Page 7", styles["Normal"]),
        Paragraph("3. General Conditions ............................................ Page 10", styles["Normal"]),
        Paragraph("4. Standard Exclusions ........................................... Page 14", styles["Normal"]),
        Paragraph("   Clause 4.1 30-Day Waiting Period ............................. Page 14", styles["Normal"]),
        Paragraph("   Clause 4.2 Pre-Existing Diseases (Code-Excl01) ............... Page 14", styles["Normal"]),
        Paragraph("   Clause 4.3 Specific Waiting Periods .......................... Page 16", styles["Normal"]),
        PageBreak(),
        
        # Page 3: Definitions
        Paragraph("SECTION 1: DEFINITIONS", styles["Heading1"]),
        Paragraph("1.1 Pre-existing disease means any condition as referenced under Clause 4.2 of exclusions.", styles["Normal"]),
        PageBreak(),
    ]
    # Add dummy pages up to page 13
    for p in range(4, 14):
        story.append(Paragraph(f"Page {p} Procedural and benefit schedule details.", styles["Normal"]))
        story.append(PageBreak())
        
    # Page 14: Operative Exclusion
    story.append(Paragraph("SECTION 4: STANDARD EXCLUSIONS", styles["Heading1"]))
    story.append(Paragraph("The following exclusions apply to all benefits:", styles["Normal"]))
    story.append(Paragraph(
        "Clause 4.2 Pre-Existing Diseases (Code-Excl01): Expenses related to the treatment of a Pre-Existing Disease (PED) and its direct complications shall be excluded until the expiry of 36 months of continuous coverage after the date of inception of the first policy with us. Coverage is excluded under this section.",
        styles["Normal"]
    ))
    story.append(Paragraph("Clause 4.3 Specific Illnesses: Waiting period of 24 months applies for specific treatments.", styles["Normal"]))
    
    doc.build(story)
    pdf_bytes = buf.getvalue()
    
    chunks = parse_policy_pdf(pdf_bytes, document_id="pol_toc_test")
    retriever = ClauseRetriever()
    
    span = retriever.retrieve_clause(
        chunks=chunks,
        clause_ref="Clause 4.2",
        stated_ground="Pre-existing condition (Essential Hypertension)",
    )
    
    # Must retrieve from Page 14, NOT Page 2 (TOC) and NOT Page 3 (Definition reference)
    assert span.page_number == 14, f"Expected Page 14, but got Page {span.page_number}!"
    assert "Expenses related to the treatment of a Pre-Existing Disease" in span.quoted_text
    assert "TABLE OF CONTENTS" not in span.quoted_text
    assert "................" not in span.quoted_text


def test_index_only_clause_flagged_as_mismatch():
    """When a clause is listed ONLY in the Table of Contents or Index and has no operative
    section in the policy body, the system must recognize it as a Clause/Policy Mismatch.
    """
    styles = getSampleStyleSheet()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    
    story = [
        # Page 1: Cover
        Paragraph("HEALTH INSURANCE POLICY", styles["Heading1"]),
        PageBreak(),
        
        # Page 2: Table of Contents mentioning Phantom Clause 5.4
        Paragraph("TABLE OF CONTENTS", styles["Heading1"]),
        Paragraph("Clause 5.4 Hazardous Sports Exclusion ......................... Page 18", styles["Normal"]),
        PageBreak(),
        
        # Page 3: General terms
        Paragraph("General terms and hospital network rules.", styles["Normal"]),
    ]
    doc.build(story)
    pdf_bytes = buf.getvalue()
    
    chunks = parse_policy_pdf(pdf_bytes, document_id="pol_mismatch_test")
    retriever = ClauseRetriever()
    
    # Must raise ClauseNotFoundError because Clause 5.4 only exists in TOC
    with pytest.raises(ClauseNotFoundError) as exc_info:
        retriever.retrieve_clause(chunks, "Clause 5.4", stated_ground="Hazardous sports exclusion")
    
    err_msg = str(exc_info.value)
    assert "mismatch" in err_msg.lower() or "table of contents" in err_msg.lower()


def test_rejection_reason_multi_sentence_and_varied_clauses():
    """Verify high-accuracy extraction from rejection letters with varied phrasing,
    multi-sentence explanatory paragraphs, and diverse clause notation.
    """
    # 1. Letter with multi-sentence reason and no explicit header
    letter_text_1 = """
    STAR HEALTH INSURANCE
    Date: 12/05/2026
    To: Meera Nair
    Policy Number: SH/POL/99120
    Claim Reference: CIR/2026/77881
    
    Dear Ms. Nair,
    On scrutiny of the hospital bills and discharge summary, it is observed that the patient was admitted for Treatment of Cataract within the specific waiting period. Under Section 4.3, cataract surgery is subject to a 24-month waiting period. Since your policy is active only for 14 continuous months, the competent authority has repudiated the claim.
    
    Yours faithfully,
    Authorized Claims Officer
    """
    record_1 = ClaimExtractor().extract(letter_text_1.encode("utf-8"), "letter1.txt")
    assert record_1.cited_clause_ref == "Section 4.3"
    assert "cataract" in record_1.stated_ground.lower()
    assert "24-month waiting period" in record_1.stated_ground.lower()

    # 2. Letter with named exclusion
    letter_text_2 = """
    CARE HEALTH INSURANCE
    Date: 10/06/2026
    To: Rahul Sharma
    Claim Reference: CR/2026/88921
    
    Dear Mr. Sharma,
    Your claim for orthodontic correction has been rejected under Exclusion - Dental Treatment as non-accidental dental procedures are permanently excluded from policy coverage.
    
    Yours sincerely,
    Claims Manager
    """
    record_2 = ClaimExtractor().extract(letter_text_2.encode("utf-8"), "letter2.txt")
    assert "Dental Treatment" in (record_2.cited_clause_ref or "")
    assert "dental procedures are permanently excluded" in record_2.stated_ground.lower()


def test_tenure_satisfied_contradicts_rejection_strong_verdict():
    """When a policy specifies a 24-month waiting period, but the policyholder has completed
    28 months continuous coverage, the system must detect that the rejection is CONTRADICTED
    by the policy's own terms and issue a Strong verdict.
    """
    claim = ClaimExtractor().extract(
        b"""
        HDFC ERGO GENERAL INSURANCE
        Date: 15/07/2026
        To: Sunita Gupta
        Policyholder Name: Sunita Gupta
        Policy Number: 2801-9982-11
        Claim Reference: CLM/2026/9912
        Inception Date: 01/03/2024
        Continuous Months: 28 months
        Stated Grounds: Claim repudiated under Clause 4.3 for cataract surgery during waiting period.
        SUB: REPUDIATION UNDER CLAUSE 4.3
        """,
        "letter.txt"
    )
    assert claim.cited_clause_ref == "Clause 4.3"
    assert claim.continuous_months == 28

    policy_span = retriever = PolicySpan(
        clause_ref="Clause 4.3",
        page_number=16,
        char_start=100,
        char_end=400,
        quoted_text="Clause 4.3 Specific Illness Waiting Periods: Expenses related to the treatment of Cataract, Hernia, and Joint Replacements shall be excluded until the expiry of 24 months of continuous coverage from the date of inception.",
    )

    verdict = merge_and_assemble_verdict(
        claim=claim,
        rule_results=[],
        policy_span=policy_span,
        clause_error_msg=None,
    )

    # Must be Strong verdict because 28 months > 24 months waiting period
    assert verdict.level == "strong"
    assert verdict.flow == "flow_a"
    assert verdict.appeal_available is True
    assert "Contradicted by Policy Terms" in verdict.summary
    assert any("28 months" in r for r in verdict.reasons)
    assert any("24 months" in r for r in verdict.reasons)
    # Evidence trail must contain verbatim policy span
    assert any(ev.source_type == "policy_span" and ev.page_number == 16 for ev in verdict.evidence_trail)


def test_tenure_unexpired_produces_weak_explained_verdict():
    """When a claim occurs within an unexpired, legally valid waiting period (e.g. initial 30 days),
    the system must produce a Weak verdict that clearly explains why the repudiation is supported,
    rather than defaulting to a generic Moderate verdict.
    """
    claim = ClaimExtractor().extract(
        b"""
        STAR HEALTH INSURANCE
        Date: 20/01/2026
        To: Karan Johar
        Policy Number: P/1102/2026
        Claim Reference: CIR/2026/1102
        Inception Date: 05/01/2026
        Continuous Months: 0 months
        Stated Grounds: Repudiation under Clause 4.1: Claim reported within initial 30 days waiting period for medical illness.
        SUB: REPUDIATION UNDER CLAUSE 4.1
        """,
        "letter.txt"
    )

    policy_span = PolicySpan(
        clause_ref="Clause 4.1",
        page_number=12,
        char_start=50,
        char_end=350,
        quoted_text="Clause 4.1 Initial Waiting Period (Code-Excl03): Expenses related to the treatment of any illness within 30 days from the first policy commencement date shall be excluded except claims arising due to an accident.",
    )

    engine = IRDAIRuleEngine()
    rule_results = engine.evaluate_all(claim)

    verdict = merge_and_assemble_verdict(
        claim=claim,
        rule_results=rule_results,
        policy_span=policy_span,
    )

    assert verdict.level == "weak"
    assert verdict.flow == "flow_b"
    assert verdict.appeal_available is False
    assert "operative policy waiting period" in verdict.summary
    assert any("within the valid" in r.lower() or "within 30 days" in r.lower() for r in verdict.reasons)
    assert any(ev.source_type == "policy_span" and ev.page_number == 12 for ev in verdict.evidence_trail)


def test_evidence_requirements_all_dimensions_present():
    """Verifies that every verdict produces evidence and reasons that clearly establish:
    1. Rejection reason stated in rejection letter
    2. Cited clause/provision
    3. Policy evidence and page number
    4. Verification result (present, absent, contradicted, or supported)
    5. Clear explanation
    """
    # Test on live demo case 1
    c1_let = (assets_dir / "case_1_rejection_letter.pdf").read_bytes()
    c1_pol = (assets_dir / "case_1_policy_wording.pdf").read_bytes()
    res = client.post("/api/analyses", files={
        "rejection_letter": ("c1_letter.pdf", c1_let, "application/pdf"),
        "policy_wording": ("c1_policy.pdf", c1_pol, "application/pdf"),
    })
    assert res.status_code == 201
    analysis_id = res.json()["analysis_id"]
    data = client.get(f"/api/analyses/{analysis_id}").json()

    reasons = data["verdict"]["reasons"]
    # Verify presence of all 5 required dimensions
    assert any("Rejection Reason Stated:" in r for r in reasons)
    assert any("Cited Policy Provision:" in r for r in reasons)
    assert any("Policy Verification:" in r for r in reasons)
    assert any("Regulatory Protection" in r or "Regulatory & Legal Analysis" in r or "Contradiction Established" in r or "Statutory Supremacy" in r for r in reasons)
    assert any("Action & Next Steps:" in r or "GRO appeal" in r for r in reasons)

    # Verify evidence items are case-specific and non-arbitrary
    trail = data["verdict"]["evidence_trail"]
    policy_spans = [ev for ev in trail if ev["source_type"] == "policy_span"]
    assert len(policy_spans) == 1
    assert policy_spans[0]["page_number"] == 14
    assert "Pre-Existing Diseases" in policy_spans[0]["source_text"]


def test_live_uploaded_scenario_2_initial_30_days():
    """Validates that a live uploaded document set for Scenario 2 (30-day initial exclusion)
    produces a Weak, legally grounded verdict with exact page number and no appeal.
    """
    styles = getSampleStyleSheet()
    
    # Generate Letter PDF
    let_buf = io.BytesIO()
    let_doc = SimpleDocTemplate(let_buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    let_story = [
        Paragraph("BAJAJ ALLIANZ GENERAL INSURANCE", styles["Heading1"]),
        Paragraph("Date of Repudiation: 18/08/2026", styles["Normal"]),
        Paragraph("To: Amit Sharma", styles["Normal"]),
        Paragraph("Policy Number: OG-26-1902-1801-00001234", styles["Normal"]),
        Paragraph("Claim Reference: BAGIC/2026/CLM/99102", styles["Normal"]),
        Paragraph("Policy Inception Date: 06/08/2026", styles["Normal"]),
        Paragraph("SUB: REPUDIATION UNDER CLAUSE 4.1", styles["Heading2"]),
        Paragraph(
            "Dear Mr. Sharma, We regret to inform you that your claim has been repudiated under Clause 4.1 as the hospitalization occurred within the initial 30 days waiting period for medical illnesses.",
            styles["Normal"]
        ),
        Paragraph("Yours faithfully, Claims Department", styles["Normal"]),
    ]
    let_doc.build(let_story)
    let_bytes = let_buf.getvalue()

    # Generate Policy PDF
    pol_buf = io.BytesIO()
    pol_doc = SimpleDocTemplate(pol_buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    pol_story = [
        Paragraph("HEALTH GUARD POLICY WORDING", styles["Heading1"]),
        PageBreak(),
        Paragraph("SECTION 4: EXCLUSIONS", styles["Heading1"]),
        Paragraph(
            "Clause 4.1 Initial 30-Day Waiting Period: A waiting period of 30 days from the inception date of the policy will be applicable for all illness claims except accidental injuries.",
            styles["Normal"]
        ),
    ]
    pol_doc.build(pol_story)
    pol_bytes = pol_buf.getvalue()

    res = client.post("/api/analyses", files={
        "rejection_letter": ("let.pdf", let_bytes, "application/pdf"),
        "policy_wording": ("pol.pdf", pol_bytes, "application/pdf"),
    })
    assert res.status_code == 201
    analysis_id = res.json()["analysis_id"]
    data = client.get(f"/api/analyses/{analysis_id}").json()

    assert data["claim_record"]["policyholder_name"] == "Amit Sharma"
    assert data["claim_record"]["cited_clause_ref"] == "Clause 4.1"
    assert data["verdict"]["level"] == "weak"
    assert data["verdict"]["flow"] == "flow_b"
    assert data["verdict"]["appeal_available"] is False

    trail = data["verdict"]["evidence_trail"]
    assert any(ev["source_type"] == "policy_span" and ev["page_number"] == 2 for ev in trail)
    assert any("30-day" in ev["statement"].lower() or "12 days" in ev["statement"].lower() or "within" in ev["statement"].lower() for ev in trail)


def test_clause_mismatch_not_fooled_by_percentages_or_tables():
    """Validates that when an insurer cites 'Clause 5.9' (absent), but the policy contains
    '5.9%' or 'Table 5.9', the system does NOT match the number and correctly declares Clause Mismatch.
    """
    styles = getSampleStyleSheet()

    # Letter citing Clause 5.9
    let_buf = io.BytesIO()
    let_doc = SimpleDocTemplate(let_buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    let_story = [
        Paragraph("HDFC ERGO GENERAL INSURANCE", styles["Heading1"]),
        Paragraph("Date: 20/08/2026", styles["Normal"]),
        Paragraph("Policyholder Name: Vikram Malhotra", styles["Normal"]),
        Paragraph("Policy Number: 2801 2049 1928 0000", styles["Normal"]),
        Paragraph("Claim Reference: HD/REP/2026/8921", styles["Normal"]),
        Paragraph("SUB: REPUDIATION UNDER CLAUSE 5.9", styles["Heading2"]),
        Paragraph(
            "Claim repudiated under Clause 5.9: Treatment excluded under specific waiting period schedule.",
            styles["Normal"]
        ),
    ]
    let_doc.build(let_story)
    let_bytes = let_buf.getvalue()

    # Policy containing 5.9% in text but NO Clause 5.9
    pol_buf = io.BytesIO()
    pol_doc = SimpleDocTemplate(pol_buf, pagesize=(612, 792), leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    pol_story = [
        Paragraph("POLICY TERMS", styles["Heading1"]),
        Paragraph("Co-pay deductible schedule: In non-network facilities, co-pay of 5.9% applies to room rent.", styles["Normal"]),
        PageBreak(),
        Paragraph("SECTION 5: GENERAL TERMS", styles["Heading1"]),
        Paragraph("Clause 5.1 Free Look Period: 15 days from date of receipt.", styles["Normal"]),
        Paragraph("Clause 5.2 Renewal Terms: Lifelong renewability.", styles["Normal"]),
    ]
    pol_doc.build(pol_story)
    pol_bytes = pol_buf.getvalue()

    res = client.post("/api/analyses", files={
        "rejection_letter": ("let.pdf", let_bytes, "application/pdf"),
        "policy_wording": ("pol.pdf", pol_bytes, "application/pdf"),
    })
    assert res.status_code == 201
    analysis_id = res.json()["analysis_id"]
    data = client.get(f"/api/analyses/{analysis_id}").json()

    assert data["claim_record"]["cited_clause_ref"] == "Clause 5.9"
    assert data["verdict"]["level"] == "strong"
    assert data["verdict"]["flow"] == "flow_a"
    assert "Clause/Policy Mismatch" in data["verdict"]["summary"]

    # Evidence trail must NOT contain the 5.9% co-pay span
    trail = data["verdict"]["evidence_trail"]
    assert all(ev["source_type"] != "policy_span" for ev in trail)
    assert any("Policy Document Audit" in ev["provision_ref"] for ev in trail)

