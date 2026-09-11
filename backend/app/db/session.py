"""
Database Session and Engine Management for Lisa.

Configures asynchronous database connectivity using SQLAlchemy 2.0.
Works seamlessly across SQLite (aiosqlite) and PostgreSQL (asyncpg).
"""

import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models in Lisa.
    """
    pass


# Connect arguments specific to SQLite for multithreading/connection handling
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

# Asynchronous engine with connection pre-ping
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an active database session
    and guarantees safe cleanup/commit lifecycle.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize all database tables defined on `Base.metadata`.
    Safely catches connectivity delays so server startup completes.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as exc:
        logger.warning(
            "Database table auto-creation skipped or encountered an issue during startup: %s",
            exc,
        )

