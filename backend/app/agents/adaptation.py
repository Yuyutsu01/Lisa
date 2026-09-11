"""
Agent 3: Content Adaptation Agent for Lisa.

Rewrites canonical source content into native platform format
while strictly preserving facts and respecting brand guidelines.
"""

from typing import Dict, Any
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import ContentBrief, PlatformStrategy


class ContentAdaptationAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Content Adaptation Agent", context)

    def adapt_content(
        self,
        brief: ContentBrief,
        source_title: str,
        source_body: str,
        strategy: PlatformStrategy,
        custom_instruction: str = "",
    ) -> Dict[str, Any]:
        """
        Adapt source into platform-native structure and copy.
        """
        platform = strategy.platform
        points_str = "\n".join([f"• {pt}" for pt in brief.key_points])

        if platform == "linkedin":
            title = f"{source_title}"
            body = (
                f"Most teams struggle with {brief.core_idea.lower()}.\n\n"
                f"Here is what we learned from first-principles testing:\n\n"
                f"{points_str}\n\n"
                f"The key takeaway: {brief.summary}\n\n"
                f"{strategy.cta_recommendation}"
            )
            caption = None

        elif platform == "x":
            title = None
            body = (
                f"1/5 🧵 {source_title}\n\n"
                f"{brief.summary}\n\n"
                f"---\n\n"
                f"2/5 Key Principles:\n"
                f"{points_str}\n\n"
                f"---\n\n"
                f"3/5 Bottom line: Execution beats theory every time.\n\n"
                f"{strategy.cta_recommendation}"
            )
            caption = None

        elif platform == "instagram":
            title = source_title
            body = (
                f"✨ {source_title.upper()}\n\n"
                f"Swipe through for the practical breakdown ➡️\n\n"
                f"Slide 1: The Core Challenge\n"
                f"Slide 2: Key Takeaways\n"
                f"{points_str}\n\n"
                f"Slide 3: Implementation Checklist"
            )
            caption = (
                f"Everything you need to know about {brief.core_idea}.\n\n"
                f"👉 {strategy.cta_recommendation}"
            )

        elif platform in ["youtube", "tiktok"]:
            title = f"{source_title} in 45 Seconds"
            body = (
                f"[HOOK - 0:00-0:05]\n"
                f"\"Stop doing {brief.core_idea.lower()} the old way. Here's what actually works in 2026.\"\n\n"
                f"[BODY - 0:05-0:35]\n"
                f"{points_str}\n\n"
                f"[CTA - 0:35-0:45]\n"
                f"\"{strategy.cta_recommendation}\""
            )
            caption = f"Quick breakdown of {source_title}. {strategy.cta_recommendation}"

        elif platform == "email":
            title = f"[Deep Dive] {source_title}"
            body = (
                f"Hey Friend,\n\n"
                f"Over the past few weeks, one topic keeps coming up: {brief.core_idea}.\n\n"
                f"{brief.summary}\n\n"
                f"### What You Need to Know\n"
                f"{points_str}\n\n"
                f"Let me know if this resonates with your current workflow.\n\n"
                f"Best,\n"
                f"{self.context.brand_name}"
            )
            caption = None

        else:
            # Generic fallback
            title = source_title
            body = f"{source_title}\n\n{brief.summary}\n\n{points_str}\n\n{strategy.cta_recommendation}"
            caption = None

        return {
            "title": title,
            "body": body,
            "caption": caption,
            "cta": strategy.cta_recommendation,
        }
