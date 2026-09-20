"""Pydantic schemas and domain models for Pratikar.
Conforms strictly to PRD §12 and Technology Stack & Architecture §8.
"""
from __future__ import annotations
from datetime import date, datetime, timezone
from typing import List, Literal, Optional, Any, Dict
from pydantic import BaseModel, Field


class StructuredClaimRecord(BaseModel):
    """The structured claim record extracted from the rejection letter.
    Exact field list and nullability defined in PRD §12 and Tech Stack §8.
    """
    insurer_name: str = Field(..., description="Name of the insurance company")
    policy_number: Optional[str] = Field(None, description="Policy number if present")
    claim_reference: Optional[str] = Field(None, description="Claim reference / docket ID")
    claim_amount: Optional[float] = Field(None, description="Claimed or disputed amount in INR")
    rejection_date: date = Field(..., description="Date of the rejection / repudiation letter")
    stated_ground: str = Field(..., description="Verbatim or summary ground stated by insurer")
    cited_clause_ref: Optional[str] = Field(None, description="Clause cited by insurer. Absence drives Flow C.")
    policy_inception_date: Optional[date] = Field(None, description="Policy start date, required for moratorium check")
    continuous_months: Optional[int] = Field(None, description="Continuous months of active coverage")
    policyholder_name: Optional[str] = Field(None, description="Name of the policyholder or insured claimant")


class RuleResult(BaseModel):
    """Result of evaluating a single coded IRDAI provision."""
    rule_id: str
    provision_ref: str
    title: str
    outcome: Literal["pass", "fail", "not_applicable"]
    explanation: str


class PolicySpan(BaseModel):
    """Verbatim quote retrieved from the user's policy wording PDF."""
    clause_ref: str
    page_number: int
    char_start: int
    char_end: int
    quoted_text: str
    surrounding_context: Optional[str] = None


class EvidenceItem(BaseModel):
    """An individual verifiable evidence item linking an assertion to its source.
    Forms the load-bearing Evidence Trail (PRD FR-07, Tech Stack §5.2).
    """
    id: str
    statement: str
    source_type: Literal["policy_span", "provision"]
    policy_chunk_id: Optional[str] = None
    page_number: Optional[int] = None
    provision_ref: Optional[str] = None
    source_text: str
    ordinal: int


class Verdict(BaseModel):
    """Contestability verdict with full evidence trail."""
    level: Literal["strong", "moderate", "weak"]
    summary: str
    reasons: List[str]
    evidence_trail: List[EvidenceItem]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    statutory_deadline: str = Field(
        default="15 days for Grievance Redressal Officer (GRO) appeal; 1 year from GRO decision for Insurance Ombudsman."
    )
    non_advice_notice: str = Field(
        default="This document analysis does not constitute formal legal advice or representation. Pratikar prepares documents for the policyholder to file themselves under IRDAI regulations."
    )
    flow: Literal["flow_a", "flow_b", "flow_c", "flow_d"] = "flow_a"
    grounds_letter_available: bool = False
    appeal_available: bool = True


class AnalysisResponse(BaseModel):
    """Top-level response for an analysis session."""
    analysis_id: str
    status: Literal["processing", "complete", "failed"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    claim_record: Optional[StructuredClaimRecord] = None
    verdict: Optional[Verdict] = None
    appeal_document_id: Optional[str] = None
    appeal_kind: Optional[Literal["gro_letter", "grounds_request"]] = None
    language: str = "en"
    error: Optional[Dict[str, Any]] = None
