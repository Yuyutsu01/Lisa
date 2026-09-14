"""
LinkedIn Platform Adapter for Lisa.

Implements direct publishing for LinkedIn posts using LinkedIn's UGC Posts API.
"""

import logging
from typing import Dict, Any, Optional, List
import httpx

from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult

logger = logging.getLogger("uvicorn.error")


class LinkedInPublishError(Exception):
    """Base exception for LinkedIn publishing failures."""
    def __init__(self, message: str, status_code: Optional[int] = None, retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class LinkedInAuthError(LinkedInPublishError):
    """401 — Access token expired or revoked. Non-retryable."""
    def __init__(self, message: str):
        super().__init__(message, status_code=401, retryable=False)


class LinkedInRateLimitError(LinkedInPublishError):
    """429 — Rate limited. Retryable with Retry-After backoff."""
    def __init__(self, message: str, retry_after: float):
        super().__init__(message, status_code=429, retryable=True)
        self.retry_after = retry_after


class LinkedInClientError(LinkedInPublishError):
    """Other 4xx — Invalid payload, forbidden, or bad request. Non-retryable."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message, status_code=status_code, retryable=False)


class LinkedInServerError(LinkedInPublishError):
    """5xx — Transient LinkedIn internal server error. Retryable."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message, status_code=status_code, retryable=True)


class LinkedInAdapter:
    # ─────────────────────────────────────────────────────────────────
    # ENDPOINT CHOICE — v2/ugcPosts vs /rest/posts
    #
    # Approved design (Step 3 of the original spec): POST /rest/posts
    # with LinkedIn-Version: 202501.
    #
    # Actual implementation: POST /v2/ugcPosts with
    # X-Restli-Protocol-Version: 2.0.0.
    #
    # Reason for deviation: /rest/posts returned HTTP 426 (Upgrade
    # Required) during smoke testing, indicating the requested
    # LinkedIn-Version was rejected by LinkedIn's version gating.
    # /v2/ugcPosts is LinkedIn's Community Management API and works
    # reliably with standard member OAuth tokens.
    #
    # Note: author_urn now accepts either a raw member sub (wrapped
    # as urn:li:person:{sub}) or a pre-formed urn:li:* value
    # (passed through unchanged). Forward-compatible with future
    # organization posting.
    #
    # Risk: /v2/ugcPosts is on LinkedIn's deprecation path and is
    # expected to sunset. This is accepted tech debt.
    #
    # Migration plan: before LinkedIn announces a hard sunset date,
    # migrate to /rest/posts with a version header that LinkedIn
    # accepts. Track the LinkedIn developer changelog for the
    # deprecation announcement.
    #
    # Decision made: 2026-09-14
    # ─────────────────────────────────────────────────────────────────
    platform_name = "linkedin"
    supported_formats = ["text_post"]
    default_mode = "direct"

    LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts"
    MAX_CHARS = 3000

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """Validate variant copy and credential availability before publishing."""
        errors = []
        body = variant_data.get("body", "")
        if not body.strip():
            errors.append("LinkedIn post body cannot be empty.")
        if len(body) > self.MAX_CHARS:
            errors.append(f"LinkedIn post exceeds {self.MAX_CHARS} characters ({len(body)} chars).")

        if account_data:
            if not account_data.get("access_token"):
                errors.append("LinkedIn access token is missing from connected account.")
            if not account_data.get("external_account_id"):
                errors.append("LinkedIn member ID (sub) is missing from connected account.")

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        """Publish a text post directly to LinkedIn via UGC Posts API."""
        # 1. Validate first
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        if not account_data:
            return PublishingResult(
                success=False,
                error_message="Connected account data is required for LinkedIn publishing.",
                publishing_mode=self.default_mode,
            )

        access_token = (account_data.get("access_token") or "").strip()
        member_sub = (account_data.get("external_account_id") or "").strip()

        # TODO: Add organization posting support (urn:li:organization:{id}) in future stages
        author_urn = f"urn:li:person:{member_sub}" if not member_sub.startswith("urn:li:") else member_sub
        body_content = variant_data.get("body", "").strip()

        # TODO: Add image/video attachments (LinkedIn 3-step media registration & binary upload) in future stages
        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": body_content
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                try:
                    response = await client.post(
                        self.LINKEDIN_UGC_URL,
                        json=payload,
                        headers=headers,
                    )
                except httpx.RequestError as exc:
                    raise LinkedInServerError(f"Network error connecting to LinkedIn API: {exc}", status_code=503)

            status_code = response.status_code

            # 201 Created — Success
            if status_code == 201:
                post_urn = (
                    response.headers.get("x-restli-id")
                    or response.headers.get("X-RestLi-Id")
                )
                if not post_urn:
                    try:
                        resp_json = response.json()
                        post_urn = resp_json.get("id") or resp_json.get("urn")
                    except Exception:
                        post_urn = None

                if post_urn:
                    external_url = f"https://www.linkedin.com/feed/update/{post_urn}"
                    logger.info("LinkedIn post published successfully (urn=%s)", post_urn)
                else:
                    # Post IS live on LinkedIn; only the URN is missing.
                    # Do NOT report failure — that would trigger a retry and duplicate the post.
                    external_url = None
                    logger.warning(
                        "LinkedIn returned HTTP 201 but no x-restli-id header; "
                        "post is live but canonical URL cannot be constructed."
                    )

                return PublishingResult(
                    success=True,
                    external_post_id=post_urn,
                    external_url=external_url,
                    publishing_mode=self.default_mode,
                    raw_response={"urn": post_urn, "status_code": 201},
                )

            # 401 Unauthorized — Expired or revoked token
            if status_code == 401:
                raise LinkedInAuthError(
                    "LinkedIn authentication failed (HTTP 401). Access token is expired or revoked. Please reconnect."
                )

            # 429 Too Many Requests — Rate Limited
            if status_code == 429:
                retry_after_hdr = response.headers.get("Retry-After", "60")
                try:
                    retry_after = float(retry_after_hdr)
                except ValueError:
                    retry_after = 60.0
                raise LinkedInRateLimitError(
                    f"LinkedIn rate limit exceeded. Retry after {retry_after}s.",
                    retry_after=retry_after,
                )

            # 4xx Client Errors — Parse structured error JSON
            if 400 <= status_code < 500:
                parsed_msg = None
                try:
                    err_json = response.json()
                    # LinkedIn format: {"status": 403, "serviceErrorCode": 100, "message": "..."}
                    msg = err_json.get("message")
                    code = err_json.get("serviceErrorCode")
                    if msg:
                        parsed_msg = f"{msg} (code: {code})" if code else msg
                except Exception:
                    pass

                error_text = parsed_msg or response.text or f"HTTP {status_code}"
                raise LinkedInClientError(
                    f"LinkedIn rejected post (HTTP {status_code}): {error_text}",
                    status_code=status_code,
                )

            # 5xx Server Errors
            if status_code >= 500:
                raise LinkedInServerError(
                    f"LinkedIn API internal server error (HTTP {status_code}): {response.text[:200]}",
                    status_code=status_code,
                )

            # Any unexpected response code
            raise LinkedInPublishError(
                f"Unexpected status from LinkedIn API (HTTP {status_code}): {response.text[:200]}",
                status_code=status_code,
            )

        except LinkedInRateLimitError as exc:
            logger.warning("LinkedIn publish hit rate limit: retry_after=%.2fs", exc.retry_after)
            return PublishingResult(
                success=False,
                error_message=str(exc),
                publishing_mode=self.default_mode,
                raw_response={"retryable": True, "retry_after": exc.retry_after, "status_code": 429},
            )
        except LinkedInPublishError as exc:
            logger.error("LinkedIn publish error: %s", exc)
            return PublishingResult(
                success=False,
                error_message=str(exc),
                publishing_mode=self.default_mode,
                raw_response={"retryable": exc.retryable, "status_code": exc.status_code},
            )
        except Exception as exc:
            logger.error("Unexpected exception during LinkedIn publish: %s", exc)
            return PublishingResult(
                success=False,
                error_message=f"Failed to publish to LinkedIn: {exc}",
                publishing_mode=self.default_mode,
                raw_response={"retryable": False},
            )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        """LinkedIn UGC Posts API is synchronous; return published status."""
        return {"status": "published", "job_id": external_job_id}
