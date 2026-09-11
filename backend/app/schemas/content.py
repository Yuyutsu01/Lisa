"""
Content Source and Versioning schemas for validation and serialization.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.content import SourceStatus, ContentType
from app.schemas.media import MediaAssetSummary


class ContentSourceBase(BaseModel):
    title: str
    body: Optional[str] = ""
    content_type: Optional[ContentType] = ContentType.ARTICLE
    language: Optional[str] = "English"
    target_platforms_json: Optional[List[str]] = Field(default_factory=list)
    content_pillar: Optional[str] = ""
    campaign: Optional[str] = ""
    source_metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ContentSourceCreate(ContentSourceBase):
    status: Optional[SourceStatus] = SourceStatus.DRAFT
    asset_ids: Optional[List[str]] = Field(default_factory=list)


class ContentSourceUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    content_type: Optional[ContentType] = None
    language: Optional[str] = None
    status: Optional[SourceStatus] = None
    target_platforms_json: Optional[List[str]] = None
    content_pillar: Optional[str] = None
    campaign: Optional[str] = None
    source_metadata_json: Optional[Dict[str, Any]] = None
    create_version_snapshot: Optional[bool] = False  # Explicit flag to freeze a version snapshot


class ContentSourceVersionResponse(BaseModel):
    id: str
    content_source_id: str
    version_number: int
    title: str
    body: str
    metadata_json: Dict[str, Any]
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentSourceResponse(ContentSourceBase):
    id: str
    workspace_id: str
    status: SourceStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    version_count: Optional[int] = 1
    attached_assets: Optional[List[MediaAssetSummary]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
