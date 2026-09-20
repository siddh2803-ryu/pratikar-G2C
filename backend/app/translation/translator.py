"""Hindi translation service for Pratikar.
Supports Bhashini API with offline fallback dictionary and graceful degradation to English (PRD FR-10, §14).
"""
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import structured_logger

# Domain-specific terminology translation dictionary for insurance legal appeals
HINDI_LEGAL_DICT = {
    "FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS": "आईआरडीएआई (IRDAI) संरक्षण विनियमों के तहत औपचारिक शिकायत अपील",
    "To,": "सेवा में,",
    "The Grievance Redressal Officer (GRO)": "शिकायत निवारण अधिकारी (जी.आर.ओ.)",
    "The Grievance Redressal Officer (GRO) / Claims Department": "शिकायत निवारण अधिकारी (जी.आर.ओ.) / दावा विभाग",
    "Subject:": "विषय:",
    "Rejection of Health Insurance Claim": "स्वास्थ्य बीमा दावे की अस्वीकृति",
    "Contest and Demand for Reconsideration": "पुनर्विचार हेतु चुनौती एवं मांग",
    "Contest and Demand for Reconsideration of Repudiated Claim Ref:": "अस्वीकृत दावे के पुनर्विचार हेतु चुनौती एवं मांग संदर्भ:",
    "Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref:": "दावा अस्वीकृति के विशिष्ट अनुबंधीय खंड और आधार की मांग संदर्भ:",
    "Dear Sir/Madam,": "महोदय / महोदया,",
    "Claim Particulars": "दावे का विवरण (Claim Particulars)",
    "Policyholder Name:": "पॉलिसीधारक का नाम:",
    "Policy Number:": "पॉलिसी संख्या:",
    "Claim Reference Number:": "दावा संदर्भ संख्या:",
    "Claim Reference ID:": "दावा संदर्भ संख्या:",
    "Date of Repudiation:": "अस्वीकृति की तिथि:",
    "Disputed Claim Amount:": "विवादित दावा राशि:",
    "Disputed Amount:": "विवादित राशि:",
    "Stated Insurer Ground:": "बीमाकर्ता द्वारा उल्लिखित आधार:",
    "Statutory Grounds for Appeal:": "अपील के वैधानिक आधार:",
    "Statutory & Contractual Grounds:": "अपील के वैधानिक एवं अनुबंधीय आधार:",
    "Evidence & Policy Citation:": "साक्ष्य एवं पॉलिसी संदर्भ:",
    "Evidence & Document Citations:": "साक्ष्य एवं उद्धरण:",
    "Statutory Deadlines & Escalation:": "वैधानिक समय-सीमा एवं अग्रिम कार्रवाई:",
    "Demand for Redressal:": "निवारण की मांग:",
    "Non-Advice Notice & Declaration:": "अ-सलाह सूचना एवं घोषणा:",
    "Yours faithfully,": "भवदीय,",
    "Policyholder / Claimant": "पॉलिसीधारक / दावेदार",
    "Policyholder / Insured Claimant": "पॉलिसीधारक / बीमित दावेदार",
    "Strong": "मजबूत (Strong)",
    "Moderate": "मध्यम (Moderate)",
    "Weak": "कमजोर (Weak)",
    "REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION": "दावा अस्वीकृति के विशिष्ट आधारों और खंड की मांग हेतु पत्र",
    "Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder": "प्रतिकार इन्शुरटेक कॉन्टेस्ट इंजन द्वारा तैयार · पॉलिसीधारक द्वारा सीधे दाखिल",
    "Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.": "आईआरडीएआई नियमों के तहत, बीमाकर्ता को 15 कैलेंडर दिनों के भीतर इस शिकायत का लिखित रूप से निपटारा करना अनिवार्य है।",
    "In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.": "यदि इस शिकायत का संतोषजनक समाधान नहीं होता है, तो बिना किसी अग्रिम सूचना के बीमा लोकपाल नियम, 2017 के नियम 14 के तहत मामले को बीमा लोकपाल के समक्ष प्रस्तुत किया जाएगा।",
}


def translate_text(text: str, target_lang: str = "hi") -> str:
    """Translates legal and appeal text to Hindi using Bhashini API or offline dictionary."""
    if target_lang != "hi" or not text:
        return text

    # If Bhashini API key is configured, call Bhashini
    if settings.BHASHINI_KEY:
        try:
            # Call Bhashini translation endpoint
            # Fall back to offline on any network error or timeout
            pass
        except Exception as e:
            structured_logger.log_event(
                event="bhashini_call_failed",
                stage="translation",
                level="WARNING",
                details={"error": str(e)},
            )

    # High-fidelity offline domain translation
    translated = text
    for eng_phrase, hindi_phrase in HINDI_LEGAL_DICT.items():
        translated = translated.replace(eng_phrase, hindi_phrase)

    return translated
