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

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # Database URL
    # Defaults to SQLite async for immediate out-of-the-box local execution
    # In production, set DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/lisa_db"
    DATABASE_URL: str = "sqlite+aiosqlite:///./lisa.db"

    # Redis URL for background worker tasks
    REDIS_URL: str = "redis://localhost:6379/0"

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
