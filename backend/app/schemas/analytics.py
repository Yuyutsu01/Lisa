from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class PerformanceMetricCreate(BaseModel):
    published_record_id: str
    platform: str
    metrics_source: str = "platform_api"  # platform_api | simulated | unavailable
    impressions: int = 0
    reach: int = 0
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    raw_metrics_json: Dict[str, Any] = {}


class PerformanceMetricRead(BaseModel):
    id: str
    workspace_id: str
    published_record_id: str
    platform: str
    metrics_source: str
    impressions: int
    reach: int
    views: int
    likes: int
    comments: int
    shares: int
    saves: int
    clicks: int
    engagement_rate: float
    collected_at: datetime
    raw_metrics_json: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentOpportunityRead(BaseModel):
    id: str
    workspace_id: str
    title: str
    content_pillar: str
    suggested_platforms_json: List[str]
    reason: str
    confidence: str
    source_evidence_json: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformMetricSummary(BaseModel):
    platform: str
    total_posts: int
    impressions: int
    engagements: int
    avg_engagement_rate: float


class TopPostSummary(BaseModel):
    published_record_id: str
    platform: str
    title: Optional[str] = None
    external_url: str
    impressions: int
    engagements: int
    engagement_rate: float
    published_at: datetime


class AnalyticsOverviewResponse(BaseModel):
    total_impressions: int
    total_reach: int
    total_engagements: int
    avg_engagement_rate: float
    total_posts_published: int
    platform_breakdown: List[PlatformMetricSummary]
    top_performing_posts: List[TopPostSummary]
    open_opportunities_count: int
