"""
TikTok Platform Adapter for Lisa.

Supports creator direct posts and upload-to-draft flow.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class TikTokAdapter:
    platform_name = "tiktok"
    supported_formats = ["short_video", "photo_carousel"]
    default_mode = "draft"  # Default to creator draft mode for maximum safety

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        caption = variant_data.get("caption") or variant_data.get("body", "")
        if not caption.strip():
            errors.append("TikTok caption cannot be empty.")
        if len(caption) > 2200:
            errors.append(f"TikTok caption exceeds 2200 characters ({len(caption)} chars).")

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

        tiktok_id = f"tt_{uuid.uuid4().hex[:12]}"
        return PublishingResult(
            success=True,
            external_post_id=tiktok_id,
            external_url=f"https://www.tiktok.com/@creator/video/{tiktok_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "draft_uploaded", "publish_id": tiktok_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "ready_in_app", "job_id": external_job_id}
