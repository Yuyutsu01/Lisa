"""
Publishing Job and Schedule Models for Lisa.

Tracks scheduled, queued, and executing publishing operations with idempotency keys
and retry counters.
"""

import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    QUEUED = "queued"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    EXPORTED = "exported"  # Mode C: Manual handoff / teleprompter package export
    FAILED = "failed"
    CANCELLED = "cancelled"


class PublishingJob(Base):
    __tablename__ = "publishing_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content_variant_id = Column(
        String(36),
        ForeignKey("content_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    connected_account_id = Column(String(36), nullable=True)  # Optional linked social account ID
    
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    status = Column(String(50), default=JobStatus.SCHEDULED.value, nullable=False, index=True)
    
    idempotency_key = Column(String(100), unique=True, nullable=False, index=True)
    external_job_id = Column(String(255), nullable=True)
    attempt_count = Column(Integer, default=0, nullable=False)
    error_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    variant = relationship("ContentVariant", foreign_keys=[content_variant_id])
