"""
End-to-end Tests for Variant Generation, Editing, Regeneration, and Human Approval.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_end_to_end_variant_generation_and_approval_flow(client: AsyncClient):
    """
    Test complete lifecycle:
    1. Create Source.
    2. Generate Variants for LinkedIn, X, Instagram.
    3. Verify QA score and format per platform.
    4. Inline edit variant.
    5. Regenerate variant.
    6. Approve variant.
    """
    # Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "operator@media.com", "name": "Content Operator", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Source
    src_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json={
            "title": "5 Production Lessons from Building Microservices",
            "body": "Lesson 1: Always implement timeouts.\nLesson 2: Idempotency is non-negotiable.\nLesson 3: Monitor queue latency.",
            "target_platforms_json": ["linkedin", "x", "instagram", "threads"],
            "content_pillar": "System Design",
            "status": "draft",
        },
    )
    assert src_res.status_code == 201
    source_id = src_res.json()["id"]

    # 2. Trigger Multi-Agent Generation Pipeline
    gen_res = await client.post(
        f"/api/v1/sources/{source_id}/generate",
        headers=headers,
        json={"platforms": ["linkedin", "x", "instagram"]},
    )
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["variants_count"] == 3
    variants = gen_data["variants"]

    linkedin_v = next(v for v in variants if v["platform"] == "linkedin")
    x_v = next(v for v in variants if v["platform"] == "x")
    insta_v = next(v for v in variants if v["platform"] == "instagram")

    assert linkedin_v["format"] == "text_post"
    assert x_v["format"] == "thread"
    assert linkedin_v["status"] == "needs_review"
    assert linkedin_v["quality_review_json"]["quality_score"] >= 0.8

    # 3. Inline Edit LinkedIn variant
    patch_res = await client.patch(
        f"/api/v1/variants/{linkedin_v['id']}",
        headers=headers,
        json={"body": "Edited custom opening line for LinkedIn audience."},
    )
    assert patch_res.status_code == 200
    assert "Edited custom opening line" in patch_res.json()["body"]

    # 4. Regenerate X variant with instruction
    regen_res = await client.post(
        f"/api/v1/variants/{x_v['id']}/regenerate",
        headers=headers,
        json={"instruction": "Make the hook more contrarian and urgent"},
    )
    assert regen_res.status_code == 200

    # 5. Approve LinkedIn variant
    app_res = await client.post(
        f"/api/v1/variants/{linkedin_v['id']}/approve",
        headers=headers,
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"
    assert app_res.json()["approved_by"] is not None

    # 6. Reject Instagram variant
    rej_res = await client.post(
        f"/api/v1/variants/{insta_v['id']}/reject",
        headers=headers,
        json={"status": "rejected", "rejection_reason": "Need a carousel format instead of single post"},
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"
    assert rej_res.json()["rejection_reason"] == "Need a carousel format instead of single post"
