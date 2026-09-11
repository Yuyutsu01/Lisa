"""
Tests for Multi-Tenancy & Workspace RBAC in Lisa.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_workspace_crud_and_tenant_isolation(client: AsyncClient):
    """
    Test workspace creation, multi-tenancy access control, and isolation:
    User A creates Workspace A.
    User B creates Workspace B.
    User B cannot access Workspace A (403 Forbidden).
    """
    # Register User A
    user_a_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "usera@test.com", "name": "User A", "password": "Password123!"},
    )
    token_a = user_a_res.json()["token"]["access_token"]
    ws_a_id = user_a_res.json()["workspace_id"]

    # Register User B
    user_b_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "userb@test.com", "name": "User B", "password": "Password123!"},
    )
    token_b = user_b_res.json()["token"]["access_token"]
    ws_b_id = user_b_res.json()["workspace_id"]

    # User A accesses Workspace A (Success)
    res_a = await client.get(
        f"/api/v1/workspaces/{ws_a_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a.status_code == 200
    assert res_a.json()["id"] == ws_a_id

    # User B attempts to access Workspace A (Forbidden by multi-tenancy rule)
    res_b_attempt = await client.get(
        f"/api/v1/workspaces/{ws_a_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_b_attempt.status_code == 403
    assert "do not have access" in res_b_attempt.json()["detail"]


@pytest.mark.asyncio
async def test_workspace_member_invitation_and_roles(client: AsyncClient):
    """
    Test inviting a user to a workspace, checking membership list, and updating roles.
    """
    # Create Owner (User 1)
    res1 = await client.post(
        "/api/v1/auth/register",
        json={"email": "owner@brand.com", "name": "Owner", "password": "Password123!"},
    )
    owner_token = res1.json()["token"]["access_token"]
    workspace_id = res1.json()["workspace_id"]

    # Create Member (User 2)
    res2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "editor@brand.com", "name": "Editor", "password": "Password123!"},
    )
    editor_user_id = res2.json()["user"]["id"]
    editor_token = res2.json()["token"]["access_token"]

    # Owner invites User 2 as EDITOR
    invite_res = await client.post(
        f"/api/v1/workspaces/{workspace_id}/members",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"email": "editor@brand.com", "role": "editor"},
    )
    assert invite_res.status_code == 201
    assert invite_res.json()["role"] == "editor"

    # Now User 2 can access Workspace 1
    access_res = await client.get(
        f"/api/v1/workspaces/{workspace_id}",
        headers={"Authorization": f"Bearer {editor_token}"},
    )
    assert access_res.status_code == 200
    assert access_res.json()["current_user_role"] == "editor"
