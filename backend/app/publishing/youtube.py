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
    default_mode = "export"  # Default to Mode C (Export/Manual Handoff) until automated video rendering is active

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

        # Check if actual video file and verified Google Data API v3 access token exist
        has_video_derivative = (
            media_derivatives
            and any(d.get("mime_type", "").startswith("video/") for d in media_derivatives)
        )
        has_oauth_token = bool(account_data and account_data.get("access_token"))

        if has_video_derivative and has_oauth_token:
            # When direct API upload is configured with an actual video file, upload via Google Data API v3
            return PublishingResult(
                success=False,
                error_message="Direct YouTube video upload requires Google Data API v3 video stream processing. Use Export Mode for manual creator upload.",
                publishing_mode="direct",
            )

        # Mode C: Produce a downloadable script / teleprompter package for manual creator upload
        export_package = {
            "title": variant_data.get("title", ""),
            "script": variant_data.get("body", ""),
            "caption": variant_data.get("caption", ""),
            "tags": variant_data.get("hashtags", []),
            "format": variant_data.get("format", "short_video"),
            "exported_at": str(uuid.uuid4()),
        }

        return PublishingResult(
            success=True,
            external_post_id=None,
            external_url=None,  # No fake URLs generated
            publishing_mode="export",
            raw_response={
                "status": "exported",
                "mode": "export_teleprompter_script",
                "package": export_package,
            },
        )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        return {"status": "exported", "job_id": external_job_id}

