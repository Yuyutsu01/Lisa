"""
Content Calendar and Scheduling API Endpoints for Lisa.

Handles scheduling approved variants, calendar aggregation, rescheduling, and cancellation.
"""

import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.variant import ContentVariant, VariantStatus
from app.models.publishing_job import PublishingJob, JobStatus
from app.schemas.publishing_job import (
    ScheduleVariantRequest,
    RescheduleJobRequest,
    PublishingJobResponse,
    CalendarEventResponse,
)
from app.api.deps import get_current_user, get_workspace_member, require_roles

router = APIRouter(tags=["Calendar & Scheduling"])


@router.post(
    "/variants/{variant_id}/schedule",
    response_model=PublishingJobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def schedule_variant(
    variant_id: str,
    schedule_req: ScheduleVariantRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Schedule an approved or reviewed variant for future publishing.
    Generates a deterministic idempotency key.
    """
    variant_res = await db.execute(
        select(ContentVariant).where(ContentVariant.id == variant_id)
    )
    variant = variant_res.scalar_one_or_none()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    # Membership & role check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == variant.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    member = mem_res.scalar_one_or_none()
    if not member or member.role not in [
        WorkspaceRole.OWNER.value,
        WorkspaceRole.ADMIN.value,
        WorkspaceRole.EDITOR.value,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    # Generate Idempotency Key: hash(variant_id + iso_time + account_id)
    raw_key = f"{variant.id}_{schedule_req.scheduled_at.isoformat()}_{schedule_req.connected_account_id or 'default'}"
    idempotency_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    # Check if existing job with exact idempotency key
    existing_job = await db.execute(
        select(PublishingJob).where(PublishingJob.idempotency_key == idempotency_key)
    )
    job = existing_job.scalar_one_or_none()

    if not job:
        job = PublishingJob(
            workspace_id=variant.workspace_id,
            content_variant_id=variant.id,
            connected_account_id=schedule_req.connected_account_id,
            scheduled_at=schedule_req.scheduled_at,
            timezone=schedule_req.timezone or "UTC",
            status=JobStatus.SCHEDULED.value,
            idempotency_key=idempotency_key,
        )
        db.add(job)

    # Update variant status to SCHEDULED
    variant.status = VariantStatus.SCHEDULED.value
    db.add(variant)

    await db.commit()
    await db.refresh(job)

    return PublishingJobResponse(
        id=job.id,
        workspace_id=job.workspace_id,
        content_variant_id=job.content_variant_id,
        connected_account_id=job.connected_account_id,
        scheduled_at=job.scheduled_at,
        timezone=job.timezone,
        status=JobStatus(job.status),
        idempotency_key=job.idempotency_key,
        attempt_count=job.attempt_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        variant_platform=variant.platform,
        variant_title=variant.title,
        variant_body=variant.body,
    )


@router.get(
    "/workspaces/{workspace_id}/calendar",
    response_model=List[CalendarEventResponse],
)
async def get_workspace_calendar(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all scheduled and published jobs formatted for calendar display.
    """
    query = (
        select(PublishingJob)
        .options(selectinload(PublishingJob.variant))
        .where(PublishingJob.workspace_id == workspace_id)
        .order_by(PublishingJob.scheduled_at.asc())
    )
    result = await db.execute(query)
    jobs = result.scalars().all()

    events = []
    for job in jobs:
        variant = job.variant
        snippet = (variant.body[:80] + "...") if variant and variant.body else "Scheduled post"
        title = (variant.title or f"{variant.platform.capitalize()} Post") if variant else "Post"
        platform = variant.platform if variant else "social"

        events.append(
            CalendarEventResponse(
                id=f"evt_{job.id}",
                job_id=job.id,
                variant_id=job.content_variant_id,
                platform=platform,
                title=title,
                snippet=snippet,
                scheduled_at=job.scheduled_at,
                status=JobStatus(job.status),
            )
        )

    return events


@router.patch(
    "/publishing-jobs/{job_id}",
    response_model=PublishingJobResponse,
)
async def reschedule_job(
    job_id: str,
    reschedule_req: RescheduleJobRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reschedule a job to a new date/time (e.g. from calendar drag & drop).
    """
    query = select(PublishingJob).options(selectinload(PublishingJob.variant)).where(PublishingJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Publishing job not found"
        )

    # Permission check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == job.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    member = mem_res.scalar_one_or_none()
    if not member or member.role not in [
        WorkspaceRole.OWNER.value,
        WorkspaceRole.ADMIN.value,
        WorkspaceRole.EDITOR.value,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    job.scheduled_at = reschedule_req.scheduled_at
    if reschedule_req.timezone:
        job.timezone = reschedule_req.timezone

    db.add(job)
    await db.commit()
    await db.refresh(job)

    return PublishingJobResponse(
        id=job.id,
        workspace_id=job.workspace_id,
        content_variant_id=job.content_variant_id,
        connected_account_id=job.connected_account_id,
        scheduled_at=job.scheduled_at,
        timezone=job.timezone,
        status=JobStatus(job.status),
        idempotency_key=job.idempotency_key,
        attempt_count=job.attempt_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        variant_platform=job.variant.platform if job.variant else None,
        variant_title=job.variant.title if job.variant else None,
        variant_body=job.variant.body if job.variant else None,
    )


@router.post(
    "/publishing-jobs/{job_id}/cancel",
    response_model=PublishingJobResponse,
)
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel a scheduled publishing job.
    """
    query = select(PublishingJob).options(selectinload(PublishingJob.variant)).where(PublishingJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Publishing job not found"
        )

    job.status = JobStatus.CANCELLED.value
    if job.variant:
        job.variant.status = VariantStatus.APPROVED.value  # Back to approved
        db.add(job.variant)

    db.add(job)
    await db.commit()
    await db.refresh(job)

    return PublishingJobResponse(
        id=job.id,
        workspace_id=job.workspace_id,
        content_variant_id=job.content_variant_id,
        connected_account_id=job.connected_account_id,
        scheduled_at=job.scheduled_at,
        timezone=job.timezone,
        status=JobStatus(job.status),
        idempotency_key=job.idempotency_key,
        attempt_count=job.attempt_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        variant_platform=job.variant.platform if job.variant else None,
        variant_title=job.variant.title if job.variant else None,
        variant_body=job.variant.body if job.variant else None,
    )
