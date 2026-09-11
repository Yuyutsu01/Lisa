"""
Tests for Performance Analytics Engine and AI Content Opportunity Feedback Loop.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analytics_metrics_and_closed_loop_opportunity_generation(client: AsyncClient):
    """
    Test analytics ingestion, overview aggregation, AI recommendation generation,
    and 1-click converting opportunity to canonical source.
    """
    # 1. Register User & get Workspace
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "analytics_lead@growth.co", "name": "Growth Lead", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check initial analytics overview
    ov_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/analytics/overview",
        headers=headers,
    )
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert ov_data["total_impressions"] == 0
    assert ov_data["total_posts_published"] == 0

    # 3. Create Source & Generate Variant & Publish
    src_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json={
            "title": "Autonomous AI Agent Architectures",
            "body": "A complete breakdown of multi-agent patterns in production SaaS.",
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

    pub_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/variants/{variant_id}/publish",
        headers=headers,
        json={},
    )
    assert pub_res.status_code == 200

    # Fetch published record id
    records_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/published",
        headers=headers,
    )
    published_id = records_res.json()[0]["id"]

    # 4. Ingest Performance Metrics for this post
    metric_payload = {
        "published_record_id": published_id,
        "platform": "linkedin",
        "impressions": 12500,
        "reach": 10200,
        "views": 8400,
        "likes": 620,
        "comments": 78,
        "shares": 95,
        "saves": 140,
        "clicks": 310,
        "raw_metrics_json": {"viral_coefficient": 1.4},
    }
    metric_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/analytics/metrics",
        headers=headers,
        json=metric_payload,
    )
    assert metric_res.status_code == 201
    metric_data = metric_res.json()
    assert metric_data["impressions"] == 12500
    assert metric_data["engagement_rate"] > 0.05

    # 5. Check Overview now reflects ingested metrics
    ov_res2 = await client.get(
        f"/api/v1/workspaces/{ws_id}/analytics/overview",
        headers=headers,
    )
    assert ov_res2.status_code == 200
    ov_data2 = ov_res2.json()
    assert ov_data2["total_impressions"] == 12500
    assert ov_data2["total_engagements"] == (620 + 78 + 95 + 140 + 310)
    assert len(ov_data2["platform_breakdown"]) == 1
    assert len(ov_data2["top_performing_posts"]) == 1

    # 6. Trigger AI Opportunity Loop Analysis
    analyze_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/analytics/analyze",
        headers=headers,
    )
    assert analyze_res.status_code == 200
    opps = analyze_res.json()
    assert len(opps) >= 1
    opp_id = opps[0]["id"]
    assert "Repurpose" in opps[0]["title"] or "Expand" in opps[0]["title"]
    assert opps[0]["status"] == "open"

    # 7. Convert Opportunity directly into a new ContentSource Draft (1-Click Action)
    convert_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/analytics/opportunities/{opp_id}/create-source",
        headers=headers,
    )
    assert convert_res.status_code == 201
    new_source = convert_res.json()
    assert new_source["title"] == opps[0]["title"]
    assert new_source["status"] == "draft"

    # Verify opportunity is now marked as actioned
    open_opps_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/analytics/opportunities",
        headers=headers,
    )
    assert open_opps_res.status_code == 200
    assert not any(o["id"] == opp_id for o in open_opps_res.json())
