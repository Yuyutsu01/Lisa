"""
Database Base Metadata aggregator.
Imports all ORM models so Alembic migrations and Base.metadata.create_all discover all entities.
"""

from app.db.session import Base
from app.models.user import User, UserStatus
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.models.brand import BrandProfile, BrandKnowledgeDoc
from app.models.content import ContentSource, ContentSourceVersion, SourceStatus, ContentType
from app.models.media import MediaAsset, ContentSourceAsset
from app.models.variant import ContentVariant, VariantStatus
from app.models.agent_run import AgentRun
from app.models.derivative import MediaDerivative
from app.models.publishing_job import PublishingJob, JobStatus

__all__ = [
    "Base",
    "User",
    "UserStatus",
    "Workspace",
    "WorkspaceMember",
    "WorkspaceRole",
    "BrandProfile",
    "BrandKnowledgeDoc",
    "ContentSource",
    "ContentSourceVersion",
    "SourceStatus",
    "ContentType",
    "MediaAsset",
    "ContentSourceAsset",
    "ContentVariant",
    "VariantStatus",
    "AgentRun",
    "MediaDerivative",
    "PublishingJob",
    "JobStatus",
]
