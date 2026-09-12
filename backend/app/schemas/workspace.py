"""
Workspace and Workspace Member validation and serialization schemas.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.workspace import WorkspaceRole


class WorkspaceBase(BaseModel):
    name: str


class WorkspaceCreate(WorkspaceBase):
    slug: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: WorkspaceRole
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceResponse(WorkspaceBase):
    id: str
    slug: str
    owner_id: str
    settings_json: Dict[str, Any]
    current_user_role: Optional[WorkspaceRole] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberInviteRequest(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.EDITOR


class MemberRoleUpdate(BaseModel):
    role: WorkspaceRole
