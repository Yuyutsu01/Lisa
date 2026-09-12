"""
Content Variant Management Endpoints for Lisa.

Handles review, manual editing, granular AI regeneration, and human approval/rejection.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.content import ContentSource
from app.models.variant import ContentVariant, VariantStatus
from app.schemas.variant import (
    ContentVariantResponse,
    ContentVariantUpdate,
    ContentVariantRegenerateRequest,
    ContentVariantApproval,
)
from app.agents.pipeline import GenerationPipeline
from app.api.deps import get_current_user

router = APIRouter(tags=["Content Variants"])


@router.get(
    "/sources/{source_id}/variants",
    response_model=List[ContentVariantResponse],
)
async def list_source_variants(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all generated variants for a specific content source.
    """
    source_res = await db.execute(
        select(ContentSource).where(ContentSource.id == source_id)
    )
    source = source_res.scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # Workspace membership check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == source.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    variants_query = (
        select(ContentVariant)
        .where(ContentVariant.content_source_id == source_id)
        .order_by(ContentVariant.created_at.asc())
    )
    v_res = await db.execute(variants_query)
    return v_res.scalars().all()


@router.get("/variants/{variant_id}", response_model=ContentVariantResponse)
async def get_variant(
    variant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed variant information by ID.
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    # Membership check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == variant.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return variant


@router.patch("/variants/{variant_id}", response_model=ContentVariantResponse)
async def update_variant_copy(
    variant_id: str,
    update_in: ContentVariantUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually edit variant text, title, caption, CTA, or hashtags.
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    # Permission check
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
        WorkspaceRole.REVIEWER.value,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    update_data = update_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            if field == "status" and hasattr(val, "value"):
                setattr(variant, field, val.value)
            else:
                setattr(variant, field, val)

    db.add(variant)
    await db.commit()
    await db.refresh(variant)

    return variant


@router.post("/variants/{variant_id}/regenerate", response_model=ContentVariantResponse)
async def regenerate_variant(
    variant_id: str,
    regen_req: ContentVariantRegenerateRequest = ContentVariantRegenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Regenerate a variant with specific instructions (e.g. "make it punchier", "shorten for X").
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    # Fetch source
    source_res = await db.execute(
        select(ContentSource).where(ContentSource.id == variant.content_source_id)
    )
    source = source_res.scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Parent source not found"
        )

    pipeline = GenerationPipeline(db=db, workspace_id=variant.workspace_id)
    variant_data = await pipeline.generate_single_variant_data(
        source=source,
        platform=variant.platform,
        custom_instruction=regen_req.instruction or "Regenerate alternative angle",
    )

    # Update existing variant with newly generated content
    variant.title = variant_data.get("title")
    variant.body = variant_data.get("body", "")
    variant.caption = variant_data.get("caption")
    variant.cta = variant_data.get("cta")
    variant.hashtags_json = variant_data.get("hashtags_json", [])
    variant.strategy_json = variant_data.get("strategy_json", {})
    variant.quality_review_json = variant_data.get("quality_review_json", {})
    variant.status = VariantStatus.NEEDS_REVIEW.value

    db.add(variant)
    await db.commit()
    await db.refresh(variant)

    return variant


@router.post("/variants/{variant_id}/approve", response_model=ContentVariantResponse)
async def approve_variant(
    variant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Approve a content variant for scheduling and publishing.
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    variant.status = VariantStatus.APPROVED.value
    variant.approved_by = current_user.id
    variant.approved_at = datetime.now(timezone.utc)
    variant.rejection_reason = None

    db.add(variant)
    await db.commit()
    await db.refresh(variant)

    return variant


@router.post("/variants/{variant_id}/reject", response_model=ContentVariantResponse)
async def reject_variant(
    variant_id: str,
    approval: ContentVariantApproval,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reject a content variant with a specified feedback reason.
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found"
        )

    variant.status = VariantStatus.REJECTED.value
    variant.rejection_reason = approval.rejection_reason or "Changes requested"

    db.add(variant)
    await db.commit()
    await db.refresh(variant)

    return variant
