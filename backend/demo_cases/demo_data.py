"""Pre-cached demo cases and sample asset generator for Pratikar.
Powers the <5 second demo path mandated by Tech Stack §12.2 and PRD §13/§17.
"""
from datetime import date
from typing import Dict, Any
from app.models.schemas import (
    StructuredClaimRecord,
    Verdict,
    EvidenceItem,
    AnalysisResponse,
)

# Demo Case 1: STRONG VERDICT — Moratorium Violation (IRDAI Master Circular 2024 cl. 13)
# Star Health policy active for 65 months (>60 month moratorium).
# Insurer rejected citing Clause 4.2 (Pre-Existing Disease: Hypertension).
DEMO_CASE_1 = {
    "analysis_id": "demo-case-1-strong-moratorium",
    "status": "complete",
    "claim_record": {
        "insurer_name": "Star Health and Allied Insurance",
        "policy_number": "P/161114/01/2021/008742",
        "claim_reference": "CIR/2026/161114/098711",
        "claim_amount": 284500.0,
        "rejection_date": "2026-08-14",
        "stated_ground": "Repudiation under Clause 4.2: Pre-existing condition (Essential Hypertension & Cardiac history) not disclosed at inception.",
        "cited_clause_ref": "Clause 4.2",
        "policy_inception_date": "2021-03-01",
        "continuous_months": 65,
    },
    "verdict": {
        "level": "strong",
        "summary": "The insurer's repudiation violates binding IRDAI regulations. After 60 continuous months of coverage, claims cannot be contested for pre-existing disease or non-disclosure.",
        "reasons": [
            "The insurer rejected the claim citing pre-existing condition or non-disclosure, but the policy has completed 65 months of continuous coverage. Under IRDAI Master Circular 2024 cl. 13, the moratorium period of 60 months has elapsed, making the policy and claim incontestable on these grounds.",
            "Policy Clause 4.2 operates subject to statutory IRDAI moratorium limits which override restrictive policy wording."
        ],
        "evidence_trail": [
            {
                "id": "ev_demo1_1",
                "statement": "The policy has completed 65 continuous months of coverage, exceeding the 60-month statutory moratorium.",
                "source_type": "provision",
                "provision_ref": "IRDAI Master Circular 2024 cl. 13 / Moratorium Clause",
                "source_text": "[IRDAI Master Circular 2024 cl. 13]: After sixty continuous months of health insurance coverage, no policy and no claim can be contested on grounds of non-disclosure, misrepresentation, or pre-existing disease, save for established fraud.",
                "ordinal": 1,
            },
            {
                "id": "ev_demo1_2",
                "statement": "Policy Clause 4.2 retrieved verbatim from Page 14 of Star Health Comprehensive Policy Wording.",
                "source_type": "policy_span",
                "page_number": 14,
                "source_text": "Clause 4.2 Pre-Existing Diseases (Code-Excl01): Expenses related to the treatment of a Pre-Existing Disease (PED) and its direct complications shall be excluded until the expiry of the waiting period specified in the policy schedule.",
                "ordinal": 2,
            }
        ],
        "flow": "flow_a",
        "grounds_letter_available": False,
        "appeal_available": True,
    },
}

