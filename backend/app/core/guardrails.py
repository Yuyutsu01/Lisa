"""
Lisa AI Guardrails & Output Validation Layer.

Enforces schema validation, PII leakage detection, platform ToS policy compliance,
and brand safety boundaries per Section 9.1 and Section 23 of the product specification.
"""

import re
from typing import Dict, Any, List, Optional, Tuple, Type
from pydantic import BaseModel, ValidationError

from app.models.brand import BrandProfile


class PolicyValidationResult(BaseModel):
    passed: bool
    status: str  # "approved", "needs_review", "policy_flagged"
    flags: List[str] = []
    reasons: List[str] = []


# Banned Engagement-Bait Patterns per Platform Policies (Meta/Instagram, X, LinkedIn ToS)
PLATFORM_ENGAGEMENT_BAIT_PATTERNS = [
    (r"comment\s+['\"][a-zA-Z0-9_\-]+['\"]\s+(?:to\s+get|for\s+the\s+link|below)", "Banned comment-gating bait (violates Meta/Instagram ToS)"),
    (r"tag\s+(?:\d+|your)\s+friends?\s+(?:to\s+win|below)", "Banned tag-baiting pattern"),
    (r"like\s+and\s+share\s+to\s+win", "Prohibited sweepstakes bait"),
    (r"drop\s+your\s+email\s+(?:in\s+the\s+comments|below)", "Prohibited PII collection in public comments"),
    (r"dm\s+me\s+['\"][a-zA-Z0-9_\-]+['\"]\s+for", "Banned automated DM bait keyword gating"),
]

# Sensitive PII Patterns
PII_EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PII_PHONE_PATTERN = r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b"
PII_SSN_PATTERN = r"\b\d{3}-\d{2}-\d{4}\b"


def validate_agent_output(
    model_class: Type[BaseModel],
    raw_data: Dict[str, Any],
) -> Tuple[bool, Optional[BaseModel], Optional[str]]:
    """
    Strictly validates raw LLM dictionary output against expected Pydantic model.
    Returns (is_valid, parsed_instance, error_message).
    """
    if not isinstance(raw_data, dict):
        return False, None, f"Expected dictionary payload, received {type(raw_data).__name__}"

    try:
        instance = model_class.model_validate(raw_data)
        return True, instance, None
    except ValidationError as ve:
        return False, None, str(ve)
    except Exception as e:
        return False, None, f"Unexpected validation error: {str(e)}"


def validate_policy(
    text: str,
    source_body: str = "",
    brand_profile: Optional[BrandProfile] = None,
    platform: str = "generic",
) -> PolicyValidationResult:
    """
    Independent policy validation gate checking for PII leakage, platform ToS violations,
    and brand safety boundaries.
    """
    if not text:
        return PolicyValidationResult(
            passed=False,
            status="policy_flagged",
            flags=["empty_content"],
            reasons=["Content body is empty."],
        )

    flags: List[str] = []
    reasons: List[str] = []
    text_lower = text.lower()

    # 1. PII Leakage Check (Emails, Phones, SSNs not present in source)
    emails_in_variant = set(re.findall(PII_EMAIL_PATTERN, text))
    if emails_in_variant:
        # Check if email is in original source or accidental leak
        for email in emails_in_variant:
            if email.lower() not in source_body.lower():
                flags.append("pii_leak_email")
                reasons.append(f"Unredacted email address detected: {email}")

    phones_in_variant = set(re.findall(PII_PHONE_PATTERN, text))
    if phones_in_variant:
        for phone in phones_in_variant:
            if phone not in source_body:
                flags.append("pii_leak_phone")
                reasons.append(f"Unredacted phone number detected: {phone}")

    if re.search(PII_SSN_PATTERN, text):
        flags.append("pii_leak_ssn")
        reasons.append("Potential Social Security Number (SSN) pattern detected.")

    # 2. Platform ToS Engagement-Bait Check
    for pattern, desc in PLATFORM_ENGAGEMENT_BAIT_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            flags.append("platform_tos_engagement_bait")
            reasons.append(f"Platform policy violation: {desc}")

    # 3. Forbidden Brand Phrases Check
    if brand_profile and getattr(brand_profile, "forbidden_phrases_json", None):
        forbidden_list = brand_profile.forbidden_phrases_json
        for phrase in forbidden_list:
            if phrase and phrase.lower() in text_lower:
                flags.append("forbidden_brand_phrase")
                reasons.append(f"Contains prohibited brand phrase: '{phrase}'")

    # Determine final policy gate status
    has_critical_violation = any(
        f in flags for f in ["pii_leak_ssn", "platform_tos_engagement_bait", "forbidden_brand_phrase", "pii_leak_phone", "pii_leak_email"]
    )

    if has_critical_violation:
        return PolicyValidationResult(
            passed=False,
            status="policy_flagged",
            flags=flags,
            reasons=reasons,
        )

    return PolicyValidationResult(
        passed=True,
        status="approved" if not flags else "needs_review",
        flags=flags,
        reasons=reasons,
    )
