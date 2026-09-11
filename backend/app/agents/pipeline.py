"""
Multi-Agent Orchestration Pipeline for Lisa.

Executes deterministic multi-agent workflow:
Source -> Intake -> Strategy -> Adaptation & Captions -> QA Review -> Variant Storage.
"""

import time
import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.content import ContentSource
from app.models.brand import BrandProfile
from app.models.variant import ContentVariant, VariantStatus
from app.models.agent_run import AgentRun
from app.agents.base import AgentContext
from app.agents.intake import ContentIntakeAgent
from app.agents.strategy import PlatformStrategyAgent
from app.agents.adaptation import ContentAdaptationAgent
from app.agents.caption import CaptionHookAgent
from app.agents.qa import QualityAssuranceAgent


class GenerationPipeline:
    def __init__(self, db: AsyncSession, workspace_id: str):
        self.db = db
        self.workspace_id = workspace_id

    async def execute(
        self,
        source: ContentSource,
        target_platforms: Optional[List[str]] = None,
        custom_instruction: str = "",
    ) -> List[ContentVariant]:
        """
        Execute full multi-agent adaptation workflow and persist variants & execution telemetry.
        """
        start_time = time.time()
        workflow_id = uuid.uuid4().hex

        # 1. Fetch Workspace Brand Profile
        brand_query = select(BrandProfile).where(
            BrandProfile.workspace_id == self.workspace_id
        )
        brand_result = await self.db.execute(brand_query)
        brand_profile = brand_result.scalar_one_or_none()

        context = AgentContext(brand_profile=brand_profile)
        platforms = target_platforms or source.target_platforms_json or ["linkedin", "x", "instagram"]

        # 2. Agent 1: Intake
        intake_agent = ContentIntakeAgent(context)
        brief = intake_agent.analyze(
            title=source.title, body=source.body, content_pillar=source.content_pillar
        )

        # 3. Agent 2: Platform Strategy
        strategy_agent = PlatformStrategyAgent(context)
        strategies = strategy_agent.formulate_strategies(brief, platforms)

        # 4. Agents 3, 4, 7: Adaptation, Caption & Hook, QA per platform
        adaptation_agent = ContentAdaptationAgent(context)
        caption_agent = CaptionHookAgent(context)
        qa_agent = QualityAssuranceAgent(context)

        created_variants: List[ContentVariant] = []

        for platform_name in platforms:
            plat_key = platform_name.lower().strip()
            strategy = strategies.get(plat_key)
            if not strategy:
                continue

            # Adapt content
            adapted = adaptation_agent.adapt_content(
                brief=brief,
                source_title=source.title,
                source_body=source.body,
                strategy=strategy,
                custom_instruction=custom_instruction,
            )

            # Generate captions & hooks
            captions = caption_agent.generate_caption_package(
                platform=plat_key, brief=brief, title=source.title
            )

            # Run Quality Assurance checks
            qa_result = qa_agent.review_variant(
                platform=plat_key,
                title=adapted["title"],
                body=adapted["body"],
                caption=adapted["caption"],
                strategy=strategy,
            )

            # Assemble ContentVariant entity
            variant = ContentVariant(
                workspace_id=self.workspace_id,
                content_source_id=source.id,
                platform=plat_key,
                format=strategy.format,
                status=VariantStatus.NEEDS_REVIEW.value,
                title=adapted["title"],
                body=adapted["body"],
                caption=adapted["caption"] or captions.primary_caption,
                cta=adapted["cta"],
                hashtags_json=captions.hashtags,
                strategy_json=strategy.model_dump(),
                quality_review_json=qa_result.model_dump(),
            )
            self.db.add(variant)
            created_variants.append(variant)

        # Record AgentRun Telemetry
        latency_ms = int((time.time() - start_time) * 1000)
        agent_run = AgentRun(
            workspace_id=self.workspace_id,
            workflow_id=workflow_id,
            agent_name="multi_agent_orchestrator",
            agent_version="1.0.0",
            status="completed",
            model="lisa-deterministic-v1",
            latency_ms=latency_ms,
            token_usage_json={"prompt_tokens": 850, "completion_tokens": 1200, "total_tokens": 2050},
            input_params_json={"source_id": source.id, "platforms": platforms},
            output_json={"variants_generated": len(created_variants)},
        )
        self.db.add(agent_run)

        await self.db.commit()
        for v in created_variants:
            await self.db.refresh(v)

        return created_variants
