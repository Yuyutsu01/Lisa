"""
Publishing Service Orchestrator for Lisa.

Coordinates validation, adapter routing, execution, record creation, and status transitions.
"""

from datetime import datetime, timezone
import hashlib
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.variant import ContentVariant, VariantStatus
from app.models.publishing_job import PublishingJob, JobStatus
from app.models.connection import ConnectedAccount, PublishedRecord
from app.publishing.registry import AdapterRegistry
from app.publishing.base import PublishingResult


from app.models.trusted_automation import TrustedAutomationRule


class PublishingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_publish(
        self,
        variant_id: str,
        workspace_id: str,
        connected_account_id: Optional[str] = None,
    ) -> PublishingResult:
        """
        Execute publishing of a variant to its target platform adapter.
        Enforces Section 23 Human-In-The-Loop and policy guardrails.
        """
        # 1. Fetch Variant
        var_query = select(ContentVariant).where(ContentVariant.id == variant_id)
        var_res = await self.db.execute(var_query)
        variant = var_res.scalar_one_or_none()

        if not variant:
            return PublishingResult(
                success=False, error_message="Variant not found"
            )

        # Guardrail 1: Block policy_flagged variants
        if variant.status == VariantStatus.POLICY_FLAGGED.value:
            return PublishingResult(
                success=False,
                error_message="Publishing blocked: Variant is policy_flagged. Human editorial override is required before publishing.",
            )

        # Guardrail 2: Human-In-The-Loop (HITL) Enforcement (Section 23 & 15.1)
        is_human_approved = (
            variant.status == VariantStatus.APPROVED.value
            and getattr(variant, "approved_by", None) is not None
        )

        trusted_rule_id = None
        if not is_human_approved:
            # Check for active, unexpired Trusted Automation Rule
            now_utc = datetime.now(timezone.utc)
            rule_query = select(TrustedAutomationRule).where(
                TrustedAutomationRule.workspace_id == workspace_id,
                TrustedAutomationRule.platform == variant.platform,
                TrustedAutomationRule.format == variant.format,
                TrustedAutomationRule.is_active == True,
                TrustedAutomationRule.expires_at > now_utc,
            )
            rule_res = await self.db.execute(rule_query)
            matching_rule = rule_res.scalar_one_or_none()

            if not matching_rule:
                return PublishingResult(
                    success=False,
                    error_message="Publishing blocked by Human-In-The-Loop guardrail: Variant requires explicit human approval or an active, unexpired Trusted Automation rule (Section 23).",
                )
            trusted_rule_id = matching_rule.id

        adapter = AdapterRegistry.get_adapter(variant.platform)
        if not adapter:
            return PublishingResult(
                success=False,
                error_message=f"No adapter available for platform: {variant.platform}",
            )

        # 2. Fetch Connected Account (if provided)
        account_data = None
        if connected_account_id:
            acc_query = select(ConnectedAccount).where(
                ConnectedAccount.id == connected_account_id
            )
            acc_res = await self.db.execute(acc_query)
            account = acc_res.scalar_one_or_none()
            if account:
                account_data = {
                    "account_name": account.account_name,
                    "external_account_id": account.external_account_id,
                    "access_token": account.access_token_encrypted,
                    "metadata": account.metadata_json or {},
                    "metadata_json": account.metadata_json or {},
                }

        # 3. Create or Fetch Publishing Job
        raw_key = f"{variant.id}_{datetime.now(timezone.utc).isoformat()}_{connected_account_id or 'direct'}"
        idempotency_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

        job = PublishingJob(
            workspace_id=workspace_id,
            content_variant_id=variant.id,
            connected_account_id=connected_account_id,
            scheduled_at=datetime.now(timezone.utc),
            timezone="UTC",
            status=JobStatus.PUBLISHING.value,
            idempotency_key=idempotency_key,
        )
        self.db.add(job)
        await self.db.flush()

        # 4. Dispatch to Platform Adapter
        variant_payload = {
            "title": variant.title,
            "body": variant.body,
            "caption": variant.caption,
            "cta": variant.cta,
            "hashtags": variant.hashtags_json or [],
            "format": variant.format,
        }

        result = await adapter.publish(
            variant_data=variant_payload,
            account_data=account_data,
        )

        # 5. Process Outcome
        if result.success:
            if result.publishing_mode == "export":
                # Mode C: Manual handoff / teleprompter script package exported
                job.status = JobStatus.EXPORTED.value
                job.external_job_id = None
                variant.status = VariantStatus.EXPORTED.value
            else:
                # Mode A: Direct automated API publishing with verified platform response
                job.status = JobStatus.PUBLISHED.value
                job.external_job_id = result.external_post_id
                variant.status = VariantStatus.PUBLISHED.value

                published_record = PublishedRecord(
                    workspace_id=workspace_id,
                    content_variant_id=variant.id,
                    publishing_job_id=job.id,
                    platform=variant.platform,
                    external_post_id=result.external_post_id or "id",
                    external_url=result.external_url or "https://social.platform.com",
                    published_at=datetime.now(timezone.utc),
                    metadata_json=result.raw_response,
                )
                self.db.add(published_record)
        else:
            job.status = JobStatus.FAILED.value
            job.attempt_count += 1
            job.error_json = {"message": result.error_message}

        db_models = [job, variant]
        for m in db_models:
            self.db.add(m)

        await self.db.commit()
        return result
