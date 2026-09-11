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
    target_audience: List[str] = Field(default_factory=list)
    content_pillars: List[str] = Field(default_factory=list)
    key_points: List[str] = Field(default_factory=list)
    tone: str = "educational"
    primary_cta: str = ""
    claims_requiring_review: List[str] = Field(default_factory=list)


class PlatformStrategy(BaseModel):
    platform: str
    format: str = "text_post"  # text_post, thread, carousel, short_video, article
    angle: str = "practical lesson"
    hook_style: str = "direct"
    target_length_chars: int = 1000
    cta_recommendation: str = ""
    media_required: bool = False


class CaptionPackage(BaseModel):
    primary_caption: str
    alternative_captions: List[str] = Field(default_factory=list)
    hook: str
    cta: str
    hashtags: List[str] = Field(default_factory=list)
    disclosures: List[str] = Field(default_factory=list)


class QualityIssue(BaseModel):
    severity: str  # info, warning, error
    message: str


class QualityCheckResult(BaseModel):
    quality_score: float = Field(default=0.95, ge=0.0, le=1.0)
    checks: Dict[str, str] = Field(default_factory=dict)
    issues: List[QualityIssue] = Field(default_factory=list)
    passed: bool = True
