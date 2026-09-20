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


class ClauseRetriever:
    """Path B: Clause Retrieval engine.
    Finds the exact clause in policy chunks, quotes verbatim, and anchors to page_number.
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

            # Normalise search pattern for clause: e.g. "Clause 4.2" or "4.2"
            clean_ref = clause_ref.strip()
            # Extract number if possible: "4.2" from "Clause 4.2"
            num_match = re.search(r"(\d+(?:\.\d+)+)", clean_ref)
            clause_num = num_match.group(1) if num_match else clean_ref

            candidate_matches: List[Tuple[PolicyChunk, int, int, str]] = []

            for chunk in chunks:
                text = chunk.text
                # Look for exact clause heading or text pattern
                # e.g., "Clause 4.2", "4.2 Pre-existing", "Section 4.2"
                patterns = [
                    re.compile(rf"\bClause\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bSection\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bExclusion\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"\bCondition\s+{re.escape(clause_num)}\b", re.IGNORECASE),
                    re.compile(rf"(?:^|\n)\s*{re.escape(clause_num)}[\s\.\-:]+[A-Z]", re.IGNORECASE),
                    re.compile(rf"\b{re.escape(clean_ref)}\b", re.IGNORECASE),
                ]

                for pat in patterns:
                    match = pat.search(text)
                    if match:
                        start_pos = match.start()
                        # Extract the clause paragraph (up to 600 chars or next clause heading)
                        end_pos = min(len(text), start_pos + 650)
                        # Try to find paragraph break
                        next_break = text.find("\n\n", start_pos + 50)
                        if next_break != -1 and next_break < start_pos + 700:
                            end_pos = next_break

                        quoted_text = text[start_pos:end_pos].strip()
                        candidate_matches.append((chunk, start_pos, end_pos, quoted_text))
                        break

            if not candidate_matches:
                # PRD §14 condition: Cited clause not found in the policy (Clause/Policy Mismatch)
                # Strict quote-or-abstain enforcement: NEVER grab arbitrary PDF text
                structured_logger.log_event(
                    event="clause_not_found_in_policy",
                    stage="clause_retrieval",
                    level="WARNING",
                    details={"clause_ref": clause_ref, "searched_num": clause_num},
                )
                raise ClauseNotFoundError(
                    f"The clause your insurer cited ({clean_ref}) does not appear in this policy document. This establishes a clause/policy mismatch."
                )

            # Pick best match
            best_chunk, start_idx, end_idx, verbatim_text = candidate_matches[0]
            
            structured_logger.log_event(
                event="clause_retrieved_verbatim",
                stage="clause_retrieval",
                details={
                    "clause_ref": clause_ref,
                    "page_number": best_chunk.page_number,
                    "char_span": [start_idx, end_idx],
                },
            )

            return PolicySpan(
                clause_ref=clause_ref,
                page_number=best_chunk.page_number,
                char_start=start_idx,
                char_end=end_idx,
                quoted_text=verbatim_text,
            )
