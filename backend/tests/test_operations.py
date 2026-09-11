"""
Tests for Phase 11 System Operations, Audit Logs, Telemetry, and WebSocket Event Hub.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from app.core.events import event_hub


@pytest.mark.asyncio
async def test_system_health_and_telemetry_inspection(client: AsyncClient, db_session: AsyncSession):
    """
    Test checking system health, agent telemetry traces, and audit logs.
    """
    # 1. Register User & get Workspace
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "ops_director@platform.co", "name": "Operations Director", "password": "Password123!"},
    )
    token = res.json()["token"]["access_token"]
    ws_id = res.json()["workspace_id"]
    user_id = res.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check System Health
    health_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/system-health",
        headers=headers,
    )
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert "linkedin" in health_data["supported_platform_adapters"]
    assert health_data["agents"]["intake_agent"] == "ready"

    # 3. Create Source & Generate to produce AgentRuns
    src_res = await client.post(
        f"/api/v1/workspaces/{ws_id}/sources",
        headers=headers,
        json={
            "title": "Production Hardening Telemetry",
            "body": "Validating agent trace logs, token consumption, and audit trail consistency.",
            "target_platforms_json": ["linkedin", "x"],
        },
    )
    source_id = src_res.json()["id"]

    await client.post(
        f"/api/v1/sources/{source_id}/generate",
        headers=headers,
        json={"platforms": ["linkedin", "x"]},
    )

    # 4. Check Agent Run Telemetry
    telemetry_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/agent-runs",
        headers=headers,
    )
    assert telemetry_res.status_code == 200
    runs = telemetry_res.json()
    assert len(runs) >= 4  # Intake, Strategy, Adaptation, Caption, QA runs
    agent_names = [r["agent_name"] for r in runs]
    assert "ContentIntakeAgent" in agent_names or "StrategyAgent" in agent_names or "QualityAssuranceAgent" in agent_names

    # 5. Insert an Audit Log record and retrieve
    audit = AuditLog(
        workspace_id=ws_id,
        actor_id=user_id,
        action="workspace.settings.updated",
        resource_type="workspace",
        resource_id=ws_id,
        metadata_json={"changed_field": "brand_voice_strictness", "new_value": "high"},
    )
    db_session.add(audit)
    await db_session.commit()

    audit_res = await client.get(
        f"/api/v1/workspaces/{ws_id}/audit-logs",
        headers=headers,
    )
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    assert logs[0]["action"] == "workspace.settings.updated"
    assert logs[0]["resource_type"] == "workspace"


@pytest.mark.asyncio
async def test_event_hub_broadcasting():
    """
    Test event hub connection manager registration and broadcasting without crashing.
    """
    ws_id = "test_workspace_ws_123"
    # Verify broadcast does not error when no clients are connected
    await event_hub.broadcast_event(
        workspace_id=ws_id,
        event_type="generation.completed",
        data={"source_id": "src_123", "variants_count": 3},
    )
    assert ws_id not in event_hub.active_connections
