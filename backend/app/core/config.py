"""Central configuration module for Pratikar.
Loads and validates settings from environment variables once at startup.
"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    LLM_PRIMARY_KEY: Optional[str] = None
    LLM_FALLBACK_KEY: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    BHASHINI_KEY: Optional[str] = None
    ALLOWED_ORIGIN: str = "*"
    SESSION_TTL_MINUTES: int = 60
    MAX_UPLOAD_MB: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
