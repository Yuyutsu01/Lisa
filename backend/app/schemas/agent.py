"""
Typed schemas for AI Agent structured outputs.
Enforces strict schema validation for Intake, Strategy, Adaptation, Caption, and QA agents.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ContentBrief(BaseModel):
    core_idea: str
    summary: str
    content_type: str = "educational"
    key_insights: List[str] = Field(default_factory=list)
    supporting_facts: List[str] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)
    key_points: List[str] = Field(default_factory=list)
    target_audience: List[str] = Field(default_factory=list)
    content_pillars: List[str] = Field(default_factory=list)
    source_tone: str = "educational"
    tone: str = "educational"
    recommended_angle: str = "practical takeaway"
    primary_cta: str = ""
    call_to_action_options: List[str] = Field(default_factory=list)
    claims_requiring_review: List[str] = Field(default_factory=list)


class PlatformStrategy(BaseModel):
    platform: str
    format: str = "text_post"  # text_post, thread, carousel, short_video, article, newsletter
    angle: str = "practical lesson"
    hook_style: str = "direct"
    target_length_chars: int = 1000
    cta_recommendation: str = ""
    media_required: bool = False
    writing_rules: List[str] = Field(default_factory=list)


class CaptionPackage(BaseModel):
    primary_caption: str
    alternative_captions: List[str] = Field(default_factory=list)
    hook: str
    cta: str
    hashtags: List[str] = Field(default_factory=list)
    disclosures: List[str] = Field(default_factory=list)


class QualityIssue(BaseModel):
    severity: str = "info"  # info, warning, error
    message: str


class QualityCheckItem(BaseModel):
    name: str
    status: str = "pass"  # pass, warning, fail
    score: float = Field(default=1.0, ge=0.0, le=1.0)
    reason: str = ""


class QualityCheckResult(BaseModel):
    quality_score: float = Field(default=0.85, ge=0.0, le=1.0)
    checks: Dict[str, str] = Field(default_factory=dict)
    check_items: List[QualityCheckItem] = Field(default_factory=list)
    issues: List[QualityIssue] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    needs_regeneration: bool = False
    passed: bool = True


class StructuredPlatformVariant(BaseModel):
    platform: str
    format: str = "text_post"
    title: Optional[str] = None
    hook: str = ""
    body: str
    caption: Optional[str] = None
    cta: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    character_count: int = 0
    source_claims_used: List[str] = Field(default_factory=list)
    quality_status: str = "pending"
