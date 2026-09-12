"""
Agent Run and Observability Models for Lisa.

Tracks agent workflow runs, model usage, latency, and structured outputs
for complete observability and auditing.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    JSON,
    Integer,
)
from app.db.session import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(
        String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workflow_id = Column(String(36), index=True, nullable=False)
    agent_name = Column(String(100), nullable=False)  # intake, strategy, adaptation, caption, qa
    agent_version = Column(String(50), default="1.0.0", nullable=False)
    status = Column(String(50), default="completed", nullable=False)  # completed, failed
    model = Column(String(100), default="lisa-deterministic-v1", nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    
    token_usage_json = Column(JSON, default=dict, nullable=False)
    input_params_json = Column(JSON, default=dict, nullable=False)
    output_json = Column(JSON, default=dict, nullable=False)
    error_json = Column(JSON, default=dict, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
