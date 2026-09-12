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



# --- Curated Platform-Specific Topic Photography Matrix ---
# Each topic maps to distinct, hand-curated photorealistic imagery customized for each platform's visual culture.

PLATFORM_TOPIC_VISUALS = {
    "distributed_systems": {
        "keywords": [
            "event", "distributed", "kafka", "queue", "engine", "server", "microservice",
            "infrastructure", "throughput", "concurrency", "backend", "cluster", "database",
            "postgres", "sql", "network", "datacenter", "latency", "scale", "cloud", "pipeline",
            "pubsub", "streaming"
        ],
        "linkedin": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",   # Enterprise symmetric server corridor
        "instagram": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop",  # Vibrant glowing fiber optic patch cords with bokeh
        "x": "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?q=80&w=1200&auto=format&fit=crop",          # Server blade clusters with cyan telemetry LEDs
        "discord": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",    # Dark-mode cyberpunk server matrix
        "youtube": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",    # Dynamic high-energy tech conduits
    },
    "ai_machine_learning": {
        "keywords": [
            "ai", "agent", "neural", "llm", "intelligence", "gpt", "model", "algorithm",
            "prompt", "autonomous", "machine learning", "deep learning", "transformer",
            "tensor", "gpu", "inference", "embedding", "vector", "robotics"
        ],
        "linkedin": "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",   # Silicon wafer semiconductor macro
        "instagram": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",  # Glowing aesthetic neon neural brain
        "x": "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",          # Robotic hand assembling neural microchip
        "discord": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200&auto=format&fit=crop",    # Holographic deep learning grid in dark room
        "youtube": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",    # Dynamic robotics lab in motion
    },
    "software_engineering": {
        "keywords": [
            "code", "developer", "software", "programming", "engineer", "api", "git",
            "github", "typescript", "python", "deploy", "frontend", "fullstack", "react",
            "syntax", "refactor", "framework", "component", "nextjs", "javascript"
        ],
        "linkedin": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",   # Executive developer workstation with laptop
        "instagram": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",  # Aesthetic cozy developer desk with plant & ambient lamp
        "x": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",          # Razor-sharp dark-mode IDE code editor
        "discord": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",    # Cyberpunk RGB mechanical keyboard & dev terminal
        "youtube": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200&auto=format&fit=crop",    # High-intensity multi-screen code setup
    },
    "fintech_markets": {
        "keywords": [
            "finance", "trading", "revenue", "metric", "growth", "roi", "business",
            "chart", "analytics", "saas", "fintech", "market", "stock", "crypto",
            "bitcoin", "investment", "economy", "banking", "capital"
        ],
        "linkedin": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop",   # Corporate financial dashboard on glass display
        "instagram": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",  # Aesthetic moody trading desk with candlestick charts
        "x": "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1200&auto=format&fit=crop",          # Clean real-time financial analytics screen
        "discord": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop",    # Crypto blockchain digital ledger in dark mode
        "youtube": "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=1200&auto=format&fit=crop",    # High-energy financial chart trajectory
    },
    "cybersecurity": {
        "keywords": [
            "security", "audit", "compliance", "vulnerability", "auth", "crypto",
            "firewall", "encryption", "cyber", "lock", "protect", "identity", "zero-trust"
        ],
        "linkedin": "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",   # Clean biometric digital fortress circuit
        "instagram": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=1200&auto=format&fit=crop",  # Aesthetic blue and magenta digital matrix
        "x": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",          # Terminal code matrix of cryptographic shield
        "discord": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",    # Hacker workstation with cyber telemetry
        "youtube": "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",    # Dynamic cyber security lock
    },
    "design_product": {
        "keywords": [
            "design", "ui", "ux", "product", "interface", "experience", "visual",
            "brand", "figma", "prototype", "wireframe", "mobile", "app"
        ],
        "linkedin": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop",   # Clean architect design desk with blueprints
        "instagram": "https://images.unsplash.com/photo-1581291518655-9523c932edcf?q=80&w=1200&auto=format&fit=crop",  # Pastel aesthetic mobile UI wireframes with stylus
        "x": "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=1200&auto=format&fit=crop",          # Retina Figma UI layout on Apple monitor
        "discord": "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop",    # Graphic designer tablet in ambient RGB glow
        "youtube": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",    # Dynamic product interface showcase
    },
}


