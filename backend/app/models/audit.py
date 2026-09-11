"""
Audit Log Model for Lisa.

Maintains immutable audit records for tenant events, user modifications,
publishing approvals, and system state transitions.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action = Column(String(100), nullable=False, index=True)  # e.g. variant.approved, source.created, publishing.published
    resource_type = Column(String(50), nullable=False, index=True)  # variant, source, connection, workspace, brand
    resource_id = Column(String(100), nullable=False, index=True)
    metadata_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    actor = relationship("User", foreign_keys=[actor_id])
