"""
Test Suite for Lisa Multi-Agent Quality Pipeline, 10-Point Scorecard, and Revision Loop.
"""

import pytest
from app.agents.base import AgentContext
from app.agents.intake import ContentIntakeAgent
from app.agents.strategy import PlatformStrategyAgent
from app.agents.adaptation import ContentAdaptationAgent
from app.agents.qa import QualityAssuranceAgent
from app.models.brand import BrandProfile


@pytest.mark.asyncio
async def test_source_analyst_semantic_extraction():
    """Verify that the Source Analyst extracts core thesis, takeaways, and CTA options."""
    context = AgentContext()
    agent = ContentIntakeAgent(context)

    title = "Scaling Distributed Vector Databases"
    body = """Distributed vector databases require robust index partitioning.
First, sharding by vector cluster reduces query latency by 45%.
Second, applying scalar quantization compresses memory footprint without degrading recall.
For example, a 100M vector index reduced RAM consumption from 120GB to 32GB in production testing."""

    brief = await agent.analyze(title=title, body=body, content_pillar="Infrastructure")

    assert brief.core_idea is not None
    assert len(brief.key_points) >= 2
    assert len(brief.call_to_action_options) > 0
    assert "Infrastructure" in brief.content_pillars


@pytest.mark.asyncio
async def test_platform_strategy_writing_rules():
    """Verify that PlatformStrategyAgent produces tailored rules per channel."""
    context = AgentContext()
    agent = ContentIntakeAgent(context)
    brief = await agent.analyze("Async Task Orchestration", "How to manage background jobs with backoff.")

    strat_agent = PlatformStrategyAgent(context)
    strategies = await strat_agent.formulate_strategies(brief, ["linkedin", "x", "instagram", "youtube"])

    assert "linkedin" in strategies
    assert "x" in strategies
    assert "instagram" in strategies
    assert "youtube" in strategies

    assert len(strategies["linkedin"].writing_rules) > 0
    assert strategies["x"].target_length_chars == 280
    assert strategies["instagram"].media_required is True


@pytest.mark.asyncio
async def test_platform_writer_and_qa_10point_evaluation():
    """Verify platform-specific writers and that the QA score reflects actual checks."""
    context = AgentContext()
    intake = ContentIntakeAgent(context)
    brief = await intake.analyze(
        "First-Principles Content Repurposing",
        "Converting long-form engineering essays into 10 platform artifacts reduces production overhead.",
    )

    strat_agent = PlatformStrategyAgent(context)
    strategies = await strat_agent.formulate_strategies(brief, ["linkedin", "x"])

    writer = ContentAdaptationAgent(context)
    qa = QualityAssuranceAgent(context)

    # 1. LinkedIn Generation & Review
    li_content = await writer.adapt_content(brief, "First-Principles Content Repurposing", "", strategies["linkedin"])
    assert li_content["body"] is not None
    assert "First-Principles Content Repurposing" in li_content["title"] or "First-Principles" in li_content["body"]

    li_qa = await qa.review_variant(
        platform="linkedin",
        title=li_content["title"],
        body=li_content["body"],
        caption=li_content["caption"],
        strategy=strategies["linkedin"],
        brief=brief,
    )
    assert li_qa.quality_score >= 0.70
    assert len(li_qa.check_items) == 10
    assert li_qa.checks["brand_voice"] == "pass"

    # 2. X Single Post Generation & Review
    x_content = await writer.adapt_content(brief, "First-Principles Content Repurposing", "", strategies["x"])
    assert x_content["body"] is not None

    x_qa = await qa.review_variant(
        platform="x",
        title=x_content["title"],
        body=x_content["body"],
        caption=x_content["caption"],
        strategy=strategies["x"],
        brief=brief,
    )
    assert x_qa.quality_score >= 0.70


@pytest.mark.asyncio
async def test_qa_forbidden_phrase_and_cliche_penalty():
    """Verify that forbidden brand phrases and clichés correctly trigger score deductions and issues."""
    brand = BrandProfile(
        name="TechCorp",
        forbidden_phrases_json=["synergy", "cheap tool", "crypto guru"],
    )
    context = AgentContext(brand_profile=brand)
    qa = QualityAssuranceAgent(context)

    strat_agent = PlatformStrategyAgent(context)
    intake = ContentIntakeAgent(context)
    brief = await intake.analyze("Sample Topic", "Sample Body")
    strategies = await strat_agent.formulate_strategies(brief, ["linkedin"])

    # Text containing forbidden phrase and cliché
    bad_body = "In today's fast-paced world, we offer a cheap tool to unlock your potential and build synergy."

    qa_result = await qa.review_variant(
        platform="linkedin",
        title="Bad Post",
        body=bad_body,
        caption=None,
        strategy=strategies["linkedin"],
        brief=brief,
    )

    # Score must be severely reduced
    assert qa_result.quality_score < 0.70
    assert qa_result.needs_regeneration is True
    assert any(i.severity == "error" for i in qa_result.issues)
    assert len(qa_result.improvement_suggestions) > 0
