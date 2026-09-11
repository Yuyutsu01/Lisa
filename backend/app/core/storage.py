"""
Storage and Asset Management Core for Lisa.

Handles secure file saving, SHA-256 deduplication, MIME validation,
dimension extraction using Pillow, and URL resolution.
"""

import os
import uuid
import hashlib
from io import BytesIO
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
from PIL import Image

# Upload base directory (local storage)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
}

ALLOWED_DOC_TYPES = {
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
}

ALLOWED_MIME_TYPES = {
    **ALLOWED_IMAGE_TYPES,
    **ALLOWED_VIDEO_TYPES,
    **ALLOWED_DOC_TYPES,
}

# Max file sizes
MAX_IMAGE_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_VIDEO_SIZE = 250 * 1024 * 1024  # 250 MB
MAX_DOC_SIZE = 20 * 1024 * 1024  # 20 MB


class StorageManager:
    @staticmethod
    def compute_checksum(content: bytes) -> str:
        """Compute SHA-256 checksum of binary data."""
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def extract_image_metadata(content: bytes) -> Tuple[Optional[int], Optional[int]]:
        """Extract width and height from image bytes using Pillow."""
        try:
            with Image.open(BytesIO(content)) as img:
                return img.width, img.height
        except Exception:
            return None, None

    @classmethod
    def save_file(
        cls,
        workspace_id: str,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> Dict[str, Any]:
        """
        Validate, save file to disk, and extract metadata.
        Returns dict with storage_key, checksum, size_bytes, width, height.
        """
        # Validate MIME type
        if mime_type not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported file type: {mime_type}")

        # Validate file size
        size_bytes = len(content)
        if mime_type in ALLOWED_IMAGE_TYPES and size_bytes > MAX_IMAGE_SIZE:
            raise ValueError(f"Image exceeds maximum allowed size of {MAX_IMAGE_SIZE // (1024*1024)}MB")
        elif mime_type in ALLOWED_VIDEO_TYPES and size_bytes > MAX_VIDEO_SIZE:
            raise ValueError(f"Video exceeds maximum allowed size of {MAX_VIDEO_SIZE // (1024*1024)}MB")
        elif mime_type in ALLOWED_DOC_TYPES and size_bytes > MAX_DOC_SIZE:
            raise ValueError(f"Document exceeds maximum allowed size of {MAX_DOC_SIZE // (1024*1024)}MB")

        checksum = cls.compute_checksum(content)
        extension = ALLOWED_MIME_TYPES[mime_type]
        unique_id = uuid.uuid4().hex[:12]
        
        # Structure: uploads/<workspace_id>/<unique_id>_<filename>
        workspace_dir = UPLOAD_DIR / workspace_id
        workspace_dir.mkdir(parents=True, exist_ok=True)
        
        safe_filename = f"{unique_id}{extension}"
        file_path = workspace_dir / safe_filename
        storage_key = f"{workspace_id}/{safe_filename}"

        # Write to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # Extract visual dimensions if image
        width, height = None, None
        if mime_type in ALLOWED_IMAGE_TYPES:
            width, height = cls.extract_image_metadata(content)

        return {
            "storage_key": storage_key,
            "filename": filename,
            "mime_type": mime_type,
            "size_bytes": size_bytes,
            "checksum": checksum,
            "width": width,
            "height": height,
        }

    @classmethod
    def get_url(cls, storage_key: str) -> str:
        """Generate accessible HTTP URL path for uploaded asset."""
        return f"/uploads/{storage_key}"

    @classmethod
    def delete_file(cls, storage_key: str) -> bool:
        """Remove file from storage."""
        file_path = UPLOAD_DIR / storage_key
        if file_path.exists():
            try:
                os.remove(file_path)
                return True
            except Exception:
                return False
        return False
