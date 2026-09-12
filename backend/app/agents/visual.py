import os
import uuid
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from huggingface_hub import InferenceClient

from app.core.config import settings
from app.core.storage import UPLOAD_DIR
from app.agents.base import call_llm, parse_json_safely
from app.schemas.agent import ContentBrief, PlatformStrategy

logger = logging.getLogger("uvicorn.error")


class VisualMediaAgent:
    """
    Agent 6: Visual & Media Production Agent
    Synthesizes creative visual prompts, generates high-res posters/photos
    using Hugging Face FLUX.1 via fal-ai, and designs viral short-form video storyboards.
    """

    def __init__(self):
        self.hf_token = getattr(settings, "HF_TOKEN", "") or os.getenv("HF_TOKEN", "")
        self.model = getattr(settings, "HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-Krea-dev")
        self.provider = getattr(settings, "HF_PROVIDER", "fal-ai")
        self.client = None

        if self.hf_token:
            try:
                self.client = InferenceClient(
                    provider=self.provider,
                    api_key=self.hf_token,
                )
            except Exception as e:
                logger.warning("Failed to initialize Hugging Face InferenceClient: %s", e)

    async def generate_image_prompt(
        self,
        brief: ContentBrief,
        platform: str,
        strategy: PlatformStrategy,
    ) -> str:
        """
        Use Groq LLM to design an optimal, descriptive prompt for FLUX.1.
        """
        system_prompt = (
            "You are an expert creative art director and prompt engineer for AI image generation (FLUX.1). "
            "Your task is to write a single photorealistic, visually captivating image prompt representing the post's core message."
        )
        user_prompt = f"""Create a prompt for FLUX.1 text-to-image generator.
Platform: {platform}
Post Core Idea: {brief.core_idea}
Audience Angle: {strategy.angle}

Rules:
1. Provide a detailed, artistic visual description: subject, mood, lighting, background, aesthetic style.
2. The image MUST NOT have text, letters, logos, or words rendered inside it.
3. Keep it to 2-3 vivid sentences.
4. Output ONLY the raw prompt text, no introductory text, no quotes.
"""
        try:
            prompt = await call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.6,
                json_mode=False,
            )
            if prompt and len(prompt.strip()) > 10:
                return prompt.strip().replace('"', "")
        except Exception as e:
            logger.warning("LLM image prompt generation error: %s", e)

        return (
            f"Vibrant, cinematic, modern photorealistic concept visual illustrating {brief.core_idea}. "
            f"Dramatic studio lighting, clean composition, 8k resolution, award-winning photography."
        )

    def generate_photo(
        self,
        prompt: str,
        variant_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Calls Hugging Face FLUX.1 and saves the image to the uploads directory.
        Returns the web-accessible URL (e.g. /uploads/variant_123.png).
        """
        if not self.client:
            logger.warning("VisualMediaAgent client not initialized (HF_TOKEN missing).")
            return None

        var_id = variant_id or uuid.uuid4().hex
        filename = f"variant_{var_id}.png"
        filepath = UPLOAD_DIR / filename

        try:
            logger.info("Calling Hugging Face FLUX.1 for prompt: %s", prompt[:80])
            # Client returns a PIL.Image
            image = self.client.text_to_image(
                prompt,
                model=self.model,
            )
            image.save(filepath, format="PNG")
            logger.info("Successfully generated and saved image to %s", filepath)
            return f"/uploads/{filename}"
        except Exception as e:
            logger.warning("Primary provider image generation failed (%s), falling back to free FLUX.1-schnell...", e)
            try:
                # Free serverless fallback (does not deplete third-party provider credits)
                fallback_client = InferenceClient(api_key=self.hf_token)
                image = fallback_client.text_to_image(
                    prompt,
                    model="black-forest-labs/FLUX.1-schnell",
                )
                image.save(filepath, format="PNG")
                logger.info("Fallback FLUX.1-schnell image saved to %s", filepath)
                return f"/uploads/{filename}"
            except Exception as fb_err:
                logger.error("Fallback image generation failed: %s", fb_err)
                return None

    async def generate_video_short_spec(
        self,
        brief: ContentBrief,
        title: str,
    ) -> Dict[str, Any]:
        """
        Synthesizes a 30-45s vertical video specification for YouTube Shorts, Reels, or TikTok.
        Returns hook, scene-by-scene visual descriptions, timestamps, voiceover, and text overlays.
        """
        system_prompt = (
            "You are an elite short-form video creator and scriptwriter for YouTube Shorts, TikTok, and Reels. "
            "You craft high-retention hooks and dynamic scene-by-scene storyboards."
        )
        user_prompt = f"""Design a high-performing 30-45 second vertical Short (9:16) based on this content:
Title: {title}
Core Idea: {brief.core_idea}
Key Points: {brief.key_points or brief.key_insights}

Return a valid JSON object matching this schema:
{{
  "hook_first_3_seconds": "Visually striking hook action + punchy first sentence",
  "soundtrack_mood": "e.g. Energetic upbeat synthwave / cinematic lo-fi beats",
  "text_overlays": ["HOOK PHRASE", "KEY POINT 1", "ACTION STEP"],
  "scenes": [
    {{
      "timestamp": "0:00 - 0:05",
      "visual_prompt": "Scene 1 visual & camera direction",
      "voiceover": "Spoken voiceover script"
    }},
    {{
      "timestamp": "0:05 - 0:15",
      "visual_prompt": "Scene 2 visual & camera direction",
      "voiceover": "Spoken voiceover script"
    }},
    {{
      "timestamp": "0:15 - 0:30",
      "visual_prompt": "Scene 3 visual & camera direction",
      "voiceover": "Spoken voiceover script"
    }},
    {{
      "timestamp": "0:30 - 0:40",
      "visual_prompt": "Closing call-to-action visual",
      "voiceover": "Closing punchline and follow CTA"
    }}
  ]
}}
"""
        try:
            raw = await call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.4,
                json_mode=True,
            )
            if raw:
                parsed = parse_json_safely(raw)
                if parsed and "scenes" in parsed:
                    return parsed
        except Exception as e:
            logger.warning("Failed to generate video short storyboard: %s", e)

        # Fallback storyboard structure
        return {
            "hook_first_3_seconds": f"Stop scrolling! Here is what you need to know about {title} 🚨",
            "soundtrack_mood": "Modern cinematic lo-fi with heavy kick",
            "text_overlays": [title.upper(), "THE BREAKTHROUGH", "FOLLOW FOR MORE"],
            "scenes": [
                {
                    "timestamp": "0:00 - 0:05",
                    "visual_prompt": "Fast zoom-in on a creator talking directly to camera with dynamic captions",
                    "voiceover": f"Did you know {brief.core_idea}? Most people get this completely backwards.",
                },
                {
                    "timestamp": "0:05 - 0:20",
                    "visual_prompt": "B-roll montage demonstrating the core insight with animated icons",
                    "voiceover": f"Here is the breakdown: {brief.summary}",
                },
                {
                    "timestamp": "0:20 - 0:35",
                    "visual_prompt": "Screen walkthrough / actionable graphic highlighting the main benefit",
                    "voiceover": "When you implement this, you unlock 10x better results instantly.",
                },
                {
                    "timestamp": "0:35 - 0:45",
                    "visual_prompt": "Creator points down at comment section with pulsing follow button",
                    "voiceover": "Save this short and drop a comment below with your thoughts!",
                },
            ],
        }
