"""Appeal Document Generator for Pratikar using ReportLab.
Generates ready-to-file Grievance-Officer appeal letters and Request-for-Grounds letters.
Embeds Noto Sans Devanagari font for Devanagari rendering (PRD FR-09, FR-10, Tech Stack §6).
"""
import io
import os
from pathlib import Path
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.models.schemas import StructuredClaimRecord, Verdict
from app.translation.translator import translate_text


# Register Noto Sans Devanagari font
FONT_NAME = "Helvetica"
FONT_BOLD = "Helvetica-Bold"

font_path = Path(__file__).resolve().parent.parent.parent / "fonts" / "NotoSansDevanagari-Regular.ttf"
if font_path.exists():
    try:
        pdfmetrics.registerFont(TTFont("NotoSansDevanagari", str(font_path)))
        FONT_NAME = "NotoSansDevanagari"
        FONT_BOLD = "NotoSansDevanagari"
    except Exception:
        pass


def generate_gro_appeal_text(claim: StructuredClaimRecord, verdict: Verdict, language: str = "en") -> str:
    """Drafts the grievance appeal letter text strictly from established grounds."""
    reasons_text = "\n".join([f"• {r}" for r in verdict.reasons])
    evidence_text = "\n".join([
        f"[{i+1}] {e.statement} (Source: {e.provision_ref or f'Policy Page {e.page_number}'})"
        for i, e in enumerate(verdict.evidence_trail)
    ])

    amount_str = f"Rs. {claim.claim_amount:,.2f}" if claim.claim_amount else "As per submitted hospital bills"
    policy_str = claim.policy_number or "Refer policy copy enclosed"
    claim_ref_str = claim.claim_reference or "N/A"

    doc_text = f"""FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS

To,
The Grievance Redressal Officer (GRO)
{claim.insurer_name}

Subject: Contest and Demand for Reconsideration of Repudiated Claim Ref: {claim_ref_str}

Dear Sir/Madam,

I am writing to register an official grievance against the repudiation of my health insurance claim under Policy Number {policy_str}.

1. CLAIM PARTICULARS
• Policyholder / Insured: Insured Claimant
• Policy Number: {policy_str}
• Claim Reference Number: {claim_ref_str}
• Date of Repudiation: {claim.rejection_date.strftime('%d/%m/%Y')}
• Disputed Claim Amount: {amount_str}
• Ground Cited by Insurer: {claim.stated_ground}

2. STATUTORY AND CONTRACTUAL GROUNDS FOR APPEAL
The repudiation of this claim is untenable on the following specific regulatory and contractual grounds:

{reasons_text}

3. EVIDENCE AND POLICY CITATIONS
The following specific provisions of binding IRDAI circulars and policy terms support this appeal:
{evidence_text}

4. DEMAND FOR REDRESSAL & STATUTORY TIMELINE
Under the IRDAI (Protection of Policyholders' Interests) Regulations, 2024, the insurer is mandated to resolve policyholder grievances within 15 calendar days of receipt.

I hereby demand:
1. Immediate reversal of the repudiation decision.
2. Full settlement and disbursement of the claim amount of {amount_str} along with statutory interest as prescribed by IRDAI.

Please take notice that in the event this grievance is not resolved to satisfaction within 15 days, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.

5. NON-ADVICE NOTICE & DECLARATION
{verdict.non_advice_notice}

Yours faithfully,

Policyholder / Claimant
Date: {claim.rejection_date.strftime('%d/%m/%Y')}
"""
    if language == "hi":
        return translate_text(doc_text, target_lang="hi")
    return doc_text


def generate_grounds_request_text(claim: StructuredClaimRecord, verdict: Verdict, language: str = "en") -> str:
    """Drafts Request-for-Grounds letter for Flow C (clause-less rejection)."""
    claim_ref_str = claim.claim_reference or "N/A"
    policy_str = claim.policy_number or "Refer policy copy"

    doc_text = f"""REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION

To,
The Claims Department / Grievance Redressal Officer
{claim.insurer_name}

Subject: Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: {claim_ref_str}

Dear Sir/Madam,

I am in receipt of your communication dated {claim.rejection_date.strftime('%d/%m/%Y')} repudiating my health insurance claim under Policy No. {policy_str} (Claim Ref: {claim_ref_str}).

The communication received does not specify the precise policy clause, wording, or medical advisory report on which the repudiation is founded.

Under IRDAI Master Circular on Operations of Health Insurance Business (IRDAI/HLT/CIR/PRO/84/5/2024), insurers are legally required to state clear, specific, and reasoned grounds citing the exact operative policy clause whenever a claim is rejected.

I hereby request you to provide within 7 days:
1. The exact clause and section of the policy schedule relied upon.
2. The complete medical and investigation report justifying the repudiation.

Yours faithfully,

Policyholder / Claimant
Date: {claim.rejection_date.strftime('%d/%m/%Y')}
"""
    if language == "hi":
        return translate_text(doc_text, target_lang="hi")
    return doc_text


def build_appeal_pdf(
    claim: StructuredClaimRecord,
    verdict: Verdict,
    kind: str = "gro_letter",
    language: str = "en",
) -> bytes:
    """Renders the appeal letter to PDF bytes using ReportLab."""
    if kind == "grounds_request":
        text_content = generate_grounds_request_text(claim, verdict, language=language)
        title = "DEMAND FOR SPECIFIC GROUNDS"
    else:
        text_content = generate_gro_appeal_text(claim, verdict, language=language)
        title = "FORMAL GRIEVANCE APPEAL"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    normal_style = ParagraphStyle(
        "AppealNormal",
        parent=styles["Normal"],
        fontName=FONT_NAME,
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
    )
    title_style = ParagraphStyle(
        "AppealTitle",
        parent=styles["Heading1"],
        fontName=FONT_BOLD,
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        alignment=1, # Center
    )
    banner_style = ParagraphStyle(
        "AppealBanner",
        parent=styles["Normal"],
        fontName=FONT_NAME,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
    )

    story = []

    # Title & subtitle
    story.append(Paragraph(f"<b>{title}</b>", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Prepared via Pratikar InsurTech Contest Engine · Filed by Policyholder", banner_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))

    # Body paragraphs
    paragraphs = text_content.split("\n\n")
    for p in paragraphs:
        clean_p = p.strip().replace("\n", "<br/>")
        if clean_p:
            story.append(Paragraph(clean_p, normal_style))
            story.append(Spacer(1, 8))

    doc.build(story)
    return buf.getvalue()
