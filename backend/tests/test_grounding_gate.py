"""Unit tests for the Architectural Grounding Gate.
Verifies that statements lacking a source are dropped and Grounding Violations is strictly ZERO.
"""
from datetime import date
import pytest
from app.models.schemas import StructuredClaimRecord, EvidenceItem, PolicySpan
from app.merge.grounding_gate import GroundingGate, GroundingGateError, merge_and_assemble_verdict
from app.rules.rule_engine import IRDAIRuleEngine


def test_grounding_gate_drops_ungrounded_statement():
    """Any assertion lacking a page number or provision ref must be dropped."""
    gate = GroundingGate()
    proposed = [
        # Valid policy span
        EvidenceItem(
            id="ev_1",
            statement="Valid policy assertion",
            source_type="policy_span",
            page_number=14,
            source_text="Clause 4.2 text",
            ordinal=1,
        ),
        # Ungrounded assertion (missing page_number!)
        EvidenceItem(
            id="ev_2",
            statement="Ungrounded speculative claim",
            source_type="policy_span",
            page_number=None, # Violation!
            source_text="Some text without page",
            ordinal=2,
        ),
        # Valid provision item
        EvidenceItem(
            id="ev_3",
            statement="Valid IRDAI assertion",
            source_type="provision",
            provision_ref="IRDAI Master Circular cl. 13",
            source_text="Statutory moratorium text",
            ordinal=3,
        ),
        # Ungrounded provision item (missing provision_ref!)
        EvidenceItem(
            id="ev_4",
            statement="Ungrounded legal assertion",
            source_type="provision",
            provision_ref=None, # Violation!
            source_text="Some rule text",
            ordinal=4,
        ),
    ]

    filtered = gate.filter_evidence(proposed)
    assert len(filtered) == 2
    assert filtered[0].id == "ev_1"
    assert filtered[1].id == "ev_3"


def test_no_statement_survives_grounding():
    """If no statement has a verified source, system must raise exact PRD error."""
    claim = StructuredClaimRecord(
        insurer_name="General Insurance Co",
        rejection_date=date(2026, 8, 15),
        stated_ground="Generic unexplained rejection",
        cited_clause_ref=None,
    )
    # Empty rule results and no policy span
    with pytest.raises(GroundingGateError) as exc_info:
        merge_and_assemble_verdict(claim, rule_results=[], policy_span=None, clause_error_msg=None)
    assert "We could not reach a conclusion we can evidence from your documents." in str(exc_info.value)
