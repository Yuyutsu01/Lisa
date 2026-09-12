"""
Agent 2: Platform Strategy Agent for Lisa.

Determines the optimal platform angle, format, hook style, and length
recommendations for each target distribution channel.
"""

from typing import List, Dict, Any
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import ContentBrief, PlatformStrategy


PLATFORM_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "linkedin": {
        "format": "text_post",
        "angle": "Executive insight + first-principles takeaway + conversational debate",
        "hook_style": "Contrarian observation with strong line-break whitespace",
        "target_length_chars": 1300,
        "cta": "What has been your team's experience with this in production?",
        "media_required": False,
        "writing_rules": [
            "Strong 1-line hook that creates an open curiosity loop.",
            "Short, scannable paragraphs (1-2 sentences each).",
            "Use bullet points for actionable steps or principles.",
            "Natural professional tone without corporate jargon or buzzwords.",
            "Avoid clichés: 'In today's fast-paced world', 'Unlock your potential', 'Game-changing'.",
            "Maximum 3 highly relevant hashtags placed at bottom.",
        ],
    },
    "x": {
        "format": "thread",
        "angle": "Punchy hook + compact insights + high-density takeaway",
        "hook_style": "Bold declarative statement with immediate intrigue",
        "target_length_chars": 280,
        "cta": "Repost to share with your network 🔁",
        "media_required": False,
        "writing_rules": [
            "Hook must fit in the first tweet and stop the scroll.",
            "Number tweets cleanly (e.g. 1/4, 2/4) if structured as a thread.",
            "Short sentences with zero fluff.",
            "No more than 1 hashtag.",
            "No generic engagement bait.",
        ],
    },
    "instagram": {
        "format": "carousel",
        "angle": "Visual multi-slide breakdown + digestible summary + saveable CTA",
        "hook_style": "Bold headline suitable for Slide 1 cover graphic",
        "target_length_chars": 900,
        "cta": "Save this post for your next project 📌",
        "media_required": True,
        "writing_rules": [
            "Structure as a clear slide-by-slide storyboard (Slide 1 to Slide 5).",
            "Keep slide text under 40 words per slide for visual clarity.",
            "Write a readable caption that summarizes the core lesson.",
            "3-5 targeted hashtags.",
        ],
    },
    "threads": {
        "format": "text_post",
        "angle": "Authentic founder/practitioner thought + open community question",
        "hook_style": "Casual observation",
        "target_length_chars": 500,
        "cta": "What do you think?",
        "media_required": False,
        "writing_rules": [
            "Casual, personal voice.",
            "No promotional hashtags.",
        ],
    },
    "email": {
        "format": "newsletter",
        "angle": "Behind-the-scenes narrative + structured deep dive + direct response",
        "hook_style": "Intriguing subject line + personal conversational opening",
        "target_length_chars": 2200,
        "cta": "Hit reply and let me know your thoughts",
        "media_required": False,
        "writing_rules": [
            "Subject line with high open-rate curiosity.",
            "Personal 1-on-1 opening.",
            "Subheaded sections for clear reading flow.",
            "Warm personal sign-off from brand author.",
        ],
    },
    "blog": {
        "format": "article",
        "angle": "Comprehensive architectural/strategic guide with code or framework breakdown",
        "hook_style": "Executive summary with thesis statement",
        "target_length_chars": 3500,
        "cta": "Explore our full technical documentation and case studies",
        "media_required": False,
        "writing_rules": [
            "Structured H2 and H3 markdown hierarchy.",
            "Clear implementation steps or framework rules.",
            "Conclusion summarizing next steps.",
        ],
    },
}


class PlatformStrategyAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Platform Strategy Agent", context)

    async def formulate_strategies(
        self, brief: ContentBrief, target_platforms: List[str]
    ) -> Dict[str, PlatformStrategy]:
        """
        Produce tailored strategy models for each requested platform.
        """
        strategies: Dict[str, PlatformStrategy] = {}

        for plat in target_platforms:
            plat_key = plat.lower().strip()
            defaults = PLATFORM_DEFAULTS.get(
                plat_key,
                {
                    "format": "text_post",
                    "angle": "Insightful summary for community discussion",
                    "hook_style": "Direct value statement",
                    "target_length_chars": 1000,
                    "cta": f"Follow for more insights on {self.context.brand_name}",
                    "media_required": False,
                    "writing_rules": ["Clear, concise, and professional presentation."],
                },
            )

            # Build tailored platform strategy
            strategy = PlatformStrategy(
                platform=plat_key,
                format=defaults["format"],
                angle=defaults["angle"],
                hook_style=defaults["hook_style"],
                target_length_chars=defaults["target_length_chars"],
                cta_recommendation=defaults["cta"],
                media_required=defaults["media_required"],
                writing_rules=defaults.get("writing_rules", []),
            )
            strategies[plat_key] = strategy

        return strategies
