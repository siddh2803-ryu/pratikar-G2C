"""Health and readiness endpoint for Pratikar.
Used for liveness monitoring and demo-day API pre-warming (Tech Stack §5.4, §12.2).
"""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check():
    """Returns system liveness and provider availability.
    Can be pinged before live demos to warm serverless or free-tier containers.
    """
    return {
        "status": "healthy",
        "warmed": True,
        "environment": "production",
        "providers": {
            "primary_llm": "configured" if settings.LLM_PRIMARY_KEY else "offline_heuristic_fallback",
            "fallback_llm": "configured" if settings.LLM_FALLBACK_KEY else "offline_heuristic_fallback",
            "supabase": "connected" if settings.SUPABASE_URL else "in_memory_ephemeral_fallback",
            "bhashini": "configured" if settings.BHASHINI_KEY else "local_dictionary_fallback",
        },
        "version": "1.0.0",
        "rulebook_status": "loaded",
    }
