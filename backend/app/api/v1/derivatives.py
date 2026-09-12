"""
Media Derivative API Endpoints for Lisa.

Generates and lists platform-optimized cropped derivatives (Instagram portrait, LinkedIn banner, etc.).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.media import MediaAsset
from app.models.derivative import MediaDerivative
from app.schemas.derivative import MediaDerivativeResponse, GenerateDerivativesRequest
from app.core.media_transformer import MediaTransformer
from app.core.storage import StorageManager
from app.api.deps import get_current_user

router = APIRouter(tags=["Media Derivatives"])


@router.post(
    "/media/{asset_id}/derivatives",
    response_model=List[MediaDerivativeResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_asset_derivatives(
    asset_id: str,
    gen_req: GenerateDerivativesRequest = GenerateDerivativesRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate platform-specific cropped and resized derivatives for an uploaded image.
    """
    asset_res = await db.execute(
        select(MediaAsset).where(MediaAsset.id == asset_id)
    )
    asset = asset_res.scalar_one_or_none()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found"
        )

    # Permission check
    mem_res = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == asset.workspace_id,
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

    try:
        results = MediaTransformer.generate_derivatives(
            workspace_id=asset.workspace_id,
            source_storage_key=asset.storage_key,
            presets=gen_req.presets,
        )

        saved_derivatives = []
        for r in results:
            deriv = MediaDerivative(
                source_asset_id=asset.id,
                workspace_id=asset.workspace_id,
                platform=r["platform"],
                format=r["format"],
                storage_key=r["storage_key"],
                mime_type=r["mime_type"],
                width=r["width"],
                height=r["height"],
                processing_status="ready",
                metadata_json=r["metadata_json"],
            )
            db.add(deriv)
            saved_derivatives.append(deriv)

        await db.commit()
        for d in saved_derivatives:
            await db.refresh(d)

        return [
            MediaDerivativeResponse(
                id=d.id,
                source_asset_id=d.source_asset_id,
                workspace_id=d.workspace_id,
                platform=d.platform,
                format=d.format,
                storage_key=d.storage_key,
                mime_type=d.mime_type,
                width=d.width,
                height=d.height,
                duration_ms=d.duration_ms,
                processing_status=d.processing_status,
                url=StorageManager.get_url(d.storage_key),
                metadata_json=d.metadata_json,
                created_at=d.created_at,
            )
            for d in saved_derivatives
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate derivatives: {str(e)}",
        )


@router.get(
    "/media/{asset_id}/derivatives",
    response_model=List[MediaDerivativeResponse],
)
async def list_asset_derivatives(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all generated derivatives for a media asset.
    """
    derivs_res = await db.execute(
        select(MediaDerivative).where(MediaDerivative.source_asset_id == asset_id)
    )
    derivs = derivs_res.scalars().all()

    return [
        MediaDerivativeResponse(
            id=d.id,
            source_asset_id=d.source_asset_id,
            workspace_id=d.workspace_id,
            platform=d.platform,
            format=d.format,
            storage_key=d.storage_key,
            mime_type=d.mime_type,
            width=d.width,
            height=d.height,
            duration_ms=d.duration_ms,
            processing_status=d.processing_status,
            url=StorageManager.get_url(d.storage_key),
            metadata_json=d.metadata_json,
            created_at=d.created_at,
        )
        for d in derivs
    ]
