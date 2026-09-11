"""
Media Asset and Storage Models for Lisa.

Tracks uploaded media files (images, videos, documents), metadata,
and association with canonical content sources.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    BigInteger,
    Integer,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename = Column(String(255), nullable=False)
    storage_key = Column(String(500), unique=True, nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    
    # Visual & Video metadata
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    checksum = Column(String(64), index=True, nullable=False)  # SHA-256
    
    metadata_json = Column(JSON, default=dict, nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    source_associations = relationship(
        "ContentSourceAsset",
        back_populates="asset",
        cascade="all, delete-orphan",
    )


class ContentSourceAsset(Base):
    __tablename__ = "content_source_assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_source_id = Column(
        String(36), ForeignKey("content_sources.id", ondelete="CASCADE"), nullable=False
    )
    media_asset_id = Column(
        String(36), ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False
    )
    position = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("content_source_id", "media_asset_id", name="uq_source_asset"),
    )

    # Relationships
    source = relationship("ContentSource", back_populates="attached_assets")
    asset = relationship("MediaAsset", back_populates="source_associations")
