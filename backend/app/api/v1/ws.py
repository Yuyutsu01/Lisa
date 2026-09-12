"""
WebSocket Real-Time Gateway Endpoint for Lisa.

Provides duplex real-time streaming of domain events, workflow updates,
and background job notifications per workspace.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.events import event_hub

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/workspaces/{workspace_id}")
async def workspace_events_websocket(websocket: WebSocket, workspace_id: str):
    """
    WebSocket endpoint for real-time workspace event broadcasting.
    """
    await event_hub.connect(websocket, workspace_id)
    try:
        # Send initial connected heartbeat
        await websocket.send_json({
            "event": "system.connected",
            "workspace_id": workspace_id,
            "message": "Connected to Lisa Real-Time Event Hub",
        })
        while True:
            # Keep connection open and accept optional client ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        event_hub.disconnect(websocket, workspace_id)
    except Exception:
        event_hub.disconnect(websocket, workspace_id)
