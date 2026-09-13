"""
Core Configuration Module for Lisa.

Handles environment-based application settings using Pydantic Settings.
Supports PostgreSQL for production and asynchronous SQLite for local development.
"""

from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve paths
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # Lisa/backend
ROOT_DIR = BACKEND_DIR.parent                               # Lisa


class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "Lisa - AI Content Distribution & Repurposing Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security & JWT Tokens
    SECRET_KEY: str = "lisa-super-secret-jwt-signing-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for convenience

    # CORS Origins - supports list of strings or comma-separated env var
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        # Handle string input from environment variables (comma-separated or JSON array)
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            # Try parsing as JSON array if formatted like '['...']'
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            # Parse comma-separated list or single URL (e.g. "http://localhost:3000,https://app.vercel.app" or "*")
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(item).strip() for item in v if str(item).strip()]
        return []


    # Database URL
    # Defaults to SQLite async for immediate out-of-the-box local execution
    # In production, set DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/lisa_db"
    DATABASE_URL: str = "sqlite+aiosqlite:///./lisa.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        # Convert standard postgres URIs (like from Supabase/Render/Heroku) to asyncpg dialect
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Redis URL for background worker tasks
    REDIS_URL: str = "redis://localhost:6379/0"

    # LinkedIn OAuth
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8000/api/v1/oauth/linkedin/callback"
    FRONTEND_URL: str = "http://localhost:3000/integrations"

    # LLM Provider Configuration
    # Supports Groq (Llama 3.3 70B), OpenAI (GPT-4o), Gemini, or Anthropic
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_TIMEOUT_SECONDS: int = 45

    # Content Quality Scoring & Revision Loop
    QUALITY_APPROVAL_THRESHOLD: float = 0.85
    QUALITY_REVIEW_THRESHOLD: float = 0.70
    MAX_AUTO_REVISION_RETRIES: int = 2

    model_config = SettingsConfigDict(
        env_file=(
            BACKEND_DIR / ".env",
            ROOT_DIR / ".env",
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
