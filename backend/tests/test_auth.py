"""
Tests for Authentication & User Registration in Lisa.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verify health endpoint returns healthy."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Lisa Backend API"


@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    """Test user registration auto-provisions workspace, brand profile, and issues token."""
    reg_payload = {
        "email": "sarah@example.com",
        "name": "Sarah Connor",
        "password": "SecurePassword123!",
    }
    reg_response = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["user"]["email"] == "sarah@example.com"
    assert data["user"]["name"] == "Sarah Connor"
    assert "token" in data
    assert data["token"]["access_token"] is not None
    assert "workspace_id" in data

    token = data["token"]["access_token"]

    # Test Login
    login_payload = {
        "email": "sarah@example.com",
        "password": "SecurePassword123!",
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data

    # Test /me endpoint
    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "sarah@example.com"


@pytest.mark.asyncio
async def test_duplicate_registration_fails(client: AsyncClient):
    """Verify duplicate email registration is rejected."""
    payload = {
        "email": "john@example.com",
        "name": "John Doe",
        "password": "Password123!",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]
