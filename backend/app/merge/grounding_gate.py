"""Merge Step and Architectural Grounding Gate.
Combines Path A (Rule Engine) and Path B (Clause Retrieval).
Enforces zero-tolerance grounding: drops any assertion lacking an explicit policy page span or IRDAI provision (FR-07, FR-08, BR-02).
"""
import uuid
from typing import List, Optional, Tuple
from app.core.logging import structured_logger, StageTimer
from app.models.schemas import (
    StructuredClaimRecord,
    RuleResult,
    PolicySpan,
    EvidenceItem,
    Verdict,
)


class GroundingGateError(Exception):
    def __init__(self, message: str = "We could not reach a conclusion we can evidence from your documents."):
        super().__init__(message)
        self.message = message


class GroundingGate:
    """Hard architectural boundary: every statement MUST resolve to a verified source.
    Untrusted or unevidenced assertions are immediately discarded.
    """
    def filter_evidence(self, proposed_items: List[EvidenceItem]) -> List[EvidenceItem]:
        valid_items: List[EvidenceItem] = []
        violations_count = 0

        for item in proposed_items:
            has_policy_source = (
                item.source_type == "policy_span"
                and item.page_number is not None
                and item.page_number > 0
                and bool(item.source_text and item.source_text.strip())
            )
            has_provision_source = (
                item.source_type == "provision"
                and bool(item.provision_ref and item.provision_ref.strip())
                and bool(item.source_text and item.source_text.strip())
            )

            if has_policy_source or has_provision_source:
                valid_items.append(item)
            else:
                violations_count += 1
                structured_logger.log_event(
                    event="grounding_violation_dropped",
                    stage="grounding_gate",
                    level="WARNING",
                    details={
                        "dropped_statement": item.statement,
                        "source_type": item.source_type,
                        "page_number": item.page_number,
                        "provision_ref": item.provision_ref,
                    },
                )

        structured_logger.log_event(
            event="grounding_check_complete",
            stage="grounding_gate",
            details={
                "surviving_count": len(valid_items),
                "violations_dropped": violations_count,
            },
        )
        return valid_items


def merge_and_assemble_verdict(
    claim: StructuredClaimRecord,
    rule_results: List[RuleResult],
    policy_span: Optional[PolicySpan],
    clause_error_msg: Optional[str] = None,
) -> Verdict:
    with StageTimer("merge_and_verdict"):
        raw_evidence: List[EvidenceItem] = []
        reasons: List[str] = []
        ordinal = 1

        # 1. Inspect Path A (Deterministic Rule Engine) — BINDING ORDER
        rule_passed = any(r.outcome == "pass" for r in rule_results)
        rule_failed = any(r.outcome == "fail" for r in rule_results)

        for rule_res in rule_results:
            if rule_res.outcome in ("pass", "fail"):
                reasons.append(rule_res.explanation)
                raw_evidence.append(
                    EvidenceItem(
                        id=f"ev_{uuid.uuid4().hex[:8]}",
                        statement=rule_res.explanation,
                        source_type="provision",
                        provision_ref=rule_res.provision_ref,
                        source_text=f"[{rule_res.provision_ref}]: {rule_res.title}. {rule_res.explanation}",
                        ordinal=ordinal,
                    )
                )
                ordinal += 1

        # 2. Inspect Path B (Verbatim Policy Span)
        if policy_span:
            clause_stmt = f"Policy Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number}."
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=clause_stmt,
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Policy Wording (Page {policy_span.page_number}): \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        # Check for clause absent / mismatch
        if clause_error_msg:
            reasons.append(clause_error_msg)
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=clause_error_msg,
                    source_type="provision",
                    provision_ref="IRDAI Policyholder Protection / Claim Repudiation Norms",
                    source_text=clause_error_msg,
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        # 3. Apply Architectural Grounding Gate
        gate = GroundingGate()
        grounded_evidence = gate.filter_evidence(raw_evidence)

        if not grounded_evidence:
            structured_logger.log_event(
                event="no_statement_survived_grounding",
                stage="merge_and_verdict",
                level="ERROR",
            )
            raise GroundingGateError("We could not reach a conclusion we can evidence from your documents.")

        # 4. Determine Verdict Level and Flow
        # Flow C: cited_clause_ref is absent or was clause-less
        if not claim.cited_clause_ref:
            level = "moderate"
            summary = "The insurer has repudiated the claim without citing a specific contractual policy clause."
            flow = "flow_c"
            appeal_available = False
            grounds_letter_available = True
        elif rule_failed:
            # Flow B: Rejection is valid (Weak verdict path)
            level = "weak"
            summary = "The insurer's repudiation appears legally and contractually consistent with policy waiting periods."
            flow = "flow_b"
            appeal_available = False
            grounds_letter_available = False
        elif rule_passed:
            # Flow A: Strong verdict (moratorium violation or explicit rule violation)
            level = "strong"
            summary = "The insurer's rejection directly contravenes binding IRDAI regulatory provisions."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False
        else:
            # Flow A: Moderate verdict (contestable on contractual terms)
            level = "moderate"
            summary = "The cited clause is subject to contractual ambiguities or contestable conditions."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False

        return Verdict(
            level=level,
            summary=summary,
            reasons=reasons,
            evidence_trail=grounded_evidence,
            flow=flow,
            appeal_available=appeal_available,
            grounds_letter_available=grounds_letter_available,
        )
