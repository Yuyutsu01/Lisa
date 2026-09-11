"""
Publishing Execution and History Endpoints for Lisa.

Handles immediate multi-platform publishing and retrieval of published post records.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.connection import PublishedRecord
from app.schemas.publishing import (
    PublishRequest,
    PublishResponse,
    PublishedRecordRead,
)
from app.publishing.service import PublishingService
from app.api.deps import (
    get_workspace_member,
    require_roles,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}",
    tags=["Publishing"],
)


@router.post(
    "/variants/{variant_id}/publish",
    response_model=PublishResponse,
)
async def publish_variant_now(
    workspace_id: str,
    variant_id: str,
    payload: Optional[PublishRequest] = None,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
):
    """
    Publish a content variant immediately using the configured platform adapter.
    """
    service = PublishingService(db)
    connected_account_id = payload.connected_account_id if payload else None
    
    result = await service.execute_publish(
        variant_id=variant_id,
        workspace_id=workspace_id,
        connected_account_id=connected_account_id,
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error_message or "Publishing failed",
        )

    return PublishResponse(
        success=result.success,
        external_post_id=result.external_post_id,
        external_url=result.external_url,
        error_message=result.error_message,
        raw_response=result.raw_response,
    )


@router.get("/published", response_model=List[PublishedRecordRead])
async def list_published_records(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(get_workspace_member),
):
    """
    List all historical published records across all platforms for the workspace.
    """
    query = (
        select(PublishedRecord)
        .where(PublishedRecord.workspace_id == workspace_id)
        .order_by(PublishedRecord.published_at.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()
