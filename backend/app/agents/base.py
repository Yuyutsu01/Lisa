"""
Base Agent and Model Abstraction for Lisa.

Provides brand context injection, prompt templating, and deterministic LLM execution.
Designed so that external LLM APIs (OpenAI, Gemini, Anthropic) or local deterministic
execution can be routed seamlessly without changing application code.
"""

from typing import Dict, Any, List, Optional
from app.models.brand import BrandProfile
from app.schemas.agent import ContentBrief, PlatformStrategy, CaptionPackage, QualityCheckResult


class AgentContext:
    def __init__(self, brand_profile: Optional[BrandProfile] = None):
        self.brand_name = brand_profile.name if brand_profile else "Lisa Creator"
        self.tone = brand_profile.tone if brand_profile else "Professional yet approachable"
        self.audience = brand_profile.target_audience if brand_profile else "Founders, Creators, and Developers"
        self.forbidden_phrases = brand_profile.forbidden_phrases_json if brand_profile else []
        self.preferred_phrases = brand_profile.preferred_phrases_json if brand_profile else []
        self.cta_style = brand_profile.cta_style if brand_profile else "soft"
        self.emoji_policy = brand_profile.emoji_policy if brand_profile else "limited"
        self.hashtag_policy = brand_profile.hashtag_policy if brand_profile else "optional"


def build_system_prompt(agent_name: str, context: AgentContext) -> str:
    """
    Inject workspace brand guidelines, tone, and forbidden words into the agent's system prompt.
    """
    forbidden_str = ", ".join(context.forbidden_phrases) if context.forbidden_phrases else "None"
    preferred_str = ", ".join(context.preferred_phrases) if context.preferred_phrases else "None"

    return f"""You are the {agent_name} for {context.brand_name}.
Brand Tone: {context.tone}
Target Audience: {context.audience}
Forbidden Phrases (NEVER use these): {forbidden_str}
Preferred Phrases: {preferred_str}
CTA Style: {context.cta_style}
Emoji Policy: {context.emoji_policy}

CRITICAL RULES:
1. Adapt the format and tone, but NEVER invent unverified facts, customer claims, or fake statistics.
2. Ensure platform-native conventions (hooks for X/LinkedIn, concise hashtags, etc.).
3. Produce valid, well-structured output adhering to the required schema.
"""


class BaseAgent:
    """Base class for all Lisa intelligence and analytics agents."""
    def __init__(self, name: str, version: str = "1.0.0", description: str = ""):
        self.name = name
        self.version = version
        self.description = description

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError
