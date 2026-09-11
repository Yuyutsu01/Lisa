"""
Tests for Media Derivatives and Image Transformations.
"""

from io import BytesIO
import pytest
from httpx import AsyncClient
from PIL import Image


def create_test_image_bytes(width: int = 800, height: int = 600) -> bytes:
    buffer = BytesIO()
    img = Image.new("RGB", (width, height), color="indigo")
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_generate_media_derivatives(client: AsyncClient):
    """
    Test generating Instagram portrait, YouTube thumbnail, and square cropped derivatives.
    """
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "visuals@media.com", "name": "Visual Lead", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload Base Asset
    img_bytes = create_test_image_bytes(1920, 1080)
    upload_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/media/upload",
        headers=headers,
        files={"file": ("keynote_banner.jpg", img_bytes, "image/jpeg")},
    )
    assert upload_res.status_code == 201
    asset_id = upload_res.json()["id"]

    # 2. Trigger Derivative Generation
    deriv_res = await client.post(
        f"/api/v1/media/{asset_id}/derivatives",
        headers=headers,
        json={"presets": ["instagram_portrait", "youtube_thumbnail", "instagram_square"]},
    )
    assert deriv_res.status_code == 201
    derivatives = deriv_res.json()
    assert len(derivatives) == 3

    insta_deriv = next(d for d in derivatives if d["platform"] == "instagram" and d["format"] == "feed_portrait")
    yt_deriv = next(d for d in derivatives if d["platform"] == "youtube")

    assert insta_deriv["width"] == 1080
    assert insta_deriv["height"] == 1350
    assert yt_deriv["width"] == 1280
    assert yt_deriv["height"] == 720
    assert insta_deriv["url"].startswith("/uploads/")

    # 3. List derivatives endpoint
    list_res = await client.get(
        f"/api/v1/media/{asset_id}/derivatives",
        headers=headers,
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) == 3
