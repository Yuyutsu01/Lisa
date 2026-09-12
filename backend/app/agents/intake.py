import re
from typing import List, Dict, Any
from app.agents.base import AgentContext, build_system_prompt, call_llm, parse_json_safely
from app.schemas.agent import ContentBrief


class ContentIntakeAgent:
    """
    Agent 1: Source Analyst
    Understands the canonical source, extracts key points, core idea, summary,
    target audience, supporting facts, and identifies claims requiring review.
    """

    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Source Analyst", context)

    async def analyze(
        self, title: str, body: str, content_pillar: str = ""
    ) -> ContentBrief:
        """
        Analyze canonical source content and produce a structured brief.
        Uses LLM with structured JSON output when available, with semantic rule-based fallback.
        """
        clean_title = (title or "").strip()
        clean_body = (body or "").strip()
        pillar = content_pillar or "Industry Strategy"

        # 1. Attempt LLM Structured Analysis
        llm_user_prompt = f"""Analyze this canonical content source for {self.context.brand_name}:
TITLE: {clean_title}
PILLAR: {pillar}
CONTENT BODY:
{clean_body}

Extract and return valid JSON with these exact keys:
{{
  "core_idea": "One clear, compelling sentence stating the central idea",
  "summary": "2-3 sentence executive summary of the content",
  "key_insights": ["3-5 clear, distinct takeaways or lessons from the text"],
  "supporting_facts": ["Specific facts, examples, or data points mentioned in text"],
  "examples": ["Concrete examples or scenarios mentioned"],
  "target_audience": ["Primary reader persona 1", "Primary reader persona 2"],
  "source_tone": "Tone of source (e.g. analytical, authoritative, instructional)",
  "recommended_angle": "Best angle for distribution",
  "call_to_action_options": ["Option 1", "Option 2"],
  "claims_requiring_review": ["Any unverified or bold claims needing fact checking"]
}}
"""
        raw_llm = await call_llm(
            system_prompt=self.system_prompt,
            user_prompt=llm_user_prompt,
            temperature=0.2,
            json_mode=True,
        )
        if raw_llm:
            parsed = parse_json_safely(raw_llm)
            if parsed and "core_idea" in parsed:
                cta_opts = parsed.get("call_to_action_options", [])
                prim_cta = cta_opts[0] if cta_opts else f"Follow for more insights on {pillar}"
                return ContentBrief(
                    core_idea=parsed.get("core_idea", clean_title or "Canonical Insight"),
                    summary=parsed.get("summary", clean_body[:250]),
                    content_type="educational",
                    key_insights=parsed.get("key_insights", []),
                    supporting_facts=parsed.get("supporting_facts", []),
                    examples=parsed.get("examples", []),
                    key_points=parsed.get("key_insights", []),
                    target_audience=parsed.get("target_audience", [self.context.audience]),
                    content_pillars=[pillar],
                    source_tone=parsed.get("source_tone", self.context.tone),
                    tone=self.context.tone,
                    recommended_angle=parsed.get("recommended_angle", "practical breakdown"),
                    primary_cta=prim_cta,
                    call_to_action_options=cta_opts,
                    claims_requiring_review=parsed.get("claims_requiring_review", []),
                )

        # 2. Semantic Deterministic Extraction (Offline / Fallback)
        paragraphs = [p.strip() for p in clean_body.split("\n") if p.strip()]
        sentences: List[str] = []
        for p in paragraphs:
            for s in re.split(r"(?<=[.!?])\s+", p):
                s_clean = s.strip()
                if len(s_clean) > 15:
                    sentences.append(s_clean)

        core_idea = clean_title if clean_title else (sentences[0] if sentences else "Strategic Framework")
        summary = " ".join(sentences[:3]) if sentences else (clean_title or "Content overview and strategic takeaways.")

        # Extract key points & takeaways
        key_insights: List[str] = []
        supporting_facts: List[str] = []
        examples: List[str] = []

        for s in sentences:
            if any(k in s.lower() for k in ["for example", "e.g.", "such as", "instance"]):
                examples.append(s)
            elif any(k in s.lower() for k in ["%", "increase", "decrease", "million", "billion", "tested", "proves", "shows"]):
                supporting_facts.append(s)
            elif len(key_insights) < 5 and len(s) > 25:
                key_insights.append(s)

        if not key_insights:
            key_insights = [
                f"Core approach to {clean_title or 'the problem statement'}.",
                "Translating high-level strategy into repeatable operating processes.",
                "Deterministic measurement of distribution velocity and impact.",
            ]

        cta_options = [
            f"What has been your team's experience implementing {clean_title or 'this approach'}?",
            f"Save this breakdown for your next planning cycle.",
            f"Follow for more tactical playbooks on {pillar}.",
        ]

        return ContentBrief(
            core_idea=core_idea,
            summary=summary,
            content_type="educational",
            key_insights=key_insights,
            supporting_facts=supporting_facts,
            examples=examples,
            key_points=key_insights,
            target_audience=[self.context.audience],
            content_pillars=[pillar],
            source_tone=self.context.tone,
            tone=self.context.tone,
            recommended_angle="actionable practitioner breakdown",
            primary_cta=cta_options[0],
            call_to_action_options=cta_options,
            claims_requiring_review=[],
        )
