"""
Content Source and Versioning API Endpoints for Lisa.

Handles canonical content creation, auto-saving drafts, version snapshotting,
restoration, and media attachments.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.content import ContentSource, ContentSourceVersion, SourceStatus
from app.models.media import MediaAsset, ContentSourceAsset
from app.schemas.content import (
    ContentSourceCreate,
    ContentSourceUpdate,
    ContentSourceResponse,
    ContentSourceVersionResponse,
)
from app.schemas.media import MediaAssetSummary
from app.core.storage import StorageManager
from app.api.deps import (
    get_current_user,
    get_workspace_member,
    require_roles,
)

router = APIRouter(tags=["Content Sources"])


def format_source_response(source: ContentSource, version_count: int = 1) -> ContentSourceResponse:
    attached_summaries = []
    if source.attached_assets:
        for assoc in source.attached_assets:
            if assoc.asset:
                attached_summaries.append(
                    MediaAssetSummary(
                        id=assoc.asset.id,
                        filename=assoc.asset.filename,
                        mime_type=assoc.asset.mime_type,
                        size_bytes=assoc.asset.size_bytes,
                        width=assoc.asset.width,
                        height=assoc.asset.height,
                        url=StorageManager.get_url(assoc.asset.storage_key),
                    )
                )

    return ContentSourceResponse(
        id=source.id,
        workspace_id=source.workspace_id,
        title=source.title,
        body=source.body,
        content_type=source.content_type,
        language=source.language,
        status=source.status,
        target_platforms_json=source.target_platforms_json or [],
        content_pillar=source.content_pillar or "",
        campaign=source.campaign or "",
        source_metadata_json=source.source_metadata_json or {},
        created_by=source.created_by,
        created_at=source.created_at,
        updated_at=source.updated_at,
        version_count=version_count,
        attached_assets=attached_summaries,
    )


@router.post(
    "/workspaces/{workspace_id}/sources",
    response_model=ContentSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_content_source(
    workspace_id: str,
    source_in: ContentSourceCreate,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new canonical content source.
    Automatically snapshots version 1.
    """
    new_source = ContentSource(
        workspace_id=workspace_id,
        title=source_in.title,
        body=source_in.body or "",
        content_type=source_in.content_type.value if source_in.content_type else "article",
        language=source_in.language or "English",
        status=source_in.status.value if source_in.status else SourceStatus.DRAFT.value,
        target_platforms_json=source_in.target_platforms_json or [],
        content_pillar=source_in.content_pillar or "",
        campaign=source_in.campaign or "",
        source_metadata_json=source_in.source_metadata_json or {},
        created_by=current_user.id,
    )
    db.add(new_source)
    await db.flush()

    # Snapshot Version 1
    initial_version = ContentSourceVersion(
        content_source_id=new_source.id,
        version_number=1,
        title=new_source.title,
        body=new_source.body,
        metadata_json=new_source.source_metadata_json,
        created_by=current_user.id,
    )
    db.add(initial_version)

    # Attach any provided media assets
    if source_in.asset_ids:
        for idx, asset_id in enumerate(source_in.asset_ids):
            assoc = ContentSourceAsset(
                content_source_id=new_source.id,
                media_asset_id=asset_id,
                position=idx,
            )
            db.add(assoc)

    await db.commit()
    await db.refresh(new_source)

    # Load attachments
    query = (
        select(ContentSource)
        .options(
            selectinload(ContentSource.attached_assets).selectinload(
                ContentSourceAsset.asset
            )
        )
        .where(ContentSource.id == new_source.id)
    )
    res = await db.execute(query)
    full_source = res.scalar_one()

    return format_source_response(full_source, version_count=1)


@router.get(
    "/workspaces/{workspace_id}/sources",
    response_model=List[ContentSourceResponse],
)
async def list_content_sources(
    workspace_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    pillar_filter: Optional[str] = Query(None, alias="pillar"),
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    List all content sources in the workspace with optional filtering.
    """
    query = (
        select(ContentSource)
        .options(
            selectinload(ContentSource.attached_assets).selectinload(
                ContentSourceAsset.asset
            ),
            selectinload(ContentSource.versions),
        )
        .where(ContentSource.workspace_id == workspace_id)
        .order_by(ContentSource.updated_at.desc())
    )

    if status_filter:
        query = query.where(ContentSource.status == status_filter)
    if pillar_filter:
        query = query.where(ContentSource.content_pillar == pillar_filter)

    result = await db.execute(query)
    sources = result.scalars().all()

    return [
        format_source_response(s, version_count=len(s.versions) or 1) for s in sources
    ]


@router.get("/sources/{source_id}", response_model=ContentSourceResponse)
async def get_content_source(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed content source data by ID.
    Verifies user has access to the workspace.
    """
    query = (
        select(ContentSource)
        .options(
            selectinload(ContentSource.attached_assets).selectinload(
                ContentSourceAsset.asset
            ),
            selectinload(ContentSource.versions),
        )
        .where(ContentSource.id == source_id)
    )
    result = await db.execute(query)
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # Multi-tenant check
    mem_query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == source.workspace_id,
        WorkspaceMember.user_id == current_user.id,
    )
    mem_res = await db.execute(mem_query)
    if not mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this source's workspace",
        )

    return format_source_response(source, version_count=len(source.versions) or 1)


