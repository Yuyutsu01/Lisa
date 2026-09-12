"""
Platform Adapter Registry for Lisa.

Resolves platform string keys to instantiated PlatformAdapter singletons.
"""

from typing import Dict, Optional, Any
from app.publishing.base import PlatformAdapter
from app.publishing.linkedin import LinkedInAdapter
from app.publishing.x import XAdapter
from app.publishing.instagram import InstagramAdapter
from app.publishing.other_adapters import ThreadsAdapter, EmailAdapter, BlogAdapter


class AdapterRegistry:
    # Supported platform adapters registry excluding decommissioned platforms
    _adapters: Dict[str, PlatformAdapter] = {
        "linkedin": LinkedInAdapter(),
        "x": XAdapter(),
        "instagram": InstagramAdapter(),
        "threads": ThreadsAdapter(),
        "email": EmailAdapter(),
        "blog": BlogAdapter(),
    }

    @classmethod
    def get_adapter(cls, platform: str) -> Optional[PlatformAdapter]:
        """Retrieve registered platform adapter or None."""
        return cls._adapters.get(platform.lower().strip())

    @classmethod
    def list_supported_platforms(cls) -> Dict[str, Dict[str, Any]]:
        """List all supported platforms and their capabilities."""
        return {
            name: {
                "name": name,
                "supported_formats": adapter.supported_formats,
                "default_mode": adapter.default_mode,
            }
            for name, adapter in cls._adapters.items()
        }
