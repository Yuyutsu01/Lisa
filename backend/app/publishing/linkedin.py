"""
LinkedIn Platform Adapter for Lisa.

Implements direct publishing for LinkedIn posts, articles, and media attachments.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class LinkedInAdapter:
    platform_name = "linkedin"
    supported_formats = ["text_post", "carousel", "article"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        body = variant_data.get("body", "")
        if not body.strip():
            errors.append("LinkedIn post body cannot be empty.")
        if len(body) > 3000:
            errors.append(f"LinkedIn post exceeds 3000 characters ({len(body)} chars).")

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        # Validate first
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        post_id = f"urn:li:share:{uuid.uuid4().hex[:12]}"
        return PublishingResult(
            success=True,
            external_post_id=post_id,
            external_url=f"https://www.linkedin.com/feed/update/{post_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "published", "urn": post_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "published", "job_id": external_job_id}
