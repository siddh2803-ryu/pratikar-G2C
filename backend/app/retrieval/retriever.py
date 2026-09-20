"""Path B: Verbatim Clause Retrieval with Quote-or-Abstain Enforcement.
Retrieves cited clauses directly from page-scoped policy chunks (PRD FR-04, FR-08).
Extracts exact character-level spans with verifiable page numbers.
"""
import re
from typing import List, Optional, Tuple
from app.core.logging import structured_logger, StageTimer
from app.ingestion.parser import PolicyChunk
from app.models.schemas import PolicySpan


class ClauseNotFoundError(Exception):
    def __init__(self, message: str = "The clause your insurer cited does not appear in this policy. That is worth raising."):
        super().__init__(message)
        self.message = message


def is_table_of_contents_or_index(text: str, page_num: int) -> bool:
    """Detects whether a policy page/chunk is a Table of Contents, Index, or Schedule listing
    rather than an operative contractual provision.
    """
    text_lower = text.lower()
    
    # 1. Direct TOC / Index headings anywhere in early pages (pages 1-4)
    if page_num <= 4 and any(h in text_lower for h in [
        "table of contents", "index of clauses", "policy index", "clause index",
        "index to policy", "schedule of benefits"
    ]):
        return True

    header_sample = text_lower[:500]
    if any(h in header_sample for h in [
        "table of contents", "contents", "index", "schedule of benefits"
    ]):
        return True

    # 2. Presence of dot leaders or dash leaders linking items to page numbers
    # e.g., "Clause 4.2 ................... Page 14" or "4.2 Pre-existing ... 14"
    dot_leader_count = len(re.findall(r"(\.{3,}|…{2,}|\-{4,}|_{4,})\s*(?:page\s*)?\d+", text_lower))
    if dot_leader_count >= 2:
        return True

    # 3. High density of line endings with bare page numbers in early pages (pages 1-5)
    if page_num <= 5:
        lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
        toc_pattern_lines = 0
        for ln in lines:
            if re.search(r"(?:section|clause|\d+\.\d+)[^\n]{3,60}(?:\.{2,}|\s{3,})\s*(?:page\s*)?\d+$", ln, re.IGNORECASE):
                toc_pattern_lines += 1
            elif re.search(r"^\d+\.\d+\s+[A-Za-z\s]{3,40}\s+\d+$", ln):
                toc_pattern_lines += 1
        if toc_pattern_lines >= 2:
            return True

    return False


