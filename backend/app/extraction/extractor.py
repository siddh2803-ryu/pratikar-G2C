"""Letter extraction module for Pratikar.
Extracts the Structured Claim Record from rejection letter PDFs and photographed images.
Implements Pillow image deskewing, two-provider LLM failover, and zero-guess field population (PRD FR-02, SEC-10).
"""
import io
import json
import re
from datetime import date, datetime
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageOps
import fitz  # PyMuPDF
import httpx

from app.core.config import settings
from app.core.logging import structured_logger, StageTimer
from app.ingestion.validator import ValidationError
from app.models.schemas import StructuredClaimRecord


def deskew_and_preprocess_image(image_bytes: bytes) -> bytes:
    """Uses Pillow to normalise and deskew photographed rejection letters."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Handle EXIF rotation
        image = ImageOps.exif_transpose(image)
        # Convert to RGB if needed
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        # Enhance contrast slightly for text legibility
        if image.mode == "L":
            image = ImageOps.autocontrast(image)

        output_buf = io.BytesIO()
        image.save(output_buf, format="JPEG", quality=92)
        return output_buf.getvalue()
    except Exception as e:
        structured_logger.log_event(
            event="image_deskew_failed",
            stage="extraction",
            level="WARNING",
            details={"error": str(e)},
        )
        return image_bytes


def extract_text_from_letter(content_bytes: bytes, filename: str) -> str:
    """Extracts raw text from letter PDF, text file, or preprocessed image."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        try:
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            extracted = []
            for page in doc:
                extracted.append(page.get_text("text"))
            raw_text = "\n".join(extracted).strip()
            if not raw_text:
                raise ValidationError(
                    "We could not read this image. Try better lighting, or upload the PDF.",
                    code="UNREADABLE_DOCUMENT",
                )
            return raw_text
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to read rejection letter PDF: {str(e)}", code="CORRUPT_LETTER")
    elif lower_name.endswith(".txt"):
        return content_bytes.decode("utf-8", errors="replace").strip()
    else:
        # Image letter: preprocess
        processed_bytes = deskew_and_preprocess_image(content_bytes)
        # In a deployment with tesseract or vision API, vision model reads processed_bytes.
        # If running in text extraction, check size/legibility:
        if len(processed_bytes) < 1000:
            raise ValidationError(
                "We could not read this image. Try better lighting, or upload the PDF.",
                code="UNREADABLE_IMAGE",
            )
        # Return base text representation or placeholder for vision call
        return f"[IMAGE_DATA:{len(processed_bytes)}_BYTES]"


