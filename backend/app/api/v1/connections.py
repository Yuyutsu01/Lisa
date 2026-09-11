"""
Connected Accounts API Endpoints for Lisa.

Manage social platform integrations, OAuth tokens, and connection status.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.connection import ConnectedAccount, ConnectionStatus
from app.schemas.connection import (
    ConnectedAccountCreate,
    ConnectedAccountRead,
    ConnectedAccountUpdate,
)
from app.api.deps import (
    get_current_user,
    get_workspace_member,
    require_roles,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/connections",
    tags=["Connections"],
)


@router.get("", response_model=List[ConnectedAccountRead])
async def list_connected_accounts(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(get_workspace_member),
):
    """
    List all connected social/platform accounts for the workspace.
    """
    query = select(ConnectedAccount).where(
        ConnectedAccount.workspace_id == workspace_id
    )
    res = await db.execute(query)
    return res.scalars().all()


@router.post("", response_model=ConnectedAccountRead, status_code=status.HTTP_201_CREATED)
async def connect_account(
    workspace_id: str,
    payload: ConnectedAccountCreate,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
):
    """
    Connect or link a social platform account to the workspace.
    """
    # Check if this external account is already linked
    query = select(ConnectedAccount).where(
        ConnectedAccount.workspace_id == workspace_id,
        ConnectedAccount.platform == payload.platform,
        ConnectedAccount.external_account_id == payload.external_account_id,
    )
    existing = (await db.execute(query)).scalar_one_or_none()
    if existing:
        # Update existing connection
        existing.account_name = payload.account_name
        existing.access_token_encrypted = payload.access_token
        existing.refresh_token_encrypted = payload.refresh_token
        existing.expires_at = payload.expires_at
        existing.scopes_json = payload.scopes
        existing.metadata_json = payload.metadata
        existing.status = ConnectionStatus.CONNECTED.value
        await db.commit()
        await db.refresh(existing)
        return existing

    account = ConnectedAccount(
        workspace_id=workspace_id,
        platform=payload.platform,
        external_account_id=payload.external_account_id,
        account_name=payload.account_name,
        access_token_encrypted=payload.access_token,
        refresh_token_encrypted=payload.refresh_token,
        expires_at=payload.expires_at,
        scopes_json=payload.scopes,
        metadata_json=payload.metadata,
        status=ConnectionStatus.CONNECTED.value,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_account(
    workspace_id: str,
    connection_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
):
    """
    Disconnect a social platform account from the workspace.
    """
    query = select(ConnectedAccount).where(
        ConnectedAccount.id == connection_id,
        ConnectedAccount.workspace_id == workspace_id,
    )
    account = (await db.execute(query)).scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found",
        )

    await db.delete(account)
    await db.commit()
    return None
