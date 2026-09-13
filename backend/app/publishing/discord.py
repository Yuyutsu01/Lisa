"""
Discord Platform Adapter for Lisa.

Implements direct webhook publishing for Discord community announcements,
forum channels, and update feeds using Discord's Incoming Webhook API.
"""

import re
import logging
from typing import Dict, Any, Optional, List
import httpx

from app.publishing.base import PlatformAdapter, ValidationResult, PublishingResult

logger = logging.getLogger("uvicorn.error")

# Pattern accepts standard discord.com and legacy discordapp.com webhook URLs (including dots in tokens)
DISCORD_WEBHOOK_REGEX = re.compile(
    r"^https://(?:ptb\.|canary\.)?(?:discord\.com|discordapp\.com)/api/webhooks/\d+/[\w.-]+$"
)


class DiscordWebhookError(Exception):
    """Base exception for Discord webhook publishing failures."""
    def __init__(self, message: str, status_code: Optional[int] = None, retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class DiscordRateLimitError(DiscordWebhookError):
    """Raised when Discord responds with HTTP 429 Too Many Requests."""
    def __init__(self, message: str, retry_after: float):
        super().__init__(message, status_code=429, retryable=True)
        self.retry_after = retry_after


class DiscordWebhookRevokedError(DiscordWebhookError):
    """Raised when webhook URL is invalid or deleted (HTTP 401, 403, 404)."""
    def __init__(self, message: str, status_code: int):
        super().__init__(message, status_code=status_code, retryable=False)


class DiscordAdapter:
    platform_name = "discord"
    supported_formats = [
        "community_announcement",
        "forum_post",
        "channel_thread",
        "text_post",
    ]
    default_mode = "direct"

    # =========================================================================
    # 1. CANONICAL PROTOCOL METHODS (Used by Lisa PublishingService)
    # =========================================================================

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """Validate variant copy and lengths before dispatch to Discord."""
        errors = []
        warnings = []
        body = variant_data.get("body", "")

        if not body.strip():
            errors.append("Discord post content cannot be empty.")
        elif len(body) > 2000:
            warnings.append(
                f"Discord message exceeds 2000 characters ({len(body)} chars). Content will be truncated to 2000."
            )

        # Validate webhook URL if connection account data is supplied
        if account_data:
            webhook_url = (
                account_data.get("access_token")
                or account_data.get("credentials_encrypted")
                or ""
            )
            if not webhook_url or not DISCORD_WEBHOOK_REGEX.match(webhook_url.strip()):
                errors.append(
                    "Invalid Discord Webhook URL. Must match https://discord.com/api/webhooks/{id}/{token}"
                )

        return ValidationResult(is_valid=len(errors) == 0, errors=errors, warnings=warnings)

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        """Execute publishing of a content variant to a Discord Webhook."""
        val = await self.validate_variant(variant_data, account_data)
        if not val.is_valid:
            return PublishingResult(
                success=False,
                error_message="; ".join(val.errors),
                publishing_mode=self.default_mode,
            )

        webhook_url = (
            account_data.get("access_token")
            or account_data.get("credentials_encrypted")
            or ""
        ) if account_data else ""

        request_payload = {
            "connection": {
                "credentials_encrypted": webhook_url,
                "account_name": account_data.get("account_name", "Lisa Community") if account_data else "Lisa Community",
            },
            "variant": {
                "body": variant_data.get("body", ""),
                "title": variant_data.get("title", ""),
            },
            "brand": {
                "name": account_data.get("account_name", "Lisa") if account_data else "Lisa",
            },
        }

        try:
            raw_response = await self.create_publish_job(request_payload)
            message_id = raw_response.get("id")
            channel_id = raw_response.get("channel_id")
            guild_id = raw_response.get("guild_id")

            # Only construct URL when guild_id, channel_id, and message_id are all present
            external_url = (
                f"https://discord.com/channels/{guild_id}/{channel_id}/{message_id}"
                if guild_id and channel_id and message_id
                else None
            )

            logger.info(
                "Discord webhook message published successfully (message_id=%s, channel_id=%s)",
                message_id,
                channel_id,
            )

            return PublishingResult(
                success=True,
                external_post_id=str(message_id) if message_id else None,
                external_url=external_url,
                publishing_mode=self.default_mode,
                raw_response=raw_response,
            )
        except DiscordRateLimitError as exc:
            logger.warning("Discord webhook hit rate limit: retry_after=%.2fs", exc.retry_after)
            return PublishingResult(
                success=False,
                error_message=str(exc),
                publishing_mode=self.default_mode,
                raw_response={"retryable": True, "retry_after": exc.retry_after, "status_code": 429},
            )
        except DiscordWebhookError as exc:
            logger.error("Discord webhook publishing error: %s", exc)
            return PublishingResult(
                success=False,
                error_message=str(exc),
                publishing_mode=self.default_mode,
                raw_response={"retryable": exc.retryable, "status_code": exc.status_code},
            )

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        """
        Discord webhooks are synchronous. Once POST returns 200/204,
        the message is live immediately.
        # TODO: Add Discord message editing / deletion APIs for post-publish revision workflows.
        """
        return {"status": "published", "job_id": external_job_id}

    # =========================================================================
    # 2. EXTENDED WORKFLOW & TEST HARNESS METHODS
    # =========================================================================

    async def create_publish_job(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes outbound HTTP dispatch to the Discord Incoming Webhook endpoint.
        Returns the raw Discord message JSON response.
        """
        connection = request.get("connection", {})
        variant = request.get("variant", {})
        brand = request.get("brand", {})

        webhook_url = (
            connection.get("credentials_encrypted")
            or connection.get("access_token")
            or ""
        ).strip()

        if not webhook_url or not DISCORD_WEBHOOK_REGEX.match(webhook_url):
            raise DiscordWebhookError(
                "Invalid or missing Discord webhook URL. Must match https://discord.com/api/webhooks/{id}/{token}"
            )

        body = variant.get("body", "")
        # Enforce 2000 character hard limit
        content = body[:2000] if len(body) > 2000 else body
        username = brand.get("name") or connection.get("account_name") or "Lisa"

        # Stage 1: Content-only payload
        # TODO: Add rich Embeds support (embeds: [{title, description, color, fields, media}]) in Stage 2.
        payload = {
            "content": content,
            "username": username[:80],  # Discord username limit is 80 chars
        }

        # Query param ?wait=true instructs Discord to return the created message JSON
        dispatch_url = f"{webhook_url}?wait=true" if "?wait=true" not in webhook_url else webhook_url

        # TODO: Discord limits webhooks to 5 requests per 5 seconds per channel.
        # In Stage 1 we rely on HTTP 429 Retry-After handling. Implement client-side bucket throttling in Stage 2.
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(dispatch_url, json=payload)
            except httpx.RequestError as exc:
                raise DiscordWebhookError(f"Network error connecting to Discord: {exc}", retryable=True)

        status = response.status_code

        # 200 OK — Success with created message JSON
        if status == 200:
            try:
                return response.json()
            except Exception:
                return {"status": "published"}

        # 204 No Content — Success without body
        if status == 204:
            return {"status": "published"}

        # 429 Too Many Requests — Rate Limited
        if status == 429:
            retry_after_header = response.headers.get("Retry-After", "5")
            try:
                retry_after = float(retry_after_header)
            except ValueError:
                retry_after = 5.0
            raise DiscordRateLimitError(
                f"Discord rate limit exceeded. Retry after {retry_after}s.",
                retry_after=retry_after,
            )

        # 401, 403, 404 — Webhook Invalid, Missing, or Deleted
        if status in (401, 403, 404):
            # TODO: In future stage, mark ConnectedAccount status = "revoked" upon receiving 401/403/404.
            raise DiscordWebhookRevokedError(
                f"Discord webhook URL is invalid or has been deleted (HTTP {status}): {response.text}",
                status_code=status,
            )

        # 5xx — Upstream Discord server errors (Retryable)
        if 500 <= status < 600:
            raise DiscordWebhookError(
                f"Discord server error (HTTP {status}). Transient issue, retryable.",
                status_code=status,
                retryable=True,
            )

        # Any other status code
        raise DiscordWebhookError(
            f"Discord webhook publishing failed with HTTP {status}: {response.text}",
            status_code=status,
            retryable=False,
        )

    async def fetch_metrics(self, published_record: Any = None) -> List[Any]:
        """
        # TODO: Discord incoming webhooks do not provide analytics/read metrics.
        # Mode C / metrics_source="unavailable" from spec (Section 23.2, Guardrail 7).
        """
        return []

    async def refresh_connection(self, connection: Any) -> Any:
        """
        # TODO: Discord Webhook URLs do not expire and require no refresh.
        # A future Bot + OAuth upgrade path would implement token refresh logic here.
        """
        return connection

    async def validate_media(self, asset: Any, metadata: Any = None) -> bool:
        """
        # TODO: Implement Discord file attachment / multi-part upload in Stage 2.
        # Stage 1 supports text and link broadcasts.
        """
        return True
