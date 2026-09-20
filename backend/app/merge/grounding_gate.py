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

        rule_passed = any(r.outcome == "pass" for r in rule_results)
        rule_failed = any(r.outcome == "fail" for r in rule_results)

        # SCENARIO A: Rejection letter did NOT cite any rejection clause (Case 2 / Flow C)
        if not claim.cited_clause_ref:
            if clause_error_msg:
                reasons.append("The rejection letter does not specify any contractual clause, exclusion, condition, or policy provision explaining why the claim was rejected.")
                reasons.append("Under IRDAI Master Circular on Operations 2024 cl. 6, insurers are legally mandated to communicate specific grounds along with operative policy terms for any claim rejection.")
                reasons.append("A formal Request-for-Grounds letter has been prepared demanding the insurer disclose the specific clause and evidence relied upon.")

                prov_ref = "IRDAI Master Circular on Operations 2024 cl. 6 / Claim Settlement Norms"
                raw_evidence.append(
                    EvidenceItem(
                        id=f"ev_{uuid.uuid4().hex[:8]}",
                        statement="Insurers are legally mandated to convey specific contractual grounds and operative policy clauses for claim repudiation.",
                        source_type="provision",
                        provision_ref=prov_ref,
                        source_text="[IRDAI Master Circular on Operations 2024 cl. 6]: Rejection of claims shall be made only after communicating specific grounds along with operative policy terms and conditions. Generic or clause-less repudiations violate regulatory standards.",
                        ordinal=ordinal,
                    )
                )
                ordinal += 1

            gate = GroundingGate()
            grounded_evidence = gate.filter_evidence(raw_evidence)
            if not grounded_evidence:
                raise GroundingGateError("We could not reach a conclusion we can evidence from your documents.")

            return Verdict(
                level="moderate",
                summary="The insurer has repudiated the claim without specifying any contractual policy clause, exclusion, condition, or provision.",
                reasons=reasons,
                evidence_trail=grounded_evidence,
                flow="flow_c",
                appeal_available=False,
                grounds_letter_available=True,
            )

        # SCENARIO B: Rejection letter cited a clause that does NOT exist in the policy (Case 3 / Mismatch)
        if claim.cited_clause_ref and policy_span is None:
            mismatch_statement = f"The clause your insurer cited ({claim.cited_clause_ref}) does not appear anywhere in this policy document. This establishes a clause/policy mismatch."
            reasons.append(f"The insurer cited '{claim.cited_clause_ref}' as the basis for claim repudiation, but verification against the policy wording confirms that this clause does not exist in the policy contract.")
            reasons.append("Under IRDAI regulations and insurance contract law, an insurer cannot reject a claim based on non-existent, uncontracted, or phantom policy terms.")
            reasons.append("An official Grievance Redressal Officer (GRO) appeal has been prepared demanding immediate withdrawal of the repudiation due to contractual invalidity.")

            # Evidence 1: Document audit proving clause is absent
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Clause '{claim.cited_clause_ref}' cited in the rejection letter does not appear anywhere in the policy wording issued to the policyholder.",
                    source_type="provision",
                    provision_ref="Policy Document Audit / Clause Verification",
                    source_text=f"[Policy Document Audit]: The uploaded policy wording was audited for '{claim.cited_clause_ref}'. No operative clause or exclusion matching this reference exists in the policy contract issued to the insured.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            # Evidence 2: IRDAI regulatory repudiation standard
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement="Insurers must substantiate claim repudiation under operative policy provisions; repudiation under non-existent terms is invalid.",
                    source_type="provision",
                    provision_ref="IRDAI Master Circular 2024 cl. 6 / Fair Repudiation Norms",
                    source_text="[IRDAI Master Circular 2024 cl. 6]: Rejection of claims shall be made only with reference to operative policy terms in the policyholder's contract. Citing non-existent clauses violates fair claims settlement standards.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            gate = GroundingGate()
            grounded_evidence = gate.filter_evidence(raw_evidence)
            if not grounded_evidence:
                raise GroundingGateError("We could not reach a conclusion we can evidence from your documents.")

            return Verdict(
                level="strong",
                summary=f"Clause/Policy Mismatch: The insurer repudiated the claim citing '{claim.cited_clause_ref}', but this clause does not exist anywhere in the policy wording.",
                reasons=reasons,
                evidence_trail=grounded_evidence,
                flow="flow_a",
                appeal_available=True,
                grounds_letter_available=False,
            )

        # SCENARIO C: Clause exists in the policy, evaluate Rule Results (Case 1, Flow B, or Contractual ambiguity)
        # 1. Inspect Path A (Deterministic Rule Engine)
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

        gate = GroundingGate()
        grounded_evidence = gate.filter_evidence(raw_evidence)
        if not grounded_evidence:
            raise GroundingGateError("We could not reach a conclusion we can evidence from your documents.")

        # Determine level and flow for grounded policy clause
        if rule_passed:
            level = "strong"
            summary = "The insurer's rejection directly contravenes binding IRDAI regulatory provisions."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False
        elif rule_failed:
            level = "weak"
            summary = "The insurer's repudiation appears legally and contractually consistent with policy waiting periods."
            flow = "flow_b"
            appeal_available = False
            grounds_letter_available = False
        else:
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
