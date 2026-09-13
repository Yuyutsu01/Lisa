"""
Migration: Add missing columns to performance_metrics table in Supabase.

Columns added to the SQLAlchemy model after the table was originally created:
  - metrics_source  VARCHAR(30) NOT NULL DEFAULT 'platform_api'
  - views           BIGINT NOT NULL DEFAULT 0
  - saves           BIGINT NOT NULL DEFAULT 0
  - clicks          BIGINT NOT NULL DEFAULT 0
  - collected_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  - raw_metrics_json JSON NOT NULL DEFAULT '{}'
"""
import asyncio
import sys

sys.path.insert(0, ".")


async def migrate():
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text

    # Each migration is idempotent: ADD COLUMN IF NOT EXISTS (PostgreSQL 9.6+)
    migrations = [
        # performance_metrics columns
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS metrics_source VARCHAR(30) NOT NULL DEFAULT 'platform_api'",
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0",
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS saves BIGINT NOT NULL DEFAULT 0",
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS clicks BIGINT NOT NULL DEFAULT 0",
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS raw_metrics_json JSON NOT NULL DEFAULT '{}'",
        # content_opportunities columns (in case updated_at is missing)
        "ALTER TABLE content_opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
    ]

    async with AsyncSessionLocal() as db:
        for stmt in migrations:
            try:
                await db.execute(text(stmt))
                print(f"  OK: {stmt[:80]}...")
            except Exception as e:
                print(f"  SKIP ({type(e).__name__}): {stmt[:60]}... -> {str(e)[:120]}")
        await db.commit()
        print("\nMigration complete.")


if __name__ == "__main__":
    asyncio.run(migrate())
