"""Policy document parser using PyMuPDF (fitz).
Extracts text into page-scoped chunks while strictly preserving page numbers and character offsets.
Enforces scanned-PDF detection and quote traceability invariants (Tech Stack §5.3).
"""
from typing import List, Dict, Any
import fitz  # PyMuPDF
from app.ingestion.validator import ValidationError
from app.core.logging import structured_logger, StageTimer


class PolicyChunk:
    def __init__(
        self,
        chunk_id: str,
        page_number: int,
        char_start: int,
        char_end: int,
        text: str,
        document_id: str = "",
    ):
        if page_number < 1:
            raise ValueError(f"Invalid page number {page_number}. Page numbers must be 1-indexed.")
        self.chunk_id = chunk_id
        self.page_number = page_number
        self.char_start = char_start
        self.char_end = char_end
        self.text = text
        self.document_id = document_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "page_number": self.page_number,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "text": self.text,
            "document_id": self.document_id,
        }


def parse_policy_pdf(pdf_bytes: bytes, document_id: str = "policy") -> List[PolicyChunk]:
    """Parses a policy wording PDF into page-scoped chunks.
    Detects image-only/scanned PDFs and raises PRD §14 error.
    """
    with StageTimer("policy_parsing", details={"document_id": document_id}):
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise ValidationError(
                f"Failed to parse policy PDF: {str(e)}", code="CORRUPT_PDF"
            )

        total_pages = len(doc)
        if total_pages == 0:
            raise ValidationError("Policy document is empty.", code="EMPTY_POLICY")

        chunks: List[PolicyChunk] = []
        total_text_chars = 0

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1  # 1-indexed
            page_text = page.get_text("text")
            total_text_chars += len(page_text.strip())

            # Store page-scoped chunk
            chunk_id = f"{document_id}_p{page_num}"
            chunk = PolicyChunk(
                chunk_id=chunk_id,
                page_number=page_num,
                char_start=0,
                char_end=len(page_text),
                text=page_text,
                document_id=document_id,
            )
            chunks.append(chunk)

        avg_chars_per_page = total_text_chars / total_pages if total_pages > 0 else 0

        # Scanned PDF check per PRD §14:
        # If average text is below 50 chars per page, it is scanned images only
        if avg_chars_per_page < 50:
            structured_logger.log_event(
                event="scanned_policy_detected",
                stage="policy_parsing",
                level="WARNING",
                details={"total_pages": total_pages, "avg_chars": avg_chars_per_page},
            )
            raise ValidationError(
                "We cannot cite pages from a scanned policy. Please upload the digital PDF your insurer issued.",
                code="SCANNED_POLICY_REJECTED",
            )

        structured_logger.log_event(
            event="policy_parsed_successfully",
            stage="policy_parsing",
            details={"total_pages": total_pages, "chunks_created": len(chunks)},
        )
        return chunks
