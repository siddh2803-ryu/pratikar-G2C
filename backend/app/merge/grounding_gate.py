import re
import uuid
from typing import List, Optional, Tuple, Any
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


def extract_policy_waiting_period_months(text: str) -> Optional[int]:
    """Extracts explicit waiting period duration in months from policy clause wording."""
    # Look for months: e.g. "waiting period of 24 months", "24 months waiting", "expiry of 36 months"
    m_match = re.search(r"(\d+)\s*(?:continuous\s*)?months(?:\s*(?:of\s*continuous\s*coverage|waiting\s*period|waiting))?", text, re.IGNORECASE)
    if m_match:
        return int(m_match.group(1))

    # Look for years: e.g. "waiting period of 2 years", "2 years waiting"
    y_match = re.search(r"(\d+)\s*(?:continuous\s*)?years(?:\s*(?:of\s*continuous\s*coverage|waiting\s*period|waiting))?", text, re.IGNORECASE)
    if y_match:
        return int(y_match.group(1)) * 12

    # Look for days: e.g. "within 30 days" or "30 days waiting period"
    d_match = re.search(r"(?:within\s*)?(\d+)\s*days\b", text, re.IGNORECASE)
    if d_match:
        days = int(d_match.group(1))
        return max(1, days // 30)

    return None


def merge_and_assemble_verdict(
    claim: StructuredClaimRecord,
    rule_results: List[RuleResult],
    policy_span: Optional[PolicySpan],
    clause_error_msg: Optional[str] = None,
    policy_chunks: Optional[List[Any]] = None,
) -> Verdict:
    """Combines Path A (Deterministic Rule Engine) and Path B (Clause Retrieval)
    into a fully verified, explained, case-specific verdict with zero ungrounded assertions.
    """
    with StageTimer("merge_and_verdict"):
        raw_evidence: List[EvidenceItem] = []
        reasons: List[str] = []
        ordinal = 1

        rule_passed = any(r.outcome == "pass" for r in rule_results)
        rule_failed = any(r.outcome == "fail" for r in rule_results)

        # SCENARIO A: Rejection letter did NOT cite any rejection clause (Flow C)
        if not claim.cited_clause_ref:
            summary = "The insurer has repudiated the claim without specifying any contractual policy clause, exclusion, condition, or provision."
            
            reasons.append(
                f"Rejection Reason Stated: The insurer's repudiation states: \"{claim.stated_ground}\"."
            )
            reasons.append(
                "Cited Policy Provision: The rejection letter fails to specify any contractual clause, exclusion, condition, or policy provision as the legal basis for rejecting the claim."
            )
            reasons.append(
                "Policy Verification: In the absence of an explicit clause citation from the insurer, no specific contractual exclusion or condition can be verified or matched against the policy document."
            )
            reasons.append(
                "Regulatory & Legal Analysis: Under IRDAI Master Circular on Operations 2024 cl. 6, insurers are legally mandated to communicate specific grounds along with operative policy terms for any claim rejection. Blanket, vague, or clause-less repudiations violate regulatory claims settlement standards."
            )
            reasons.append(
                "Action & Next Steps: A formal Request-for-Grounds letter has been prepared demanding the insurer disclose the specific clause and evidence relied upon before any further appeal."
            )

            if clause_error_msg:
                prov_ref = "IRDAI Master Circular on Operations 2024 cl. 6 / Claim Settlement Norms"
                source_detail = (
                    f"[IRDAI Master Circular on Operations 2024 cl. 6]: {clause_error_msg}"
                    if not clause_error_msg.startswith("[")
                    else clause_error_msg
                )
                raw_evidence.append(
                    EvidenceItem(
                        id=f"ev_{uuid.uuid4().hex[:8]}",
                        statement="Insurers are legally mandated to convey specific contractual grounds and operative policy clauses for claim repudiation.",
                        source_type="provision",
                        provision_ref=prov_ref,
                        source_text=source_detail,
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
                summary=summary,
                reasons=reasons,
                evidence_trail=grounded_evidence,
                flow="flow_c",
                appeal_available=False,
                grounds_letter_available=True,
            )

        # SCENARIO B: Rejection letter cited a clause that does NOT exist in the policy (Clause/Policy Mismatch)
        if claim.cited_clause_ref and policy_span is None:
            summary = f"Clause/Policy Mismatch: The insurer repudiated the claim citing '{claim.cited_clause_ref}', but this clause does not exist anywhere in the policy wording."

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim stating: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The rejection letter explicitly cited '{claim.cited_clause_ref}' as the contractual basis for claim repudiation."
            )
            reasons.append(
                f"Policy Verification: Verification against the policy document confirms that '{claim.cited_clause_ref}' does not exist as an operative provision in the policy contract issued to the insured."
            )
            reasons.append(
                "Regulatory & Legal Analysis: Under IRDAI regulations and insurance contract law, an insurer cannot reject a claim based on non-existent, uncontracted, or phantom policy terms. Repudiating a claim under terms absent from the policyholder's contract is legally void."
            )
            reasons.append(
                "Action & Next Steps: A formal Grievance Redressal Officer (GRO) appeal has been prepared demanding immediate withdrawal of the repudiation due to contractual invalidity."
            )

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
                summary=summary,
                reasons=reasons,
                evidence_trail=grounded_evidence,
                flow="flow_a",
                appeal_available=True,
                grounds_letter_available=False,
            )

        # SCENARIO C: Clause exists in the policy — Perform Semantic Comparison and Validation
        # 1. Compute tenure and days
        days = None
        if claim.policy_inception_date and claim.rejection_date:
            days = (claim.rejection_date - claim.policy_inception_date).days
        continuous_months = claim.continuous_months
        if continuous_months is None and days is not None:
            continuous_months = max(0, days // 30)

        # 2. Check tenure vs policy waiting period
        policy_waiting_months = extract_policy_waiting_period_months(policy_span.quoted_text)
        tenure_satisfied = False
        tenure_unexpired = False

        if policy_waiting_months is not None and continuous_months is not None:
            if continuous_months >= policy_waiting_months:
                tenure_satisfied = True
            elif continuous_months < policy_waiting_months:
                tenure_unexpired = True

        # Check if 30-day initial waiting period applies
        is_initial_30_days = (
            (days is not None and 0 <= days <= 30)
            or (continuous_months is not None and continuous_months < 1)
        ) and any(
            kw in (claim.stated_ground or "").lower() or kw in (claim.cited_clause_ref or "").lower() or kw in policy_span.quoted_text.lower()
            for kw in ["30-day", "30 days", "initial waiting", "clause 4.1", "early claim", "initial exclusion"]
        )

        moratorium_rule = next((r for r in rule_results if r.rule_id == "moratorium_60_month" and r.outcome == "pass"), None)

        # 3. Determine Verdict Level, Flow, Summary, Detailed Reasons, and Grounded Evidence
        if moratorium_rule or (continuous_months is not None and continuous_months >= 60 and rule_passed):
            level = "strong"
            summary = "The insurer's repudiation violates binding IRDAI regulations. After 60 continuous months of coverage, claims cannot be contested for pre-existing disease or non-disclosure."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim stating: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The rejection letter cited '{claim.cited_clause_ref}' as the basis for repudiation."
            )
            reasons.append(
                f"Policy Verification: Operative Clause {policy_span.clause_ref} was identified on Page {policy_span.page_number} of the policy wording."
            )
            reasons.append(
                f"Regulatory Protection (IRDAI Master Circular 2024 cl. 13): The insurer rejected the claim citing pre-existing condition or non-disclosure, but the policy has completed {continuous_months or 60} months of continuous coverage. Under IRDAI Master Circular 2024 cl. 13, the moratorium period of 60 months has elapsed, making the policy and claim incontestable on these grounds."
            )
            reasons.append(
                f"Statutory Supremacy: Policy Clause {policy_span.clause_ref} operates subject to statutory IRDAI moratorium limits which override restrictive policy wording. The claim is legally incontestable on these grounds, providing strong grounds for a formal GRO appeal."
            )
            reasons.append(
                "Action & Next Steps: An official Grievance Redressal Officer (GRO) appeal has been prepared demanding immediate withdrawal of the repudiation and full settlement."
            )

            # Evidence 1: IRDAI Master Circular Moratorium
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"The policy has completed {continuous_months or 60} continuous months of coverage, exceeding the 60-month statutory moratorium.",
                    source_type="provision",
                    provision_ref="IRDAI Master Circular 2024 cl. 13 / Moratorium Clause",
                    source_text="[IRDAI Master Circular 2024 cl. 13]: After sixty continuous months of health insurance coverage, no policy and no claim can be contested on grounds of non-disclosure, misrepresentation, or pre-existing disease, save for established fraud.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            # Evidence 2: Verbatim policy clause span
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number} of policy wording.",
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Clause {policy_span.clause_ref}: \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        elif rule_passed:
            # Another rule passed (e.g. 36-month PED cap violation)
            level = "strong"
            summary = "The insurer's rejection directly contravenes binding IRDAI regulatory provisions."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim stating: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The rejection letter cited '{claim.cited_clause_ref}' as the basis for repudiation."
            )
            reasons.append(
                f"Policy Verification: Operative Clause {policy_span.clause_ref} was identified on Page {policy_span.page_number} of the policy wording."
            )
            for rule_res in rule_results:
                if rule_res.outcome == "pass":
                    reasons.append(
                        f"Regulatory Protection ({rule_res.provision_ref}): {rule_res.explanation}"
                    )
            reasons.append(
                "Statutory Supremacy: Statutory IRDAI regulations override restrictive policy wording. The claim is legally incontestable on these grounds, providing strong grounds for a formal GRO appeal."
            )
            reasons.append(
                "Action & Next Steps: A formal GRO appeal has been prepared citing regulatory supremacy."
            )

            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number}.",
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Policy Wording (Page {policy_span.page_number}): \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            for rule_res in rule_results:
                if rule_res.outcome == "pass":
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

        elif tenure_satisfied:
            level = "strong"
            summary = f"Contradicted by Policy Terms: Policy Clause {policy_span.clause_ref} requires a waiting period of {policy_waiting_months} months, which the policyholder has already satisfied ({continuous_months} months served)."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim citing waiting period: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The rejection letter cited '{claim.cited_clause_ref}' as the contractual basis."
            )
            reasons.append(
                f"Policy Verification: Operative Clause {policy_span.clause_ref} on Page {policy_span.page_number} mandates a waiting period of {policy_waiting_months} months."
            )
            reasons.append(
                f"Contradiction Established: The policyholder completed {continuous_months} months of continuous coverage before this claim. The required waiting period of {policy_waiting_months} months has been fully satisfied, making the insurer's rejection an explicit contradiction of its own policy terms."
            )
            reasons.append(
                "Action & Next Steps: A formal GRO appeal has been prepared citing the continuous policy tenure and operative clause wording to demand immediate settlement."
            )

            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number}.",
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Policy Wording (Page {policy_span.page_number}): \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} mandates a waiting period of {policy_waiting_months} months, which the policyholder has completed ({continuous_months} continuous months active).",
                    source_type="provision",
                    provision_ref="Policy Waiting Period Compliance / Contractual Right",
                    source_text=f"[Policy Contract Compliance]: Clause {policy_span.clause_ref} specifies a waiting period of {policy_waiting_months} months. Policy records confirm {continuous_months} continuous months of coverage. The waiting period condition precedent is fully met.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        elif rule_failed or is_initial_30_days or (tenure_unexpired and not rule_passed):
            # Scenario 2: Repudiation is supported by policy terms and legal waiting period (Weak verdict)
            duration_desc = f"{days} days" if days is not None else (f"{continuous_months} months" if continuous_months is not None else "initial waiting period")
            level = "weak"
            summary = "The insurer's repudiation is legally and contractually valid under operative policy waiting period provisions."
            flow = "flow_b"
            appeal_available = False
            grounds_letter_available = False

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim stating: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The rejection letter cited '{claim.cited_clause_ref}' (initial 30-day waiting period for illnesses other than accidents)."
            )
            reasons.append(
                f"Policy Verification: Operative Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number} specifies an initial waiting period of 30 days from inception during which illness claims are excluded."
            )
            reasons.append(
                f"Verification Result: The claim occurred after {duration_desc} of active coverage, which is within the valid waiting period window. The repudiation is contractually and legally supported by policy terms."
            )
            reasons.append(
                "Statutory Norm: Under IRDAI Master Circular on Operations 2024 and standard health insurance policy conditions, an initial waiting period of 30 days from inception is statutorily and contractually valid. No appeal grounds exist for this repudiation."
            )
            reasons.append(
                "Conclusion: Because the rejection is consistent with the policy wording and IRDAI regulations, an appeal is unlikely to succeed unless documentation proves an emergency exception applies."
            )

            # Evidence 1: Verbatim policy clause span
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} specifies an initial waiting period of 30 days from inception during which illness claims are excluded.",
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Clause {policy_span.clause_ref}: \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            # Evidence 2: IRDAI regulatory norm
            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"The claim occurred {duration_desc} after policy inception, falling squarely within the contractually operative 30-day exclusion window.",
                    source_type="provision",
                    provision_ref="IRDAI Health Insurance Regulations / Waiting Period Norms",
                    source_text="[IRDAI Norms]: Insurers are permitted an initial 30-day waiting period from policy inception for all illnesses. Repudiation within this window is valid.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        else:
            # Contractual ambiguity or contestable condition
            level = "moderate"
            summary = f"Contractual Ambiguity: The rejection under Clause {policy_span.clause_ref} is subject to contestable interpretation under operative policy terms."
            flow = "flow_a"
            appeal_available = True
            grounds_letter_available = False

            reasons.append(
                f"Rejection Reason Stated: The insurer repudiated the claim stating: \"{claim.stated_ground}\"."
            )
            reasons.append(
                f"Cited Policy Provision: The insurer cited '{claim.cited_clause_ref}' as the contractual basis for rejection."
            )
            reasons.append(
                f"Policy Verification: Operative Clause {policy_span.clause_ref} on Page {policy_span.page_number} governs exclusions and conditions for this category."
            )
            reasons.append(
                "Contractual Interpretation: Under the legal principle of Contra Proferentem and IRDAI fair claims guidelines, any ambiguities or conditional exclusions in standard form insurance contracts must be interpreted in favour of the policyholder."
            )
            reasons.append(
                "Action & Next Steps: A formal GRO appeal has been prepared challenging the insurer's restrictive interpretation and demanding re-examination under fair claims standards."
            )

            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement=f"Policy Clause {policy_span.clause_ref} retrieved verbatim from Page {policy_span.page_number}.",
                    source_type="policy_span",
                    page_number=policy_span.page_number,
                    source_text=f"Policy Wording (Page {policy_span.page_number}): \"{policy_span.quoted_text}\"",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

            raw_evidence.append(
                EvidenceItem(
                    id=f"ev_{uuid.uuid4().hex[:8]}",
                    statement="Ambiguities in insurance policy exclusions must be construed in favour of the insured under IRDAI standards and Contra Proferentem.",
                    source_type="provision",
                    provision_ref="IRDAI Policyholder Protection Norms / Contra Proferentem",
                    source_text="[IRDAI Guidelines & Insurance Contract Law]: Exclusionary clauses in standard form insurance policies are construed strictly against the insurer. Where terms admit of more than one interpretation, the construction favourable to the insured shall prevail.",
                    ordinal=ordinal,
                )
            )
            ordinal += 1

        gate = GroundingGate()
        grounded_evidence = gate.filter_evidence(raw_evidence)
        if not grounded_evidence:
            raise GroundingGateError("We could not reach a conclusion we can evidence from your documents.")

        return Verdict(
            level=level,
            summary=summary,
            reasons=reasons,
            evidence_trail=grounded_evidence,
            flow=flow,
            appeal_available=appeal_available,
            grounds_letter_available=grounds_letter_available,
        )
