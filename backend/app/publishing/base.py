"""
Platform Adapter Protocol and Result Types for Lisa Publishing Engine.

Defines the standard interface that all social and CMS adapters must implement.
"""

from typing import Protocol, Dict, Any, Optional, List
from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    is_valid: bool = True
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class PublishingResult(BaseModel):
    success: bool
    external_post_id: Optional[str] = None
    external_url: Optional[str] = None
    publishing_mode: str = "direct"  # direct, draft, manual
    error_message: Optional[str] = None
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class PlatformAdapter(Protocol):
    platform_name: str
    supported_formats: List[str]
    default_mode: str  # direct, draft, export

    async def validate_variant(
        self, variant_data: Dict[str, Any], account_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """Validate variant copy, lengths, and media before dispatch."""
        ...

    async def publish(
        self,
        variant_data: Dict[str, Any],
        account_data: Optional[Dict[str, Any]] = None,
        media_derivatives: Optional[List[Dict[str, Any]]] = None,
    ) -> PublishingResult:
        """Execute publishing or draft upload to the target platform."""
        ...

    async def check_status(self, external_job_id: str) -> Dict[str, Any]:
        """Poll asynchronous upload/processing status where required."""
        ...
