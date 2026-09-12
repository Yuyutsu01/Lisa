"""
Brand Intelligence API Endpoints for Lisa.

Handles brand profile retrieval/updates and brand knowledge document ingestion.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.brand import BrandProfile, BrandKnowledgeDoc
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.schemas.brand import (
    BrandProfileUpdate,
    BrandProfileResponse,
    BrandKnowledgeDocCreate,
    BrandKnowledgeDocResponse,
)
from app.api.deps import (
    get_workspace_member,
    require_roles,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/brand", tags=["Brand Intelligence"])


@router.get("", response_model=BrandProfileResponse)
async def get_brand_profile(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the brand profile configuration for the workspace.
    """
    result = await db.execute(
        select(BrandProfile).where(BrandProfile.workspace_id == workspace_id)
    )
    brand = result.scalar_one_or_none()

    if not brand:
        # Create an empty brand profile if not exists
        brand = BrandProfile(
            workspace_id=workspace_id,
            name="Default Brand",
            description="",
            tone="Professional and engaging",
        )
        db.add(brand)
        await db.commit()
        await db.refresh(brand)

    return brand


@router.put("", response_model=BrandProfileResponse)
async def update_brand_profile(
    workspace_id: str,
    brand_update: BrandProfileUpdate,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update brand voice, style guidelines, tone, forbidden phrases, and content pillars.
    Requires OWNER, ADMIN, or EDITOR role.
    """
    result = await db.execute(
        select(BrandProfile).where(BrandProfile.workspace_id == workspace_id)
    )
    brand = result.scalar_one_or_none()

    if not brand:
        brand = BrandProfile(workspace_id=workspace_id, name="Default Brand")
        db.add(brand)

    # Update non-null fields
    update_data = brand_update.model_dump(exclude_unset=True)
    
    # Handle serialized JSON fields if present
    if "content_pillars_json" in update_data and update_data["content_pillars_json"] is not None:
        update_data["content_pillars_json"] = [
            p if isinstance(p, dict) else p.model_dump() for p in update_data["content_pillars_json"]
        ]

    for key, value in update_data.items():
        setattr(brand, key, value)

    db.add(brand)
    await db.commit()
    await db.refresh(brand)

    return brand


@router.get("/knowledge", response_model=List[BrandKnowledgeDocResponse])
async def list_brand_knowledge_docs(
    workspace_id: str,
    member: WorkspaceMember = Depends(get_workspace_member),
    db: AsyncSession = Depends(get_db),
):
    """
    List all uploaded brand knowledge documents for RAG context.
    """
    query = (
        select(BrandKnowledgeDoc)
        .where(BrandKnowledgeDoc.workspace_id == workspace_id)
        .order_by(BrandKnowledgeDoc.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/knowledge",
    response_model=BrandKnowledgeDocResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_brand_knowledge_doc(
    workspace_id: str,
    doc_in: BrandKnowledgeDocCreate,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and index a new brand reference document, guidelines, or FAQ.
    """
    new_doc = BrandKnowledgeDoc(
        workspace_id=workspace_id,
        title=doc_in.title,
        source_type=doc_in.source_type,
        content=doc_in.content,
        status="indexed",
        metadata_json=doc_in.metadata_json or {},
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    return new_doc


@router.delete(
    "/knowledge/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_brand_knowledge_doc(
    workspace_id: str,
    doc_id: str,
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a brand knowledge document.
    """
    query = select(BrandKnowledgeDoc).where(
        BrandKnowledgeDoc.workspace_id == workspace_id,
        BrandKnowledgeDoc.id == doc_id,
    )
    result = await db.execute(query)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    await db.delete(doc)
    await db.commit()
