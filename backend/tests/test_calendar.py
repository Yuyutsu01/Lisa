"""
Tests for Content Calendar and Scheduling Engine.
"""

from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_calendar_scheduling_and_rescheduling(client: AsyncClient):
    """
    Test scheduling a variant, verifying idempotency, checking calendar events,
    rescheduling, and cancelling.
    """
    # Register User
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "scheduler@agency.com", "name": "Campaign Scheduler", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Source & Generate Variant
    src_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json={"title": "Weekly Strategy", "body": "Summary points for calendar scheduling.", "target_platforms_json": ["linkedin"]},
    )
    source_id = src_res.json()["id"]

    gen_res = await client.post(
        f"/api/v1/sources/{source_id}/generate",
        headers=headers,
        json={"platforms": ["linkedin"]},
    )
    variant_id = gen_res.json()["variants"][0]["id"]

    # 2. Schedule Variant for tomorrow
    target_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    sched_res = await client.post(
        f"/api/v1/variants/{variant_id}/schedule",
        headers=headers,
        json={"scheduled_at": target_time, "timezone": "UTC"},
    )
    assert sched_res.status_code == 201
    job_data = sched_res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "scheduled"
    assert job_data["idempotency_key"] is not None

    # 3. Verify Calendar Events aggregation
    cal_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/calendar",
        headers=headers,
    )
    assert cal_res.status_code == 200
    events = cal_res.json()
    assert len(events) >= 1
    assert events[0]["job_id"] == job_id
    assert events[0]["platform"] == "linkedin"

    # 4. Reschedule Job (simulate drag & drop on calendar)
    new_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    resched_res = await client.patch(
        f"/api/v1/publishing-jobs/{job_id}",
        headers=headers,
        json={"scheduled_at": new_time},
    )
    assert resched_res.status_code == 200
    assert resched_res.json()["status"] == "scheduled"

    # 5. Cancel Job
    cancel_res = await client.post(
        f"/api/v1/publishing-jobs/{job_id}/cancel",
        headers=headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"
