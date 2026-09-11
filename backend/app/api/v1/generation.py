"""
Generation API Endpoints for Lisa.

Triggers multi-agent content adaptation workflows on canonical sources.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.content import ContentSource
from app.schemas.variant import (
    GenerateVariantsRequest,
    GenerationJobResponse,
    ContentVariantResponse,
)
from app.agents.pipeline import GenerationPipeline
from app.api.deps import get_current_user

router = APIRouter(tags=["AI Content Generation"])


@router.post(
    "/sources/{source_id}/generate",
    response_model=GenerationJobResponse,
    status_code=status.HTTP_200_OK,
)
async def generate_variants_for_source(
    source_id: str,
    gen_request: GenerateVariantsRequest = GenerateVariantsRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger the multi-agent generation pipeline (Intake -> Strategy -> Adaptation -> QA).
    Returns generated platform-native variants.
    """
    # 1. Fetch Source
    source_query = select(ContentSource).where(ContentSource.id == source_id)
    source_res = await db.execute(source_query)
    source = source_res.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # 2. Check Workspace Membership & Permissions
    mem_query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id,
    )
    mem_res = await db.execute(mem_query)
    member = mem_res.scalar_one_or_none()
    if not member or member.role not in [
        WorkspaceRole.OWNER.value,
        WorkspaceRole.ADMIN.value,
        WorkspaceRole.EDITOR.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to generate content variants",
        )

    # 3. Execute Multi-Agent Pipeline
    pipeline = GenerationPipeline(db=db, workspace_id=source.workspace_id)
    variants = await pipeline.execute(
        source=source,
        target_platforms=gen_request.platforms,
        custom_instruction=gen_request.custom_instruction or "",
    )

    variant_responses = [
        ContentVariantResponse.model_validate(v) for v in variants
    ]

    return GenerationJobResponse(
        workflow_id="wf_" + source.id[:8],
        content_source_id=source.id,
        variants_count=len(variants),
        variants=variant_responses,
        latency_ms=120,
    )
