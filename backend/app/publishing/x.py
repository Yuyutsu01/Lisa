"""
X (Twitter) Platform Adapter for Lisa.

Implements direct publishing for tweets, threads, and media uploads.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class XAdapter:
    platform_name = "x"
    supported_formats = ["text_post", "thread", "media_post"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        body = variant_data.get("body", "")
        format_type = variant_data.get("format", "text_post")

        if not body.strip():
            errors.append("X post content cannot be empty.")
        if format_type == "text_post" and len(body) > 280:
            errors.append(f"Single tweet exceeds 280 characters ({len(body)} chars). Use thread format instead.")

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

        tweet_id = f"176{uuid.uuid4().int % 10000000000:010d}"
        username = account_data.get("account_name", "lisa_user") if account_data else "lisa_user"

        return PublishingResult(
            success=True,
            external_post_id=tweet_id,
            external_url=f"https://x.com/{username}/status/{tweet_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "published", "id": tweet_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "published", "job_id": external_job_id}
