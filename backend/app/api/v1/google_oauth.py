"""
Google OAuth 2.0 / OpenID Connect authentication for Lisa.

Handles:
- Generating signed HMAC state tokens for CSRF mitigation
- Starting authorization flow via Google Accounts consent screen
- Exchanging auth code for tokens via Google OAuth token endpoint
- Retrieving verified userinfo (sub, email, name, picture)
- Account creation & automatic workspace provisioning for new users
- Account linking for verified email matches
- Issuing Lisa JWT tokens and redirecting to the frontend auth callback
"""

import base64
import hashlib
import hmac
import json
import re
import secrets
import time
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.brand import BrandProfile
from app.models.user import User, UserStatus
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole

router = APIRouter(
    prefix="/oauth/google",
    tags=["Google OAuth"],
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_SCOPES = "openid email profile"
STATE_MAX_AGE_SECONDS = 600


def _generate_slug(text_val: str) -> str:
    """Generate a clean URL-friendly slug from text."""
    slug = re.sub(r"[^\w\s-]", "", text_val.lower()).strip()
    return re.sub(r"[-\s]+", "-", slug) or "workspace"


def _create_state(action: str = "login", return_to: str = "/dashboard") -> str:
    """
    Create a signed OAuth state token containing action and return path.
    Does not require an existing user session.

    Note: `action` ('login' | 'register') and `return_to` (post-auth target path)
    are captured in the signed payload to preserve user context across redirects
    and are reserved for frontend routing in Stage 3.
    """
    payload = {
        "action": action,
        "return_to": return_to,
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
    Verify and decode OAuth state signature and expiration.
    Note: payload["action"] and payload["return_to"] are preserved
    for future Stage 3 destination routing.
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

        return payload
    except Exception as exc:
        raise ValueError(f"State validation error: {exc}")


def _build_frontend_redirect(params: dict) -> str:
    """
    Builds the frontend callback redirect URL (/auth/callback).
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "").strip()
    if frontend_url:
        # Strip subpath like /integrations if present to get site base
        base = re.sub(r"/integrations/?$", "", frontend_url).rstrip("/")
    else:
        base = "http://localhost:3000"

    return f"{base}/auth/callback?{urlencode(params)}"


@router.get("/start")
async def google_oauth_start(
    action: str = Query(default="login", description="login or register (reserved for Stage 3 UX)"),
    return_to: str = Query(default="/dashboard", description="Post-login destination (reserved for Stage 3 UX)"),
):
    """
    Start Google OAuth 2.0 authorization flow.
    Returns the Google consent URL for the frontend to redirect to.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID is not configured.",
        )
    if not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google redirect URI is not configured.",
        )

    state = _create_state(action=action, return_to=return_to)
    params = {
        "response_type": "code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": GOOGLE_SCOPES,
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    authorization_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {"authorization_url": authorization_url}


@router.get("/callback")
async def google_oauth_callback(
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    error_description: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Google OAuth callback endpoint.
    Exchanges auth code, retrieves OpenID profile, links or registers user,
    and redirects to the frontend with Lisa JWT session.
    """
    # 1. Handle error response from Google
    if error:
        detail = error_description or error
        return RedirectResponse(
            url=_build_frontend_redirect({"google": "error", "message": detail})
        )

    if not code or not state:
        return RedirectResponse(
            url=_build_frontend_redirect(
                {"google": "error", "message": "Missing authorization code or state"}
            )
        )

    # 2. Verify state token
    try:
        _verify_state(state)
    except ValueError as exc:
        return RedirectResponse(
            url=_build_frontend_redirect({"google": "error", "message": str(exc)})
        )

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return RedirectResponse(
            url=_build_frontend_redirect(
                {"google": "error", "message": "Google credentials not configured on server"}
            )
        )

    # 3. Exchange code for access token via httpx
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            token_res = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        except Exception:
            return RedirectResponse(
                url=_build_frontend_redirect(
                    {"google": "error", "message": "Network error contacting Google token service"}
                )
            )

        if token_res.status_code != 200:
            return RedirectResponse(
                url=_build_frontend_redirect(
                    {"google": "error", "message": "Google token exchange failed"}
                )
            )

        token_json = token_res.json()
        access_token = token_json.get("access_token")
        if not access_token:
            return RedirectResponse(
                url=_build_frontend_redirect(
                    {"google": "error", "message": "No access token in Google response"}
                )
            )

        # 4. Fetch userinfo from OpenID Connect endpoint
        try:
            userinfo_res = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        except Exception:
            return RedirectResponse(
                url=_build_frontend_redirect(
                    {"google": "error", "message": "Network error fetching Google profile"}
                )
            )

        if userinfo_res.status_code != 200:
            return RedirectResponse(
                url=_build_frontend_redirect(
                    {"google": "error", "message": "Could not retrieve Google profile"}
                )
            )

        userinfo = userinfo_res.json()

    google_sub = userinfo.get("sub")
    email = (userinfo.get("email") or "").lower().strip()
    email_verified = userinfo.get("email_verified", False)
    name = userinfo.get("name") or userinfo.get("given_name") or email.split("@")[0] or "Creator"

    if not google_sub or not email:
        return RedirectResponse(
            url=_build_frontend_redirect(
                {"google": "error", "message": "Incomplete profile received from Google"}
            )
        )

    # 5. Require verified email from Google
    if not email_verified:
        return RedirectResponse(
            url=_build_frontend_redirect(
                {"google": "error", "message": "Google email address is not verified"}
            )
        )

    # 6. Database lookup logic via ORM
    # Case (a): Look up user by google_id
    query = select(User).where(User.google_id == google_sub)
    result = await db.execute(query)
    target_user = result.scalar_one_or_none()

    # Case (b): Not found by google_id -> check by verified email and link
    if not target_user:
        email_query = select(User).where(User.email == email)
        result = await db.execute(email_query)
        existing_email_user = result.scalar_one_or_none()

        if existing_email_user:
            target_user = existing_email_user
            target_user.google_id = google_sub
            if target_user.auth_provider == "local":
                target_user.auth_provider = "google"
            db.add(target_user)
            await db.commit()
            await db.refresh(target_user)

    # Case (c): Neither exists -> create new user + workspace + brand profile
    default_workspace_id = None

    if not target_user:
        target_user = User(
            email=email,
            name=name,
            password_hash=None,
            google_id=google_sub,
            auth_provider="google",
            status=UserStatus.ACTIVE.value,
        )
        db.add(target_user)
        await db.flush()

        # Provision default personal workspace
        base_slug = _generate_slug(f"{target_user.name}-workspace")
        slug = f"{base_slug}-{target_user.id[:6]}"
        workspace = Workspace(
            name=f"{target_user.name}'s Workspace",
            slug=slug,
            owner_id=target_user.id,
            settings_json={"timezone": "UTC", "default_language": "English"},
        )
        db.add(workspace)
        await db.flush()
        default_workspace_id = workspace.id

        # Add user as workspace OWNER
        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=target_user.id,
            role=WorkspaceRole.OWNER.value,
        )
        db.add(membership)

        # Initialize Brand Profile for the workspace
        brand_profile = BrandProfile(
            workspace_id=workspace.id,
            name=target_user.name,
            description=f"Brand profile for {target_user.name}",
            tone="Professional, informative, and engaging",
            preferred_language="English",
            content_pillars_json=[
                {"name": "Industry Insights", "target_percentage": 40},
                {"name": "How-To Guides", "target_percentage": 30},
                {"name": "Product Updates", "target_percentage": 30},
            ],
        )
        db.add(brand_profile)
        await db.commit()
        await db.refresh(target_user)
    else:
        # Retrieve target user's primary workspace ID
        ws_query = (
            select(WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == target_user.id)
            .limit(1)
        )
        ws_res = await db.execute(ws_query)
        default_workspace_id = ws_res.scalar_one_or_none() or ""

    # 7. Issue Lisa JWT
    jwt_token = create_access_token(subject=target_user.id)

    # 8. Redirect to frontend auth callback
    redirect_url = _build_frontend_redirect(
        {
            "token": jwt_token,
            "workspace_id": default_workspace_id or "",
            "provider": "google",
        }
    )
    return RedirectResponse(url=redirect_url)
