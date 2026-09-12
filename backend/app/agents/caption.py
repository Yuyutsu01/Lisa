"""
Agent 4: Caption & Hook Agent for Lisa.

Generates platform-specific hook packages, alternative hooks, and optimized hashtags.
"""

from typing import List
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import CaptionPackage, ContentBrief


class CaptionHookAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Caption & Hook Agent", context)

    def generate_caption_package(
        self, platform: str, brief: ContentBrief, title: str
    ) -> CaptionPackage:
        """
        Generate primary and alternative hooks along with targeted hashtags.
        """
        topic = brief.content_pillars[0] if brief.content_pillars else "Tech"
        clean_topic = topic.replace(" ", "").replace("-", "")

        hashtags = []
        if self.context.hashtag_policy != "prohibited":
            if platform == "instagram":
                hashtags = [f"#{clean_topic}", "#ContentOps", "#TechTips", "#Productivity", "#Creators"]
            elif platform in ["linkedin", "x"]:
                hashtags = [f"#{clean_topic}", "#AI", "#Automation"]

        primary_caption = f"How we approach {title.lower()} without sacrificing quality."
        alt_captions = [
            f"The 3-step playbook for {title.lower()}.",
            f"Why traditional methods fail for {brief.core_idea.lower()}.",
            f"A practical breakdown of {title}.",
        ]

        hook = f"The biggest mistake people make with {brief.core_idea.lower()}."

        return CaptionPackage(
            primary_caption=primary_caption,
            alternative_captions=alt_captions,
            hook=hook,
            cta=brief.primary_cta,
            hashtags=hashtags,
            disclosures=[],
        )
