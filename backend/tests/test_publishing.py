"""
Tests for Social Platform Adapters and Publishing Service.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_connected_accounts_and_immediate_publishing(client: AsyncClient):
    """
    Test account connection lifecycle, variant publishing through platform adapters,
    and retrieval of historical published records.
    """
    # 1. Register User & get Workspace
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "publisher@media.co", "name": "Lead Publisher", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Connect a LinkedIn Account
    conn_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/connections",
        headers=headers,
        json={
            "platform": "linkedin",
            "external_account_id": "urn:li:person:123456",
            "account_name": "Lisa Tech Co LinkedIn",
            "access_token": "mock_encrypted_oauth_token_li",
            "scopes": ["w_member_social", "r_liteprofile"],
        },
    )
    assert conn_res.status_code == 201
    conn_data = conn_res.json()
    account_id = conn_data["id"]
    assert conn_data["platform"] == "linkedin"
    assert conn_data["status"] == "connected"

    # List connections
    list_conns = await client.get(
        f"/api/v1/workspaces/{ws_id}/connections",
        headers=headers,
    )
    assert list_conns.status_code == 200
    assert len(list_conns.json()) == 1

    # 3. Create Source and Generate a LinkedIn Variant
    src_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json={
            "title": "Scaling AI SaaS in 2026",
            "body": "Detailed insights into multi-agent content pipelines and autonomous repurposing.",
            "target_platforms_json": ["linkedin"],
        },
    )
    source_id = src_res.json()["id"]

    gen_res = await client.post(
        f"/api/v1/sources/{source_id}/generate",
        headers=headers,
        json={"platforms": ["linkedin"]},
    )
    variant_id = gen_res.json()["variants"][0]["id"]

    # 4. Publish Variant Immediately
    pub_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/variants/{variant_id}/publish",
        headers=headers,
        json={"connected_account_id": account_id},
    )
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["success"] is True
    assert pub_data["external_post_id"] is not None
    assert "linkedin.com" in pub_data["external_url"]

    # 5. Verify Variant Status updated to 'published'
    var_check = await client.get(
        f"/api/v1/variants/{variant_id}",
        headers=headers,
    )
    assert var_check.status_code == 200
    assert var_check.json()["status"] == "published"

    # 6. Retrieve Workspace Published Records
    records_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/published",
        headers=headers,
    )
    assert records_res.status_code == 200
    records = records_res.json()
    assert len(records) == 1
    assert records[0]["platform"] == "linkedin"
    assert records[0]["external_post_id"] == pub_data["external_post_id"]

    # 7. Disconnect Account
    del_res = await client.delete(
        f"/api/v1/workspaces/{ws_id}/connections/{account_id}",
        headers=headers,
    )
    assert del_res.status_code == 204
