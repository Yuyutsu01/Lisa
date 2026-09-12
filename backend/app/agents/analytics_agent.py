"""
Analytics Agent for Lisa.

Ingests raw post metrics, normalizes KPIs across heterogeneous social platforms,
and extracts format efficiency patterns and angle performance benchmarks.
"""

from typing import Dict, Any, List
from app.agents.base import BaseAgent


class AnalyticsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="AnalyticsAgent",
            version="1.0.0",
            description="Normalizes social metrics and evaluates content efficiency patterns.",
        )

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inputs expected:
        - metrics_history: List[Dict[str, Any]] (list of metric records)
        - brand_profile: Dict[str, Any]
        """
        raw_metrics = inputs.get("metrics_history", [])
        # Strict provenance filter: only analyze genuine platform_api metrics
        metrics_history = [
            m for m in raw_metrics
            if m.get("metrics_source", "platform_api") == "platform_api"
        ]
        
        if not metrics_history:
            return {
                "summary": "No verified platform API performance data available yet.",
                "total_impressions": 0,
                "total_engagements": 0,
                "avg_engagement_rate": 0.0,
                "insights": [
                    {
                        "type": "baseline",
                        "observation": "Baseline tracking active. Connect social accounts and publish posts to sync verified API metrics.",
                        "confidence": "high",
                    }
                ],
            }

        total_impressions = sum(m.get("impressions", 0) for m in metrics_history)
        total_reach = sum(m.get("reach", 0) for m in metrics_history)
        total_engagements = sum(
            m.get("likes", 0) + m.get("comments", 0) + m.get("shares", 0) + m.get("saves", 0) + m.get("clicks", 0)
            for m in metrics_history
        )
        avg_engagement_rate = (
            total_engagements / max(total_impressions, 1)
        )

        # Platform grouping
        platform_stats: Dict[str, Dict[str, Any]] = {}
        for m in metrics_history:
            plat = m.get("platform", "unknown")
            if plat not in platform_stats:
                platform_stats[plat] = {"posts": 0, "impressions": 0, "engagements": 0}
            platform_stats[plat]["posts"] += 1
            platform_stats[plat]["impressions"] += m.get("impressions", 0)
            platform_stats[plat]["engagements"] += (
                m.get("likes", 0) + m.get("comments", 0) + m.get("shares", 0) + m.get("saves", 0) + m.get("clicks", 0)
            )

        # Format Insights
        insights = []
        best_platform = None
        best_rate = -1.0
        for plat, stats in platform_stats.items():
            rate = stats["engagements"] / max(stats["impressions"], 1)
            if rate > best_rate and stats["posts"] > 0:
                best_rate = rate
                best_platform = plat

        if best_platform:
            insights.append({
                "type": "platform_leader",
                "observation": f"{best_platform.capitalize()} is currently your highest-converting channel with {(best_rate * 100):.1f}% engagement rate.",
                "confidence": "high",
                "evidence": {
                    "platform": best_platform,
                    "engagement_rate": best_rate,
                },
            })

        return {
            "total_impressions": total_impressions,
            "total_reach": total_reach,
            "total_engagements": total_engagements,
            "avg_engagement_rate": round(avg_engagement_rate, 4),
            "platform_breakdown": platform_stats,
            "insights": insights,
        }
