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


# Connect arguments and pool configuration
connect_args = {}
engine_kwargs = {
    "echo": (settings.ENVIRONMENT == "development"),
    "pool_pre_ping": True,
    "future": True,
}

if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL / Supabase connection pool tuning
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 1800
    engine_kwargs["pool_timeout"] = 30

# Asynchronous database engine
engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

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
        # Ensure all models are imported so their tables are in Base.metadata
        import app.models  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as exc:
        logger.warning(
            "Database table auto-creation skipped or encountered an issue during startup: %s",
            exc,
        )