# Demo Case 2: WEAK VERDICT (Flow B) — Valid Rejection
# Care Health policy active for only 12 days.
# Claim filed for non-accidental illness (Appendicitis hospitalisation).
# Clause 4.1 (Initial 30-day waiting period) legitimately excludes the claim.
DEMO_CASE_2 = {
    "analysis_id": "demo-case-2-weak-valid-rejection",
    "status": "complete",
    "claim_record": {
        "insurer_name": "Care Health Insurance",
        "policy_number": "18942201-00",
        "claim_reference": "CARE/2026/CLM/44120",
        "claim_amount": 92000.0,
        "rejection_date": "2026-08-18",
        "stated_ground": "Repudiation under Clause 4.1: Claim reported within the initial 30 days waiting period for non-accidental illness.",
        "cited_clause_ref": "Clause 4.1",
        "policy_inception_date": "2026-08-06",
        "continuous_months": 0,
    },
    "verdict": {
        "level": "weak",
        "summary": "The insurer's rejection is legally valid under IRDAI standard terms and policy wording. No appeal is recommended.",
        "reasons": [
            "The claim occurred within the first 30 days of policy inception (0 months / 12 days elapsed) for an illness, which is validly excluded under standard policy terms and IRDAI regulations unless caused by an accident.",
            "Policy Clause 4.1 explicitly excludes treatment of illnesses diagnosed during the first 30 days."
        ],
        "evidence_trail": [
            {
                "id": "ev_demo2_1",
                "statement": "Initial 30-day exclusion is an approved standard regulatory waiting period.",
                "source_type": "provision",
                "provision_ref": "IRDAI Master Circular 2024 / Standard Health Policy Terms cl. 4.1",
                "source_text": "[IRDAI Master Circular 2024 Standard Terms cl. 4.1]: Expenses related to the treatment of any illness within 30 days from the first policy commencement date shall be excluded except claims arising due to an accident.",
                "ordinal": 1,
            },
            {
                "id": "ev_demo2_2",
                "statement": "Policy Clause 4.1 retrieved verbatim from Page 9 of Care Health Policy Wording.",
                "source_type": "policy_span",
                "page_number": 9,
                "source_text": "Clause 4.1 30-day Waiting Period (Code-Excl03): Expenses related to the treatment of any illness within 30 days from the first policy commencement date shall be excluded.",
                "ordinal": 2,
            }
        ],
        "flow": "flow_b",
        "grounds_letter_available": False,
        "appeal_available": False, # PRD FR-12: Offers NO appeal letter!
    },
}

# Demo Case 3: MODERATE / FLOW C — Clause-less / Vague Rejection
# Rejection letter gives generic repudiation without citing any policy clause.
# System generates a formal Request-for-Grounds letter rather than guessing a clause.
DEMO_CASE_3 = {
    "analysis_id": "demo-case-3-vague-no-clause",
    "status": "complete",
    "claim_record": {
        "insurer_name": "HDFC ERGO General Insurance",
        "policy_number": "2801 2049 1928 0000",
        "claim_reference": "HD/REP/2026/8921",
        "claim_amount": 165000.0,
        "rejection_date": "2026-08-20",
        "stated_ground": "Claim repudiated as per terms and conditions of policy.",
        "cited_clause_ref": None, # ABSENT! Drives Flow C
        "policy_inception_date": "2023-01-15",
        "continuous_months": 43,
    },
    "verdict": {
        "level": "moderate",
        "summary": "Your insurer has repudiated the claim without citing the specific clause or medical ground relied upon. A formal Request-for-Grounds letter is prepared.",
        "reasons": [
            "Your insurer has not stated which clause it relied on. Under IRDAI regulations, an insurer must state specific contractual grounds with clause citations.",
            "A written demand for specific grounds and investigation findings has been generated."
        ],
        "evidence_trail": [
            {
                "id": "ev_demo3_1",
                "statement": "Insurers are mandated to convey clear and reasoned grounds for claim repudiation.",
                "source_type": "provision",
                "provision_ref": "IRDAI Master Circular on Operations 2024 cl. 6 / Claim Settlement Norms",
                "source_text": "[IRDAI Master Circular 2024 cl. 6]: Rejection of claims shall be made only after communicating specific grounds along with operative policy terms.",
                "ordinal": 1,
            }
        ],
        "flow": "flow_c",
        "grounds_letter_available": True,
        "appeal_available": False,
    },
}

DEMO_REGISTRY: Dict[str, Dict[str, Any]] = {
    "case-1": DEMO_CASE_1,
    "case-2": DEMO_CASE_2,
    "case-3": DEMO_CASE_3,
    "demo-case-1-strong-moratorium": DEMO_CASE_1,
    "demo-case-2-weak-valid-rejection": DEMO_CASE_2,
    "demo-case-3-vague-no-clause": DEMO_CASE_3,
}
