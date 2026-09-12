"""
Media Derivative Model for Lisa.

Stores platform-specific cropped and resized image/video derivatives
generated from canonical source media assets.
"""

import uuid
from datetime import datetime, timezone
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


class MediaDerivative(Base):
    __tablename__ = "media_derivatives"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_asset_id = Column(
        String(36),
        ForeignKey("media_assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform = Column(String(50), nullable=False)  # instagram, x, linkedin, discord
    format = Column(String(50), nullable=False)  # feed_portrait, thumbnail, story_vertical, header
    
    storage_key = Column(String(500), unique=True, nullable=False)
    mime_type = Column(String(100), default="image/jpeg", nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    processing_status = Column(String(50), default="ready", nullable=False)  # ready, processing, error
    metadata_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    source_asset = relationship("MediaAsset", foreign_keys=[source_asset_id])
