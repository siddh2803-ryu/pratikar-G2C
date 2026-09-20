"""Appeal Document Generator for Pratikar using ReportLab.
Generates ready-to-file Grievance-Officer appeal letters and Request-for-Grounds letters.
Supports bilingual rendering (English and Hindi) with embedded Mukta and Helvetica fonts.
Guarantees 100% text and structure synchronization with the on-screen preview.
"""
import io
import os
from pathlib import Path
from typing import Optional, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.models.schemas import StructuredClaimRecord, Verdict
from app.translation.translator import translate_text


# Register fonts
FONT_NORMAL = "Helvetica"
FONT_BOLD = "Helvetica-Bold"

fonts_dir = Path(__file__).resolve().parent.parent.parent / "fonts"
mukta_regular = fonts_dir / "Mukta-Regular.ttf"
mukta_bold = fonts_dir / "Mukta-Bold.ttf"

if mukta_regular.exists():
    try:
        pdfmetrics.registerFont(TTFont("Mukta", str(mukta_regular)))
        if mukta_bold.exists():
            pdfmetrics.registerFont(TTFont("Mukta-Bold", str(mukta_bold)))
            pdfmetrics.registerFontFamily("Mukta", normal="Mukta", bold="Mukta-Bold", italic="Mukta", boldItalic="Mukta-Bold")
        else:
            pdfmetrics.registerFontFamily("Mukta", normal="Mukta", bold="Mukta", italic="Mukta", boldItalic="Mukta")
        FONT_NORMAL = "Mukta"
        FONT_BOLD = "Mukta-Bold" if mukta_bold.exists() else "Mukta"
    except Exception:
        pass


def generate_gro_appeal_text(claim: StructuredClaimRecord, verdict: Verdict, language: str = "en") -> str:
    """Generates the GRO appeal letter text matching the on-screen preview."""
    is_hi = language == "hi"
    reasons_text = "\n".join([f"• {r}" for r in verdict.reasons])
    evidence_text = "\n".join([
        f"[{i+1}] {e.statement} (Source: {e.provision_ref or f'Policy Wording Page {e.page_number}'})"
        for i, e in enumerate(verdict.evidence_trail)
    ])

    amount_str = f"₹{claim.claim_amount:,.2f}" if claim.claim_amount else ("अस्पताल बिल के अनुसार" if is_hi else "As per hospital bills")
    policy_str = claim.policy_number or ("संलग्न पॉलिसी देखें" if is_hi else "Refer enclosed policy")
    claim_ref_str = claim.claim_reference or ("लागू नहीं" if is_hi else "N/A")
    date_str = claim.rejection_date.strftime("%Y-%m-%d") if hasattr(claim.rejection_date, "strftime") else str(claim.rejection_date)
    policyholder_str = claim.policyholder_name or ("बीमित दावेदार" if is_hi else "Insured Claimant")

    if is_hi:
        doc_text = f"""FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS
Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder

To,
The Grievance Redressal Officer (GRO) / Claims Department
{claim.insurer_name}

Subject: Contest and Demand for Reconsideration of Repudiated Claim Ref: {claim_ref_str}

Claim Particulars
• Policyholder Name: {policyholder_str}
• Policy Number: {policy_str}
• Claim Reference ID: {claim_ref_str}
• Date of Repudiation: {date_str}
• Disputed Amount: {amount_str}
• Stated Insurer Ground: {claim.stated_ground}

Statutory & Contractual Grounds:
{reasons_text}

Evidence & Document Citations:
{evidence_text}

Demand for Redressal: Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.
In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.

Yours faithfully,

{policyholder_str}
Date: {date_str}
"""
        return translate_text(doc_text, target_lang="hi")

    doc_text = f"""FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS
Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder

To,
The Grievance Redressal Officer (GRO) / Claims Department
{claim.insurer_name}

Subject: Contest and Demand for Reconsideration of Repudiated Claim Ref: {claim_ref_str}

Claim Particulars
• Policyholder Name: {policyholder_str}
• Policy Number: {policy_str}
• Claim Reference ID: {claim_ref_str}
• Date of Repudiation: {date_str}
• Disputed Amount: {amount_str}
• Stated Insurer Ground: {claim.stated_ground}

Statutory & Contractual Grounds:
{reasons_text}

Evidence & Document Citations:
{evidence_text}

Demand for Redressal: Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.
In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.

Yours faithfully,

{policyholder_str}
Date: {date_str}
"""
    return doc_text


