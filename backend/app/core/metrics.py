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
    }
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


def dump_prometheus() -> str:
    """Return Prometheus-formatted metrics lines for LLM stats."""
    with _lock:
        llm = _state.get("llm", {})
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

    return "\n".join(lines)
