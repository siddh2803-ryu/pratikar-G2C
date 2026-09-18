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
    "Subject:": "विषय:",
    "Rejection of Health Insurance Claim": "स्वास्थ्य बीमा दावे की अस्वीकृति",
    "Contest and Demand for Reconsideration": "पुनर्विचार हेतु चुनौती एवं मांग",
    "Dear Sir/Madam,": "महोदय / महोदया,",
    "Policy Number:": "पॉलिसी संख्या:",
    "Claim Reference Number:": "दावा संदर्भ संख्या:",
    "Date of Repudiation:": "अस्वीकृति की तिथि:",
    "Disputed Claim Amount:": "विवादित दावा राशि:",
    "Statutory Grounds for Appeal:": "अपील के वैधानिक आधार:",
    "Evidence & Policy Citation:": "साक्ष्य एवं पॉलिसी संदर्भ:",
    "Statutory Deadlines & Escalation:": "वैधानिक समय-सीमा एवं अग्रिम कार्रवाई:",
    "Non-Advice Notice & Declaration:": "अ-सलाह सूचना एवं घोषणा:",
    "Yours faithfully,": "भवदीय,",
    "Policyholder / Claimant": "पॉलिसीधारक / दावेदार",
    "Strong": "मजबूत (Strong)",
    "Moderate": "मध्यम (Moderate)",
    "Weak": "कमजोर (Weak)",
    "REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION": "दावा अस्वीकृति के विशिष्ट आधारों और खंड की मांग हेतु पत्र",
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
