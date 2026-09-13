"""
Tests for LinkedIn OAuth 2.0 Integration (Phase 8).
"""

import time
import pytest
from httpx import AsyncClient, Response
from unittest.mock import patch

from app.core.config import settings
from app.api.v1.linkedin_oauth import _create_state, _verify_state


@pytest.mark.asyncio
async def test_state_creation_and_cryptographic_verification():
    """Test HMAC SHA256 state signing and verification."""
    user_id = "user_123"
    workspace_id = "ws_456"

    state = _create_state(user_id, workspace_id)
    assert "." in state

    payload = _verify_state(state)
    assert payload["user_id"] == user_id
    assert payload["workspace_id"] == workspace_id
    assert "nonce" in payload
    assert "iat" in payload


@pytest.mark.asyncio
async def test_linkedin_oauth_start_flow(client: AsyncClient):
    """Test starting LinkedIn OAuth member authorization."""
    # 1. Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "oauth_user@lisa.ai", "name": "OAuth User", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start OAuth without configured client ID should return 500
    with patch.object(settings, "LINKEDIN_CLIENT_ID", ""):
        start_res = await client.get(
            f"/api/v1/oauth/linkedin/start?workspace_id={ws_id}",
            headers=headers,
        )
        assert start_res.status_code == 500

    # 3. Start OAuth with configured credentials
    with patch.object(settings, "LINKEDIN_CLIENT_ID", "test_linkedin_client_id"), \
         patch.object(settings, "LINKEDIN_REDIRECT_URI", "https://lisa.ai/api/v1/oauth/linkedin/callback"):
        start_res = await client.get(
            f"/api/v1/oauth/linkedin/start?workspace_id={ws_id}",
            headers=headers,
        )
        assert start_res.status_code == 200
        auth_url = start_res.json()["authorization_url"]
        assert "https://www.linkedin.com/oauth/v2/authorization" in auth_url
        assert "client_id=test_linkedin_client_id" in auth_url
        assert "response_type=code" in auth_url
        assert "scope=" in auth_url
        assert "state=" in auth_url


@pytest.mark.asyncio
async def test_linkedin_oauth_callback_flow(client: AsyncClient):
    """Test LinkedIn OAuth callback with token exchange and profile storage."""
    # 1. Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "member@company.com", "name": "LinkedIn Exec", "password": "Password123!"},
    )
    ws_id = res.json()["workspace_id"]
    user_id = res.json()["user"]["id"]

    valid_state = _create_state(user_id=user_id, workspace_id=ws_id)

    class MockExternalClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def post(self, url, *args, **kwargs):
            return Response(
                200,
                json={
                    "access_token": "li_at_mock_token_abcdef123456",
                    "expires_in": 5184000,
                    "refresh_token": "li_rt_mock_refresh_987654",
                },
            )

        async def get(self, url, *args, **kwargs):
            return Response(
                200,
                json={
                    "sub": "li_member_998877",
                    "name": "Shivam Sharma",
                    "given_name": "Shivam",
                    "family_name": "Sharma",
                    "email": "shivam@example.com",
                },
            )

    with patch.object(settings, "LINKEDIN_CLIENT_ID", "test_client_id"), \
         patch.object(settings, "LINKEDIN_CLIENT_SECRET", "test_client_secret"), \
         patch.object(settings, "LINKEDIN_REDIRECT_URI", "https://lisa.ai/api/v1/oauth/linkedin/callback"), \
         patch.object(settings, "FRONTEND_URL", ""), \
         patch("app.api.v1.linkedin_oauth.httpx.AsyncClient", return_value=MockExternalClient()):

        cb_res = await client.get(
            f"/api/v1/oauth/linkedin/callback?code=mock_linkedin_auth_code&state={valid_state}"
        )
        assert cb_res.status_code == 200
        data = cb_res.json()
        assert data["success"] is True
        assert data["platform"] == "linkedin"
        assert data["account_name"] == "Shivam Sharma"
        assert data["external_account_id"] == "li_member_998877"
