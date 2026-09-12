"""
Content Source and Versioning Models for Lisa.

Represents canonical content sources created or uploaded by users, along with
immutable version snapshots for draft recovery and auditability.
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
    Integer,
    Boolean,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class SourceStatus(str, enum.Enum):
    DRAFT = "draft"
    READY_FOR_ADAPTATION = "ready_for_adaptation"
    ARCHIVED = "archived"


class ContentType(str, enum.Enum):
    TEXT = "text"
    RICH_TEXT = "rich_text"
    ARTICLE = "article"
    ANNOUNCEMENT = "announcement"
    CASE_STUDY = "case_study"
    NOTE = "note"


class ContentSource(Base):
    __tablename__ = "content_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(255), nullable=False)
    body = Column(Text, default="", nullable=False)
    content_type = Column(String(50), default=ContentType.ARTICLE.value, nullable=False)
    language = Column(String(50), default="English", nullable=False)
    status = Column(String(50), default=SourceStatus.DRAFT.value, nullable=False, index=True)
    
    # Prompt injection guardrail flags (FR-BRAND-005)
    injection_risk_flag = Column(Boolean, default=False, nullable=False)
    injection_risk_details = Column(JSON, default=dict, nullable=False)

    # Platform targeting and categorization
    target_platforms_json = Column(JSON, default=list, nullable=False)  # ["linkedin", "x", "instagram", "youtube", "email"]
    content_pillar = Column(String(100), default="", nullable=False)
    campaign = Column(String(100), default="", nullable=False)
    source_metadata_json = Column(JSON, default=dict, nullable=False)

    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
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
    versions = relationship(
        "ContentSourceVersion",
        back_populates="source",
        cascade="all, delete-orphan",
        order_by="desc(ContentSourceVersion.version_number)",
    )
    attached_assets = relationship(
        "ContentSourceAsset",
        back_populates="source",
        cascade="all, delete-orphan",
    )


class ContentSourceVersion(Base):
    __tablename__ = "content_source_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_source_id = Column(
        String(36),
        ForeignKey("content_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    source = relationship("ContentSource", back_populates="versions")
