"""
Workspace and Multi-Tenancy Management Endpoints for Lisa.

Handles workspace CRUD, membership listings, invitations, and role management.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.models.brand import BrandProfile
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    MemberInviteRequest,
    MemberRoleUpdate,
)
from app.api.deps import (
    get_current_user,
    get_workspace_member,
    require_roles,
)
from app.api.v1.auth import generate_slug

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
async def list_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all workspaces the authenticated user is a member of.
    """
    query = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
        .order_by(Workspace.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    workspaces = []
    for workspace, role in rows:
        ws_dict = WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            owner_id=workspace.owner_id,
            settings_json=workspace.settings_json or {},
            current_user_role=WorkspaceRole(role),
            created_at=workspace.created_at,
            updated_at=workspace.updated_at,
        )
        workspaces.append(ws_dict)

    return workspaces


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new workspace and assign the current user as the OWNER.
    Initializes a default Brand Profile for the new workspace.
    """
    base_slug = generate_slug(workspace_in.slug or workspace_in.name)
    slug = f"{base_slug}-{current_user.id[:6]}"

    workspace = Workspace(
        name=workspace_in.name,
        slug=slug,
        owner_id=current_user.id,
        settings_json=workspace_in.settings or {},
    )
    db.add(workspace)
    await db.flush()

    # Assign user as Owner
    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role=WorkspaceRole.OWNER.value,
    )
    db.add(membership)

    # Initialize Brand Profile
    brand_profile = BrandProfile(
        workspace_id=workspace.id,
        name=workspace_in.name,
        description=f"Brand profile for {workspace_in.name}",
    )
    db.add(brand_profile)

    await db.commit()
    await db.refresh(workspace)

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        settings_json=workspace.settings_json or {},
        current_user_role=WorkspaceRole.OWNER,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed workspace metadata for an authorized member.
    """
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        settings_json=workspace.settings_json or {},
        current_user_role=WorkspaceRole(member.role),
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
    )


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_update: WorkspaceUpdate,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update workspace name or settings. Requires OWNER or ADMIN role.
    """
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )

    if workspace_update.name is not None:
        workspace.name = workspace_update.name
    if workspace_update.settings is not None:
        workspace.settings_json = workspace_update.settings

    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)

    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        owner_id=workspace.owner_id,
        settings_json=workspace.settings_json or {},
        current_user_role=WorkspaceRole(member.role),
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
    )


@router.get(
    "/{workspace_id}/members", response_model=List[WorkspaceMemberResponse]
)
async def list_workspace_members(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    List all team members and their roles in the workspace.
    """
    query = (
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.user))
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.created_at.asc())
    )
    result = await db.execute(query)
    members = result.scalars().all()

    return [
        WorkspaceMemberResponse(
            id=m.id,
            workspace_id=m.workspace_id,
            user_id=m.user_id,
            role=WorkspaceRole(m.role),
            user_name=m.user.name if m.user else None,
            user_email=m.user.email if m.user else None,
            created_at=m.created_at,
        )
        for m in members
    ]


@router.post(
    "/{workspace_id}/members",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_workspace_member(
    workspace_id: str,
    invite: MemberInviteRequest,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Add/invite a user to the workspace with a specified role.
    Requires OWNER or ADMIN role.
    """
    # Check if target user exists
    user_result = await db.execute(
        select(User).where(User.email == invite.email.lower())
    )
    target_user = user_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist yet. Ask them to register first.",
        )

    # Check if already a member
    existing_member = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == target_user.id,
        )
    )
    if existing_member.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this workspace",
        )

    new_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=target_user.id,
        role=invite.role.value,
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return WorkspaceMemberResponse(
        id=new_member.id,
        workspace_id=new_member.workspace_id,
        user_id=new_member.user_id,
        role=WorkspaceRole(new_member.role),
        user_name=target_user.name,
        user_email=target_user.email,
        created_at=new_member.created_at,
    )


@router.patch(
    "/{workspace_id}/members/{user_id}",
    response_model=WorkspaceMemberResponse,
)
async def update_member_role(
    workspace_id: str,
    user_id: str,
    role_update: MemberRoleUpdate,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a member's role in the workspace.
    Requires OWNER or ADMIN role.
    """
    query = select(WorkspaceMember).options(selectinload(WorkspaceMember.user)).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    )
    result = await db.execute(query)
    target_membership = result.scalar_one_or_none()

    if not target_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this workspace",
        )

    # Cannot demote or change owner role unless current user is owner
    if target_membership.role == WorkspaceRole.OWNER.value and member.role != WorkspaceRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the workspace owner can modify an owner's role",
        )

    target_membership.role = role_update.role.value
    db.add(target_membership)
    await db.commit()
    await db.refresh(target_membership)

    return WorkspaceMemberResponse(
        id=target_membership.id,
        workspace_id=target_membership.workspace_id,
        user_id=target_membership.user_id,
        role=WorkspaceRole(target_membership.role),
        user_name=target_membership.user.name if target_membership.user else None,
        user_email=target_membership.user.email if target_membership.user else None,
        created_at=target_membership.created_at,
    )


@router.delete(
    "/{workspace_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a member from the workspace.
    Requires OWNER or ADMIN role.
    """
    query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    )
    result = await db.execute(query)
    target_membership = result.scalar_one_or_none()

    if not target_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this workspace",
        )

    if target_membership.role == WorkspaceRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the workspace owner",
        )

    await db.delete(target_membership)
    await db.commit()
