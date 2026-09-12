"""
Trusted Automation Rules Model for Lisa.

Enforces Section 15.1 and Section 23 of the Product Specification.
Auto-publishing is blocked unless an explicit, unexpired Trusted Automation Rule
matching the exact channel and format exists, or manual human approval is provided.
"""

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
)
from app.db.session import Base


class TrustedAutomationRule(Base):
    __tablename__ = "trusted_automation_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform = Column(String(50), nullable=False)  # linkedin, x, etc.
    format = Column(String(50), nullable=False)  # text_post, carousel, etc.
    min_quality_score = Column(Float, default=0.85, nullable=False)
    
    # 30-Day Expiry Policy per Section 23 HITL Guardrail
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=30),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
