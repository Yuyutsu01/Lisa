"""
LinkedIn OAuth 2.0 integration for Lisa.

Handles:
- Starting LinkedIn member authorization (3-legged OAuth)
- OAuth state generation and HMAC cryptographic verification
- OAuth callback handling and error management
- Access token exchange via https://www.linkedin.com/oauth/v2/accessToken
- LinkedIn member profile retrieval via OpenID Connect userinfo endpoint
- Creating or updating ConnectedAccount records in the database
"""

import base64
import hashlib
import hmac
import json
import secrets
import time
from urllib.parse import urlencode
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.connection import ConnectedAccount, ConnectionStatus
from app.models.user import User
from app.models.workspace import WorkspaceMember

router = APIRouter(
    prefix="/oauth/linkedin",
    tags=["LinkedIn OAuth"],
)

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
LINKEDIN_SCOPES = "openid profile email w_member_social"
STATE_MAX_AGE_SECONDS = 600


def _create_state(user_id: str, workspace_id: str) -> str:
    """
    Create a signed OAuth state containing the Lisa user/workspace.
    This lets the callback identify which Lisa account initiated the LinkedIn
    connection without changing the existing auth system.
    """
    payload = {
        "user_id": user_id,
        "workspace_id": workspace_id,
        "nonce": secrets.token_urlsafe(24),
        "iat": int(time.time()),
    }
    payload_bytes = json.dumps(
        payload,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded}.{signature}"


def _verify_state(state: str) -> dict:
    """
    Verify and decode OAuth state signature and timestamp expiration.
    """
    try:
        encoded, signature = state.rsplit(".", 1)
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            encoded.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("Invalid OAuth state signature")

        padding = "=" * (-len(encoded) % 4)
        payload_bytes = base64.urlsafe_b64decode(encoded + padding)
        payload = json.loads(payload_bytes.decode("utf-8"))

        issued_at = int(payload["iat"])
        if int(time.time()) - issued_at > STATE_MAX_AGE_SECONDS:
            raise ValueError("OAuth state expired")

        if not payload.get("user_id"):
            raise ValueError("OAuth state missing user_id")
        if not payload.get("workspace_id"):
            raise ValueError("OAuth state missing workspace_id")

        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid LinkedIn OAuth state: {exc}",
        )


def _build_frontend_redirect_url(query_string: str) -> str:
    """
    Constructs the frontend callback redirect URL, ensuring that it routes
    directly to /integrations regardless of trailing slashes or subpaths in FRONTEND_URL.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "").strip()
    if not frontend_url:
        return ""
    base = frontend_url.rstrip("/")
    if not base.endswith("/integrations"):
        base = f"{base}/integrations"
    return f"{base}?{query_string}"


@router.get("/start")
async def linkedin_oauth_start(
    workspace_id: str = Query(..., description="Target workspace ID to connect"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start LinkedIn member OAuth authorization.
    The authenticated Lisa user must belong to the requested workspace.
    """
    membership_query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id,
    )
    membership = (await db.execute(membership_query)).scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace.",
        )

    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LinkedIn Client ID is not configured.",
        )
    if not settings.LINKEDIN_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LinkedIn redirect URI is not configured.",
        )

    state = _create_state(
        user_id=current_user.id,
        workspace_id=workspace_id,
    )
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": LINKEDIN_SCOPES,
    }
    authorization_url = f"{LINKEDIN_AUTH_URL}?{urlencode(params)}"
    return {
        "authorization_url": authorization_url,
    }


@router.get("/callback")
async def linkedin_oauth_callback(
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    error_description: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    LinkedIn OAuth callback.
    Exchanges authorization code for an access token, retrieves member profile,
    and stores or updates the ConnectedAccount record.
    """
    if error:
        detail = error_description or error
        redirect_url = _build_frontend_redirect_url(f"linkedin=error&message={detail}")
        if redirect_url:
            return RedirectResponse(url=redirect_url)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LinkedIn authorization failed: {detail}",
        )

    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing LinkedIn OAuth code or state.",
        )

    oauth_state = _verify_state(state)
    user_id = oauth_state["user_id"]
    workspace_id = oauth_state["workspace_id"]

    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LinkedIn Client ID is not configured.",
        )
    if not settings.LINKEDIN_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LinkedIn Client Secret is not configured.",
        )
    if not settings.LINKEDIN_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LinkedIn redirect URI is not configured.",
        )

    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        token_response = await client.post(
            LINKEDIN_TOKEN_URL,
            data=token_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "message": "LinkedIn token exchange failed.",
                    "linkedin_status": token_response.status_code,
                    "linkedin_response": token_response.text,
                },
            )

        token_json = token_response.json()
        access_token = token_json.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="LinkedIn did not return an access token.",
            )

        expires_in = token_json.get("expires_in")
        refresh_token = token_json.get("refresh_token")

        userinfo_response = await client.get(
            LINKEDIN_USERINFO_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
            },
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "message": "Could not retrieve LinkedIn member profile.",
                    "linkedin_status": userinfo_response.status_code,
                    "linkedin_response": userinfo_response.text,
                },
            )

        linkedin_profile = userinfo_response.json()
        linkedin_member_id = linkedin_profile.get("sub")
        if not linkedin_member_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="LinkedIn profile did not contain a member ID.",
            )

        account_name = linkedin_profile.get("name")
        if not account_name:
            given_name = linkedin_profile.get("given_name", "")
            family_name = linkedin_profile.get("family_name", "")
            account_name = f"{given_name} {family_name}".strip()
            if not account_name:
                account_name = "LinkedIn Member"

        # Store token expiry if LinkedIn supplied expires_in
        expires_at = None
        if expires_in:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

        scopes = LINKEDIN_SCOPES.split()

        # Check whether this LinkedIn account is already connected to the workspace
        query = select(ConnectedAccount).where(
            ConnectedAccount.workspace_id == workspace_id,
            ConnectedAccount.platform == "linkedin",
            ConnectedAccount.external_account_id == linkedin_member_id,
        )
        existing = (await db.execute(query)).scalar_one_or_none()

        if existing:
            existing.account_name = account_name
            existing.access_token_encrypted = access_token
            existing.refresh_token_encrypted = refresh_token
            existing.expires_at = expires_at
            existing.scopes_json = scopes
            existing.metadata_json = {
                "provider": "linkedin",
                "profile": linkedin_profile,
            }
            existing.status = ConnectionStatus.CONNECTED.value
            connected_account = existing
        else:
            connected_account = ConnectedAccount(
                workspace_id=workspace_id,
                platform="linkedin",
                external_account_id=linkedin_member_id,
                account_name=account_name,
                access_token_encrypted=access_token,
                refresh_token_encrypted=refresh_token,
                expires_at=expires_at,
                scopes_json=scopes,
                metadata_json={
                    "provider": "linkedin",
                    "profile": linkedin_profile,
                },
                status=ConnectionStatus.CONNECTED.value,
            )
            db.add(connected_account)

        await db.commit()
        await db.refresh(connected_account)

        redirect_url = _build_frontend_redirect_url("linkedin=connected")
        if redirect_url:
            return RedirectResponse(url=redirect_url)

        return {
            "success": True,
            "platform": "linkedin",
            "account_name": account_name,
            "external_account_id": linkedin_member_id,
        }
