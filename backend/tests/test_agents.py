"""
Unit tests for AI Agent components in Lisa.
"""

import pytest
from app.agents.base import AgentContext
from app.agents.intake import ContentIntakeAgent
from app.agents.strategy import PlatformStrategyAgent
from app.agents.adaptation import ContentAdaptationAgent
from app.agents.caption import CaptionHookAgent
from app.agents.qa import QualityAssuranceAgent


def test_agent_intake_and_strategy():
    """Test Intake Agent extracts structured brief and Strategy Agent derives platform models."""
    context = AgentContext()
    intake = ContentIntakeAgent(context)

    title = "Scaling AI Pipelines in Production"
    body = "Building scalable AI systems requires deterministic validation, queue management, and monitoring."

    brief = intake.analyze(title=title, body=body, content_pillar="Architecture")
    assert brief.core_idea == title
    assert len(brief.key_points) >= 1
    assert "Architecture" in brief.content_pillars

    strategy_agent = PlatformStrategyAgent(context)
    strategies = strategy_agent.formulate_strategies(brief, ["linkedin", "x", "instagram", "youtube"])

    assert "linkedin" in strategies
    assert "x" in strategies
    assert strategies["linkedin"].format == "text_post"
    assert strategies["x"].format == "thread"
    assert strategies["instagram"].media_required is True


def test_qa_agent_forbidden_phrase_detection():
    """Test Quality Assurance Agent catches prohibited phrases and computes score penalty."""
    context = AgentContext()
    context.forbidden_phrases = ["synergy", "game changer"]

    qa_agent = QualityAssuranceAgent(context)
    strategy_agent = PlatformStrategyAgent(context)
    brief = ContentIntakeAgent(context).analyze("Post Title", "Body text")
    strat = strategy_agent.formulate_strategies(brief, ["linkedin"])["linkedin"]

    # Clean variant
    clean_result = qa_agent.review_variant(
        platform="linkedin",
        title="Engineering Best Practices",
        body="Deterministic validation is critical for systems.",
        caption="",
        strategy=strat,
    )
    assert clean_result.passed is True
    assert clean_result.quality_score >= 0.9

    # Polluted variant with forbidden phrase
    polluted_result = qa_agent.review_variant(
        platform="linkedin",
        title="Engineering Synergy",
        body="This is a game changer for our workflows.",
        caption="",
        strategy=strat,
    )
    assert polluted_result.passed is False
    assert polluted_result.checks["forbidden_words"] == "fail"
    assert len(polluted_result.issues) >= 1