@router.patch("/sources/{source_id}", response_model=ContentSourceResponse)
async def update_content_source(
    source_id: str,
    source_update: ContentSourceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update content source title, body, platforms, or status (auto-save or major edit).
    If `create_version_snapshot=True`, captures a new immutable version in history.
    """
    query = (
        select(ContentSource)
        .options(
            selectinload(ContentSource.attached_assets).selectinload(
                ContentSourceAsset.asset
            ),
            selectinload(ContentSource.versions),
        )
        .where(ContentSource.id == source_id)
    )
    result = await db.execute(query)
    source = result.scalar_one_or_none()

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # Multi-tenant check with role validation
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
            detail="Insufficient permissions to edit this source",
        )

    update_data = source_update.model_dump(exclude_unset=True)
    create_snapshot = update_data.pop("create_version_snapshot", False)

    for field, val in update_data.items():
        if val is not None:
            if field in ["content_type", "status"] and hasattr(val, "value"):
                setattr(source, field, val.value)
            else:
                setattr(source, field, val)

    if create_snapshot:
        # Determine next version number
        next_ver = (len(source.versions) or 0) + 1
        new_version = ContentSourceVersion(
            content_source_id=source.id,
            version_number=next_ver,
            title=source.title,
            body=source.body,
            metadata_json=source.source_metadata_json or {},
            created_by=current_user.id,
        )
        db.add(new_version)

    db.add(source)
    await db.commit()
    await db.refresh(source)

    return format_source_response(source, version_count=(len(source.versions) or 1))


@router.get(
    "/sources/{source_id}/versions",
    response_model=List[ContentSourceVersionResponse],
)
async def list_source_versions(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all historical versions of a content source.
    """
    source_res = await db.execute(
        select(ContentSource).where(ContentSource.id == source_id)
    )
    source = source_res.scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # Multi-tenant check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == source.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    versions_query = (
        select(ContentSourceVersion)
        .where(ContentSourceVersion.content_source_id == source_id)
        .order_by(ContentSourceVersion.version_number.desc())
    )
    v_res = await db.execute(versions_query)
    return v_res.scalars().all()


@router.post("/sources/{source_id}/versions/{version_id}/restore", response_model=ContentSourceResponse)
async def restore_source_version(
    source_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Restore source title and body from a historical version snapshot.
    """
    source_res = await db.execute(
        select(ContentSource)
        .options(
            selectinload(ContentSource.attached_assets).selectinload(
                ContentSourceAsset.asset
            ),
            selectinload(ContentSource.versions),
        )
        .where(ContentSource.id == source_id)
    )
    source = source_res.scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content source not found"
        )

    # Role check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == source.workspace_id,
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

    v_res = await db.execute(
        select(ContentSourceVersion).where(
            ContentSourceVersion.id == version_id,
            ContentSourceVersion.content_source_id == source_id,
        )
    )
    target_version = v_res.scalar_one_or_none()
    if not target_version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")

    # Restore content and record new version
    source.title = target_version.title
    source.body = target_version.body

    next_ver = (len(source.versions) or 0) + 1
    new_version_record = ContentSourceVersion(
        content_source_id=source.id,
        version_number=next_ver,
        title=source.title,
        body=source.body,
        metadata_json={"restored_from_version": target_version.version_number},
        created_by=current_user.id,
    )
    db.add(new_version_record)
    db.add(source)
    await db.commit()
    await db.refresh(source)

    return format_source_response(source, version_count=next_ver)


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_source(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a content source and its versions.
    """
    source_res = await db.execute(
        select(ContentSource).where(ContentSource.id == source_id)
    )
    source = source_res.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == source.workspace_id,
            WorkspaceMember.user_id == current_user.id,
        )
    )
    member = mem_res.scalar_one_or_none()
    if not member or member.role not in [
        WorkspaceRole.OWNER.value,
        WorkspaceRole.ADMIN.value,
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    await db.delete(source)
    await db.commit()
