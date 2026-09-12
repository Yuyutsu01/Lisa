"""
Content Variant Models for Lisa.

Stores platform-specific native representations derived from a canonical ContentSource,
along with QA scores, platform strategies, and human approval status.
"""

import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Boolean,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class VariantStatus(str, enum.Enum):
    DRAFT = "draft"
    NEEDS_REVIEW = "needs_review"
    POLICY_FLAGGED = "policy_flagged"  # Guardrail: blocked from review until human override
    BUDGET_EXCEEDED = "budget_exceeded"  # Guardrail: token/cost ceiling reached
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    EXPORTED = "exported"  # Mode C: Script exported for manual creator upload
    REJECTED = "rejected"


class ContentVariant(Base):
    __tablename__ = "content_variants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content_source_id = Column(
        String(36),
        ForeignKey("content_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform = Column(String(50), nullable=False, index=True)  # linkedin, x, instagram, discord, tiktok, threads, email, blog
    format = Column(String(50), default="text_post", nullable=False)  # text_post, thread, carousel, short_video, newsletter, article
    status = Column(String(50), default=VariantStatus.NEEDS_REVIEW.value, nullable=False, index=True)

    # Adapted Copy
    title = Column(String(255), nullable=True)
    body = Column(Text, default="", nullable=False)
    caption = Column(Text, nullable=True)
    cta = Column(String(500), nullable=True)
    hashtags_json = Column(JSON, default=list, nullable=False)

    # Guardrails & Provenance
    is_fallback = Column(Boolean, default=False, nullable=False)
    policy_flags_json = Column(JSON, default=list, nullable=False)

    # Strategy & Quality Assurance
    strategy_json = Column(JSON, default=dict, nullable=False)
    quality_review_json = Column(JSON, default=dict, nullable=False)  # score, checks, warnings
    
    # Human Approval Trail
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)

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
    source = relationship("ContentSource", foreign_keys=[content_source_id])
