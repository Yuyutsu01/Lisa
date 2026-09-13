"""
Discord Incoming Webhook Connection Endpoint.

Allows workspace owners/admins/editors to connect Discord channels via Incoming Webhooks.
Validates the webhook against Discord's metadata API before persisting to connected_accounts.
"""

import logging
import re
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.connection import ConnectedAccount, ConnectionStatus
from app.schemas.connection import ConnectedAccountRead
from app.api.deps import require_roles

logger = logging.getLogger(__name__)

DISCORD_WEBHOOK_URL_REGEX = re.compile(
    r"^https://(?:canary\.|ptb\.)?discord\.com/api/webhooks/(\d+)/([\w.-]+)$"
)
DISCORD_METADATA_TIMEOUT_SECONDS = 10.0


class DiscordConnectRequest(BaseModel):
    webhook_url: str = Field(
        ...,
        description="Full Discord Incoming Webhook URL (e.g. https://discord.com/api/webhooks/{id}/{token})",
    )
    label: Optional[str] = Field(
        None,
        description="Optional custom display name for the connected channel/server",
    )


router = APIRouter(
    prefix="/workspaces/{workspace_id}/connections",
    tags=["Connections"],
)


@router.post(
    "/discord",
    response_model=ConnectedAccountRead,
    status_code=status.HTTP_201_CREATED,
)
async def connect_discord_webhook(
    workspace_id: str,
    payload: DiscordConnectRequest,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
) -> ConnectedAccountRead:
    """
    Validate a Discord Incoming Webhook URL and store it as a connected account.

    1. Enforces workspace RBAC (OWNER, ADMIN, or EDITOR).
    2. Validates webhook URL syntax.
    3. Calls Discord GET /api/webhooks/{id}/{token} to verify the webhook.
    4. Idempotently upserts into connected_accounts using external_account_id.
    """
    url = payload.webhook_url.strip()
    match = DISCORD_WEBHOOK_URL_REGEX.match(url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid Discord webhook URL format. Expected: "
                "https://discord.com/api/webhooks/{id}/{token}"
            ),
        )

    webhook_id, _ = match.groups()

    # Step 1: Verify webhook against Discord metadata API
    async with httpx.AsyncClient(timeout=DISCORD_METADATA_TIMEOUT_SECONDS) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as exc:
            logger.warning(f"Discord metadata request failed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to connect to Discord API to verify webhook.",
            )

    if resp.status_code == 429:
        retry_after = resp.headers.get("Retry-After", "5")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Discord rate limit reached. Try again later.",
            headers={"Retry-After": retry_after},
        )
    elif resp.status_code in (401, 403, 404):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or deleted webhook URL.",
        )
    elif resp.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Discord API is currently unavailable. Try again later.",
        )
    elif resp.is_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discord webhook validation failed (HTTP {resp.status_code}).",
        )

    try:
        webhook_data = resp.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid JSON response received from Discord metadata API.",
        )

    verified_name = webhook_data.get("name") or "Discord Webhook"
    channel_id = webhook_data.get("channel_id")
    guild_id = webhook_data.get("guild_id")
    display_name = payload.label.strip() if payload.label and payload.label.strip() else verified_name

    # Step 2: Query for existing connection idempotency
    stmt = select(ConnectedAccount).where(
        and_(
            ConnectedAccount.workspace_id == workspace_id,
            ConnectedAccount.platform == "discord",
            ConnectedAccount.external_account_id == webhook_id,
        )
    )
    result = await db.execute(stmt)
    account = result.scalars().first()

    account_metadata = {
        "webhook_id": webhook_id,
        "channel_id": channel_id,
        "guild_id": guild_id,
        "webhook_name": verified_name,
        "webhook_type": webhook_data.get("type"),
        "avatar": webhook_data.get("avatar"),
    }

    if account:
        # Update existing record
        account.account_name = display_name
        # TODO(security): Column stores plaintext webhook URL.
        # Needs AES-256-GCM encryption in a separate migration pass across all platforms.
        account.access_token_encrypted = url
        account.status = ConnectionStatus.CONNECTED.value
        account.metadata_json = account_metadata
    else:
        # Create new connected account record
        # TODO(security): Column stores plaintext webhook URL.
        # Needs AES-256-GCM encryption in a separate migration pass across all platforms.
        account = ConnectedAccount(
            workspace_id=workspace_id,
            platform="discord",
            external_account_id=webhook_id,
            account_name=display_name,
            access_token_encrypted=url,
            status=ConnectionStatus.CONNECTED.value,
            metadata_json=account_metadata,
        )
        db.add(account)

    await db.commit()
    await db.refresh(account)

    return ConnectedAccountRead.model_validate(account)
