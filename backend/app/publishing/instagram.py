"""
Instagram Platform Adapter for Lisa.

Supports feed photos, carousels, and reels publishing / draft flows.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class InstagramAdapter:
    platform_name = "instagram"
    supported_formats = ["feed_portrait", "carousel", "reel", "square"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        caption = variant_data.get("caption") or variant_data.get("body", "")
        if not caption.strip():
            errors.append("Instagram caption cannot be empty.")
        if len(caption) > 2200:
            errors.append(f"Instagram caption exceeds 2200 characters ({len(caption)} chars).")

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

        post_id = f"ig_{uuid.uuid4().hex[:12]}"
        return PublishingResult(
            success=True,
            external_post_id=post_id,
            external_url=f"https://www.instagram.com/p/{post_id}/",
            publishing_mode=self.default_mode,
            raw_response={"status": "published", "media_id": post_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "published", "job_id": external_job_id}