def score_clause_candidate(
    chunk: PolicyChunk,
    match_start: int,
    match_end: int,
    clause_num: str,
    clean_ref: str,
    stated_ground: Optional[str] = None,
) -> Tuple[int, str]:
    """Scores a candidate clause match to distinguish operative provisions from index entries,
    cross-references, and footers.
    Returns (score, rationale).
    """
    text = chunk.text
    page_num = chunk.page_number
    line_start = text.rfind("\n", 0, match_start)
    line_start = 0 if line_start == -1 else line_start + 1
    line_end = text.find("\n", match_end)
    line_end = len(text) if line_end == -1 else line_end
    matched_line = text[line_start:line_end].strip()
    matched_line_lower = matched_line.lower()

    score = 0
    rationales = []

    # 1. Penalty for Table of Contents / Index page
    if is_table_of_contents_or_index(text, page_num):
        score -= 250
        rationales.append("table_of_contents_page")

    # 2. Cover / title page 1 penalty (operative clauses reside on interior pages)
    if page_num == 1:
        score -= 100
        rationales.append("page_1_cover_penalty")

    # 3. Penalty for dot leaders or trailing page numbers in the matched line
    if re.search(r"(\.{3,}|…{2,}|\-{4,}|_{4,})\s*(?:page\s*)?\d+", matched_line_lower):
        score -= 150
        rationales.append("dot_leaders_detected")
    elif re.search(r"\bpage\s+\d+\s*$", matched_line_lower) or re.search(r"\s+\d+\s*$", matched_line_lower):
        if len(matched_line) < 80:
            score -= 100
            rationales.append("trailing_page_number")

    # 4. Penalty for cross-reference or incidental definitions mention
    surrounding_start = max(0, match_start - 80)
    surrounding_end = min(len(text), match_end + 80)
    surrounding = text[surrounding_start:surrounding_end].lower()
    if any(xref in surrounding for xref in [
        "as defined under", "as specified in", "referred to in", "refer to clause",
        "in accordance with clause", "subject to clause", "clause 1.1", "grievance redressal",
        "ombudsman", "arbitration", "as referenced under", "refer to", "referred to under",
        "for the purpose of"
    ]):
        score -= 50
        rationales.append("incidental_cross_reference")

    # 5. Reward for operative clause heading format (starts line or near start)
    # e.g., "Clause 4.2 Pre-Existing Diseases" or "4.2. Pre-Existing Diseases"
    is_heading = bool(re.match(
        rf"^(?:clause|section|exclusion|condition)?\s*{re.escape(clause_num)}[\s\.\-:]+",
        matched_line_lower
    ))
    if is_heading:
        score += 90
        rationales.append("clause_heading_format")

    # 6. Reward for substantive operative exclusionary / condition language in paragraph
    paragraph_sample = text[match_start:min(len(text), match_start + 600)].lower()
    operative_keywords = [
        "shall not be liable", "shall be excluded", "expenses related to",
        "waiting period", "continuous coverage", "is not covered", "is excluded",
        "code-excl", "the company will not pay", "condition precedent",
        "treatment of a pre-existing disease", "specific waiting period",
        "permanent exclusion", "coverage is excluded", "pre-existing disease (ped)",
        "standard exclusions"
    ]
    matched_kw_count = sum(1 for kw in operative_keywords if kw in paragraph_sample)
    if matched_kw_count > 0:
        score += min(120, matched_kw_count * 35)
        rationales.append(f"operative_language_found({matched_kw_count})")

    # 7. Reward for matching ground / topic keywords from rejection letter
    if stated_ground:
        ground_lower = stated_ground.lower()
        topic_keywords = [
            "pre-existing", "hypertension", "diabetes", "cardiac", "waiting period",
            "cataract", "hernia", "joint replacement", "congenital", "cosmetic",
            "dental", "non-disclosure", "investigation"
        ]
        ground_topics = [t for t in topic_keywords if t in ground_lower]
        for gt in ground_topics:
            if gt in paragraph_sample:
                score += 40
                rationales.append(f"matches_ground_topic({gt})")
                break

    # 8. Substantial length reward (operative clauses have explanatory body text)
    if len(paragraph_sample.strip()) >= 120 and matched_kw_count > 0:
        score += 40
        rationales.append("substantial_paragraph_body")

    # 9. Heavy penalty if snippet is too short and resembles an index row
    if len(paragraph_sample.strip()) < 100 and (re.search(r"\bpage\s*\d+\b", paragraph_sample) or "..." in paragraph_sample):
        score -= 150
        rationales.append("short_index_snippet_penalty")

    return score, "; ".join(rationales)


