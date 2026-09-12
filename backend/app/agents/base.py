import asyncio
import json
import logging
import re
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings
from app.models.brand import BrandProfile
from app.schemas.agent import (
    ContentBrief,
    PlatformStrategy,
    CaptionPackage,
    QualityCheckResult,
    QualityIssue,
)

logger = logging.getLogger("uvicorn.error")


class AgentContext:
    def __init__(self, brand_profile: Optional[BrandProfile] = None):
        self.brand_name = (
            brand_profile.name
            if (brand_profile and getattr(brand_profile, "name", None))
            else "Lisa Creator"
        )
        self.tone = (
            brand_profile.tone
            if (brand_profile and getattr(brand_profile, "tone", None))
            else "Authoritative yet conversational"
        )
        self.audience = (
            brand_profile.target_audience
            if (brand_profile and getattr(brand_profile, "target_audience", None))
            else "Founders, Operators, Creators, and Software Engineers"
        )
        self.forbidden_phrases = (
            brand_profile.forbidden_phrases_json
            if (brand_profile and getattr(brand_profile, "forbidden_phrases_json", None))
            else []
        )
        self.preferred_phrases = (
            brand_profile.preferred_phrases_json
            if (brand_profile and getattr(brand_profile, "preferred_phrases_json", None))
            else []
        )
        self.cta_style = (
            brand_profile.cta_style
            if (brand_profile and getattr(brand_profile, "cta_style", None))
            else "value-first question"
        )
        self.emoji_policy = (
            brand_profile.emoji_policy
            if (brand_profile and getattr(brand_profile, "emoji_policy", None))
            else "minimal"
        )
        self.hashtag_policy = (
            brand_profile.hashtag_policy
            if (brand_profile and getattr(brand_profile, "hashtag_policy", None))
            else "curated"
        )


def build_system_prompt(agent_name: str, context: AgentContext) -> str:
    """
    Inject workspace brand guidelines, tone, and forbidden words into the agent's system prompt.
    """
    forbidden_str = ", ".join(context.forbidden_phrases) if context.forbidden_phrases else "None"
    preferred_str = ", ".join(context.preferred_phrases) if context.preferred_phrases else "None"

    return f"""You are the expert {agent_name} for {context.brand_name}.
Brand Tone: {context.tone}
Target Audience: {context.audience}
Forbidden Phrases (NEVER use these): {forbidden_str}
Preferred Vocabulary: {preferred_str}
CTA Style: {context.cta_style}
Emoji Policy: {context.emoji_policy}

CRITICAL RULES:
1. Ground all claims strictly in verified facts provided in the source. NEVER invent unverified facts, customer claims, or fake statistics.
2. Ensure platform-native conventions (sharp hooks, proper whitespace, platform character bounds).
3. Produce valid, well-structured JSON adhering precisely to the required schema.
4. Avoid AI clichés (e.g., 'In today's fast-paced world', 'Unlock your potential', 'Game-changer').
"""


def parse_json_safely(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract and parse JSON from an LLM response even if wrapped in markdown codeblocks.
    """
    if not text:
        return None

    cleaned = text.strip()
    # Strip markdown code blocks
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Search for first '{' and last '}'
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.4,
    json_mode: bool = True,
) -> Optional[str]:
    """
    Asynchronously invoke the configured LLM provider (Groq, OpenAI, Gemini).
    Returns raw string content or None if unavailable/unconfigured.
    """
    # 1. Check Groq API Key
    if settings.GROQ_API_KEY:
        candidate_models = [settings.GROQ_MODEL]
        for fallback_m in ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        for model_name in candidate_models:
            try:
                async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
                    payload: Dict[str, Any] = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": float(temperature),
                    }
                    if json_mode:
                        payload["response_format"] = {"type": "json_object"}

                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"]
                    elif response.status_code == 429:
                        logger.warning(
                            "Groq model %s hit rate limit (429), pausing and trying fallback model...",
                            model_name,
                        )
                        await asyncio.sleep(1.5)
                        continue
                    else:
                        logger.warning(
                            "Groq API error on model %s: status=%s body=%s",
                            model_name,
                            response.status_code,
                            response.text[:120],
                        )
            except Exception as e:
                logger.warning("Groq API call failed for model %s: %s", model_name, e)
                await asyncio.sleep(1)

    # 2. Check OpenAI API Key
    if settings.OPENAI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
                payload = {
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature,
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning("OpenAI API call failed: %s", e)

    return None


class BaseAgent:
    """Base class for all Lisa intelligence and analytics agents."""

    def __init__(self, name: str, version: str = "2.0.0", description: str = ""):
        self.name = name
        self.version = version
        self.description = description

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError
