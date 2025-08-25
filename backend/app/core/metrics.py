import threading
from typing import Dict, Any

# Thread-safe in-memory metrics for LLM calls
_lock = threading.Lock()
_state: Dict[str, Any] = {
    "llm": {
        # model -> counts
        "per_model_requests": {},
        # cumulative tokens
        "prompt_tokens_total": 0,
        "completion_tokens_total": 0,
        # cumulative latency ms
        "latency_ms_total": 0.0,
        # cumulative cost USD (if known)
        "cost_usd_total": 0.0,
    },
    "audit": {
        # Total audit writes (successful)
        "writes_total": 0,
        # Total audit write errors
        "write_errors_total": 0,
        # Per action writes, e.g., update/soft_delete/hard_delete/search
        "per_action_writes": {},
    },
}


def record_llm_call(
    *,
    model: str,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    latency_ms: float | None = None,
    cost_usd: float | None = None,
) -> None:
    with _lock:
        llm = _state["llm"]
        pm = llm.setdefault("per_model_requests", {})
        pm[model] = int(pm.get(model, 0)) + 1
        if isinstance(prompt_tokens, int):
            llm["prompt_tokens_total"] = int(llm.get("prompt_tokens_total", 0)) + prompt_tokens
        if isinstance(completion_tokens, int):
            llm["completion_tokens_total"] = int(llm.get("completion_tokens_total", 0)) + completion_tokens
        if isinstance(latency_ms, (int, float)):
            llm["latency_ms_total"] = float(llm.get("latency_ms_total", 0.0)) + float(latency_ms)
        if isinstance(cost_usd, (int, float)):
            llm["cost_usd_total"] = float(llm.get("cost_usd_total", 0.0)) + float(cost_usd)


def record_audit_write(*, action: str | None, success: bool) -> None:
    """Record audit write success/failure and per-action counts."""
    with _lock:
        audit = _state.setdefault("audit", {})
        if success:
            audit["writes_total"] = int(audit.get("writes_total", 0)) + 1
            if action:
                per = audit.setdefault("per_action_writes", {})
                per[action] = int(per.get(action, 0)) + 1
        else:
            audit["write_errors_total"] = int(audit.get("write_errors_total", 0)) + 1


def dump_prometheus() -> str:
    """Return Prometheus-formatted metrics lines for LLM stats."""
    with _lock:
        llm = _state.get("llm", {})
        audit = _state.get("audit", {})
        pm = llm.get("per_model_requests", {})
        pt = int(llm.get("prompt_tokens_total", 0))
        ct = int(llm.get("completion_tokens_total", 0))
        ltot = float(llm.get("latency_ms_total", 0.0))
        cost = float(llm.get("cost_usd_total", 0.0))

    lines: list[str] = []
    lines.append("# HELP ai_companion_llm_requests_total Total LLM requests by model.")
    lines.append("# TYPE ai_companion_llm_requests_total counter")
    for model, c in pm.items():
        m = str(model).replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'ai_companion_llm_requests_total{{model="{m}"}} {int(c)}')

    lines.append("# HELP ai_companion_llm_prompt_tokens_total Total prompt tokens across LLM calls.")
    lines.append("# TYPE ai_companion_llm_prompt_tokens_total counter")
    lines.append(f"ai_companion_llm_prompt_tokens_total {pt}")

    lines.append("# HELP ai_companion_llm_completion_tokens_total Total completion tokens across LLM calls.")
    lines.append("# TYPE ai_companion_llm_completion_tokens_total counter")
    lines.append(f"ai_companion_llm_completion_tokens_total {ct}")

    lines.append("# HELP ai_companion_llm_latency_ms_total Total LLM latency in milliseconds.")
    lines.append("# TYPE ai_companion_llm_latency_ms_total counter")
    lines.append(f"ai_companion_llm_latency_ms_total {ltot}")

    lines.append("# HELP ai_companion_llm_cost_usd_total Total LLM cost in USD (if known).")
    lines.append("# TYPE ai_companion_llm_cost_usd_total counter")
    lines.append(f"ai_companion_llm_cost_usd_total {cost}")

    # Audit metrics
    lines.append("# HELP ai_companion_audit_writes_total Total successful audit writes.")
    lines.append("# TYPE ai_companion_audit_writes_total counter")
    lines.append(f"ai_companion_audit_writes_total {int(audit.get('writes_total', 0))}")

    lines.append("# HELP ai_companion_audit_write_errors_total Total failed audit writes.")
    lines.append("# TYPE ai_companion_audit_write_errors_total counter")
    lines.append(f"ai_companion_audit_write_errors_total {int(audit.get('write_errors_total', 0))}")

    per_action = audit.get("per_action_writes", {})
    if isinstance(per_action, dict):
        lines.append("# HELP ai_companion_audit_writes_by_action_total Total successful audit writes by action.")
        lines.append("# TYPE ai_companion_audit_writes_by_action_total counter")
        for action, c in per_action.items():
            a = str(action).replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'ai_companion_audit_writes_by_action_total{{action="{a}"}} {int(c)}')

    return "\n".join(lines)
