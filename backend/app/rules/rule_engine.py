"""Deterministic IRDAI Rule Engine.
Evaluates coded IRDAI provisions (loaded from Navya's YAML rulebook) against the claim record.
Zero model involvement; fully reproducible (PRD FR-05, BR-09).
"""
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml
from app.models.schemas import StructuredClaimRecord, RuleResult
from app.core.logging import structured_logger


class IRDAIRuleEngine:
    def __init__(self, rulebook_path: Optional[str] = None):
        if not rulebook_path:
            # Default to backend/rulebook/irdai_rules.yaml
            base_dir = Path(__file__).resolve().parent.parent.parent
            rulebook_path = str(base_dir / "rulebook" / "irdai_rules.yaml")
        self.rulebook_path = rulebook_path
        self.rules: List[Dict[str, Any]] = self._load_rulebook()

    def _load_rulebook(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.rulebook_path):
            raise FileNotFoundError(f"Rulebook YAML not found at {self.rulebook_path}")
        with open(self.rulebook_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data.get("rules", [])

    def evaluate_all(self, claim: StructuredClaimRecord) -> List[RuleResult]:
        """Evaluates all rules in the rulebook against the structured claim record."""
        results: List[RuleResult] = []
        for rule in self.rules:
            result = self._evaluate_rule(rule, claim)
            results.append(result)
            structured_logger.log_event(
                event="rule_evaluated",
                stage="rule_engine",
                details={
                    "rule_id": result.rule_id,
                    "provision_ref": result.provision_ref,
                    "outcome": result.outcome,
                },
            )
        return results

    def _evaluate_rule(self, rule: Dict[str, Any], claim: StructuredClaimRecord) -> RuleResult:
        rule_id = rule["id"]
        provision_ref = rule["provision_ref"]
        title = rule.get("title", rule_id)
        stated_ground_lower = (claim.stated_ground or "").lower()
        clause_ref_lower = (claim.cited_clause_ref or "").lower()

        # Check target ground match
        target_grounds = rule.get("target_grounds", [])
        applies_to_ground = any(
            g.lower() in stated_ground_lower or g.lower() in clause_ref_lower
            for g in target_grounds
        )

        if not applies_to_ground:
            return RuleResult(
                rule_id=rule_id,
                provision_ref=provision_ref,
                title=title,
                outcome="not_applicable",
                explanation=f"Rule {title} is not applicable to the stated ground '{claim.stated_ground}'.",
            )

        # Continuous months derivation if dates present
        continuous_months = claim.continuous_months
        if continuous_months is None and claim.policy_inception_date and claim.rejection_date:
            days = (claim.rejection_date - claim.policy_inception_date).days
            continuous_months = max(0, days // 30)

        # Check required fields
        required_fields = rule.get("requires_fields", [])
        for field_name in required_fields:
            if field_name == "policy_inception_date" and continuous_months is not None:
                continue
            val = getattr(claim, field_name, None)
            if val is None:
                missing_msg = rule.get(
                    "missing_field_message",
                    f"Required field '{field_name}' is missing to evaluate this rule."
                )
                return RuleResult(
                    rule_id=rule_id,
                    provision_ref=provision_ref,
                    title=title,
                    outcome="not_applicable",
                    explanation=missing_msg,
                )

        # Specific rule evaluation conditions defined in YAML metadata:
        # 1. min_continuous_months (e.g. moratorium_60_month or waiting_period_ped_36)
        if "min_continuous_months" in rule:
            min_months = rule["min_continuous_months"]
            if continuous_months is not None and continuous_months >= min_months:
                # Violation of moratorium / waiting period limit by insurer!
                outcome = rule.get("outcome_on_violation", "pass")
                template = rule.get(
                    "explanation_on_violation",
                    f"Policy tenure of {continuous_months} months exceeds statutory limit of {min_months} months."
                )
                explanation = template.format(continuous_months=continuous_months)
                return RuleResult(
                    rule_id=rule_id,
                    provision_ref=provision_ref,
                    title=title,
                    outcome=outcome,
                    explanation=explanation,
                )
            else:
                template = rule.get(
                    "explanation_on_compliance",
                    f"Policy tenure of {continuous_months} months is within the {min_months}-month threshold."
                )
                explanation = template.format(continuous_months=continuous_months if continuous_months is not None else "unknown")
                return RuleResult(
                    rule_id=rule_id,
                    provision_ref=provision_ref,
                    title=title,
                    outcome="not_applicable",
                    explanation=explanation,
                )

        # 2. max_continuous_months_for_exclusion (e.g. initial 30 days)
        if "max_continuous_months_for_exclusion" in rule:
            max_months = rule["max_continuous_months_for_exclusion"]
            days = None
            if claim.policy_inception_date and claim.rejection_date:
                days = (claim.rejection_date - claim.policy_inception_date).days

            is_within_initial = (
                (days is not None and 0 <= days <= 30)
                or (continuous_months is not None and continuous_months < max_months)
            )
            if is_within_initial:
                outcome = rule.get("outcome_on_valid_rejection", "fail")
                duration_desc = f"{days} days" if days is not None else f"{continuous_months} months"
                template = rule.get(
                    "explanation_on_valid_rejection",
                    f"Claim occurred within the initial exclusion period ({duration_desc})."
                )
                explanation = template.format(continuous_months=duration_desc)
                return RuleResult(
                    rule_id=rule_id,
                    provision_ref=provision_ref,
                    title=title,
                    outcome=outcome,
                    explanation=explanation,
                )

        return RuleResult(
            rule_id=rule_id,
            provision_ref=provision_ref,
            title=title,
            outcome="not_applicable",
            explanation=f"Rule {title} did not meet activation conditions.",
        )
