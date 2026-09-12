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



def get_semantic_visual_fallback(text: str) -> str:
    """
    Keyword & Semantic Word Algorithm:
    Analyzes domain words in text and maps to photorealistic topic-relevant photography.
    Never returns abstract or irrelevant imagery.
    """
    lower = text.lower()
    if any(w in lower for w in ["event", "distributed", "kafka", "queue", "engine", "server", "microservice", "infrastructure", "throughput", "concurrency", "backend", "cluster", "database", "postgres", "sql", "network"]):
        # Enterprise Datacenter / Server Infrastructure
        return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop"
    elif any(w in lower for w in ["ai", "agent", "neural", "llm", "intelligence", "gpt", "model", "algorithm", "prompt", "autonomous", "machine learning", "deep learning", "transformer"]):
        # AI Silicon Chip / Neural Network
        return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop"
    elif any(w in lower for w in ["code", "developer", "software", "programming", "engineer", "api", "git", "typescript", "python", "deploy", "frontend", "fullstack"]):
        # Software Engineering Workstation
        return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
    elif any(w in lower for w in ["finance", "trading", "revenue", "metric", "growth", "scale", "roi", "business", "chart", "analytics", "saas", "fintech", "market"]):
        # Financial Charts & Trading Analytics
        return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop"
    elif any(w in lower for w in ["security", "audit", "compliance", "vulnerability", "auth", "crypto", "firewall", "encryption", "cyber"]):
        # Cybersecurity / Digital Defense
        return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    elif any(w in lower for w in ["design", "ui", "ux", "product", "interface", "experience", "visual", "brand", "figma"]):
        # Product & UI/UX Design Studio
        return "https://images.unsplash.com/photo-1581291518655-9523c932edcf?q=80&w=1200&auto=format&fit=crop"
    else:
        # Modern High-Tech Executive Architecture
        return "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop"


class VisualMediaAgent:
    """
    Agent 6: Visual & Media Production Agent
    Synthesizes creative visual prompts, generates high-res posters/photos
    using Hugging Face FLUX.1 via fal-ai, and designs viral short-form video storyboards.
    """

    def __init__(self):
        self.hf_token = getattr(settings, "HF_TOKEN", "") or os.getenv("HF_TOKEN", "")
        self.model = getattr(settings, "HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell") or "black-forest-labs/FLUX.1-schnell"
        self.provider = getattr(settings, "HF_PROVIDER", "")
        self.client = None

        if self.hf_token:
            try:
                if self.provider:
                    self.client = InferenceClient(
                        provider=self.provider,
                        api_key=self.hf_token,
                    )
                else:
                    self.client = InferenceClient(api_key=self.hf_token)
            except Exception as e:
                logger.warning("Failed to initialize Hugging Face InferenceClient: %s", e)

    def extract_semantic_theme(self, text: str) -> str:
        """
        Deterministic semantic keyword extraction algorithm to identify the concrete domain topic.
        """
        lower = text.lower()
        if any(w in lower for w in ["event", "distributed", "kafka", "queue", "engine", "server", "microservice", "infrastructure", "throughput", "concurrency", "backend", "cluster", "database", "postgres", "sql"]):
            return "high-tech enterprise datacenter server room, glowing fiber optic network cables connecting rack clusters, subtle neon indicator lights, cinematic tech photography, shallow depth of field"
        elif any(w in lower for w in ["ai", "agent", "neural", "llm", "intelligence", "gpt", "model", "algorithm", "prompt", "autonomous"]):
            return "futuristic glowing silicon microchip processor with intricate neural circuit traces, macro electronic photography, soft ambient lighting, clean hyper-detailed 8k resolution"
        elif any(w in lower for w in ["code", "developer", "software", "programming", "engineer", "api", "git", "typescript", "python", "deploy"]):
            return "modern software engineer desk with syntax-highlighted code on ultra-wide curved monitor, mechanical keyboard, clean minimal aesthetics, warm ambient studio desk lamp"
        elif any(w in lower for w in ["finance", "trading", "revenue", "metric", "growth", "scale", "roi", "business", "chart", "analytics", "saas"]):
            return "sleek modern fintech trading desk with multi-monitor data visualization charts, crisp financial analytics graphs, dark mode aesthetics, sunlit glass corporate office"
        elif any(w in lower for w in ["security", "audit", "compliance", "vulnerability", "auth", "crypto", "firewall"]):
            return "cybersecurity digital fortress interface, glowing biometric lock motif, blue and emerald circuit traces, clean futuristic composition"
        elif any(w in lower for w in ["design", "ui", "ux", "product", "interface", "experience", "visual", "brand"]):
            return "minimalist product design studio workspace, architect wireframe sketches on glass desk, modern ergonomic stylus tablet, beautiful warm architectural lighting"
        else:
            return "sleek architectural executive office overlooking city skyline, polished marble desk with minimalist laptop, golden hour sunbeams, editorial commercial photography"

    async def generate_image_prompt(
        self,
        brief: Optional[ContentBrief] = None,
        platform: str = "linkedin",
        strategy: Optional[PlatformStrategy] = None,
        title: str = "",
        body: str = "",
        content_pillar: str = "",
    ) -> str:
        """
        Semantic Prompt Engine for FLUX.1.
        Combines Groq LLM Art Direction with domain keyword entity extraction to ensure
        the generated image is directly, tangibly relevant to the post topic.
        """
        topic_title = title or (brief.core_idea if brief else "Enterprise Technology")
        topic_body = body[:500] if body else (brief.summary if brief else "")
        angle = strategy.angle if strategy else "Authoritative & insightful"
        fallback_theme = self.extract_semantic_theme(f"{topic_title} {topic_body} {content_pillar}")

        system_prompt = (
            "You are an award-winning creative art director and prompt engineer for FLUX.1. "
            "Your job is to generate a tangible, photorealistic image description that is DEEPLY RELEVANT "
            "to the specific technical or business topic of the post. Avoid abstract floating shapes; describe concrete physical subjects (e.g. servers, chips, workspaces, devices, trading desks, blueprints)."
        )
        user_prompt = f"""Write an image generation prompt for FLUX.1.
Topic / Headline: {topic_title}
Post Content Summary: {topic_body}
Audience Angle: {angle}

Strict Rules:
1. Ground the image in a CONCRETE, PHYSICAL SUBJECT directly representing the topic (e.g. if about distributed event systems, describe a server cluster or fiber optic conduits; if about coding, describe an engineer's workstation; if about AI, describe a neural chip or robotics).
2. Detail the exact lighting, camera angle, texture, and aesthetic style.
3. Absolutely NO letters, text, numbers, signs, watermarks, or logos in the image.
4. Keep it to 2-3 vivid sentences.
5. Return ONLY the raw prompt text, no quotes, no preamble.
"""
        try:
            prompt = await call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.5,
                json_mode=False,
            )
            if prompt and len(prompt.strip()) > 15:
                clean_prompt = prompt.strip().replace('"', "")
                return f"{clean_prompt}, 8k resolution, cinematic lighting, award-winning photography, highly detailed"
        except Exception as e:
            logger.warning("LLM image prompt generation error: %s", e)

        # High-relevance deterministic fallback:
        return (
            f"Photorealistic scene illustrating {topic_title}: {fallback_theme}. "
            f"Clean composition, high-end commercial aesthetic, 8k resolution, shot on 35mm lens."
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
