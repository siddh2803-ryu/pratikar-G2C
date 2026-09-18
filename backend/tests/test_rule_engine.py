"""Unit tests for the Deterministic IRDAI Rule Engine.
Tests every rule against known pass/fail inputs and verifies 100% determinism.
"""
from datetime import date
import pytest
from app.models.schemas import StructuredClaimRecord
from app.rules.rule_engine import IRDAIRuleEngine


@pytest.fixture
def engine():
    return IRDAIRuleEngine()


def test_moratorium_60_month_violation(engine):
    """Claim rejected for pre-existing disease after 65 months must fire moratorium_60_month as pass (contest valid)."""
    claim = StructuredClaimRecord(
        insurer_name="Star Health and Allied Insurance",
        policy_number="P/12345/01/2026",
        claim_reference="CIR/2026/09981",
        claim_amount=245000.0,
        rejection_date=date(2026, 8, 15),
        stated_ground="Rejection under Clause 4.2 - Pre-Existing Disease (Hypertension not disclosed)",
        cited_clause_ref="Clause 4.2",
        policy_inception_date=date(2021, 3, 1), # ~65 months
        continuous_months=65,
    )
    results = engine.evaluate_all(claim)
    moratorium_results = [r for r in results if r.rule_id == "moratorium_60_month"]
    assert len(moratorium_results) == 1
    res = moratorium_results[0]
    assert res.outcome == "pass"
    assert "IRDAI Master Circular 2024 cl. 13" in res.provision_ref
    assert "65 months" in res.explanation
    assert "incontestable" in res.explanation


def test_moratorium_missing_field(engine):
    """If policy_inception_date is missing, rule must state the exact PRD-mandated string."""
    claim = StructuredClaimRecord(
        insurer_name="HDFC ERGO General Insurance",
        rejection_date=date(2026, 8, 15),
        stated_ground="Pre-existing disease exclusion",
        cited_clause_ref="Clause 4.2",
        policy_inception_date=None, # Missing!
        continuous_months=None,
    )
    results = engine.evaluate_all(claim)
    moratorium_results = [r for r in results if r.rule_id == "moratorium_60_month"]
    assert len(moratorium_results) == 1
    res = moratorium_results[0]
    assert res.outcome == "not_applicable"
    assert res.explanation == "We could not check the moratorium because the policy start date was not found."


def test_initial_30_day_valid_rejection(engine):
    """Claim occurring within first 30 days for illness is a valid rejection (Flow B / Weak verdict)."""
    claim = StructuredClaimRecord(
        insurer_name="Care Health Insurance",
        rejection_date=date(2026, 8, 12),
        stated_ground="Repudiated under Clause 4.1: Claim within initial 30 days waiting period",
        cited_clause_ref="Clause 4.1",
        policy_inception_date=date(2026, 8, 1), # 11 days
        continuous_months=0,
    )
    results = engine.evaluate_all(claim)
    waiting_results = [r for r in results if r.rule_id == "waiting_period_initial_30_days"]
    assert len(waiting_results) == 1
    res = waiting_results[0]
    assert res.outcome == "fail" # Rejection stands (weak contestability)
    assert "initial exclusion period" in res.explanation or "first 30 days" in res.explanation


def test_rule_determinism(engine):
    """Running identical input 100 times must produce identical results every single time."""
    claim = StructuredClaimRecord(
        insurer_name="ICICI Lombard",
        rejection_date=date(2026, 8, 15),
        stated_ground="Clause 4.2 pre-existing disease",
        cited_clause_ref="Clause 4.2",
        policy_inception_date=date(2020, 1, 1),
        continuous_months=79,
    )
    first_run = [r.model_dump() for r in engine.evaluate_all(claim)]
    for _ in range(100):
        assert [r.model_dump() for r in engine.evaluate_all(claim)] == first_run
