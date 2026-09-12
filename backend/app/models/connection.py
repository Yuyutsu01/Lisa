"""
Connected Accounts and Published Records Models for Lisa.

Stores encrypted platform OAuth connection credentials, token expiry,
and historical published post links (external post IDs and URLs).
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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class ConnectionStatus(str, enum.Enum):
    CONNECTED = "connected"
    EXPIRED = "expired"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform = Column(String(50), nullable=False, index=True)  # linkedin, x, instagram, discord, tiktok, threads, email, blog
    external_account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)
    
    # Credentials (encrypted at rest)
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    scopes_json = Column(JSON, default=list, nullable=False)
    status = Column(String(50), default=ConnectionStatus.CONNECTED.value, nullable=False)
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

    __table_args__ = (
        UniqueConstraint("workspace_id", "platform", "external_account_id", name="uq_workspace_platform_account"),
    )


class PublishedRecord(Base):
    __tablename__ = "published_records"

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
    publishing_job_id = Column(
        String(36),
        ForeignKey("publishing_jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    platform = Column(String(50), nullable=False, index=True)
    external_post_id = Column(String(255), nullable=False, index=True)
    external_url = Column(String(500), nullable=False)
    
    published_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    metadata_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    variant = relationship("ContentVariant", foreign_keys=[content_variant_id])