def get_semantic_visual_fallback(text: str, platform: str = "linkedin") -> str:
    """
    Keyword & Semantic Word Algorithm with Platform Differentiation:
    Analyzes domain words in text, determines the concrete topic, and returns
    a photography visual specifically tailored to the visual culture of the target platform.
    """
    lower = text.lower()
    plat = (platform or "linkedin").lower()
    if plat not in ["linkedin", "instagram", "x", "discord", "youtube"]:
        plat = "linkedin"

    best_category = "distributed_systems"
    max_score = -1

    for cat_name, data in PLATFORM_TOPIC_VISUALS.items():
        score = 0
        for kw in data["keywords"]:
            if kw in lower:
                score += 2 if len(kw) > 4 else 1
        if score > max_score:
            max_score = score
            best_category = cat_name

    category = PLATFORM_TOPIC_VISUALS.get(best_category, PLATFORM_TOPIC_VISUALS["distributed_systems"])
    return category.get(plat, category["linkedin"])


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

    def extract_semantic_theme(self, text: str, platform: str = "linkedin") -> str:
        """
        Deterministic semantic keyword extraction algorithm to identify the concrete domain topic,
        differentiated by target platform.
        """
        lower = text.lower()
        plat = (platform or "linkedin").lower()

        if any(w in lower for w in ["event", "distributed", "kafka", "queue", "engine", "server", "microservice", "infrastructure", "throughput", "concurrency", "backend", "cluster", "database", "postgres", "sql"]):
            if plat == "instagram":
                return "aesthetic macro photography of glowing neon fiber optic cables connecting high-speed network ports, vibrant bokeh, studio lighting"
            elif plat in ["x", "twitter"]:
                return "dark mode technical server blade motherboard, glowing cyan status LEDs, razor-sharp hardware blueprint details"
            elif plat == "discord":
                return "cyberpunk dark-mode server rack corridor, ambient magenta and blue neon backlighting, high-tech hacker vibe"
            elif plat == "youtube":
                return "dynamic high-voltage glowing tech conduits, explosive blue data pulses, high-impact cinematic frame"
            else:
                return "high-tech enterprise datacenter server room, symmetric rack clusters, pristine cable management, subtle indicator lights, architectural commercial photography"
        elif any(w in lower for w in ["ai", "agent", "neural", "llm", "intelligence", "gpt", "model", "algorithm", "prompt", "autonomous"]):
            if plat == "instagram":
                return "vibrant glowing neon neural brain model, artistic cyan and purple light flares, aesthetic macro studio shot"
            elif plat in ["x", "twitter"]:
                return "robotic humanoid precision fingers assembling advanced AI microchip processor, high-contrast schematic style"
            elif plat == "discord":
                return "holographic neural network grid floating above a dark developer workstation, cyber green neon ambient glow"
            elif plat == "youtube":
                return "dynamic AI robotics laboratory, gleaming titanium android hand reaching toward glowing energy core"
            else:
                return "futuristic silicon microchip processor with intricate neural circuit traces, macro electronic photography, soft ambient lighting, clean 8k resolution"
        elif any(w in lower for w in ["code", "developer", "software", "programming", "engineer", "api", "git", "typescript", "python", "deploy"]):
            if plat == "instagram":
                return "aesthetic cozy developer desk with mechanical keyboard, green plant, warm ambient monitor backlighting, coffee mug, soft morning light"
            elif plat in ["x", "twitter"]:
                return "ultra-clean dark mode IDE code terminal on curved monitor, high-contrast syntax highlighting, minimal keyboard"
            elif plat == "discord":
                return "cyberpunk developer battle station with dual vertical monitors, custom mechanical keyboard, RGB ambient strip lighting"
            elif plat == "youtube":
                return "dynamic multi-screen software engineering station with animated code deployment graphs and high energy"
            else:
                return "modern software engineer desk with syntax-highlighted code on ultra-wide curved monitor, mechanical keyboard, clean minimal corporate office"
        elif any(w in lower for w in ["finance", "trading", "revenue", "metric", "growth", "scale", "roi", "business", "chart", "analytics", "saas"]):
            if plat == "instagram":
                return "vibrant aesthetic multi-screen trading desk with green and gold candlestick charts, moody studio lighting"
            elif plat in ["x", "twitter"]:
                return "crisp high-resolution real-time market data analytics charts, heatmap matrix, clean modern dark mode"
            else:
                return "sleek modern fintech trading desk with multi-monitor data visualization charts, crisp financial analytics graphs, sunlit glass corporate office"
        else:
            if plat == "instagram":
                return "minimalist creative studio workspace, Apple devices on warm wood desk, golden hour sunbeams, aesthetic lifestyle photography"
            else:
                return "sleek architectural executive office overlooking city skyline, polished marble desk with minimalist laptop, commercial editorial photography"

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
        Combines Groq LLM Art Direction with domain keyword entity extraction and platform-specific
        aesthetic guidance to ensure the generated image is directly relevant to the topic AND
        visually customized for the target platform (LinkedIn vs Instagram vs X vs Discord vs YouTube).
        """
        topic_title = title or (brief.core_idea if brief else "Enterprise Technology")
        topic_body = body[:500] if body else (brief.summary if brief else "")
        angle = strategy.angle if strategy else "Authoritative & insightful"
        plat = (platform or "linkedin").lower()
        fallback_theme = self.extract_semantic_theme(f"{topic_title} {topic_body} {content_pillar}", platform=plat)

        platform_specs = {
            "linkedin": (
                "Target Platform: LinkedIn.\n"
                "Aesthetic Style: Clean, authoritative, symmetric corporate enterprise photography. "
                "Aspect ratio: 16:9 widescreen. Composition: Professional architectural symmetry, high-trust engineering realism, neutral balanced lighting."
            ),
            "instagram": (
                "Target Platform: Instagram.\n"
                "Aesthetic Style: High-contrast, vibrant, artistic visual storytelling. "
                "Aspect ratio: 1:1 square. Composition: Dynamic studio lighting, neon/bokeh highlights, aesthetic shallow depth of field, bold creator/developer atmosphere."
            ),
            "x": (
                "Target Platform: X (Twitter).\n"
                "Aesthetic Style: High-contrast, sharp technical visual. "
                "Aspect ratio: 16:9 landscape. Composition: Dark mode terminal, hardware schematic focus, razor-sharp technical details."
            ),
            "discord": (
                "Target Platform: Discord Community.\n"
                "Aesthetic Style: Cyberpunk dark-mode developer hub. "
                "Aspect ratio: 16:9 banner. Composition: Ambient neon RGB glow, terminal matrix, energetic hacker workstation."
            ),
            "youtube": (
                "Target Platform: YouTube Shorts.\n"
                "Aesthetic Style: High-retention cinematic visual frame. "
                "Aspect ratio: 9:16 vertical short. Composition: High visual velocity, dramatic focal subject, bold contrast."
            ),
        }
        platform_spec = platform_specs.get(plat, platform_specs["linkedin"])

        system_prompt = (
            "You are an award-winning creative art director and prompt engineer for FLUX.1. "
            "Your job is to generate a tangible, photorealistic image description that is DEEPLY RELEVANT "
            "to the specific technical or business topic of the post, customized for the visual culture of the target platform.\n"
            f"{platform_spec}\n"
            "Avoid abstract floating shapes; describe concrete physical subjects (e.g. servers, chips, workspaces, devices, trading desks, blueprints)."
        )
        user_prompt = f"""Write an image generation prompt for FLUX.1.
Topic / Headline: {topic_title}
Post Content Summary: {topic_body}
Target Platform: {plat.upper()}
Audience Angle: {angle}

Strict Rules:
1. Ground the image in a CONCRETE, PHYSICAL SUBJECT directly representing the topic (e.g. if about distributed event systems, describe a server cluster or fiber optic conduits; if about coding, describe an engineer's workstation; if about AI, describe a neural chip or robotics).
2. Follow the platform aesthetic style: {'1:1 square, vibrant artistic lighting' if plat == 'instagram' else '16:9 widescreen, clean authoritative enterprise realism' if plat == 'linkedin' else 'high-contrast dark mode technical'}.
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

        # High-relevance platform-differentiated fallback:
        return (
            f"Photorealistic scene illustrating {topic_title} for {plat.upper()}: {fallback_theme}. "
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
