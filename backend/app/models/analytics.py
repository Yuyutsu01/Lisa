"""
Analytics and Opportunity Loop Models for Lisa.

Stores post performance metrics across platforms, normalized KPIs,
and AI-generated content repurposing opportunities.
"""

import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    BigInteger,
    Float,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class OpportunityStatus(str, enum.Enum):
    OPEN = "open"
    ACTIONED = "actioned"
    DISMISSED = "dismissed"


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    published_record_id = Column(
        String(36),
        ForeignKey("published_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform = Column(String(50), nullable=False, index=True)
    # Provenance Tracking: platform_api | simulated | unavailable
    metrics_source = Column(String(30), default="platform_api", nullable=False, index=True)

    # Core Performance Metrics
    impressions = Column(BigInteger, default=0, nullable=False)
    reach = Column(BigInteger, default=0, nullable=False)
    views = Column(BigInteger, default=0, nullable=False)
    likes = Column(BigInteger, default=0, nullable=False)
    comments = Column(BigInteger, default=0, nullable=False)
    shares = Column(BigInteger, default=0, nullable=False)
    saves = Column(BigInteger, default=0, nullable=False)
    clicks = Column(BigInteger, default=0, nullable=False)
    engagement_rate = Column(Float, default=0.0, nullable=False)

    collected_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    raw_metrics_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    published_record = relationship("PublishedRecord")


class ContentOpportunity(Base):
    __tablename__ = "content_opportunities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(255), nullable=False)
    content_pillar = Column(String(100), default="General", nullable=False)
    suggested_platforms_json = Column(JSON, default=list, nullable=False)
    reason = Column(Text, nullable=False)
    confidence = Column(String(20), default="medium", nullable=False)  # high, medium, low
    source_evidence_json = Column(JSON, default=dict, nullable=False)
    status = Column(String(30), default=OpportunityStatus.OPEN.value, nullable=False)

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