class ClauseRetriever:
    """Path B: Clause Retrieval engine.
    Finds the exact operative clause in policy chunks, quotes verbatim, filters out index/TOC pages,
    and anchors to page_number.
    """
    def retrieve_clause(
        self,
        chunks: List[PolicyChunk],
        clause_ref: Optional[str],
        stated_ground: Optional[str] = None,
    ) -> PolicySpan:
        with StageTimer("clause_retrieval", details={"clause_ref": clause_ref}):
            if not clause_ref or not clause_ref.strip():
                # Deliberate abstention / Flow C indicator
                structured_logger.log_event(
                    event="clause_ref_absent",
                    stage="clause_retrieval",
                    details={"stated_ground": stated_ground},
                )
                raise ClauseNotFoundError("not determinable from the documents provided")

            # Normalise search pattern for clause: e.g. "Clause 4.2" -> clause_num="4.2"
            clean_ref = clause_ref.strip()
            
            # Extract number / identifier if present:
            # Handles: "Clause 4.2" -> "4.2", "Section 4.1(a)" -> "4.1(a)", "Exclusion 18" -> "18", "Code-Excl01" -> "Code-Excl01"
            num_match = re.search(r"(\d+(?:\.\d+)*[A-Za-z0-9\(\)\-_]*)", clean_ref)
            code_match = re.search(r"(Code[\-_]Excl\d+)", clean_ref, re.IGNORECASE)
            
            clause_num = code_match.group(1) if code_match else (num_match.group(1) if num_match else clean_ref)

            candidate_matches: List[Tuple[PolicyChunk, int, int, str, int, str]] = []

            for chunk in chunks:
                text = chunk.text
                patterns = [
                    re.compile(rf"\bClause\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bSection\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bExclusion\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bCondition\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"(?:^|\n)\s*{re.escape(clause_num)}[\s\.\-:]+[A-Z]", re.IGNORECASE),
                    re.compile(rf"\b{re.escape(clean_ref)}\b", re.IGNORECASE),
                ]

                # If clause has an exclusion code like Code-Excl01
                if code_match:
                    patterns.insert(0, re.compile(rf"\b{re.escape(code_match.group(1))}\b", re.IGNORECASE))

                for pat in patterns:
                    match = pat.search(text)
                    if match:
                        # Avoid bare percentage matches like 5.9%
                        trailing = text[match.start():match.start()+30]
                        if re.match(r"^\d+\.\d+%\s*", trailing) or trailing.strip().endswith("%"):
                            continue

                        start_pos = match.start()
                        
                        # Expand backwards to beginning of line if it's a heading
                        line_start = text.rfind("\n", 0, start_pos)
                        line_start = 0 if line_start == -1 else line_start + 1
                        if start_pos - line_start < 25:
                            start_pos = line_start

                        # Extract operative clause section (up to next clause heading or paragraph boundary)
                        end_pos = min(len(text), start_pos + 800)
                        
                        # Check for next clause heading: e.g. "\nClause 4.3" or "\n4.3" or "\nSection"
                        next_heading = re.search(
                            r"\n\s*(?:Clause|Section|Exclusion|Condition|\d+\.\d+)\s+[\dA-Za-z]",
                            text[start_pos + 60:end_pos]
                        )
                        if next_heading:
                            end_pos = start_pos + 60 + next_heading.start()
                        else:
                            # Try finding paragraph break
                            next_break = text.find("\n\n", start_pos + 80)
                            if next_break != -1 and next_break < end_pos:
                                end_pos = next_break

                        quoted_text = text[start_pos:end_pos].strip()
                        
                        # Score this candidate
                        score, rationale = score_clause_candidate(
                            chunk=chunk,
                            match_start=start_pos,
                            match_end=end_pos,
                            clause_num=clause_num,
                            clean_ref=clean_ref,
                            stated_ground=stated_ground,
                        )
                        
                        candidate_matches.append((chunk, start_pos, end_pos, quoted_text, score, rationale))
                        break

            if not candidate_matches:
                structured_logger.log_event(
                    event="clause_not_found_in_policy",
                    stage="clause_retrieval",
                    level="WARNING",
                    details={"clause_ref": clause_ref, "searched_num": clause_num},
                )
                raise ClauseNotFoundError(
                    f"The clause your insurer cited ({clean_ref}) does not appear anywhere in this policy document. This establishes a clause/policy mismatch."
                )

            # Sort candidates by score descending
            candidate_matches.sort(key=lambda x: x[4], reverse=True)
            best_chunk, start_idx, end_idx, verbatim_text, best_score, best_rationale = candidate_matches[0]

            # If the best score is below the positive operative confidence threshold (e.g. index/TOC matches or non-operative mentions),
            # this establishes that no genuine operative clause exists in the policy!
            if best_score < 40:
                structured_logger.log_event(
                    event="clause_only_in_index_or_non_operative",
                    stage="clause_retrieval",
                    level="WARNING",
                    details={
                        "clause_ref": clause_ref,
                        "best_page": best_chunk.page_number,
                        "best_score": best_score,
                        "rationale": best_rationale,
                    },
                )
                raise ClauseNotFoundError(
                    f"The clause cited by your insurer ({clean_ref}) appears only in an index, cross-reference, or non-operative section (Page {best_chunk.page_number}), but no operative policy provision defining this exclusion exists in the policy contract. This establishes a clause/policy mismatch."
                )

            structured_logger.log_event(
                event="clause_retrieved_verbatim",
                stage="clause_retrieval",
                details={
                    "clause_ref": clause_ref,
                    "page_number": best_chunk.page_number,
                    "char_span": [start_idx, end_idx],
                    "score": best_score,
                    "rationale": best_rationale,
                },
            )

            return PolicySpan(
                clause_ref=clause_ref,
                page_number=best_chunk.page_number,
                char_start=start_idx,
                char_end=end_idx,
                quoted_text=verbatim_text,
            )
