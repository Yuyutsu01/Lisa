from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class AuditLogRead(BaseModel):
    id: str
    workspace_id: str
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    metadata_json: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentRunRead(BaseModel):
    id: str
    workspace_id: str
    workflow_id: str
    agent_name: str
    agent_version: str
    status: str
    model: str
    latency_ms: int
    token_usage_json: Dict[str, Any] = {}
    input_params_json: Dict[str, Any] = {}
    output_json: Dict[str, Any] = {}
    error_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