def generate_grounds_request_text(claim: StructuredClaimRecord, verdict: Verdict, language: str = "en") -> str:
    """Generates Request-for-Grounds letter for Flow C matching the on-screen preview."""
    is_hi = language == "hi"
    reasons_text = "\n".join([f"• {r}" for r in verdict.reasons])
    evidence_text = "\n".join([
        f"[{i+1}] {e.statement} (Source: {e.provision_ref or f'Policy Wording Page {e.page_number}'})"
        for i, e in enumerate(verdict.evidence_trail)
    ])

    amount_str = f"₹{claim.claim_amount:,.2f}" if claim.claim_amount else ("अस्पताल बिल के अनुसार" if is_hi else "As per hospital bills")
    policy_str = claim.policy_number or ("संलग्न पॉलिसी देखें" if is_hi else "Refer enclosed policy")
    claim_ref_str = claim.claim_reference or ("लागू नहीं" if is_hi else "N/A")
    date_str = claim.rejection_date.strftime("%Y-%m-%d") if hasattr(claim.rejection_date, "strftime") else str(claim.rejection_date)
    policyholder_str = claim.policyholder_name or ("बीमित दावेदार" if is_hi else "Insured Claimant")

    if is_hi:
        doc_text = f"""REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION
Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder

To,
The Grievance Redressal Officer (GRO) / Claims Department
{claim.insurer_name}

Subject: Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: {claim_ref_str}

Claim Particulars
• Policyholder Name: {policyholder_str}
• Policy Number: {policy_str}
• Claim Reference ID: {claim_ref_str}
• Date of Repudiation: {date_str}
• Disputed Amount: {amount_str}
• Stated Insurer Ground: {claim.stated_ground}

Statutory & Contractual Grounds:
{reasons_text}

Evidence & Document Citations:
{evidence_text}

Demand for Redressal: Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.
In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.

Yours faithfully,

{policyholder_str}
Date: {date_str}
"""
        return translate_text(doc_text, target_lang="hi")

    doc_text = f"""REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION
Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder

To,
The Grievance Redressal Officer (GRO) / Claims Department
{claim.insurer_name}

Subject: Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: {claim_ref_str}

Claim Particulars
• Policyholder Name: {policyholder_str}
• Policy Number: {policy_str}
• Claim Reference ID: {claim_ref_str}
• Date of Repudiation: {date_str}
• Disputed Amount: {amount_str}
• Stated Insurer Ground: {claim.stated_ground}

Statutory & Contractual Grounds:
{reasons_text}

Evidence & Document Citations:
{evidence_text}

Demand for Redressal: Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.
In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.

Yours faithfully,

{policyholder_str}
Date: {date_str}
"""
    return doc_text


