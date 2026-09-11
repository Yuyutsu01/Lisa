"""
Media Transformation and Cropping Engine for Lisa.

Performs aspect-ratio smart center-cropping, resizing (Lanczos),
and derivative generation using Pillow.
"""

import os
import uuid
from io import BytesIO
from typing import Dict, Any, List, Tuple
from pathlib import Path
from PIL import Image
from app.core.storage import UPLOAD_DIR, StorageManager

# Platform derivative presets
DERIVATIVE_PRESETS: Dict[str, Dict[str, Any]] = {
    "instagram_portrait": {
        "platform": "instagram",
        "format": "feed_portrait",
        "width": 1080,
        "height": 1350,
        "aspect_ratio": "4:5",
    },
    "instagram_square": {
        "platform": "instagram",
        "format": "square",
        "width": 1080,
        "height": 1080,
        "aspect_ratio": "1:1",
    },
    "youtube_thumbnail": {
        "platform": "youtube",
        "format": "thumbnail",
        "width": 1280,
        "height": 720,
        "aspect_ratio": "16:9",
    },
    "tiktok_vertical": {
        "platform": "tiktok",
        "format": "story_vertical",
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
    },
    "linkedin_banner": {
        "platform": "linkedin",
        "format": "feed_landscape",
        "width": 1200,
        "height": 628,
        "aspect_ratio": "1.91:1",
    },
    "x_landscape": {
        "platform": "x",
        "format": "feed_landscape",
        "width": 1200,
        "height": 675,
        "aspect_ratio": "16:9",
    },
}


class MediaTransformer:
    @staticmethod
    def crop_and_resize(
        image_bytes: bytes, target_width: int, target_height: int
    ) -> bytes:
        """
        Center-crop image to target aspect ratio and resize using Lanczos filter.
        """
        with Image.open(BytesIO(image_bytes)) as img:
            # Convert RGBA to RGB for JPEG compatibility
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            orig_width, orig_height = img.size
            target_aspect = target_width / target_height
            orig_aspect = orig_width / orig_height

            if orig_aspect > target_aspect:
                # Original is wider -> crop sides
                new_width = int(target_aspect * orig_height)
                offset = (orig_width - new_width) // 2
                crop_box = (offset, 0, offset + new_width, orig_height)
            else:
                # Original is taller -> crop top/bottom
                new_height = int(orig_width / target_aspect)
                offset = (orig_height - new_height) // 2
                crop_box = (0, offset, orig_width, offset + new_height)

            cropped = img.crop(crop_box)
            resized = cropped.resize((target_width, target_height), Image.Resampling.LANCZOS)

            output_buf = BytesIO()
            resized.save(output_buf, format="JPEG", quality=90, optimize=True)
            return output_buf.getvalue()

    @classmethod
    def generate_derivatives(
        cls,
        workspace_id: str,
        source_storage_key: str,
        presets: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Read source asset from disk and generate platform-optimized derivative images.
        """
        source_path = UPLOAD_DIR / source_storage_key
        if not source_path.exists():
            raise FileNotFoundError(f"Source asset file not found at {source_storage_key}")

        with open(source_path, "rb") as f:
            source_bytes = f.read()

        chosen_presets = presets or list(DERIVATIVE_PRESETS.keys())
        results = []

        workspace_deriv_dir = UPLOAD_DIR / workspace_id / "derivatives"
        workspace_deriv_dir.mkdir(parents=True, exist_ok=True)

        for preset_key in chosen_presets:
            preset = DERIVATIVE_PRESETS.get(preset_key)
            if not preset:
                continue

            try:
                deriv_bytes = cls.crop_and_resize(
                    image_bytes=source_bytes,
                    target_width=preset["width"],
                    target_height=preset["height"],
                )

                deriv_filename = f"{preset_key}_{uuid.uuid4().hex[:8]}.jpg"
                deriv_file_path = workspace_deriv_dir / deriv_filename
                storage_key = f"{workspace_id}/derivatives/{deriv_filename}"

                with open(deriv_file_path, "wb") as out_f:
                    out_f.write(deriv_bytes)

                results.append({
                    "platform": preset["platform"],
                    "format": preset["format"],
                    "width": preset["width"],
                    "height": preset["height"],
                    "storage_key": storage_key,
                    "mime_type": "image/jpeg",
                    "url": StorageManager.get_url(storage_key),
                    "metadata_json": {"preset": preset_key, "aspect_ratio": preset["aspect_ratio"]},
                })
            except Exception as e:
                # Log and continue with other derivatives
                print(f"Failed to generate derivative {preset_key}: {e}")

        return results
