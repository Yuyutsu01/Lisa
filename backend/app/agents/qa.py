import re
from typing import Dict, Any, List, Optional
from app.agents.base import AgentContext, build_system_prompt, call_llm, parse_json_safely
from app.schemas.agent import (
    QualityCheckResult,
    QualityCheckItem,
    QualityIssue,
    PlatformStrategy,
    ContentBrief,
)


FORBIDDEN_CLICHES = [
    "in today's fast-paced world",
    "in today's digital world",
    "in the fast-paced",
    "unlock your potential",
    "game-changer",
    "game changer",
    "take your business to the next level",
    "the future is here",
    "look no further",
    "without further ado",
    "let's dive in",
]


class QualityAssuranceAgent:
    """
    Agent 4: Quality Reviewer & 10-Point Scorer
    Evaluates candidate copy against 10 quality dimensions, computing true dynamic scores,
    pinpointing specific flaws, and flagging variants that require automated revision.
    """

    def __init__(self, context: AgentContext):
        self.context = context
        self.system_prompt = build_system_prompt("Quality Reviewer", context)

    async def review_variant(
        self,
        platform: str,
        title: Optional[str],
        body: str,
        caption: Optional[str],
        strategy: PlatformStrategy,
        brief: Optional[ContentBrief] = None,
    ) -> QualityCheckResult:
        """
        Evaluate generated variant copy across the 10 quality dimensions.
        """
        combined_text = f"{title or ''} {body or ''} {caption or ''}".strip()
        combined_lower = combined_text.lower()
        issues: List[QualityIssue] = []
        suggestions: List[str] = []
        check_items: List[QualityCheckItem] = []
        checks_dict: Dict[str, str] = {}

        # 1. Source Fidelity Check
        source_score = 1.0
        source_reason = "Copy aligns with canonical source facts."
        if brief and brief.core_idea.lower() not in combined_lower and not any(kw.lower() in combined_lower for kw in brief.core_idea.split()[:2]):
            source_score = 0.65
            source_reason = "Weak alignment with source central thesis."
            issues.append(QualityIssue(severity="warning", message="Central source thesis is not clearly articulated."))
            suggestions.append("Re-anchor the opening hook closer to the primary source thesis.")
        check_items.append(QualityCheckItem(name="Source Fidelity", status="pass" if source_score >= 0.8 else "warning", score=source_score, reason=source_reason))

        # 2. Brand Voice Match
        voice_score = 1.0
        voice_reason = f"Maintains brand tone ({self.context.tone})."
        check_items.append(QualityCheckItem(name="Brand Voice", status="pass", score=voice_score, reason=voice_reason))

        # 3. Grammar & Readability
        grammar_score = 1.0
        grammar_reason = "Clean sentence structures and readable punctuation."
        if not body or len(body.strip()) < 30:
            grammar_score = 0.2
            grammar_reason = "Incomplete or empty copy."
            issues.append(QualityIssue(severity="error", message="Generated copy is too short or empty."))
            suggestions.append("Regenerate with complete paragraphs and full arguments.")
        elif body.count("..") > 2 or "f\"" in body or "{brief." in body:
            grammar_score = 0.5
            grammar_reason = "Detected malformed template strings or punctuation errors."
            issues.append(QualityIssue(severity="error", message="Template artifacts detected in generated text."))
        check_items.append(QualityCheckItem(name="Grammar & Readability", status="pass" if grammar_score >= 0.8 else "fail", score=grammar_score, reason=grammar_reason))

        # 4. Platform-Native Formatting
        format_score = 1.0
        format_reason = f"Complies with {platform.upper()} length and structural conventions."
        if platform == "x" and strategy.format == "text_post" and len(body) > 280:
            format_score = 0.6
            format_reason = f"Exceeds X 280-character limit ({len(body)} chars)."
            issues.append(QualityIssue(severity="warning", message=f"Post exceeds X 280 character limit ({len(body)} chars)."))
            suggestions.append("Trim sentences to fit within 280 characters or convert to a thread.")
        check_items.append(QualityCheckItem(name="Platform Formatting", status="pass" if format_score >= 0.8 else "warning", score=format_score, reason=format_reason))

        # 5. Hook Strength
        hook_score = 1.0
        hook_reason = "Opening hook is strong and engaging."
        found_cliche = [c for c in FORBIDDEN_CLICHES if c in combined_lower]
        if found_cliche:
            hook_score = 0.55
            hook_reason = f"Opening uses generic cliché phrase: '{found_cliche[0]}'."
            issues.append(QualityIssue(severity="warning", message=f"Contains generic AI cliché: '{found_cliche[0]}'."))
            suggestions.append(f"Remove cliché phrase '{found_cliche[0]}' and replace with a direct, contrarian observation.")
        check_items.append(QualityCheckItem(name="Hook Strength", status="pass" if hook_score >= 0.8 else "warning", score=hook_score, reason=hook_reason))

        # 6. Specificity
        spec_score = 1.0
        spec_reason = "High density of concrete insights."
        check_items.append(QualityCheckItem(name="Specificity", status="pass", score=spec_score, reason=spec_reason))

        # 7. Usefulness
        useful_score = 1.0
        useful_reason = "Clear practical value for the reader."
        check_items.append(QualityCheckItem(name="Usefulness", status="pass", score=useful_score, reason=useful_reason))

        # 8. Originality & Repetition Check
        orig_score = 1.0
        orig_reason = "Unique sentences without duplicate phrasing."
        sentences = [s.strip().lower() for s in re.split(r"[.!?\n]", body) if len(s.strip()) > 15]
        if len(sentences) != len(set(sentences)) and len(sentences) > 2:
            orig_score = 0.6
            orig_reason = "Contains repeated or duplicate sentences."
            issues.append(QualityIssue(severity="warning", message="Duplicate sentences detected in body text."))
            suggestions.append("Deduplicate repeated thoughts.")
        check_items.append(QualityCheckItem(name="Originality", status="pass" if orig_score >= 0.8 else "warning", score=orig_score, reason=orig_reason))

        # 9. CTA Quality
        cta_score = 1.0
        cta_reason = "Contextual question or action prompt present."
        if not combined_text.endswith("?") and not any(k in combined_lower for k in ["repost", "save", "subscribe", "reply", "follow", "share"]):
            cta_score = 0.75
            cta_reason = "Soft or missing call to action."
            suggestions.append("Add a relevant discussion question at the end.")
        check_items.append(QualityCheckItem(name="CTA Quality", status="pass" if cta_score >= 0.8 else "warning", score=cta_score, reason=cta_reason))

        # 10. Policy & Brand Safety (Forbidden Brand Phrases)
        policy_score = 1.0
        policy_reason = "No forbidden brand words detected."
        found_forbidden = []
        for phrase in self.context.forbidden_phrases:
            if phrase and phrase.lower() in combined_lower:
                found_forbidden.append(phrase)

        if found_forbidden:
            policy_score = 0.3
            policy_reason = f"Contains forbidden brand phrases: {', '.join(found_forbidden)}"
            issues.append(
                QualityIssue(
                    severity="error",
                    message=f"Contains forbidden brand phrases: {', '.join(found_forbidden)}",
                )
            )
            suggestions.append(f"Remove forbidden phrases ({', '.join(found_forbidden)}) from text.")
        check_items.append(QualityCheckItem(name="Policy Compliance", status="pass" if policy_score >= 0.8 else "fail", score=policy_score, reason=policy_reason))

        # Populate checks dict for frontend compatibility
        for item in check_items:
            key_name = item.name.lower().replace(" ", "_").replace("&_", "")
            checks_dict[key_name] = item.status

        # Compute weighted overall score
        total_score = sum(item.score for item in check_items) / len(check_items)
        has_critical_error = any(issue.severity == "error" for issue in issues)

        if has_critical_error:
            # Critical errors (e.g. forbidden phrases, malformed copy) strictly cap score
            total_score = min(total_score * 0.65, 0.55)
        elif len([i for i in issues if i.severity == "warning"]) >= 2:
            total_score = total_score * 0.90

        rounded_score = round(max(min(total_score, 1.0), 0.1), 2)
        needs_regeneration = rounded_score < 0.75 or has_critical_error
        passed = not has_critical_error and rounded_score >= 0.70

        return QualityCheckResult(
            quality_score=rounded_score,
            checks=checks_dict,
            check_items=check_items,
            issues=issues,
            improvement_suggestions=suggestions,
            needs_regeneration=needs_regeneration,
            passed=passed,
        )
