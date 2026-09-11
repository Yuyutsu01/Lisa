"""
Analytics and Opportunity Loop Endpoints for Lisa.

Aggregates cross-channel post performance metrics and provides AI-driven
closed-loop content repurposing recommendations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.workspace import WorkspaceMember, WorkspaceRole
from app.models.content import ContentSource, ContentType, SourceStatus
from app.models.variant import ContentVariant
from app.models.connection import PublishedRecord
from app.models.analytics import PerformanceMetric, ContentOpportunity, OpportunityStatus
from app.models.brand import BrandProfile
from app.schemas.analytics import (
    PerformanceMetricCreate,
    PerformanceMetricRead,
    ContentOpportunityRead,
    AnalyticsOverviewResponse,
    PlatformMetricSummary,
    TopPostSummary,
)
from app.schemas.content import ContentSourceResponse
from app.agents.analytics_agent import AnalyticsAgent
from app.agents.recommendation_agent import ContentRecommendationAgent
from app.api.deps import (
    get_current_user,
    get_workspace_member,
    require_roles,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/analytics",
    tags=["Analytics"],
)


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(get_workspace_member),
):
    """
    Get aggregated high-level KPIs, per-platform distribution, and top performing posts.
    """
    # 1. Fetch all performance metrics for the workspace
    metrics_q = select(PerformanceMetric).where(
        PerformanceMetric.workspace_id == workspace_id
    )
    metrics_res = await db.execute(metrics_q)
    all_metrics = metrics_res.scalars().all()

    # 2. Count total published posts
    pub_count_q = select(func.count(PublishedRecord.id)).where(
        PublishedRecord.workspace_id == workspace_id
    )
    total_posts = (await db.execute(pub_count_q)).scalar() or 0

    total_impressions = sum(m.impressions for m in all_metrics)
    total_reach = sum(m.reach for m in all_metrics)
    total_engagements = sum(
        m.likes + m.comments + m.shares + m.saves + m.clicks for m in all_metrics
    )
    avg_engagement_rate = (
        (total_engagements / max(total_impressions, 1)) if total_impressions > 0 else 0.0
    )

    # 3. Platform breakdown
    platform_map = {}
    for m in all_metrics:
        if m.platform not in platform_map:
            platform_map[m.platform] = {
                "posts": 0,
                "impressions": 0,
                "engagements": 0,
            }
        platform_map[m.platform]["posts"] += 1
        platform_map[m.platform]["impressions"] += m.impressions
        platform_map[m.platform]["engagements"] += (
            m.likes + m.comments + m.shares + m.saves + m.clicks
        )

    platform_breakdown = [
        PlatformMetricSummary(
            platform=p,
            total_posts=stats["posts"],
            impressions=stats["impressions"],
            engagements=stats["engagements"],
            avg_engagement_rate=round(
                stats["engagements"] / max(stats["impressions"], 1), 4
            ),
        )
        for p, stats in platform_map.items()
    ]

    # 4. Top performing posts (join with published records)
    top_q = (
        select(PerformanceMetric, PublishedRecord)
        .join(PublishedRecord, PerformanceMetric.published_record_id == PublishedRecord.id)
        .where(PerformanceMetric.workspace_id == workspace_id)
        .order_by(PerformanceMetric.engagement_rate.desc())
        .limit(5)
    )
    top_res = await db.execute(top_q)
    top_posts = []
    for m, pr in top_res.all():
        engs = m.likes + m.comments + m.shares + m.saves + m.clicks
        top_posts.append(
            TopPostSummary(
                published_record_id=pr.id,
                platform=pr.platform,
                title=f"{pr.platform.capitalize()} Post ({pr.external_post_id})",
                external_url=pr.external_url,
                impressions=m.impressions,
                engagements=engs,
                engagement_rate=round(m.engagement_rate, 4),
                published_at=pr.published_at,
            )
        )

    # 5. Open opportunities count
    opp_count_q = select(func.count(ContentOpportunity.id)).where(
        ContentOpportunity.workspace_id == workspace_id,
        ContentOpportunity.status == OpportunityStatus.OPEN.value,
    )
    open_opps = (await db.execute(opp_count_q)).scalar() or 0

    return AnalyticsOverviewResponse(
        total_impressions=total_impressions,
        total_reach=total_reach,
        total_engagements=total_engagements,
        avg_engagement_rate=round(avg_engagement_rate, 4),
        total_posts_published=total_posts,
        platform_breakdown=platform_breakdown,
        top_performing_posts=top_posts,
        open_opportunities_count=open_opps,
    )


@router.post("/metrics", response_model=PerformanceMetricRead, status_code=status.HTTP_201_CREATED)
async def record_performance_metric(
    workspace_id: str,
    payload: PerformanceMetricCreate,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
):
    """
    Ingest or record a post performance metric snapshot.
    """
    # Calculate engagement rate
    engagements = (
        payload.likes
        + payload.comments
        + payload.shares
        + payload.saves
        + payload.clicks
    )
    denominator = max(payload.impressions, payload.reach, 1)
    engagement_rate = engagements / denominator

    metric = PerformanceMetric(
        workspace_id=workspace_id,
        published_record_id=payload.published_record_id,
        platform=payload.platform,
        impressions=payload.impressions,
        reach=payload.reach,
        views=payload.views,
        likes=payload.likes,
        comments=payload.comments,
        shares=payload.shares,
        saves=payload.saves,
        clicks=payload.clicks,
        engagement_rate=engagement_rate,
        raw_metrics_json=payload.raw_metrics_json,
    )
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.get("/opportunities", response_model=List[ContentOpportunityRead])
async def list_content_opportunities(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(get_workspace_member),
):
    """
    List AI-generated closed-loop content repurposing opportunities for the workspace.
    """
    query = (
        select(ContentOpportunity)
        .where(
            ContentOpportunity.workspace_id == workspace_id,
            ContentOpportunity.status == OpportunityStatus.OPEN.value,
        )
        .order_by(ContentOpportunity.created_at.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()


@router.post("/analyze", response_model=List[ContentOpportunityRead])
async def trigger_analytics_and_opportunity_loop(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
):
    """
    Trigger the AnalyticsAgent and ContentRecommendationAgent to discover new repurposing opportunities.
    """
    # 1. Fetch performance metrics with published records & variants
    top_q = (
        select(PerformanceMetric, PublishedRecord, ContentVariant)
        .join(PublishedRecord, PerformanceMetric.published_record_id == PublishedRecord.id)
        .join(ContentVariant, PublishedRecord.content_variant_id == ContentVariant.id)
        .where(PerformanceMetric.workspace_id == workspace_id)
        .order_by(PerformanceMetric.engagement_rate.desc())
        .limit(10)
    )
    top_res = await db.execute(top_q)
    top_records = []
    for m, pr, cv in top_res.all():
        top_records.append({
            "published_record_id": pr.id,
            "platform": pr.platform,
            "title": cv.title,
            "engagement_rate": m.engagement_rate,
            "content_pillar": cv.strategy_json.get("angle", "Thought Leadership") if cv.strategy_json else "General",
        })

    # 2. Fetch Brand Profile
    brand_q = select(BrandProfile).where(BrandProfile.workspace_id == workspace_id)
    brand = (await db.execute(brand_q)).scalar_one_or_none()
    brand_pillars = brand.content_pillars_json if brand else ["Product", "Strategy", "Culture"]

    # 3. Execute Recommendation Agent
    rec_agent = ContentRecommendationAgent()
    rec_output = await rec_agent.execute({
        "top_posts": top_records,
        "brand_pillars": brand_pillars,
    })

    created_opps = []
    for r in rec_output.get("recommendations", []):
        opp = ContentOpportunity(
            workspace_id=workspace_id,
            title=r.get("title", "New Content Opportunity"),
            content_pillar=r.get("content_pillar", "General"),
            suggested_platforms_json=r.get("suggested_platforms", ["linkedin", "x"]),
            reason=r.get("reason", "High audience resonance detected."),
            confidence=r.get("confidence", "medium"),
            source_evidence_json=r.get("source_evidence", {}),
            status=OpportunityStatus.OPEN.value,
        )
        db.add(opp)
        created_opps.append(opp)

    await db.commit()
    for o in created_opps:
        await db.refresh(o)

    return created_opps


@router.post(
    "/opportunities/{opportunity_id}/create-source",
    response_model=ContentSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def turn_opportunity_into_source(
    workspace_id: str,
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    member: WorkspaceMember = Depends(
        require_roles([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.EDITOR])
    ),
):
    """
    1-Click Action: Turn an AI Opportunity directly into a new canonical ContentSource draft.
    """
    opp_q = select(ContentOpportunity).where(
        ContentOpportunity.id == opportunity_id,
        ContentOpportunity.workspace_id == workspace_id,
    )
    opp = (await db.execute(opp_q)).scalar_one_or_none()
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content opportunity not found",
        )

    # Create new ContentSource
    new_source = ContentSource(
        workspace_id=workspace_id,
        created_by=current_user.id,
        title=opp.title,
        body=f"Repurposed Canonical Source derived from opportunity: {opp.title}\n\nStrategic Context: {opp.reason}",
        content_type=ContentType.ARTICLE.value,
        language="English",
        status=SourceStatus.DRAFT.value,
        target_platforms_json=opp.suggested_platforms_json,
        content_pillar=opp.content_pillar,
        source_metadata_json={
            "derived_from_opportunity_id": opp.id,
            "confidence": opp.confidence,
        },
    )
    db.add(new_source)

    # Mark opportunity as actioned
    opp.status = OpportunityStatus.ACTIONED.value
    await db.commit()
    await db.refresh(new_source)

    return ContentSourceResponse(
        id=new_source.id,
        workspace_id=new_source.workspace_id,
        title=new_source.title,
        body=new_source.body,
        content_type=new_source.content_type,
        language=new_source.language,
        status=new_source.status,
        target_platforms_json=new_source.target_platforms_json or [],
        content_pillar=new_source.content_pillar or "",
        campaign=new_source.campaign or "",
        source_metadata_json=new_source.source_metadata_json or {},
        created_by=new_source.created_by,
        created_at=new_source.created_at,
        updated_at=new_source.updated_at,
        version_count=1,
        attached_assets=[],
    )
