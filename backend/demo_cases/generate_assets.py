"""Generates realistic PDF demo assets for the 4 demo cases.
Produces actual multi-page policy wordings and rejection letters with real page numbers.
"""
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

assets_dir = Path(__file__).resolve().parent / "demo_assets"
assets_dir.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=14, leading=18, textColor=colors.HexColor("#0f172a"))
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14, textColor=colors.HexColor("#334155"))
bold_style = ParagraphStyle("Bold", parent=styles["Normal"], fontSize=10, leading=14, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))


def create_pdf(filepath: Path, pages_content: list):
    doc = SimpleDocTemplate(str(filepath), pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    story = []
    for i, p_items in enumerate(pages_content):
        for item in p_items:
            story.append(item)
        if i < len(pages_content) - 1:
            story.append(PageBreak())
    doc.build(story)


def generate_all_assets():
    # 1. Case 1: Rejection Letter
    c1_letter = [
        [
            Paragraph("<b>STAR HEALTH AND ALLIED INSURANCE CO. LTD.</b>", title_style),
            Paragraph("Claims Department, Corporate Office, Chennai", body_style),
            Spacer(1, 15),
            Paragraph("Date: 14/08/2026", body_style),
            Paragraph("To: Rajesh Kumar", body_style),
            Paragraph("Policyholder Name: Rajesh Kumar", bold_style),
            Paragraph("Policy Number: P/161114/01/2021/008742", bold_style),
            Paragraph("Claim Reference ID: CIR/2026/161114/098711", bold_style),
            Paragraph("Inception Date: 01/03/2021 | Continuous Months: 65 months", body_style),
            Paragraph("Claimed Amount: INR 284,500.00", body_style),
            Spacer(1, 15),
            Paragraph("<b>SUB: REPUDIATION OF CLAIM UNDER POLICY CLAUSE 4.2</b>", bold_style),
            Spacer(1, 10),
            Paragraph("Dear Mr. Rajesh Kumar,<br/><br/>With reference to your hospitalization claim CIR/2026/161114/098711 for cardiac evaluation and treatment, we regret to inform you that the competent authority has repudiated your claim under <b>Clause 4.2</b> of the policy terms.<br/><br/><b>Stated Ground:</b> Repudiation under Clause 4.2: Pre-existing condition (Essential Hypertension & Cardiac history) not disclosed at inception. As per the treating physician notes, the patient has a history of hypertension.<br/><br/>Yours faithfully,<br/>Authorized Claims Signatory<br/>Star Health & Allied Insurance", body_style),
        ]
    ]
    create_pdf(assets_dir / "case_1_rejection_letter.pdf", c1_letter)

    # 1. Case 1: Policy Wording (20 pages, Clause 4.2 on Page 14)
    c1_policy_pages = []
    for p in range(1, 21):
        if p == 14:
            c1_policy_pages.append([
                Paragraph(f"<b>STAR HEALTH COMPREHENSIVE INSURANCE POLICY - PAGE {p}</b>", title_style),
                Spacer(1, 10),
                Paragraph("<b>SECTION 4: STANDARD EXCLUSIONS</b>", bold_style),
                Spacer(1, 10),
                Paragraph("<b>Clause 4.2 Pre-Existing Diseases (Code-Excl01):</b> Expenses related to the treatment of a Pre-Existing Disease (PED) and its direct complications shall be excluded until the expiry of the waiting period specified in the policy schedule.", body_style),
                Spacer(1, 10),
                Paragraph("<b>Clause 4.3 Specific Waiting Period (Code-Excl02):</b> Expenses for specific surgical procedures are subject to 24 months waiting.", body_style),
                Spacer(1, 10),
                Paragraph("This page contains operative exclusionary wording applicable to all admitted claims.", body_style),
            ])
        else:
            c1_policy_pages.append([
                Paragraph(f"<b>STAR HEALTH COMPREHENSIVE INSURANCE POLICY - PAGE {p}</b>", title_style),
                Spacer(1, 10),
                Paragraph(f"Section {p}. General definitions, terms, coverage limits, sub-limits, and procedures governing health policy cover.", body_style),
                Spacer(1, 10),
                Paragraph("This digital policy document is issued by the insurer and outlines full benefit schedules, network hospital lists, and grievance redressal mechanisms.", body_style),
            ])
    create_pdf(assets_dir / "case_1_policy_wording.pdf", c1_policy_pages)

    # 2. Case 2: Rejection Letter (30-day initial waiting period)
    c2_letter = [
        [
            Paragraph("<b>CARE HEALTH INSURANCE LIMITED</b>", title_style),
            Spacer(1, 15),
            Paragraph("Date: 18/08/2026", body_style),
            Paragraph("To: Sneha Verma", body_style),
            Paragraph("Policyholder Name: Sneha Verma", bold_style),
            Paragraph("Policy Number: 18942201-00", bold_style),
            Paragraph("Claim Reference: CARE/2026/CLM/44120", bold_style),
            Paragraph("Policy Inception Date: 06/08/2026", body_style),
            Paragraph("Claimed Amount: Rs. 92,000.00", body_style),
            Spacer(1, 15),
            Paragraph("<b>RE: REPUDIATION UNDER CLAUSE 4.1 (INITIAL 30 DAYS WAITING PERIOD)</b>", bold_style),
            Spacer(1, 10),
            Paragraph("Dear Ms. Sneha Verma,<br/><br/>Your claim for medical treatment of acute appendicitis on 17/08/2026 stands repudiated.<br/><br/><b>Reason:</b> Repudiation under Clause 4.1: Claim reported within the initial 30 days waiting period for non-accidental illness. Policy inception date was 06/08/2026 (only 12 days continuous coverage).<br/><br/>Claims Officer,<br/>Care Health Insurance", body_style),
        ]
    ]
    create_pdf(assets_dir / "case_2_rejection_letter.pdf", c2_letter)

    # 2. Case 2: Policy Wording (12 pages, Clause 4.1 on Page 9)
    c2_policy_pages = []
    for p in range(1, 13):
        if p == 9:
            c2_policy_pages.append([
                Paragraph(f"<b>CARE HEALTH POLICY TERMS - PAGE {p}</b>", title_style),
                Spacer(1, 10),
                Paragraph("<b>Clause 4.1 30-day Waiting Period (Code-Excl03):</b> Expenses related to the treatment of any illness within 30 days from the first policy commencement date shall be excluded except claims arising due to an accident.", bold_style),
                Spacer(1, 10),
                Paragraph("This exclusion applies uniformly to all non-emergency or medical illnesses contracted in the initial month.", body_style),
            ])
        else:
            c2_policy_pages.append([
                Paragraph(f"<b>CARE HEALTH POLICY TERMS - PAGE {p}</b>", title_style),
                Spacer(1, 10),
                Paragraph("Terms, limits, network provider guidelines, and policy schedules.", body_style),
            ])
    create_pdf(assets_dir / "case_2_policy_wording.pdf", c2_policy_pages)

    # 3. Case 3: Clause-less Rejection Letter (Flow C)
    c3_letter = [
        [
            Paragraph("<b>HDFC ERGO GENERAL INSURANCE COMPANY LIMITED</b>", title_style),
            Spacer(1, 15),
            Paragraph("Date: 20/08/2026", body_style),
            Paragraph("To: Vikram Malhotra", body_style),
            Paragraph("Policyholder Name: Vikram Malhotra", bold_style),
            Paragraph("Policy Number: 2801 2049 1928 0000", bold_style),
            Paragraph("Claim Reference: HD/REP/2026/8921", bold_style),
            Paragraph("Claimed Amount: Rs. 165,000.00", body_style),
            Spacer(1, 15),
            Paragraph("<b>SUBJECT: CLAIM STATUS NOTIFICATION</b>", bold_style),
            Spacer(1, 10),
            Paragraph("Dear Mr. Vikram Malhotra,<br/><br/>We refer to your claim submitted for reimbursement. Please be advised that after careful examination, the claim is repudiated as per terms and conditions of policy.<br/><br/>HDFC ERGO Claims Service", body_style),
        ]
    ]
    create_pdf(assets_dir / "case_3_rejection_letter.pdf", c3_letter)

    # 3. Case 3 Policy Wording
    c3_policy_pages = [
        [Paragraph(f"<b>HDFC ERGO OPTIMA SECURE POLICY - PAGE {p}</b>", title_style), Paragraph("Policy provisions and conditions.", body_style)]
        for p in range(1, 10)
    ]
    create_pdf(assets_dir / "case_3_policy_wording.pdf", c3_policy_pages)

    print("All demo PDF assets generated successfully in:", assets_dir)


if __name__ == "__main__":
    generate_all_assets()
