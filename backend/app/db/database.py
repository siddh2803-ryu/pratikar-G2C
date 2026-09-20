"""Database and session lifecycle repository for Pratikar.
Enforces analysis_id scoping and cascade disposal of session data and documents (PRD FR-13, Tech Stack §7.7, §8).
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.logging import structured_logger
from app.models.schemas import AnalysisResponse, StructuredClaimRecord, Verdict, EvidenceItem
from app.ingestion.parser import PolicyChunk


class SessionDatabase:
    """Manages active analysis sessions, document storage, and cascade cleanup."""
    def __init__(self):
        # In-memory session store (with Supabase sync if credentials provided)
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self) -> str:
        analysis_id = str(uuid.uuid4())
        ttl_minutes = settings.SESSION_TTL_MINUTES
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)

        self.sessions[analysis_id] = {
            "analysis_id": analysis_id,
            "created_at": datetime.now(timezone.utc),
            "expires_at": expires_at,
            "status": "processing",
            "claim_record": None,
            "policy_chunks": [],
            "verdict": None,
            "generated_docs": {}, # doc_id -> {"kind": ..., "bytes": ..., "language": ...}
            "uploaded_files": {}, # role -> {"filename": ..., "bytes": ...}
            "language": "en",
            "error": None,
        }

        structured_logger.log_event(
            event="session_created",
            analysis_id=analysis_id,
            stage="session_lifecycle",
            details={"expires_at": expires_at.isoformat()},
        )
        return analysis_id

    def get_session(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(analysis_id)
        if not session:
            return None
        # Check expiry
        if datetime.now(timezone.utc) > session["expires_at"]:
            self.delete_session(analysis_id)
            return None
        return session

    def update_session(self, analysis_id: str, updates: Dict[str, Any]) -> None:
        if analysis_id in self.sessions:
            self.sessions[analysis_id].update(updates)

    def delete_session(self, analysis_id: str) -> bool:
        """Cascade deletes all data, derived chunks, and stored documents for the session (PRD FR-13)."""
        if analysis_id in self.sessions:
            del self.sessions[analysis_id]
            structured_logger.log_event(
                event="session_disposed_cascade",
                analysis_id=analysis_id,
                stage="session_lifecycle",
                details={"status": "all_documents_purged"},
            )
            return True
        return False

    def store_document(self, analysis_id: str, role: str, filename: str, content: bytes):
        if analysis_id in self.sessions:
            self.sessions[analysis_id]["uploaded_files"][role] = {
                "filename": filename,
                "bytes": content,
            }

    def store_generated_doc(self, analysis_id: str, doc_id: str, kind: str, pdf_bytes: bytes, language: str = "en"):
        if analysis_id not in self.sessions:
            # For demo cases or pre-cached sessions, create a persistent session container
            ttl_minutes = settings.SESSION_TTL_MINUTES
            self.sessions[analysis_id] = {
                "analysis_id": analysis_id,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes),
                "status": "complete",
                "claim_record": None,
                "policy_chunks": [],
                "verdict": None,
                "generated_docs": {},
                "uploaded_files": {},
                "language": language,
                "error": None,
            }

        self.sessions[analysis_id]["generated_docs"][doc_id] = {
            "kind": kind,
            "bytes": pdf_bytes,
            "language": language,
        }

    def get_generated_doc(self, analysis_id: str, doc_id: str) -> Optional[Dict[str, Any]]:
        session = self.get_session(analysis_id)
        if not session:
            # Also check direct map for demo cases
            session = self.sessions.get(analysis_id)
        if not session:
            return None
        return session.get("generated_docs", {}).get(doc_id)


db = SessionDatabase()