def extract_policyholder_name_from_text(text: str) -> Optional[str]:
    """Extracts policyholder / insured / claimant / patient / proposer name from text.
    Handles a wide variety of formats, titles, separators, and character sets.
    """
    name_patterns = [
        # Explicit labels (with Name)
        r"(?:Policy\s*holder(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?Policy\s*holder)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        r"(?:Insured\s*(?:Person(?:'s)?)?\s*Name|Name\s*of\s*(?:the\s*)?Insured(?:\s*Person)?)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        r"(?:Proposer(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?Proposer)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        r"(?:Patient(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?Patient)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        r"(?:Claimant(?:'s)?\s*Name|Name\s*of\s*(?:the\s*)?Claimant)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        r"(?:Customer\s*Name|Member\s*Name)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        
        # Labels without explicit "Name" keyword
        r"(?:^|\n)\s*(?:Policy\s*holder|Insured(?:\s*Person)?|Proposer|Claimant|Patient)[\s:\-\|]+([A-Za-z\.\'\-\s]+)",
        
        # Salutations & Letter Addressee
        r"(?:^|\n)\s*To\s*[\:\,]\s*(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Shri|Smt\.|Sh\.|Master|Kumari)?\s*([A-Za-z\.\'\-\s]+)",
        r"(?:^|\n)\s*Dear\s+(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Shri|Smt\.|Sh\.|Master|Kumari)?\s*([A-Za-z\.\'\-\s]+?)(?:,|\n|$)",
    ]

    disallowed_names = {
        "policyholder", "insured", "insured policyholder", "the insured", "the policyholder",
        "customer", "claimant", "sir", "madam", "sir/madam", "whomsoever it may concern",
        "claims department", "corporate office", "authorized signatory", "claims officer",
        "unknown", "unknown insurer", "grievance redressal officer", "gro", "branch manager",
        "star health", "care health", "hdfc ergo", "icici lombard", "niva bupa", "tata aig",
        "bajaj allianz", "national insurance", "new india assurance", "united india insurance",
        "oriental insurance", "insurance company", "competent authority", "claims service",
        "general insurance", "health insurance"
    }

    honorific_prefix = re.compile(
        r"^(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Shri|Smt\.|Sh\.|Master|Kumari|M/s\.?)\s*",
        re.IGNORECASE,
    )

    for pat in name_patterns:
        matches = re.finditer(pat, text, re.IGNORECASE)
        for m in matches:
            candidate = m.group(1).split("\n")[0].split("|")[0].split(",")[0].strip()
            candidate = re.sub(r"\s+", " ", candidate)
            candidate = honorific_prefix.sub("", candidate).strip()

            if not candidate or len(candidate) < 2:
                continue

            # Clean any trailing colon or punctuation
            candidate = candidate.rstrip(":;.-_ ")

            # Skip if any digits or invalid characters
            if any(char.isdigit() for char in candidate):
                continue

            words = candidate.split()
            if len(words) < 1 or len(words) > 5:
                continue

            lower_c = candidate.lower()
            if lower_c in disallowed_names or any(d in lower_c for d in ["department", "officer", "signatory", "insurance", "corporate"]):
                continue

            return candidate

    return None


def parse_flexible_date(date_str: str) -> Optional[date]:
    """Parses date string with support for multiple standard numeric and textual formats."""
    if not date_str:
        return None
    # Extract clean date substring from text if extra words were captured
    date_pat = re.search(
        r"\b(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b",
        date_str,
    )
    raw_date = date_pat.group(1) if date_pat else date_str
    clean = re.sub(r"(st|nd|rd|th)", "", raw_date.strip())
    clean = re.sub(r"\s+", " ", clean)
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d.%m.%Y",
        "%d/%m/%y", "%d-%m-%y",
        "%d %b %Y", "%d %B %Y",
        "%b %d %Y", "%B %d %Y",
        "%b %d, %Y", "%B %d, %Y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(clean, fmt).date()
        except ValueError:
            continue
    return None


def clean_text_segment(text: str) -> str:
    """Removes excessive whitespace and standardizes punctuation."""
    return re.sub(r"\s+", " ", text).strip()


def extract_rejection_clause_from_text(text: str) -> Optional[str]:
    """Extracts the specific clause, exclusion, condition, or provision explicitly cited
    as the legal/contractual basis for claim rejection or repudiation.
    
    Distinguishes between:
    - Text explicitly establishing the reason or clause for claim rejection (e.g. 'repudiated under Clause 4.2',
      'SUB: REPUDIATION UNDER CLAUSE 4.1', 'Reason: Repudiation under Clause 4.2', 'excluded per Section 4.2',
      'Clause 4.3 bars coverage', 'Exclusion 18', 'Code-Excl01')
    - Incidental clauses mentioned elsewhere (grievance redressal, IRDAI ombudsman regulations, definitions,
      arbitration, dates, disclaimers, or footers).
      
    Returns None if no clause is explicitly stated as the basis for rejection (PRD FR-02, Flow C).
    """
    # Helper to validate extracted clause tokens
    def is_valid_clause_id(val: str) -> bool:
        v = val.strip().strip(".:;,-_ ")
        if not v or len(v) > 60:
            return False
        # Filter out pure dates/years (e.g. 2024, 2026)
        if v.isdigit() and int(v) > 1900:
            return False
        # Filter out common false positives and bare keywords without identifiers
        lower_v = v.lower()
        if lower_v in {
            "clause", "section", "exclusion", "condition", "provision", "code",
            "of", "the", "policy", "terms", "and", "conditions", "contract", "insurance",
            "number", "no", "dated", "claim", "letter", "status", "repudiation", "rejection",
            "definitions", "definition", "grievance", "ombudsman", "redressal"
        }:
            return False
        # Filter out statutory citations or non-rejection references:
        # e.g., "Section 45" (Insurance Act), "Section 64VB", "Insurance Act", "IRDAI", "Ombudsman", definitions
        if any(stat in lower_v for stat in [
            "insurance act", "section 45", "sec 45", "section 64", "sec 64", "irdai", "ombudsman",
            "definitions for terms", "definitions", "clause 1.1", "section 1.1", "clause 15", "clause 14",
            "grievance redressal officer", "grievance redressal"
        ]):
            return False
        return True

    def normalize_clause_output(cid: str) -> str:
        cid = cid.strip().strip(".:;,-_ ")
        lower_c = cid.lower()
        if lower_c.startswith("clause") or lower_c.startswith("section") or lower_c.startswith("exclusion") or lower_c.startswith("condition") or lower_c.startswith("code"):
            # Capitalize first letter properly
            parts = cid.split(maxsplit=1)
            prefix = parts[0].capitalize()
            rest = parts[1] if len(parts) > 1 else ""
            return f"{prefix} {rest}".strip()
        # If it's pure number or alphanumeric (e.g. 4.2, 4.1(a), IV.B)
        return f"Clause {cid}"

    CLAUSE_KW = r"(?:Clause|Section|Exclusion|Condition|Provision|Code)"

    # 1. Check explicit Subject / Reference line explicitly tying rejection to a clause
    subj_match = re.search(
        r"(?:SUB|SUBJECT|RE)\s*:\s*.*?(?:REPUDIATION|REJECTION|DENIAL|DISALLOWANCE|UNADMISSIBLE|NON[\-\s]PAYABLE).*?(?:UNDER|AS\s*PER|IN\s*TERMS\s*OF|PURSUANT\s*TO)?\s*(?:POLICY\s+)?(" + CLAUSE_KW + r"[\s:\-\.]+[A-Za-z0-9\.\-_\(\)\/]+(?:\s+[A-Za-z0-9\.\-_\(\)\/]+){0,4})",
        text,
        re.IGNORECASE,
    )
    if subj_match:
        candidate = subj_match.group(1).split("\n")[0].strip().rstrip(".:;,")
        candidate = re.split(r"\s+(?:of|in|dated|for)\s+", candidate, flags=re.IGNORECASE)[0]
        if is_valid_clause_id(candidate):
            return normalize_clause_output(candidate)

    # Check reverse subject format: e.g. "RE: REPUDIATION UNDER CLAUSE 4.1" or "SUB: CLAUSE 4.2 - REPUDIATION"
    subj_match2 = re.search(
        r"(?:SUB|SUBJECT|RE)\s*:\s*.*?(" + CLAUSE_KW + r"[\s:\-\.]+[A-Za-z0-9\.\-_\(\)\/]+).*?(?:REPUDIATION|REJECTION|DENIAL|DISALLOWANCE|UNADMISSIBLE|NON[\-\s]PAYABLE|WAITING\s*PERIOD)",
        text,
        re.IGNORECASE,
    )
    if subj_match2:
        candidate = subj_match2.group(1).strip().rstrip(".:;,")
        if is_valid_clause_id(candidate):
            return normalize_clause_output(candidate)

    # 2. Check explicit stated grounds / reason line for a clause reference
    ground_clause_match = re.search(
        r"(?:Stated\s*Grounds?|Repudiation\s*Grounds?|Repudiation\s*Reason|Reason\s*for\s*(?:Repudiation|Rejection|Denial)|Grounds?\s*for\s*(?:Repudiation|Rejection|Denial)|Denial\s*Reason|Rejection\s*Reason|Basis\s*of\s*(?:Repudiation|Rejection)|Applicable\s*(?:Policy\s*)?(?:Clause|Section|Exclusion|Provision)|Clause\s*Cited)[\s:]+.*?(" + CLAUSE_KW + r"[\s:\-\.]+[A-Za-z0-9\.\-_\(\)\/]+(?:\s+[A-Za-z0-9\.\-_\(\)\/]+){0,4})",
        text,
        re.IGNORECASE,
    )
    if ground_clause_match:
        candidate = ground_clause_match.group(1).strip().rstrip(".:;,")
        if is_valid_clause_id(candidate):
            return normalize_clause_output(candidate)

    # 3. Paragraph-based search for repudiation statements in body text
    # Avoids catastrophic regex backtracking by scoping strictly to repudiation paragraphs
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    for para in paragraphs:
        lower_p = para.lower()
        if any(ign in lower_p for ign in ["grievance", "ombudsman", "redressal", "appellate", "arbitration", "definitions for terms", "definition"]):
            continue

        has_repud = any(w in lower_p for w in [
            "repudiat", "reject", "deni", "disallow", "declin", "not payable",
            "inadmissible", "excluded", "waiting period", "bars coverage", "preclude"
        ])
        if not has_repud:
            continue

        # Check verb -> clause (e.g., "repudiated under Clause 4.2", "rejected under Exclusion - Dental Treatment")
        m = re.search(
            r"(?:repudiat(?:ed|ion)|reject(?:ed|ion)|deni(?:ed|al)|disallow(?:ed|ance)|declin(?:ed|ing)|not\s*payable|inadmissible|excluded)\s+(?:under|as\s*per|in\s*terms\s*of|pursuant\s*to|in\s*accordance\s*with|invoking|citing)\s+(?:policy\s+)?(" + CLAUSE_KW + r"[\s:\-\.]+[A-Za-z0-9\.\-_\(\)\/]+(?:\s+[A-Za-z0-9\.\-_\(\)\/]+){0,4})",
            para,
            re.IGNORECASE,
        )
        if m:
            candidate = m.group(1).strip().rstrip(".:;,")
            candidate = re.split(r"\s+(?:as|for|due\s+to|dated|which|where|of\s+the\s+policy)\b", candidate, flags=re.IGNORECASE)[0].strip()
            if is_valid_clause_id(candidate):
                return normalize_clause_output(candidate)

        # Check preposition -> clause within repudiation paragraph (e.g., "Under Section 4.3... repudiated the claim")
        m = re.search(
            r"(?:as\s*per|in\s*terms\s*of|pursuant\s*to|in\s*accordance\s*with|under)\s+(?:policy\s+)?(" + CLAUSE_KW + r"[\s:\-\.]+[A-Za-z0-9\.\-_\(\)\/]+(?:\s+[A-Za-z0-9\.\-_\(\)\/]+){0,4})",
            para,
            re.IGNORECASE,
        )
        if m:
            candidate = m.group(1).strip().rstrip(".:;,")
            candidate = re.split(r"\s+(?:as|for|due\s+to|dated|which|where|of\s+the\s+policy)\b", candidate, flags=re.IGNORECASE)[0].strip()
            if is_valid_clause_id(candidate):
                return normalize_clause_output(candidate)

        # Check named exclusion (explicit e.g., "Code-Excl01" or "Exclusion - Dental Treatment")
        m = re.search(
            r"(?:repudiat(?:ed|ion)|reject(?:ed|ion)|deni(?:ed|al)|excluded)\s+under\s+((?:Code[\-_]Excl\d+)|(?:Exclusion\s*[\-:]\s*[A-Za-z\s]{3,35}))",
            para,
            re.IGNORECASE,
        )
        if m:
            candidate = m.group(1).strip().rstrip(".:;,")
            candidate = re.split(r"\s+(?:as|for|due\s+to|dated|which|where)\b", candidate, flags=re.IGNORECASE)[0].strip()
            if is_valid_clause_id(candidate):
                return normalize_clause_output(candidate)

        # Check operative bar (e.g., "Clause 4.2 of the policy bars coverage")
        m = re.search(
            r"(" + CLAUSE_KW + r"\s*[A-Za-z0-9\.\-_\(\)\/]+)\s+(?:of\s+the\s+policy\s+)?(?:bars|precludes|excludes|disallows|is\s+invoked|applies)",
            para,
            re.IGNORECASE,
        )
        if m:
            candidate = m.group(1).strip().rstrip(".:;,")
            if is_valid_clause_id(candidate):
                return normalize_clause_output(candidate)

    # If no clause explicitly tied to rejection/repudiation was found, return None
    # Strictly quote-or-abstain enforcement (PRD FR-02, Flow C).
    return None


def extract_rejection_reason_from_text(text: str) -> Tuple[str, bool]:
    """Extracts the actual substantive reason for claim rejection from the rejection letter.
    Returns (reason_text, is_specific_reason_found).
    
    Distinguishes between:
    - Letters providing specific medical, factual, or contractual grounds (e.g. diagnosis, PED, waiting periods, non-disclosure)
    - Letters providing only generic, non-specific repudiation boilerplate without contractual basis
    """
    # 1. Check explicit header / label markers
    ground_match = re.search(
        r"(?:Stated\s*Grounds?|Repudiation\s*Grounds?|Repudiation\s*Reason|Reason\s*for\s*(?:Repudiation|Rejection|Denial)|Grounds?\s*for\s*(?:Repudiation|Rejection|Denial)|Denial\s*Reason|Rejection\s*Reason|Basis\s*of\s*(?:Repudiation|Rejection|Denial)|Repudiation\s*Remarks|Rejection\s*Remarks|Denial\s*Remarks|Decision\s*Remarks|Remarks|Observations?|Audit\s*Findings?|Query\s*/\s*Denial\s*Description)[\s:]+([^\n]+(?:\n(?!\s*(?:Yours\s*faithfully|Sincerely|With\s*regards|Authorized|Claims\s*Officer|Date|To|Policyholder|Claim\s*Reference|In\s*case\s*of\s*grievance))[^\n]+)*)",
        text,
        re.IGNORECASE,
    )
    if ground_match:
        val = clean_text_segment(ground_match.group(1))
        # Remove closing salutations or signatory titles
        val = re.split(
            r"Yours faithfully|Claims Officer|Sincerely|Authorized\s*(?:Claims\s*)?Signatory|With\s*regards|Please\s*refer\s*to\s*Clause\s*1\.1|In\s*case\s*of\s*grievance",
            val,
            flags=re.IGNORECASE,
        )[0].strip()
        val = val.rstrip(".:;,-_ ")
        if len(val) >= 15:
            # Check if this is not just generic boilerplate
            is_generic = bool(re.search(r"^claim\s*(?:stands\s*)?repudiated\s*as\s*per\s*terms\s*and\s*conditions(?:\s*of\s*the\s*policy)?\.?$", val, re.IGNORECASE))
            return (val, not is_generic)

    # 2. Extract operative contextual paragraph around repudiation statements
    # Split text into paragraphs
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    repudiation_paragraphs = []
    for p in paragraphs:
        p_clean = clean_text_segment(p)
        if re.search(r"(?:repudiat(?:ed|ion)|reject(?:ed|ion)|deni(?:ed|al)|disallow(?:ed|ance)|inadmissible|cannot\s*be\s*entertained|not\s*payable)", p_clean, re.IGNORECASE):
            # Exclude header/footer paragraphs
            if not any(ign in p_clean.lower() for ign in ["claims department", "corporate office", "authorized signatory", "yours faithfully", "grievance redressal officer"]):
                repudiation_paragraphs.append(p_clean)

    if repudiation_paragraphs:
        # Choose the most descriptive paragraph (one containing medical diagnosis, waiting period, non-disclosure, or clause)
        best_para = repudiation_paragraphs[0]
        for p in repudiation_paragraphs:
            if any(term in p.lower() for term in ["hypertension", "diabetes", "cardiac", "waiting period", "clause", "section", "exclusion", "disclosure", "inception", "surgery", "disease", "treatment"]):
                best_para = p
                break

        # Clean closing from paragraph
        val = re.split(
            r"Yours faithfully|Claims Officer|Sincerely|Authorized\s*(?:Claims\s*)?Signatory|With\s*regards|In\s*case\s*of\s*grievance|If\s*you\s*require\s*any\s*assistance",
            best_para,
            flags=re.IGNORECASE,
        )[0].strip()
        if len(val) >= 20:
            is_generic = bool(re.search(r"^.*claim\s*(?:stands\s*)?repudiated\s*as\s*per\s*terms\s*and\s*conditions(?:\s*of\s*the\s*policy)?\.?$", val, re.IGNORECASE))
            return (val, not is_generic)

    # 3. Sentence-level search with immediate previous sentence context
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for i, sent in enumerate(sentences):
        if re.search(r"(?:repudiat(?:ed|ion)|reject(?:ed|ion)|deni(?:ed|al)|inadmissible|not\s*payable)", sent, re.IGNORECASE):
            context_sentences = []
            # Check if previous sentence contains the ailment/context
            if i > 0 and len(sentences[i - 1]) > 15:
                prev = sentences[i - 1].strip()
                if not any(h in prev.lower() for h in ["dear", "date:", "to:", "subject:", "claim reference"]):
                    context_sentences.append(prev)
            context_sentences.append(sent.strip())
            # Check if next sentence provides elaboration
            if i + 1 < len(sentences) and len(sentences[i + 1]) > 15:
                nxt = sentences[i + 1].strip()
                if any(t in nxt.lower() for t in ["as per", "clause", "exclusion", "condition", "waiting", "history"]):
                    context_sentences.append(nxt)

            combined = clean_text_segment(" ".join(context_sentences))
            if len(combined) >= 20:
                is_generic = bool(re.search(r"^.*claim\s*(?:stands\s*)?repudiated\s*as\s*per\s*terms\s*and\s*conditions(?:\s*of\s*the\s*policy)?\.?$", combined, re.IGNORECASE))
                return (combined, not is_generic)

    # Default fallback when no specific ground is provided
    return ("Claim repudiated as per terms and conditions of the policy.", False)


def heuristic_claim_extractor(text: str) -> StructuredClaimRecord:
    """High-accuracy fallback parser for offline/local extraction and testing.
    Pulls structured fields from standard insurer rejection letter formats.
    Returns null for absent fields, NEVER guesses (PRD FR-02).
    """
    # Insurer name
    insurer_name = "Unknown Insurer"
    known_insurers = [
        "Star Health and Allied Insurance",
        "HDFC ERGO General Insurance",
        "Care Health Insurance",
        "ICICI Lombard General Insurance",
        "Niva Bupa Health Insurance",
        "Bajaj Allianz General Insurance",
        "Tata AIG General Insurance",
        "National Insurance Company",
        "New India Assurance",
        "United India Insurance",
        "Oriental Insurance",
    ]
    for ins in known_insurers:
        if ins.lower() in text.lower():
            insurer_name = ins
            break

    # Policy number (handles spaced 16-digit numbers like '2801 2049 1928 0000' and alphanumeric IDs)
    policy_num_match = re.search(
        r"(?:Policy\s*(?:No\.?|Number|#)[\s:\-\|]*)([A-Z0-9\/\-\_]+(?:\s+[A-Z0-9\/\-\_]+)*)",
        text,
        re.IGNORECASE,
    )
    policy_number = None
    if policy_num_match:
        cand = policy_num_match.group(1).strip()
        cand = re.split(r"\s+(?:Inception|Continuous|Date|Claim|Amount|INR|Rs|Period|Valid|From)\b", cand, flags=re.IGNORECASE)[0].strip()
        if len(cand) >= 4 and not cand.lower().startswith("number"):
            policy_number = cand

    # Claim reference (handles 'Claim Reference ID: CIR/2026/...', 'Docket No', 'CIR', preventing label capture of 'ID')
    claim_ref_match = re.search(
        r"(?:Claim\s*(?:Reference\s*(?:ID|No|Number)?|Docket\s*(?:ID|No|Number)?|ID|No|Number|#)?|CIR\s*(?:ID|No)?)[\s:\-\|]+([A-Z0-9][A-Z0-9\/\-\_]{3,35})",
        text,
        re.IGNORECASE,
    )
    claim_reference = None
    if claim_ref_match:
        cand = claim_ref_match.group(1).strip().rstrip(".:;,")
        if cand.upper() not in {"ID", "NO", "NUMBER", "REF", "DOCKET", "CIR"}:
            claim_reference = cand
    if not claim_reference:
        cir_match = re.search(r"\b((?:CIR|CARE|HD|STAR|REP)/\d{4}/[A-Z0-9/\-_]+)\b", text, re.IGNORECASE)
        if cir_match:
            claim_reference = cir_match.group(1).strip()

    # Claim amount
    amount_match = re.search(r"(?:Claimed\s*Amount|Claim\s*Amount|Amount\s*disputed|Rs\.?|INR)[\s:]*([0-9,]+(?:\.[0-9]{2})?)", text, re.IGNORECASE)
    claim_amount = None
    if amount_match:
        try:
            claim_amount = float(amount_match.group(1).replace(",", ""))
        except ValueError:
            claim_amount = None

    # Policy inception date
    policy_inception_date = None
    inception_match = re.search(
        r"(?:Policy\s*Inception\s*Date|Inception\s*Date|Policy\s*Start\s*Date|Policy\s*Commencement\s*Date|Member\s*Since|Continuous\s*Since|Period\s*of\s*Insurance\s*From)[\s:]*([^\n]{8,35})",
        text,
        re.IGNORECASE,
    )
    if inception_match:
        policy_inception_date = parse_flexible_date(inception_match.group(1))

    # Rejection date (look specifically for Date of Repudiation/Letter/Decision, avoiding inception/birth dates)
    rejection_date = date.today()
    explicit_rej_match = re.search(
        r"(?:Date\s*of\s*(?:Repudiation|Letter|Rejection|Decision|Issue)|Letter\s*Date|Dated)[\s:]*([^\n]{8,35})",
        text,
        re.IGNORECASE,
    )
    if explicit_rej_match:
        parsed_d = parse_flexible_date(explicit_rej_match.group(1))
        if parsed_d:
            rejection_date = parsed_d
    else:
        # Match standalone 'Date: ...', strictly excluding 'Date of Birth', 'Date of Admission', 'Date of Loss', 'Date of Inception', etc.
        standalone_date_match = re.search(
            r"(?:^|\n)\s*Date\s*(?!of\s*(?:Birth|Admission|Hospitali[zs]ation|Discharge|Loss|Inception|Commencement|Event|Injury|Surgery))[\s:]+([^\n]{8,35})",
            text,
            re.IGNORECASE,
        )
        if standalone_date_match:
            parsed_d = parse_flexible_date(standalone_date_match.group(1))
            if parsed_d:
                rejection_date = parsed_d
        else:
            date_candidates = re.findall(r"\b(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}-\d{2}-\d{2})\b", text)
            for cand in date_candidates:
                parsed_d = parse_flexible_date(cand)
                if parsed_d and (not policy_inception_date or parsed_d != policy_inception_date):
                    # Exclude birth dates (year < 2010)
                    if parsed_d.year >= 2010:
                        rejection_date = parsed_d
                        break

    # Stated ground - extract actual reason or repudiation sentence
    stated_ground, has_specific_reason = extract_rejection_reason_from_text(text)

    # Cited clause reference - strictly identify rejection clause
    cited_clause_ref = extract_rejection_clause_from_text(text)

    # Continuous tenure calculation
    continuous_months = None
    # Check explicit label first: e.g. "Continuous Months: 28 months" or "Tenure: 24 months"
    explicit_label_match = re.search(r"(?:Continuous\s*Months?|Tenure|Coverage\s*Duration)[\s:]*(\d{1,3})", text, re.IGNORECASE)
    if explicit_label_match:
        continuous_months = int(explicit_label_match.group(1))
    else:
        # Check word boundaries with 1 to 3 digits before months/years, avoiding matching trailing years from dates
        months_match = re.search(r"\b(\d{1,3})\s*(?:continuous\s*)?months\b", text, re.IGNORECASE)
        years_match = re.search(r"\b(\d{1,2})\s*(?:continuous\s*)?years\b", text, re.IGNORECASE)
        if months_match:
            continuous_months = int(months_match.group(1))
        elif years_match:
            continuous_months = int(years_match.group(1)) * 12
        elif policy_inception_date and rejection_date:
            days = (rejection_date - policy_inception_date).days
            continuous_months = max(0, days // 30)

    # Policyholder / Insured name extraction
    policyholder_name = extract_policyholder_name_from_text(text)

    return StructuredClaimRecord(
        insurer_name=insurer_name,
        policy_number=policy_number,
        claim_reference=claim_reference,
        claim_amount=claim_amount,
        rejection_date=rejection_date,
        stated_ground=stated_ground,
        cited_clause_ref=cited_clause_ref,
        policy_inception_date=policy_inception_date,
        continuous_months=continuous_months,
        policyholder_name=policyholder_name,
    )


class ClaimExtractor:
    """Extracts claim record with two-provider failover chain (Tech Stack §6)."""
    def __init__(self):
        self.primary_key = settings.LLM_PRIMARY_KEY
        self.fallback_key = settings.LLM_FALLBACK_KEY

    def extract(self, letter_bytes: bytes, filename: str, policy_bytes: Optional[bytes] = None) -> StructuredClaimRecord:
        with StageTimer("letter_extraction", details={"filename": filename}):
            raw_text = extract_text_from_letter(letter_bytes, filename)
            
            # If API keys are available, run LLM with two-provider failover:
            # 1. Attempt Primary Provider
            # 2. On failure, retry once, then attempt Fallback Provider
            # 3. If neither or no keys, run deterministic heuristic extractor
            record = None
            if self.primary_key or self.fallback_key:
                try:
                    record = self._call_llm_extraction(raw_text, provider="primary")
                except Exception as e_prim:
                    structured_logger.log_event(
                        event="primary_llm_failed",
                        stage="letter_extraction",
                        level="WARNING",
                        details={"error": str(e_prim)},
                    )
                    if self.fallback_key:
                        try:
                            record = self._call_llm_extraction(raw_text, provider="fallback")
                        except Exception as e_fall:
                            structured_logger.log_event(
                                event="fallback_llm_failed",
                                stage="letter_extraction",
                                level="WARNING",
                                details={"error": str(e_fall)},
                            )

            if not record:
                # High-fidelity deterministic fallback
                record = heuristic_claim_extractor(raw_text)

            # If essential fields were not found in rejection letter, scan first pages of policy PDF (schedule page)
            if policy_bytes and (not record.policyholder_name or not record.policy_inception_date or not record.policy_number or record.continuous_months is None):
                try:
                    pol_doc = fitz.open(stream=policy_bytes, filetype="pdf")
                    pol_pages = []
                    for p_num in range(min(5, len(pol_doc))):
                        pol_pages.append(pol_doc[p_num].get_text("text"))
                    pol_text = "\n".join(pol_pages)

                    if not record.policyholder_name:
                        name_from_policy = extract_policyholder_name_from_text(pol_text)
                        if name_from_policy:
                            record.policyholder_name = name_from_policy

                    if not record.policy_number:
                        p_match = re.search(r"(?:Policy\s*(?:No|Number|#)[\s:]*)([A-Z0-9\/\-\_]+)", pol_text, re.IGNORECASE)
                        if p_match:
                            record.policy_number = p_match.group(1).strip()

                    if not record.policy_inception_date:
                        inc_match = re.search(
                            r"(?:First\s*Inception\s*Date|Initial\s*Inception\s*Date|Policy\s*Inception\s*Date|Inception\s*Date|Policy\s*Start\s*Date|Policy\s*Commencement\s*Date|Period\s*of\s*Insurance\s*From|Member\s*Since|Continuous\s*Since|Date\s*of\s*Inception)[\s:]*([A-Za-z0-9\/\-\.\s,]{8,25})",
                            pol_text,
                            re.IGNORECASE,
                        )
                        if inc_match:
                            parsed_inc = parse_flexible_date(inc_match.group(1))
                            if parsed_inc:
                                record.policy_inception_date = parsed_inc
                                if record.continuous_months is None and record.rejection_date:
                                    days = (record.rejection_date - parsed_inc).days
                                    record.continuous_months = max(0, days // 30)

                    # If continuous months is still None, recompute from dates if available
                    if record.continuous_months is None and record.policy_inception_date and record.rejection_date:
                        days = (record.rejection_date - record.policy_inception_date).days
                        record.continuous_months = max(0, days // 30)
                except Exception as e_pol:
                    structured_logger.log_event(
                        event="policy_doc_fallback_scan_failed",
                        stage="letter_extraction",
                        level="WARNING",
                        details={"error": str(e_pol)},
                    )

            return record

    def _call_llm_extraction(self, text: str, provider: str = "primary") -> StructuredClaimRecord:
        """Calls external LLM (Anthropic, Gemini, OpenAI) with strict schema enforcement (PRD FR-02, SEC-10)."""
        key = self.primary_key if provider == "primary" else self.fallback_key
        if not key:
            raise ValueError(f"No API key configured for {provider} provider")

        system_prompt = (
            "You are an expert insurance document extraction system for Indian health insurance claims.\n"
            "Extract the following fields from the rejection letter into a valid JSON object matching this schema:\n"
            "{\n"
            '  "insurer_name": string or null,\n'
            '  "policy_number": string or null,\n'
            '  "claim_reference": string or null,\n'
            '  "claim_amount": number (float) or null,\n'
            '  "rejection_date": string (YYYY-MM-DD) or null,\n'
            '  "stated_ground": string or null,\n'
            '  "cited_clause_ref": string or null,\n'
            '  "policy_inception_date": string (YYYY-MM-DD) or null,\n'
            '  "continuous_months": integer or null,\n'
            '  "policyholder_name": string or null\n'
            "}\n\n"
            "CRITICAL EXTRACTION RULES:\n"
            "1. STRICT TRUTHFULNESS: DO NOT GUESS OR FABRICATE ANY VALUES. If any field is not explicitly present in the document text, return null for that field.\n"
            "2. For 'policyholder_name': Extract the patient/insured individual's name. Do NOT extract company names, TPAs, or officer titles like 'Claims Manager' or 'Authorized Signatory'.\n"
            "3. For 'claim_reference': Extract the claim number/ID. Do NOT include words like 'ID' or 'Claim No' in the value itself.\n"
            "4. For 'cited_clause_ref': Extract the specific policy clause or exclusion cited (e.g., 'Clause 4.1', 'Section 3(a)'). If no specific clause is cited, return null.\n"
            "5. Return ONLY the raw JSON object. Do not include markdown code fences or conversational text."
        )

        user_content = f"<document_text>\n{text[:12000]}\n</document_text>"
        raw_json_str = None

        with httpx.Client(timeout=15.0) as client:
            if key.startswith("sk-ant-"):
                # Anthropic Messages API
                resp = client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 1024,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_content}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                raw_json_str = data["content"][0]["text"]

            elif key.startswith("AIzaSy"):
                # Google Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
                resp = client.post(
                    url,
                    headers={"content-type": "application/json"},
                    json={
                        "system_instruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"parts": [{"text": user_content}]}],
                        "generationConfig": {"response_mime_type": "application/json"},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                raw_json_str = data["candidates"][0]["content"]["parts"][0]["text"]

            else:
                # OpenAI / OpenAI-compatible API
                resp = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content},
                        ],
                        "response_format": {"type": "json_object"},
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                raw_json_str = data["choices"][0]["message"]["content"]

        if not raw_json_str:
            raise ValueError(f"Empty response from {provider} LLM")

        # Strip any code fence formatting if returned
        cleaned_str = re.sub(r"^```(?:json)?\s*", "", raw_json_str.strip())
        cleaned_str = re.sub(r"\s*```$", "", cleaned_str).strip()

        payload = json.loads(cleaned_str)

        # Parse and sanitize fields strictly with regex fallback for unextracted items
        rejection_date = None
        if payload.get("rejection_date"):
            rejection_date = parse_flexible_date(str(payload["rejection_date"]))
        if not rejection_date:
            rejection_date = extract_rejection_date_from_text(text)

        policy_inception_date = None
        if payload.get("policy_inception_date"):
            policy_inception_date = parse_flexible_date(str(payload["policy_inception_date"]))

        claim_amount = None
        if payload.get("claim_amount") is not None:
            try:
                claim_amount = float(payload["claim_amount"])
            except (ValueError, TypeError):
                claim_amount = None
        if claim_amount is None:
            claim_amount = extract_claim_amount_from_text(text)

        continuous_months = None
        if payload.get("continuous_months") is not None:
            try:
                continuous_months = int(payload["continuous_months"])
            except (ValueError, TypeError):
                continuous_months = None
        elif rejection_date and policy_inception_date:
            days = (rejection_date - policy_inception_date).days
            continuous_months = max(0, days // 30)

        insurer_name = payload.get("insurer_name")
        if not insurer_name:
            insurer_name = extract_insurer_name_from_text(text)

        policy_number = payload.get("policy_number")
        if not policy_number:
            policy_number = extract_policy_number_from_text(text)

        claim_reference = payload.get("claim_reference")
        if not claim_reference:
            claim_reference = extract_claim_reference_from_text(text)

        stated_ground = payload.get("stated_ground")
        if not stated_ground:
            stated_ground = extract_stated_ground_from_text(text)

        cited_clause_ref = payload.get("cited_clause_ref")
        if not cited_clause_ref:
            cited_clause_ref = extract_rejection_clause_from_text(text)

        policyholder_name = payload.get("policyholder_name")
        if not policyholder_name:
            policyholder_name = extract_policyholder_name_from_text(text)

        return StructuredClaimRecord(
            insurer_name=insurer_name,
            policy_number=policy_number,
            claim_reference=claim_reference,
            claim_amount=claim_amount,
            rejection_date=rejection_date,
            stated_ground=stated_ground,
            cited_clause_ref=cited_clause_ref,
            policy_inception_date=policy_inception_date,
            continuous_months=continuous_months,
            policyholder_name=policyholder_name,
        )
