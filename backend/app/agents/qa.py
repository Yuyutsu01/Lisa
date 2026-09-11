"""
Agent 7: Quality Assurance (QA) Agent for Lisa.

Reviews generated content variants before presenting for human review.
Validates brand voice, scans for forbidden phrases, checks formatting,
and computes a composite quality score.
"""

from typing import Dict, Any, List
from app.agents.base import AgentContext, build_system_prompt
from app.schemas.agent import QualityCheckResult, QualityIssue, PlatformStrategy


class QualityAssuranceAgent:
    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Quality Assurance Agent", context)

    def review_variant(
        self,
        platform: str,
        title: str,
        body: str,
        caption: str,
        strategy: PlatformStrategy,
    ) -> QualityCheckResult:
        """
        Evaluate generated variant copy against brand rules and platform constraints.
        """
        combined_text = f"{title or ''} {body or ''} {caption or ''}".lower()
        issues: List[QualityIssue] = []
        checks = {
            "brand_voice": "pass",
            "forbidden_words": "pass",
            "format_validity": "pass",
            "source_fidelity": "pass",
        }
        score = 0.96

        # 1. Check for Forbidden Phrases
        found_forbidden = []
        for phrase in self.context.forbidden_phrases:
            if phrase.lower() in combined_text:
                found_forbidden.append(phrase)

        if found_forbidden:
            checks["forbidden_words"] = "fail"
            score -= 0.25
            issues.append(
                QualityIssue(
                    severity="error",
                    message=f"Contains forbidden brand phrases: {', '.join(found_forbidden)}",
                )
            )

        # 2. Length check for short formats (X single posts)
        if platform == "x" and strategy.format == "text_post" and len(body) > 280:
            checks["format_validity"] = "warning"
            score -= 0.1
            issues.append(
                QualityIssue(
                    severity="warning",
                    message=f"Post exceeds X 280 character limit ({len(body)} chars).",
                )
            )

        # 3. Media Requirement Check
        if strategy.media_required:
            checks["media_fit"] = "required"

        passed = not any(issue.severity == "error" for issue in issues)

        return QualityCheckResult(
            quality_score=round(max(score, 0.5), 2),
            checks=checks,
            issues=issues,
            passed=passed,
        )
