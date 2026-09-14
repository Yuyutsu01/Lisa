"""
Threads, Email Newsletter, and Blog CMS Platform Adapters for Lisa.
"""

import uuid
import re
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult

logger = logging.getLogger("uvicorn.error")


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


# ─────────────────────────────────────────────────────────────────
# EMAIL (RESEND) PLATFORM ADAPTER & EXCEPTIONS
# ─────────────────────────────────────────────────────────────────

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailPublishError(Exception):
    """Base exception for Email (Resend) publishing failures."""
    def __init__(self, message: str, status_code: Optional[int] = None, retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class EmailAuthError(EmailPublishError):
    """401 — Invalid or revoked Resend API key. Non-retryable."""
    def __init__(self, message: str):
        super().__init__(message, status_code=401, retryable=False)


class EmailRateLimitError(EmailPublishError):
    """429 — Resend rate limit exceeded. Retryable with backoff."""
    def __init__(self, message: str, retry_after: float):
        super().__init__(message, status_code=429, retryable=True)
        self.retry_after = retry_after


class EmailClientError(EmailPublishError):
    """Other 4xx — Validation or bad request error from Resend. Non-retryable."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message, status_code=status_code, retryable=False)


class EmailServerError(EmailPublishError):
    """5xx — Transient Resend server error. Retryable."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message, status_code=status_code, retryable=True)


class EmailAdapter:
    """
    Platform adapter for direct email publishing via Resend REST API.
    """
    platform_name = "email"
    supported_formats = ["newsletter", "dispatch", "text_post"]
    default_mode = "direct"
    RESEND_URL = "https://api.resend.com/emails"
    MAX_SUBJECT_CHARS = 200
    MAX_BODY_CHARS = 100000

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Validate email recipient, subject, body, and account credentials.
        """
        errors = []
        body = variant_data.get("body", "")
        subject = variant_data.get("title") or ""
        recipient = variant_data.get("recipient_email") or ""

        if not body or not body.strip():
            errors.append("Email body cannot be empty.")
        elif len(body) > self.MAX_BODY_CHARS:
            errors.append(f"Email body exceeds {self.MAX_BODY_CHARS} characters ({len(body)} chars).")

        if not subject or not subject.strip():
            errors.append("Email subject line cannot be empty.")
        elif len(subject) > self.MAX_SUBJECT_CHARS:
            errors.append(f"Email subject exceeds {self.MAX_SUBJECT_CHARS} characters ({len(subject)} chars).")

        if not recipient or not recipient.strip():
            errors.append("recipient_email is required for email publishing.")
        elif not EMAIL_REGEX.match(recipient.strip()):
            errors.append(f"Invalid recipient_email format: '{recipient}'.")

        if not account_data or not account_data.get("access_token"):
            errors.append("Missing Resend API key in connected account data.")

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        """
        Dispatch email payload to Resend POST /emails endpoint.
        """
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        api_key = account_data["access_token"]
        metadata = account_data.get("metadata_json") or account_data.get("metadata") or {}
        from_email = metadata.get("from_email") or "onboarding@resend.dev"
        from_name = metadata.get("from_name") or "Lisa"
        recipient = variant_data["recipient_email"].strip()
        subject = (variant_data.get("title") or "Update from Lisa").strip()
        body = variant_data.get("body", "")

        # TODO(stage2): Add rich HTML templating and markdown-to-HTML conversion
        # TODO: Add CC / BCC recipient support
        # TODO: Add media attachments support
        # TODO: Add bounce and complaint webhook ingestion
        payload = {
            "from": f"{from_name} <{from_email}>",
            "to": [recipient],
            "subject": subject,
            "text": body,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Lisa-Content-Pipeline/1.0",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self.RESEND_URL, headers=headers, json=payload)
        except httpx.RequestError as exc:
            logger.error(f"Network error calling Resend API: {exc}")
            return PublishingResult(
                success=False,
                error_message=f"Network error connecting to Resend API: {str(exc)}",
                publishing_mode=self.default_mode,
                raw_response={"retryable": True, "error": str(exc)},
            )

        try:
            if resp.status_code in (200, 201):
                data = resp.json()
                email_id = data.get("id")
                return PublishingResult(
                    success=True,
                    external_post_id=email_id,
                    external_url=None,
                    publishing_mode=self.default_mode,
                    raw_response={"id": email_id, "to": recipient, "from": f"{from_name} <{from_email}>"},
                )
            elif resp.status_code == 401:
                raise EmailAuthError("Invalid or revoked Resend API key. Please reconnect in Integrations.")
            elif resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", 1.0))
                raise EmailRateLimitError("Resend rate limit exceeded.", retry_after=retry_after)
            elif 400 <= resp.status_code < 500:
                err_detail = resp.text
                try:
                    err_json = resp.json()
                    err_detail = err_json.get("message") or err_detail
                except Exception:
                    pass
                raise EmailClientError(f"Resend error (HTTP {resp.status_code}): {err_detail}", status_code=resp.status_code)
            elif resp.status_code >= 500:
                raise EmailServerError(f"Resend internal server error (HTTP {resp.status_code}).", status_code=resp.status_code)
            else:
                raise EmailPublishError(f"Unexpected response from Resend (HTTP {resp.status_code}): {resp.text}", status_code=resp.status_code)
        except EmailPublishError as exc:
            logger.error(f"Email publishing error: {exc}")
            return PublishingResult(
                success=False,
                error_message=str(exc),
                publishing_mode=self.default_mode,
                raw_response={"retryable": exc.retryable, "status_code": exc.status_code},
            )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        """
        Resend dispatch is synchronous upon HTTP 200 response.
        """
        return {"status": "sent", "job_id": external_job_id}


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
