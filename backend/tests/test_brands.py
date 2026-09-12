"""
Tests for Brand Intelligence System in Lisa.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_brand_profile_retrieval_and_update(client: AsyncClient):
    """
    Test retrieving and updating brand profile settings, tone, and pillars.
    """
    # Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "creator@tech.com", "name": "Tech Creator", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]

    # Retrieve Initial Brand Profile
    brand_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/brand",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert brand_res.status_code == 200
    brand_data = brand_res.json()
    assert brand_data["name"] == "Tech Creator"

    # Update Brand Profile with specific guidelines
    update_payload = {
        "tone": "Authoritative, educational, concise",
        "forbidden_phrases_json": ["synergy", "paradigm shift", "game changer"],
        "preferred_phrases_json": ["first principles", "deterministic execution"],
        "content_pillars_json": [
            {"name": "AI Architecture", "target_percentage": 50},
            {"name": "Developer Productivity", "target_percentage": 50},
        ],
        "cta_style": "direct",
    }
    update_res = await client.put(
        f"/api/v1/workspaces/{ws_id}/brand",
        headers={"Authorization": f"Bearer {token}"},
        json=update_payload,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["tone"] == "Authoritative, educational, concise"
    assert "synergy" in updated_data["forbidden_phrases_json"]
    assert len(updated_data["content_pillars_json"]) == 2


@pytest.mark.asyncio
async def test_brand_knowledge_docs_management(client: AsyncClient):
    """
    Test ingesting, listing, and deleting brand reference documents.
    """
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "author@agency.com", "name": "Author", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]

    # Upload Knowledge Doc
    doc_payload = {
        "title": "Company Brand Bible 2026",
        "source_type": "markdown",
        "content": "# Brand Rules\nAlways write in active voice. Never use marketing fluff.",
        "metadata_json": {"version": "1.0", "author": "Marketing Team"},
    }
    doc_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/brand/knowledge",
        headers={"Authorization": f"Bearer {token}"},
        json=doc_payload,
    )
    assert doc_res.status_code == 201
    doc_data = doc_res.json()
    assert doc_data["title"] == "Company Brand Bible 2026"
    doc_id = doc_data["id"]

    # List Knowledge Docs
    list_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/brand/knowledge",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Delete Knowledge Doc
    del_res = await client.delete(
        f"/api/v1/workspaces/{ws_id}/brand/knowledge/{doc_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 204
