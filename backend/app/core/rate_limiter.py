"""
Cost and Rate Limiting Guardrails for Lisa AI Agents.

Enforces Section 23 and NFR-SEC token budget ceilings, runaway retry circuit breakers,
and per-workspace rate limits.
"""

import time
from typing import Dict, Any, Tuple
from collections import defaultdict


class BudgetExceededError(Exception):
    """Raised when a generation job or workspace exceeds configured token/cost ceilings."""
    pass


class TokenBudgetTracker:
    def __init__(
        self,
        max_job_tokens: int = 15000,
        max_workspace_hourly_tokens: int = 100000,
    ):
        self.max_job_tokens = max_job_tokens
        self.max_workspace_hourly_tokens = max_workspace_hourly_tokens
        self._job_tokens: Dict[str, int] = defaultdict(int)
        self._workspace_tokens: Dict[str, list[Tuple[float, int]]] = defaultdict(list)

    def record_usage(
        self, workspace_id: str, job_id: str, tokens: int
    ) -> Dict[str, Any]:
        """
        Record token usage and evaluate budget thresholds.
        Returns telemetry including threshold warnings.
        """
        now = time.time()
        self._job_tokens[job_id] += tokens
        self._workspace_tokens[workspace_id].append((now, tokens))

        # Clean old tokens outside 1 hour window
        one_hour_ago = now - 3600
        self._workspace_tokens[workspace_id] = [
            (t, count) for (t, count) in self._workspace_tokens[workspace_id] if t > one_hour_ago
        ]

        workspace_hourly_total = sum(count for (_, count) in self._workspace_tokens[workspace_id])
        job_total = self._job_tokens[job_id]

        is_job_exceeded = job_total > self.max_job_tokens
        is_workspace_exceeded = workspace_hourly_total > self.max_workspace_hourly_tokens

        # Check 80% warning threshold
        is_job_warning = job_total >= (self.max_job_tokens * 0.80)
        is_workspace_warning = workspace_hourly_total >= (self.max_workspace_hourly_tokens * 0.80)

        if is_job_exceeded or is_workspace_exceeded:
            raise BudgetExceededError(
                f"Token budget ceiling exceeded: job={job_total}/{self.max_job_tokens}, "
                f"workspace={workspace_hourly_total}/{self.max_workspace_hourly_tokens}"
            )

        return {
            "job_tokens": job_total,
            "workspace_hourly_tokens": workspace_hourly_total,
            "warning_80_percent": is_job_warning or is_workspace_warning,
            "status": "warning" if (is_job_warning or is_workspace_warning) else "ok",
        }


# Global singleton instance for runtime tracking
budget_tracker = TokenBudgetTracker()
