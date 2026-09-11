"""
Content Variant schemas for validation and API serialization.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.models.variant import VariantStatus
from app.schemas.agent import PlatformStrategy, QualityCheckResult


class ContentVariantBase(BaseModel):
    platform: str
    format: str = "text_post"
    title: Optional[str] = None
    body: str = ""
    caption: Optional[str] = None
    cta: Optional[str] = None
    hashtags_json: List[str] = Field(default_factory=list)


class ContentVariantUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    caption: Optional[str] = None
    cta: Optional[str] = None
    hashtags_json: Optional[List[str]] = None
    status: Optional[VariantStatus] = None


class ContentVariantRegenerateRequest(BaseModel):
    instruction: Optional[str] = None  # e.g. "make it more contrarian", "shorten hook"
    target_field: Optional[str] = "all"  # all, hook, body, caption, hashtags


class ContentVariantApproval(BaseModel):
    status: VariantStatus = VariantStatus.APPROVED
    rejection_reason: Optional[str] = None


class ContentVariantResponse(ContentVariantBase):
    id: str
    workspace_id: str
    content_source_id: str
    status: VariantStatus
    strategy_json: Dict[str, Any] = Field(default_factory=dict)
    quality_review_json: Dict[str, Any] = Field(default_factory=dict)
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateVariantsRequest(BaseModel):
    platforms: Optional[List[str]] = None  # If not specified, uses source's target_platforms_json
    custom_instruction: Optional[str] = None


class GenerationJobResponse(BaseModel):
    workflow_id: str
    content_source_id: str
    variants_count: int
    variants: List[ContentVariantResponse]
    latency_ms: int
