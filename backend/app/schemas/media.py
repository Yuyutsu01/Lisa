"""
Media Asset schemas for validation and serialization.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class MediaAssetResponse(BaseModel):
    id: str
    workspace_id: str
    filename: str
    storage_key: str
    mime_type: str
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration_ms: Optional[int] = None
    checksum: str
    url: str
    metadata_json: Dict[str, Any]
    uploaded_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MediaAssetSummary(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    url: str

    model_config = ConfigDict(from_attributes=True)
