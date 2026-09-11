"""
Brand Intelligence schemas for Brand Profile and Knowledge Documents.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ContentPillar(BaseModel):
    name: str
    description: Optional[str] = ""
    target_percentage: Optional[int] = 25  # Recommended target share of content


class BrandProfileBase(BaseModel):
    name: str
    description: Optional[str] = ""
    industry: Optional[str] = ""
    target_audience: Optional[str] = ""
    brand_mission: Optional[str] = ""
    tone: Optional[str] = "Professional yet approachable"
    writing_style: Optional[str] = ""
    preferred_language: Optional[str] = "English"
    forbidden_phrases_json: List[str] = Field(default_factory=list)
    preferred_phrases_json: List[str] = Field(default_factory=list)
    cta_style: Optional[str] = "soft"
    emoji_policy: Optional[str] = "limited"
    hashtag_policy: Optional[str] = "optional"
    content_pillars_json: List[ContentPillar] = Field(default_factory=list)
    competitors_references_json: List[str] = Field(default_factory=list)
    visual_rules_json: Dict[str, Any] = Field(default_factory=dict)
    disclosure_rules_json: Dict[str, Any] = Field(default_factory=dict)


class BrandProfileCreate(BrandProfileBase):
    pass


class BrandProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    brand_mission: Optional[str] = None
    tone: Optional[str] = None
    writing_style: Optional[str] = None
    preferred_language: Optional[str] = None
    forbidden_phrases_json: Optional[List[str]] = None
    preferred_phrases_json: Optional[List[str]] = None
    cta_style: Optional[str] = None
    emoji_policy: Optional[str] = None
    hashtag_policy: Optional[str] = None
    content_pillars_json: Optional[List[ContentPillar]] = None
    competitors_references_json: Optional[List[str]] = None
    visual_rules_json: Optional[Dict[str, Any]] = None
    disclosure_rules_json: Optional[Dict[str, Any]] = None


class BrandProfileResponse(BrandProfileBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BrandKnowledgeDocCreate(BaseModel):
    title: str
    source_type: str = "text"  # text, markdown, pdf, url, previous_post
    content: str
    metadata_json: Optional[Dict[str, Any]] = None


class BrandKnowledgeDocResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    source_type: str
    content: str
    status: str
    metadata_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
