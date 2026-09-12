"""
Content Variant Management Endpoints for Lisa.

Handles review, manual editing, granular AI regeneration, and human approval/rejection.
"""

from datetime import datetime, timezone
from typing import List, Optional, Any
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
    GenerateImageRequest,
    GenerateVideoRequest,
)
from app.agents.pipeline import GenerationPipeline
from app.api.deps import get_current_user, get_current_user_optional

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
    if variant_data.get("media_url"):
        variant.media_url = variant_data.get("media_url")
    if variant_data.get("video_storyboard_json"):
        variant.video_storyboard_json = variant_data.get("video_storyboard_json")
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


@router.post("/variants/{variant_id}/generate-image", response_model=Any)
async def generate_variant_image(
    variant_id: str,
    req: GenerateImageRequest = GenerateImageRequest(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate or regenerate a FLUX.1 visual photo for this specific variant.
    Uses LLM art direction and semantic keyword topic extraction so the image
    is tangibly, deeply relevant to the post topic (servers, neural chips, workspaces, etc.).
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    from app.agents.visual import VisualMediaAgent, get_semantic_visual_fallback
    from app.agents.base import AgentContext
    from app.agents.intake import ContentIntakeAgent
    from app.agents.strategy import PlatformStrategyAgent

    source = None
    if variant:
        source_res = await db.execute(
            select(ContentSource).where(ContentSource.id == variant.content_source_id)
        )
        source = source_res.scalar_one_or_none()

    platform = req.platform or (variant.platform if variant else "linkedin")
    title = req.title or (source.title if source else (variant.title if variant else "Technical System"))
    body = req.body or (source.body if source else (variant.body if variant else ""))

    visual_agent = VisualMediaAgent()
    if req.custom_prompt:
        prompt = req.custom_prompt
    else:
        context = AgentContext()
        intake = ContentIntakeAgent(context)
        brief = await intake.analyze(title=title, body=body)
        strat_agent = PlatformStrategyAgent(context)
        strats = await strat_agent.formulate_strategies(brief, [platform])
        strat = strats.get(platform)
        prompt = await visual_agent.generate_image_prompt(
            brief=brief,
            platform=platform,
            strategy=strat,
            title=title,
            body=body,
        )

    media_url = visual_agent.generate_photo(prompt, variant_id=variant_id)
    if not media_url:
        media_url = get_semantic_visual_fallback(f"{title} {body}")

    if variant:
        variant.media_url = media_url
        db.add(variant)
        await db.commit()
        await db.refresh(variant)
        return variant
    else:
        now_dt = datetime.now(timezone.utc)
        return {
            "id": variant_id,
            "workspace_id": "ws_default",
            "content_source_id": "src_default",
            "platform": platform,
            "format": "image_post",
            "title": title,
            "body": body,
            "media_url": media_url,
            "status": VariantStatus.DRAFT.value,
            "created_at": now_dt.isoformat(),
            "updated_at": now_dt.isoformat(),
        }


@router.post("/variants/{variant_id}/generate-video", response_model=Any)
async def generate_variant_video_storyboard(
    variant_id: str,
    req: GenerateVideoRequest = GenerateVideoRequest(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate or regenerate a 9:16 vertical short video storyboard specification for this variant.
    """
    query = select(ContentVariant).where(ContentVariant.id == variant_id)
    result = await db.execute(query)
    variant = result.scalar_one_or_none()

    from app.agents.visual import VisualMediaAgent
    from app.agents.base import AgentContext
    from app.agents.intake import ContentIntakeAgent

    source = None
    if variant:
        source_res = await db.execute(
            select(ContentSource).where(ContentSource.id == variant.content_source_id)
        )
        source = source_res.scalar_one_or_none()

    platform = req.platform or (variant.platform if variant else "youtube")
    title = req.title or (source.title if source else (variant.title if variant else "High Performance Architecture"))
    body = req.body or (source.body if source else (variant.body if variant else ""))

    context = AgentContext()
    intake = ContentIntakeAgent(context)
    brief = await intake.analyze(title=title, body=body)

    visual_agent = VisualMediaAgent()
    spec = await visual_agent.generate_video_short_spec(brief, title)

    if variant:
        variant.video_storyboard_json = spec
        db.add(variant)
        await db.commit()
        await db.refresh(variant)
        return variant
    else:
        now_dt = datetime.now(timezone.utc)
        return {
            "id": variant_id,
            "workspace_id": "ws_default",
            "content_source_id": "src_default",
            "platform": platform,
            "format": "video_short",
            "title": title,
            "body": body,
            "video_storyboard_json": spec,
            "status": VariantStatus.DRAFT.value,
            "created_at": now_dt.isoformat(),
            "updated_at": now_dt.isoformat(),
        }
