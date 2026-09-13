"""
Standalone script to reproduce and diagnose the /analytics/analyze 500 error.
Run from the backend/ directory.
"""
import asyncio
import sys
import traceback

sys.path.insert(0, ".")


async def test():
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.analytics import PerformanceMetric, ContentOpportunity, OpportunityStatus
    from app.models.connection import PublishedRecord
    from app.models.variant import ContentVariant
    from app.models.brand import BrandProfile
    from app.agents.recommendation_agent import ContentRecommendationAgent

    workspace_id = "a1096076-58d2-4d5e-b0e9-0ac931cc573b"

    async with AsyncSessionLocal() as db:
        try:
            # Step 1: Fetch metrics (same query as the endpoint)
            top_q = (
                select(PerformanceMetric, PublishedRecord, ContentVariant)
                .join(PublishedRecord, PerformanceMetric.published_record_id == PublishedRecord.id)
                .join(ContentVariant, PublishedRecord.content_variant_id == ContentVariant.id)
                .where(
                    PerformanceMetric.workspace_id == workspace_id,
                    PerformanceMetric.metrics_source == "platform_api",
                )
                .order_by(PerformanceMetric.engagement_rate.desc())
                .limit(10)
            )
            top_res = await db.execute(top_q)
            top_records = []
            for m, pr, cv in top_res.all():
                top_records.append(
                    {
                        "published_record_id": pr.id,
                        "platform": pr.platform,
                        "title": cv.title,
                        "engagement_rate": m.engagement_rate,
                        "content_pillar": (
                            cv.strategy_json.get("angle", "Thought Leadership")
                            if cv.strategy_json
                            else "General"
                        ),
                    }
                )
            print(f"[1] Top records fetched: {len(top_records)}")

            # Step 2: Brand profile
            brand_q = select(BrandProfile).where(BrandProfile.workspace_id == workspace_id)
            brand = (await db.execute(brand_q)).scalar_one_or_none()
            raw_pillars = brand.content_pillars_json if brand else ["Product", "Strategy", "Culture"]
            # content_pillars_json may be List[str] or List[dict]; normalize to plain strings
            brand_pillars = [
                p["name"] if isinstance(p, dict) else str(p)
                for p in raw_pillars
            ] if raw_pillars else ["Product", "Strategy", "Culture"]
            print(f"[2] Brand pillars (normalized): {brand_pillars}")

            # Step 3: Run recommendation agent
            rec_agent = ContentRecommendationAgent()
            rec_output = await rec_agent.execute(
                {"top_posts": top_records, "brand_pillars": brand_pillars}
            )
            recommendations = rec_output.get("recommendations", [])
            print(f"[3] Recommendations generated: {len(recommendations)}")

            # Step 4: Insert opportunities into DB
            created = []
            for r in recommendations:
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
                created.append(opp)

            await db.commit()
            for o in created:
                await db.refresh(o)

            print(f"[4] SUCCESS: {len(created)} opportunities created")

        except Exception as e:
            print(f"\nERROR: {type(e).__name__}: {e}")
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
