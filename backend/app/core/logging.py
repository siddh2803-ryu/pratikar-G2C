"""Structured JSON logger for Pratikar.
Outputs structured JSON to stdout containing stage timings, rules fired, and grounding checks.
NEVER logs raw document text or extracted personal health data (SEC-08).
"""
import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class StructuredLogger:
    def __init__(self, name: str = "pratikar"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)

    def log_event(
        self,
        event: str,
        analysis_id: Optional[str] = None,
        duration_ms: Optional[float] = None,
        stage: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        level: str = "INFO",
    ):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "event": event,
            "analysis_id": analysis_id,
            "stage": stage,
            "duration_ms": duration_ms,
            "details": details or {},
        }
        log_line = json.dumps({k: v for k, v in payload.items() if v is not None})
        if level == "ERROR":
            self.logger.error(log_line)
        elif level == "WARNING":
            self.logger.warning(log_line)
        else:
            self.logger.info(log_line)


structured_logger = StructuredLogger()


class StageTimer:
    """Context manager for timing pipeline stages and structured logging."""
    def __init__(self, stage: str, analysis_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.stage = stage
        self.analysis_id = analysis_id
        self.details = details or {}
        self.start_time = 0.0

    def __enter__(self):
        self.start_time = time.perf_counter()
        structured_logger.log_event(
            event="stage_started",
            analysis_id=self.analysis_id,
            stage=self.stage,
            details=self.details,
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.perf_counter() - self.start_time) * 1000.0
        if exc_type:
            structured_logger.log_event(
                event="stage_failed",
                analysis_id=self.analysis_id,
                stage=self.stage,
                duration_ms=round(duration_ms, 2),
                details={"error": str(exc_val)},
                level="ERROR",
            )
        else:
            structured_logger.log_event(
                event="stage_completed",
                analysis_id=self.analysis_id,
                stage=self.stage,
                duration_ms=round(duration_ms, 2),
                details=self.details,
            )
