"""
Tests for Media Asset Uploads, Deduplication, and Library Management.
"""

from io import BytesIO
import pytest
from httpx import AsyncClient
from PIL import Image


def create_mock_png() -> bytes:
    """Generate a small valid in-memory PNG image."""
    buffer = BytesIO()
    img = Image.new("RGB", (100, 100), color="indigo")
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_media_upload_and_deduplication(client: AsyncClient):
    """
    Test uploading an image, verifying dimension extraction, and testing SHA-256 deduplication.
    """
    # Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "designer@agency.com", "name": "Lead Designer", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    png_bytes = create_mock_png()

    # 1. Upload new image
    files = {"file": ("banner.png", png_bytes, "image/png")}
    upload_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/media/upload",
        headers=headers,
        files=files,
    )
    assert upload_res.status_code == 201
    asset_data = upload_res.json()
    assert asset_data["filename"] == "banner.png"
    assert asset_data["mime_type"] == "image/png"
    assert asset_data["width"] == 100
    assert asset_data["height"] == 100
    assert asset_data["url"].startswith("/uploads/")
    asset_id = asset_data["id"]

    # 2. Upload same binary data again (should return existing asset due to SHA-256 deduplication)
    dup_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/media/upload",
        headers=headers,
        files={"file": ("duplicate_banner.png", png_bytes, "image/png")},
    )
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert dup_data["id"] == asset_id
    assert dup_data["checksum"] == asset_data["checksum"]

    # 3. List workspace media assets
    list_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/media",
        headers=headers,
    )
    assert list_res.status_code == 200
    assets = list_res.json()
    assert len(assets) == 1

    # 4. Delete asset
    del_res = await client.delete(
        f"/api/v1/workspaces/{ws_id}/media/{asset_id}",
        headers=headers,
    )
    assert del_res.status_code == 204
