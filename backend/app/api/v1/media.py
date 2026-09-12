"""
Media Asset API Endpoints for Lisa.

Handles file uploads, MIME/size validation, SHA-256 deduplication,
and workspace asset repository listings.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.media import MediaAsset
from app.schemas.media import MediaAssetResponse
from app.core.storage import StorageManager
from app.api.deps import (
    get_current_user,
    get_workspace_member,
    require_roles,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/media", tags=["Media Assets"])


@router.post(
    "/upload",
    response_model=MediaAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_media_asset(
    workspace_id: str,
    file: UploadFile = File(...),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a media asset (image, video, document) to the workspace library.
    Performs MIME validation, dimension extraction, and SHA-256 checksumming.
    """
    try:
        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"

        # Check for existing file with exact checksum in workspace (deduplication)
        checksum = StorageManager.compute_checksum(content)
        existing_query = select(MediaAsset).where(
            MediaAsset.workspace_id == workspace_id,
            MediaAsset.checksum == checksum,
        )
        existing_result = await db.execute(existing_query)
        existing_asset = existing_result.scalar_one_or_none()

        if existing_asset:
            return MediaAssetResponse(
                id=existing_asset.id,
                workspace_id=existing_asset.workspace_id,
                filename=existing_asset.filename,
                storage_key=existing_asset.storage_key,
                mime_type=existing_asset.mime_type,
                size_bytes=existing_asset.size_bytes,
                width=existing_asset.width,
                height=existing_asset.height,
                duration_ms=existing_asset.duration_ms,
                checksum=existing_asset.checksum,
                url=StorageManager.get_url(existing_asset.storage_key),
                metadata_json=existing_asset.metadata_json or {},
                uploaded_by=existing_asset.uploaded_by,
                created_at=existing_asset.created_at,
            )

        # Save new file to storage
        saved = StorageManager.save_file(
            workspace_id=workspace_id,
            filename=file.filename or "uploaded_asset",
            content=content,
            mime_type=mime_type,
        )

        asset = MediaAsset(
            workspace_id=workspace_id,
            filename=saved["filename"],
            storage_key=saved["storage_key"],
            mime_type=saved["mime_type"],
            size_bytes=saved["size_bytes"],
            width=saved["width"],
            height=saved["height"],
            checksum=saved["checksum"],
            metadata_json={"original_name": file.filename},
            uploaded_by=current_user.id,
        )
        db.add(asset)
        await db.commit()
        await db.refresh(asset)

        return MediaAssetResponse(
            id=asset.id,
            workspace_id=asset.workspace_id,
            filename=asset.filename,
            storage_key=asset.storage_key,
            mime_type=asset.mime_type,
            size_bytes=asset.size_bytes,
            width=asset.width,
            height=asset.height,
            duration_ms=asset.duration_ms,
            checksum=asset.checksum,
            url=StorageManager.get_url(asset.storage_key),
            metadata_json=asset.metadata_json or {},
            uploaded_by=asset.uploaded_by,
            created_at=asset.created_at,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process media upload: {str(e)}",
        )


@router.get("", response_model=List[MediaAssetResponse])
async def list_media_assets(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    List all media assets in the workspace asset library.
    """
    query = (
        select(MediaAsset)
        .where(MediaAsset.workspace_id == workspace_id)
        .order_by(MediaAsset.created_at.desc())
    )
    result = await db.execute(query)
    assets = result.scalars().all()

    return [
        MediaAssetResponse(
            id=a.id,
            workspace_id=a.workspace_id,
            filename=a.filename,
            storage_key=a.storage_key,
            mime_type=a.mime_type,
            size_bytes=a.size_bytes,
            width=a.width,
            height=a.height,
            duration_ms=a.duration_ms,
            checksum=a.checksum,
            url=StorageManager.get_url(a.storage_key),
            metadata_json=a.metadata_json or {},
            uploaded_by=a.uploaded_by,
            created_at=a.created_at,
        )
        for a in assets
    ]


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_media_asset(
    workspace_id: str,
    asset_id: str,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a media asset from the workspace and storage.
    """
    query = select(MediaAsset).where(
        MediaAsset.workspace_id == workspace_id,
        MediaAsset.id == asset_id,
    )
    result = await db.execute(query)
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media asset not found",
        )

    StorageManager.delete_file(asset.storage_key)
    await db.delete(asset)
    await db.commit()
