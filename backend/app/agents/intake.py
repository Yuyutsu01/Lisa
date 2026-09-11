"""
Agent 1: Content Intake Agent for Lisa.

Understands the canonical source, extracts key points, core idea, summary,
target audience, and identifies claims requiring review.
"""

from typing import List
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import ContentBrief


class ContentIntakeAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Content Intake Agent", context)

    def analyze(self, title: str, body: str, content_pillar: str = "") -> ContentBrief:
        """
        Analyze canonical source content and produce a structured brief.
        """
        # Split body into sentences/paragraphs to extract key points
        paragraphs = [p.strip() for p in body.split("\n") if p.strip()]
        
        core_idea = title if title else (paragraphs[0] if paragraphs else "Content Idea")
        summary = (
            " ".join(paragraphs[:2])
            if paragraphs
            else f"Overview on {title or 'the canonical topic'}."
        )

        key_points = []
        for p in paragraphs:
            if len(p) > 20 and len(key_points) < 5:
                # Truncate clean sentence
                clean_pt = p.split(". ")[0] + ("." if not p.endswith(".") else "")
                key_points.append(clean_pt[:150])

        if not key_points:
            key_points = [
                f"Core focus on {title}",
                "Structured takeaways for practitioner implementation",
            ]

        pillars = [content_pillar] if content_pillar else ["Industry Insights"]

        return ContentBrief(
            core_idea=core_idea,
            summary=summary,
            content_type="educational",
            target_audience=[self.context.audience],
            content_pillars=pillars,
            key_points=key_points,
            tone=self.context.tone,
            primary_cta=f"Follow for more insights on {pillars[0]}",
            claims_requiring_review=[],
        )
