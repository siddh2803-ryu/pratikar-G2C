"""File validation logic for uploads in Pratikar.
Enforces size limits and file format constraints with exact error messages from PRD §14.
"""
from typing import Tuple
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


class ValidationError(Exception):
    def __init__(self, message: str, code: str = "VALIDATION_FAILED"):
        super().__init__(message)
        self.message = message
        self.code = code


def validate_file_upload(filename: str, content_bytes: bytes) -> Tuple[bool, str]:
    """Validates file extension and size according to PRD FR-01 and SEC-04.
    Returns (True, "OK") or raises ValidationError.
    """
    # 1. Extension check
    lower_name = filename.lower()
    ext = ""
    for candidate in ALLOWED_EXTENSIONS:
        if lower_name.endswith(candidate):
            ext = candidate
            break

    if not ext:
        # Extract the actual extension if possible for the exact PRD message
        parts = lower_name.rsplit(".", 1)
        actual_ext = f".{parts[1]}" if len(parts) > 1 else "unknown format"
        raise ValidationError(
            f"We can read PDF, JPG and PNG. This file is a {actual_ext} — please upload the PDF version.",
            code="UNSUPPORTED_FILE_TYPE",
        )

    # 2. Size check
    size_mb = round(len(content_bytes) / (1024 * 1024), 1)
    limit_mb = settings.MAX_UPLOAD_MB
    if size_mb > limit_mb:
        raise ValidationError(
            f"This file is {int(size_mb) if size_mb.is_integer() else size_mb} MB. The limit is {limit_mb} MB.",
            code="UPLOAD_EXCEEDS_LIMIT",
        )

    # 3. Content signature check
    if ext == ".pdf":
        if not content_bytes.startswith(b"%PDF-"):
            raise ValidationError(
                "The uploaded file has a .pdf extension but is not a valid PDF document.",
                code="INVALID_PDF_CONTENT",
            )

    return True, "OK"
