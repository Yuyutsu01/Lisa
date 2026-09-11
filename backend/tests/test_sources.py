"""
Tests for Content Source Creation, Versioning, and Draft Auto-saving.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_content_source_lifecycle_and_versioning(client: AsyncClient):
    """
    Test creating a canonical source, draft auto-save, explicit version snapshotting,
    listing versions, and restoring a previous version.
    """
    # Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "writer@studio.com", "name": "Lead Writer", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Initial Source (Version 1 snapshot created automatically)
    create_payload = {
        "title": "Mastering Event-Driven Architectures in 2026",
        "body": "Event-driven systems decouple producer and consumer services...",
        "content_type": "article",
        "target_platforms_json": ["linkedin", "x", "newsletter"],
        "content_pillar": "System Architecture",
        "status": "draft",
    }
    create_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json=create_payload,
    )
    assert create_res.status_code == 201
    source_data = create_res.json()
    source_id = source_data["id"]
    assert source_data["title"] == create_payload["title"]
    assert len(source_data["target_platforms_json"]) == 3
    assert source_data["version_count"] == 1

    # 2. Auto-save edit (without new version snapshot)
    patch_res = await client.patch(
        f"/api/v1/sources/{source_id}",
        headers=headers,
        json={"body": "Event-driven systems decouple services using durable queues like Kafka or Redis."},
    )
    assert patch_res.status_code == 200
    assert "durable queues" in patch_res.json()["body"]

    # 3. Major revision with explicit version snapshot (creates Version 2)
    snapshot_res = await client.patch(
        f"/api/v1/sources/{source_id}",
        headers=headers,
        json={
            "title": "Mastering Event-Driven Systems: 2026 Guide",
            "body": "Finalized comprehensive guide with benchmarks.",
            "create_version_snapshot": True,
            "status": "ready_for_adaptation",
        },
    )
    assert snapshot_res.status_code == 200
    assert snapshot_res.json()["status"] == "ready_for_adaptation"

    # 4. List historical versions
    v_res = await client.get(
        f"/api/v1/sources/{source_id}/versions",
        headers=headers,
    )
    assert v_res.status_code == 200
    versions = v_res.json()
    assert len(versions) == 2
    v1 = next(v for v in versions if v["version_number"] == 1)
    assert "producer and consumer" in v1["body"]

    # 5. Restore Version 1
    restore_res = await client.post(
        f"/api/v1/sources/{source_id}/versions/{v1['id']}/restore",
        headers=headers,
    )
    assert restore_res.status_code == 200
    restored_data = restore_res.json()
    assert "producer and consumer" in restored_data["body"]
    assert restored_data["title"] == v1["title"]
    # A new version entry is recorded for the restore
    assert restored_data["version_count"] == 3


@pytest.mark.asyncio
async def test_source_filtering_and_workspace_isolation(client: AsyncClient):
    """
    Test filtering sources by status/pillar and ensuring workspace isolation.
    """
    res1 = await client.post(
        "/api/v1/auth/register",
        json={"email": "author1@media.com", "name": "Author 1", "password": "Password123!"},
    )
    token1 = res1.json()["token"]["access_token"]
    ws1 = res1.json()["workspace_id"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    res2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "author2@media.com", "name": "Author 2", "password": "Password123!"},
    )
    token2 = res2.json()["token"]["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Create 2 sources in ws1
    await client.post(
        f"/api/v1/workspaces/{ws1}/sources",
        headers=headers1,
        json={"title": "Draft 1", "content_pillar": "AI", "status": "draft"},
    )
    src2_res = await client.post(
        f"/api/v1/workspaces/{ws1}/sources",
        headers=headers1,
        json={"title": "Ready Post", "content_pillar": "Engineering", "status": "ready_for_adaptation"},
    )
    src2_id = src2_res.json()["id"]

    # Filter by status
    list_drafts = await client.get(
        f"/api/v1/workspaces/{ws1}/sources?status=draft",
        headers=headers1,
    )
    assert len(list_drafts.json()) == 1
    assert list_drafts.json()[0]["title"] == "Draft 1"

    # User 2 attempts to access User 1's source (403 Forbidden)
    unauth_res = await client.get(
        f"/api/v1/sources/{src2_id}",
        headers=headers2,
    )
    assert unauth_res.status_code == 403
