"""
Database Base Metadata aggregator.
Imports all ORM models so Alembic migrations and Base.metadata.create_all discover all entities.
"""

from app.db.session import Base
from app.models.user import User, UserStatus
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.models.brand import BrandProfile, BrandKnowledgeDoc

__all__ = [
    "Base",
    "User",
    "UserStatus",
    "Workspace",
    "WorkspaceMember",
    "WorkspaceRole",
    "BrandProfile",
    "BrandKnowledgeDoc",
]
