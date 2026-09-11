"""
Real-Time Event Hub and WebSocket Connection Manager for Lisa.

Handles real-time tenant multiplexing and broadcasting of lifecycle events
(source.created, generation.completed, publishing.published, opportunity.discovered).
"""

from typing import Dict, List, Any
import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Map workspace_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: str):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, websocket: WebSocket, workspace_id: str):
        if workspace_id in self.active_connections:
            if websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast_event(self, workspace_id: str, event_type: str, data: Dict[str, Any]):
        """
        Broadcast a structured domain event to all connected clients in a workspace.
        """
        if workspace_id not in self.active_connections:
            return

        payload = {
            "event": event_type,
            "workspace_id": workspace_id,
            "data": data,
        }
        dead_connections = []
        for connection in self.active_connections[workspace_id]:
            try:
                await connection.send_text(json.dumps(payload))
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead, workspace_id)


# Global singleton event hub
event_hub = ConnectionManager()
