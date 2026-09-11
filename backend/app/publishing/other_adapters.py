"""
Threads, Email Newsletter, and Blog CMS Platform Adapters for Lisa.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class ThreadsAdapter:
    platform_name = "threads"
    supported_formats = ["text_post", "media_post"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        body = variant_data.get("body", "")
        if not body.strip():
            errors.append("Threads post body cannot be empty.")
        if len(body) > 500:
            errors.append(f"Threads post exceeds 500 characters ({len(body)} chars).")
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        thread_id = f"th_{uuid.uuid4().hex[:12]}"
        return PublishingResult(
            success=True,
            external_post_id=thread_id,
            external_url=f"https://www.threads.net/t/{thread_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "published", "id": thread_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "published", "job_id": external_job_id}


class EmailAdapter:
    platform_name = "email"
    supported_formats = ["newsletter", "broadcast"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        body = variant_data.get("body", "")
        title = variant_data.get("title", "")
        if not title.strip():
            errors.append("Email subject line cannot be empty.")
        if not body.strip():
            errors.append("Email body cannot be empty.")
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        campaign_id = f"msg_{uuid.uuid4().hex[:14]}"
        return PublishingResult(
            success=True,
            external_post_id=campaign_id,
            external_url=f"https://email.app/campaigns/{campaign_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "queued_for_send", "campaign_id": campaign_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "delivered", "job_id": external_job_id}


class BlogAdapter:
    platform_name = "blog"
    supported_formats = ["article", "post"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        body = variant_data.get("body", "")
        title = variant_data.get("title", "")
        if not title.strip():
            errors.append("Blog post title cannot be empty.")
        if not body.strip():
            errors.append("Blog post content cannot be empty.")
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        post_id = str(uuid.uuid4().int % 100000)
        slug = variant_data.get("title", "post").lower().replace(" ", "-")[:40]
        return PublishingResult(
            success=True,
            external_post_id=post_id,
            external_url=f"https://blog.brand.com/p/{slug}",
            publishing_mode=self.default_mode,
            raw_response={"status": "published", "postId": post_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "published", "job_id": external_job_id}
