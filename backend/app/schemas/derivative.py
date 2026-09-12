"""
Media Derivative schemas for API serialization.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class MediaDerivativeResponse(BaseModel):
    id: str
    source_asset_id: str
    workspace_id: str
    platform: str
    format: str
    storage_key: str
    mime_type: str
    width: int
    height: int
    duration_ms: Optional[int] = None
    processing_status: str
    url: str
    metadata_json: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateDerivativesRequest(BaseModel):
    presets: Optional[List[str]] = None
