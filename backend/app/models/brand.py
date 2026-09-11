"""
Brand Intelligence Models for Lisa.

Stores workspace brand profiles, style guidelines, tone, content pillars,
and ingested brand knowledge reference documents.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Core Brand Identity
    name = Column(String(255), nullable=False)
    description = Column(Text, default="", nullable=False)
    industry = Column(String(255), default="", nullable=False)
    target_audience = Column(Text, default="", nullable=False)
    brand_mission = Column(Text, default="", nullable=False)
    
    # Voice & Tone
    tone = Column(String(255), default="Professional yet approachable", nullable=False)
    writing_style = Column(Text, default="", nullable=False)
    preferred_language = Column(String(50), default="English", nullable=False)
    
    # Guidelines & Rules (JSON arrays and objects)
    forbidden_phrases_json = Column(JSON, default=list, nullable=False)
    preferred_phrases_json = Column(JSON, default=list, nullable=False)
    cta_style = Column(String(100), default="soft", nullable=False)  # soft, direct, educational, promotional
    emoji_policy = Column(String(100), default="limited", nullable=False)  # none, limited, expressive
    hashtag_policy = Column(String(100), default="optional", nullable=False)  # required, optional, prohibited
    
    # Pillars & Visuals
    content_pillars_json = Column(JSON, default=list, nullable=False)
    competitors_references_json = Column(JSON, default=list, nullable=False)
    visual_rules_json = Column(JSON, default=dict, nullable=False)
    disclosure_rules_json = Column(JSON, default=dict, nullable=False)

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

    # Relationship
    workspace = relationship("Workspace", back_populates="brand_profile")


class BrandKnowledgeDoc(Base):
    __tablename__ = "brand_knowledge_docs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(255), nullable=False)
    source_type = Column(
        String(50), default="text", nullable=False
    )  # text, markdown, pdf, url, previous_post
    content = Column(Text, nullable=False)
    status = Column(
        String(50), default="indexed", nullable=False
    )  # indexed, pending, error
    metadata_json = Column(JSON, default=dict, nullable=False)

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

    # Relationship
    workspace = relationship("Workspace", back_populates="knowledge_docs")
