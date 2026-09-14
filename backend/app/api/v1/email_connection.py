"""
Resend Email Connection Endpoint for Lisa.

Enables workspace admins to securely connect and verify their Resend API key
for newsletter and dispatch publishing.
"""

import logging
from typing import Optional
from pydantic import BaseModel, Field
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.connection import ConnectedAccount, ConnectionStatus
from app.schemas.connection import ConnectedAccountRead
from app.api.deps import require_roles

logger = logging.getLogger("uvicorn.error")

router = APIRouter(
    prefix="/workspaces/{workspace_id}/connections",
    tags=["Connections"],
)


class EmailConnectRequest(BaseModel):
    api_key: str = Field(..., description="Resend API key starting with re_")
    from_email: Optional[str] = Field(None, description="Sender email address (must be verified in Resend)")
    from_name: Optional[str] = Field(None, description="Sender display name")
    label: Optional[str] = Field(None, description="Workspace display label for this connection")


@router.post(
    "/email",
    response_model=ConnectedAccountRead,
    status_code=status.HTTP_201_CREATED,
)
async def connect_email_account(
    workspace_id: str,
    payload: EmailConnectRequest,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
) -> ConnectedAccountRead:
    """
    Connect a Resend API key for email publishing.
    1. Validates API key prefix ('re_').
    2. Verifies API key with Resend GET /domains.
    3. Idempotently upserts the connection record.
    4. Returns ConnectedAccountRead without exposing the API key.
    """
    api_key = payload.api_key.strip()
    if not api_key.startswith("re_"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Resend API key format. Expected key starting with 're_'.",
        )

    # Verify key validity with Resend API
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                "https://api.resend.com/domains",
                headers={"Authorization": f"Bearer {api_key}"},
            )
        except httpx.RequestError as exc:
            logger.warning(f"Resend verification request failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to connect to Resend API to verify credentials.",
            )

    if resp.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Resend API key. Please check your credentials.",
        )
    # 403 is expected for Resend "sending access"-only API keys:
    # they can send email but cannot list domains, so GET /domains
    # returns 403. Do not reject them.
    elif resp.is_error and resp.status_code != 403:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Resend verification failed with status {resp.status_code}.",
        )

    key_prefix = api_key[:16]
    display_name = payload.label.strip() if payload.label and payload.label.strip() else "Resend"

    stmt = select(ConnectedAccount).where(
        and_(
            ConnectedAccount.workspace_id == workspace_id,
            ConnectedAccount.platform == "email",
            ConnectedAccount.external_account_id == key_prefix,
        )
    )
    result = await db.execute(stmt)
    account = result.scalars().first()

    account_metadata = {
        "from_email": payload.from_email.strip() if payload.from_email else "onboarding@resend.dev",
        "from_name": payload.from_name.strip() if payload.from_name else "Lisa",
        "provider": "resend",
    }

    if account:
        account.account_name = display_name
        account.access_token_encrypted = api_key
        account.status = ConnectionStatus.CONNECTED.value
        account.metadata_json = account_metadata
        account.expires_at = None
    else:
        account = ConnectedAccount(
            workspace_id=workspace_id,
            platform="email",
            external_account_id=key_prefix,
            account_name=display_name,
            access_token_encrypted=api_key,
            status=ConnectionStatus.CONNECTED.value,
            metadata_json=account_metadata,
            expires_at=None,
        )
        db.add(account)

    await db.commit()
    await db.refresh(account)
    return account
