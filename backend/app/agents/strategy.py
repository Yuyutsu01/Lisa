"""
Agent 2: Platform Strategy Agent for Lisa.

Determines the optimal platform angle, format, hook style, and length
recommendations for each target distribution channel.
"""

from typing import List, Dict
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import ContentBrief, PlatformStrategy


PLATFORM_DEFAULTS = {
    "linkedin": {
        "format": "text_post",
        "angle": "professional insight + practical breakdown + discussion",
        "hook_style": "contrarian or data-backed observation",
        "target_length_chars": 1200,
        "cta": "What has been your experience with this in production?",
        "media_required": False,
    },
    "x": {
        "format": "thread",
        "angle": "punchy hook + concise bullet points + takeaway",
        "hook_style": "bold statement with high curiosity",
        "target_length_chars": 280,
        "cta": "Repost if you found this helpful 🔁",
        "media_required": False,
    },
    "instagram": {
        "format": "carousel",
        "angle": "visual breakdown + slide takeaways + caption context",
        "hook_style": "bold visual headline",
        "target_length_chars": 800,
        "cta": "Save this post for your next project 📌",
        "media_required": True,
    },
    "youtube": {
        "format": "short_video",
        "angle": "3-second pattern interrupt hook + 45s fast breakdown",
        "hook_style": "immediate problem statement",
        "target_length_chars": 600,
        "cta": "Subscribe for more rapid breakdowns",
        "media_required": True,
    },
    "tiktok": {
        "format": "short_video",
        "angle": "relatable problem + quick proof + key takeaway",
        "hook_style": "conversational interrupt",
        "target_length_chars": 500,
        "cta": "Drop your thoughts below",
        "media_required": True,
    },
    "threads": {
        "format": "text_post",
        "angle": "casual observation + open discussion",
        "hook_style": "conversational question",
        "target_length_chars": 500,
        "cta": "Thoughts on this?",
        "media_required": False,
    },
    "email": {
        "format": "newsletter",
        "angle": "personal narrative + behind-the-scenes + deep takeaway",
        "hook_style": "curiosity subject line + personal opening",
        "target_length_chars": 2000,
        "cta": "Reply directly to this email to share your thoughts",
        "media_required": False,
    },
    "blog": {
        "format": "article",
        "angle": "comprehensive structured guide with subheadings",
        "hook_style": "executive summary",
        "target_length_chars": 3500,
        "cta": "Explore related engineering deep dives",
        "media_required": False,
    },
}


class PlatformStrategyAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Platform Strategy Agent", context)

    def formulate_strategies(
        self, brief: ContentBrief, target_platforms: List[str]
    ) -> Dict[str, PlatformStrategy]:
        """
        Produce tailored strategy models for each requested platform.
        """
        strategies = {}
        for plat in target_platforms:
            plat_key = plat.lower().strip()
            defaults = PLATFORM_DEFAULTS.get(
                plat_key,
                {
                    "format": "text_post",
                    "angle": "insightful summary",
                    "hook_style": "direct",
                    "target_length_chars": 1000,
                    "cta": brief.primary_cta,
                    "media_required": False,
                },
            )

            strategies[plat_key] = PlatformStrategy(
                platform=plat_key,
                format=defaults["format"],
                angle=defaults["angle"],
                hook_style=defaults["hook_style"],
                target_length_chars=defaults["target_length_chars"],
                cta_recommendation=defaults["cta"],
                media_required=defaults["media_required"],
            )

        return strategies