def build_appeal_pdf(
    claim: StructuredClaimRecord,
    verdict: Verdict,
    kind: str = "gro_letter",
    language: str = "en",
) -> bytes:
    """Renders the appeal letter to PDF bytes matching exactly the preview layout and content."""
    is_hi = language == "hi"
    is_flow_c = kind == "grounds_request" or verdict.flow == "flow_c"

    # Select font
    font_name = FONT_NORMAL
    font_bold = FONT_BOLD

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "AppealTitle",
        parent=styles["Heading1"],
        fontName=font_bold,
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        alignment=1,  # Center
    )
    banner_style = ParagraphStyle(
        "AppealBanner",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1,  # Center
    )
    normal_style = ParagraphStyle(
        "AppealNormal",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
    )
    header_style = ParagraphStyle(
        "AppealHeader",
        parent=styles["Normal"],
        fontName=font_bold,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # 1. Document Header (Title + Subtitle)
    if is_flow_c:
        title_text = "दावा अस्वीकृति के विशिष्ट आधारों और खंड की मांग हेतु पत्र" if is_hi else "REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION"
    else:
        title_text = "आईआरडीएआई (IRDAI) संरक्षण विनियमों के तहत औपचारिक शिकायत अपील" if is_hi else "FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS"

    subtitle_text = (
        "प्रतिकार इन्शुरटेक कॉन्टेस्ट इंजन द्वारा तैयार · पॉलिसीधारक द्वारा सीधे दाखिल"
        if is_hi
        else "Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder"
    )

    story.append(Paragraph(f"<b>{title_text}</b>", title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(subtitle_text, banner_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=10))

    # 2. Addressee
    if is_hi:
        addressee_text = f"<b>सेवा में,</b><br/>शिकायत निवारण अधिकारी (जी.आर.ओ.) / दावा विभाग<br/><b>{claim.insurer_name}</b>"
    else:
        addressee_text = f"<b>To,</b><br/>The Grievance Redressal Officer (GRO) / Claims Department<br/><b>{claim.insurer_name}</b>"
    story.append(Paragraph(addressee_text, normal_style))
    story.append(Spacer(1, 8))

    # 3. Subject Box
    claim_ref_str = claim.claim_reference or ("लागू नहीं" if is_hi else "N/A")
    if is_flow_c:
        if is_hi:
            subj_text = f"<b>विषय:</b> दावा अस्वीकृति के विशिष्ट अनुबंधीय खंड और आधार की मांग संदर्भ: {claim_ref_str}"
        else:
            subj_text = f"<b>Subject:</b> Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: {claim_ref_str}"
    else:
        if is_hi:
            subj_text = f"<b>विषय:</b> अस्वीकृत दावे के पुनर्विचार हेतु चुनौती एवं मांग संदर्भ: {claim_ref_str}"
        else:
            subj_text = f"<b>Subject:</b> Contest and Demand for Reconsideration of Repudiated Claim Ref: {claim_ref_str}"

    subj_table = Table([[Paragraph(subj_text, normal_style)]], colWidths=[540])
    subj_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(subj_table)
    story.append(Spacer(1, 8))

    # 4. Claim Particulars Box
    policyholder_str = claim.policyholder_name or ("बीमित दावेदार" if is_hi else "Insured Claimant")
    policy_str = claim.policy_number or ("संलग्न पॉलिसी देखें" if is_hi else "Refer enclosed policy")
    date_str = claim.rejection_date.strftime("%Y-%m-%d") if hasattr(claim.rejection_date, "strftime") else str(claim.rejection_date)
    amount_str = f"₹{claim.claim_amount:,.2f}" if claim.claim_amount else ("अस्पताल बिल के अनुसार" if is_hi else "As per hospital bills")

    if is_hi:
        part_heading = "<b>दावे का विवरण (CLAIM PARTICULARS)</b>"
        part_rows = [
            Paragraph(part_heading, header_style),
            Paragraph(f"• <b>पॉलिसीधारक का नाम:</b> {policyholder_str}", normal_style),
            Paragraph(f"• <b>पॉलिसी संख्या:</b> {policy_str}", normal_style),
            Paragraph(f"• <b>दावा संदर्भ संख्या:</b> {claim_ref_str}", normal_style),
            Paragraph(f"• <b>अस्वीकृति की तिथि:</b> {date_str}", normal_style),
            Paragraph(f"• <b>विवादित राशि:</b> {amount_str}", normal_style),
            Paragraph(f"• <b>बीमाकर्ता द्वारा उल्लिखित आधार:</b> {claim.stated_ground}", normal_style),
        ]
    else:
        part_heading = "<b>CLAIM PARTICULARS</b>"
        part_rows = [
            Paragraph(part_heading, header_style),
            Paragraph(f"• <b>Policyholder Name:</b> {policyholder_str}", normal_style),
            Paragraph(f"• <b>Policy Number:</b> {policy_str}", normal_style),
            Paragraph(f"• <b>Claim Reference ID:</b> {claim_ref_str}", normal_style),
            Paragraph(f"• <b>Date of Repudiation:</b> {date_str}", normal_style),
            Paragraph(f"• <b>Disputed Amount:</b> {amount_str}", normal_style),
            Paragraph(f"• <b>Stated Insurer Ground:</b> {claim.stated_ground}", normal_style),
        ]

    part_table = Table([[p] for p in part_rows], colWidths=[540])
    part_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(part_table)
    story.append(Spacer(1, 8))

    # 5. Grounds
    grounds_title = "<b>अपील के वैधानिक एवं अनुबंधीय आधार:</b>" if is_hi else "<b>Statutory & Contractual Grounds:</b>"
    story.append(Paragraph(grounds_title, header_style))
    for r in verdict.reasons:
        story.append(Paragraph(f"• {r}", normal_style))
    story.append(Spacer(1, 8))

    # 6. Evidence Items
    evidence_title = "<b>साक्ष्य एवं उद्धरण:</b>" if is_hi else "<b>Evidence & Document Citations:</b>"
    story.append(Paragraph(evidence_title, header_style))
    for i, ev in enumerate(verdict.evidence_trail):
        source_label = ev.provision_ref or (f"पॉलिसी दस्तावेज़ पृष्ठ {ev.page_number}" if is_hi else f"Policy Wording Page {ev.page_number}")
        story.append(Paragraph(f"<b>[{i+1}]</b> {ev.statement} (<i>Source: {source_label}</i>)", normal_style))
    story.append(Spacer(1, 8))

    # 7. Demand & Timeline
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
    if is_hi:
        demand_text1 = "<b>निवारण की मांग:</b> आईआरडीएआई नियमों के तहत, बीमाकर्ता को 15 कैलेंडर दिनों के भीतर इस शिकायत का लिखित रूप से निपटारा करना अनिवार्य है।"
        demand_text2 = "यदि इस शिकायत का संतोषजनक समाधान नहीं होता है, तो बिना किसी अग्रिम सूचना के बीमा लोकपाल नियम, 2017 के नियम 14 के तहत मामले को बीमा लोकपाल के समक्ष प्रस्तुत किया जाएगा।"
    else:
        demand_text1 = "<b>Demand for Redressal:</b> Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days."
        demand_text2 = "In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice."
    story.append(Paragraph(demand_text1, normal_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(demand_text2, normal_style))
    story.append(Spacer(1, 8))

    # 8. Signoff
    if is_hi:
        signoff_html = (
            f"भवदीय,<br/><br/>"
            f"<b>{policyholder_str}</b><br/>"
            f"पॉलिसीधारक / बीमित दावेदार<br/>"
            f"दिनांक: {date_str}"
        )
    else:
        signoff_html = (
            f"Yours faithfully,<br/><br/>"
            f"<b>{policyholder_str}</b><br/>"
            f"Policyholder / Insured Claimant<br/>"
            f"Date: {date_str}"
        )
    story.append(Paragraph(signoff_html, normal_style))

    doc.build(story)
    return buf.getvalue()
