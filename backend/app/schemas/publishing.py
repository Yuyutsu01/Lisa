from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


class PublishRequest(BaseModel):
    connected_account_id: Optional[str] = None
    recipient_email: Optional[str] = None


class PublishResponse(BaseModel):
    success: bool
    external_post_id: Optional[str] = None
    external_url: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Dict[str, Any] = {}


class PublishedRecordRead(BaseModel):
    id: str
    workspace_id: str
    content_variant_id: str
    publishing_job_id: Optional[str] = None
    platform: str
    external_post_id: str
    external_url: str
    published_at: datetime
    metadata_json: Dict[str, Any] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
