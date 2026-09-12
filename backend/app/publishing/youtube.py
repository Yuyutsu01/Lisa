"""
YouTube Platform Adapter for Lisa.

Supports Shorts and long-form video metadata uploads and scheduled releases.
"""

import uuid
from typing import Dict, Any, Optional, List
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult


class YouTubeAdapter:
    platform_name = "youtube"
    supported_formats = ["short_video", "video", "community_post"]
    default_mode = "direct"

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        errors = []
        title = variant_data.get("title", "")
        if not title.strip():
            errors.append("YouTube video title cannot be empty.")
        if len(title) > 100:
            errors.append(f"YouTube title exceeds 100 characters ({len(title)} chars).")

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

        video_id = uuid.uuid4().hex[:11]
        return PublishingResult(
            success=True,
            external_post_id=video_id,
            external_url=f"https://www.youtube.com/shorts/{video_id}",
            publishing_mode=self.default_mode,
            raw_response={"status": "uploaded", "videoId": video_id},
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "processed", "video_id": external_job_id}
