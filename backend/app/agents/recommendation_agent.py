"""
Content Recommendation Agent for Lisa.

Closed-loop feedback engine: Discovers winning posts, evaluates content pillars,
and proposes specific repurposing and distribution opportunities.
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent


class ContentRecommendationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ContentRecommendationAgent",
            version="1.0.0",
            description="Generates actionable content repurposing opportunities from performance signals.",
        )

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inputs expected:
        - top_posts: List[Dict[str, Any]]
        - brand_pillars: List[str]
        """
        top_posts = inputs.get("top_posts", [])
        brand_pillars = inputs.get("brand_pillars", ["Product Updates", "Thought Leadership", "Industry News"])

        recommendations = []

        if not top_posts:
            # Baseline recommendation when no posts exist yet
            recommendations.append({
                "title": "Establish Baseline Pillar Content",
                "content_pillar": brand_pillars[0] if brand_pillars else "Thought Leadership",
                "suggested_platforms": ["linkedin", "x"],
                "reason": "Publish foundational core insights across LinkedIn and X to establish initial baseline metrics.",
                "confidence": "medium",
                "source_evidence": {"sample_size": 0},
            })
            return {"recommendations": recommendations}

        for post in top_posts[:3]:
            plat = post.get("platform", "linkedin")
            title = post.get("title", "High Performing Asset")
            eng_rate = post.get("engagement_rate", 0.0)

            # Rule: If high performing on LinkedIn, repurpose to X thread & TikTok / Shorts script
            if plat == "linkedin":
                recommendations.append({
                    "title": f"Repurpose '{title}' into X Thread & Video Hook",
                    "content_pillar": post.get("content_pillar", "Thought Leadership"),
                    "suggested_platforms": ["x", "tiktok", "youtube"],
                    "reason": f"LinkedIn post achieved high engagement ({(eng_rate * 100):.1f}%). Deconstruct key arguments into a fast-paced X thread and short-form video breakdown.",
                    "confidence": "high",
                    "source_evidence": {
                        "published_record_id": post.get("published_record_id"),
                        "engagement_rate": eng_rate,
                        "origin_platform": "linkedin",
                    },
                })
            elif plat in ["x", "threads"]:
                recommendations.append({
                    "title": f"Expand Short Take '{title}' into Long-Form Article",
                    "content_pillar": post.get("content_pillar", "Industry Analysis"),
                    "suggested_platforms": ["linkedin", "blog", "email"],
                    "reason": f"Viral engagement on {plat.capitalize()} indicates strong audience resonance. Expand the thesis into an in-depth canonical newsletter breakdown and blog post.",
                    "confidence": "high",
                    "source_evidence": {
                        "published_record_id": post.get("published_record_id"),
                        "engagement_rate": eng_rate,
                        "origin_platform": plat,
                    },
                })
            else:
                recommendations.append({
                    "title": f"Cross-Distribute Visual Hook '{title}'",
                    "content_pillar": post.get("content_pillar", "Visual Storytelling"),
                    "suggested_platforms": ["instagram", "youtube", "threads"],
                    "reason": f"High visual retention detected on {plat.capitalize()}. Adapt aspect ratios for Instagram Portrait & YouTube Shorts.",
                    "confidence": "medium",
                    "source_evidence": {
                        "published_record_id": post.get("published_record_id"),
                        "engagement_rate": eng_rate,
                    },
                })

        return {"recommendations": recommendations}
