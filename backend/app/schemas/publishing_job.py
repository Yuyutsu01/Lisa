"""
Publishing Job and Schedule schemas.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from app.models.publishing_job import JobStatus


class ScheduleVariantRequest(BaseModel):
    scheduled_at: datetime
    timezone: Optional[str] = "UTC"
    connected_account_id: Optional[str] = None


class RescheduleJobRequest(BaseModel):
    scheduled_at: datetime
    timezone: Optional[str] = None


class PublishingJobResponse(BaseModel):
    id: str
    workspace_id: str
    content_variant_id: str
    connected_account_id: Optional[str] = None
    scheduled_at: datetime
    timezone: str
    status: JobStatus
    idempotency_key: str
    attempt_count: int
    created_at: datetime
    updated_at: datetime

    # Variant snapshot summary
    variant_platform: Optional[str] = None
    variant_title: Optional[str] = None
    variant_body: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CalendarEventResponse(BaseModel):
    id: str
    job_id: str
    variant_id: str
    platform: str
    title: Optional[str] = None
    snippet: str
    scheduled_at: datetime
    status: JobStatus
