#!/usr/bin/env python3
"""
Human vs Companion Evaluation
Computes side-by-side scores for Companion responses and human baselines
using the same scenario rubric defined in eval_prompts.yaml.
"""
from __future__ import annotations

import json
import importlib.util
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

# Paths
ROOT = Path(__file__).parent.parent.parent
REPORTS_DIR = ROOT / "reports"
EVAL_PROMPTS_PATH = ROOT / "eval_prompts.yaml"
HUMAN_BASELINES_PATH = ROOT / "docs" / "specs" / "human_baselines.yaml"

# Dynamically load ChatEvaluator from tests/evaluation/test_chat_evaluation.py
_eval_module_path = ROOT / "tests" / "evaluation" / "test_chat_evaluation.py"
ChatEvaluator = None  # type: ignore
install_llm_stubs = None  # type: ignore
if _eval_module_path.exists():
    spec = importlib.util.spec_from_file_location("test_chat_evaluation", str(_eval_module_path))
    if spec and spec.loader:
        _mod = importlib.util.module_from_spec(spec)
        sys.modules["test_chat_evaluation"] = _mod
        spec.loader.exec_module(_mod)  # type: ignore
        ChatEvaluator = getattr(_mod, "ChatEvaluator", None)
        install_llm_stubs = getattr(_mod, "install_llm_stubs", None)


def load_human_baselines() -> Dict[str, str]:
    if not HUMAN_BASELINES_PATH.exists():
        raise FileNotFoundError(f"Human baselines not found: {HUMAN_BASELINES_PATH}")
    with open(HUMAN_BASELINES_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    scenarios = data.get("scenarios", [])
    return {s.get("id"): (s.get("baseline") or "").strip() for s in scenarios if s.get("id")}


def load_scenarios() -> List[Dict[str, Any]]:
    if not EVAL_PROMPTS_PATH.exists():
        raise FileNotFoundError(f"Evaluation prompts not found: {EVAL_PROMPTS_PATH}")
    with open(EVAL_PROMPTS_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data.get("scenarios", [])


def main() -> None:
    assert ChatEvaluator is not None, "ChatEvaluator import failed"

    # Install deterministic LLM stubs if available for stable evaluation
    if callable(install_llm_stubs):
        try:
            install_llm_stubs()
        except Exception:
            pass

    baselines = load_human_baselines()
    scenarios = load_scenarios()

    # Prepare evaluator for Companion side
    evaluator = ChatEvaluator()
    evaluator.load_scenarios()  # Ensures evaluator.scenarios is in sync

    if not evaluator.login():
        raise RuntimeError("Failed to authenticate")
    if not evaluator.create_conversation():
        raise RuntimeError("Failed to create conversation")

    # Evaluate both sides
    rows: List[Dict[str, Any]] = []
    dim_scores_h: Dict[str, List[float]] = {}
    dim_scores_c: Dict[str, List[float]] = {}

    for scenario in scenarios:
        sid = scenario.get("id")
        if not sid:
            continue

        # Seed memory when needed
        evaluator.seed_memory_if_required(scenario)

        # Companion reply: send user message first, then request assistant reply via /reply
        # This follows the updated flow used elsewhere in the suite.
        companion_reply: Optional[str] = ""
        try:
            # Post user message
            resp_msg = evaluator.session.post(
                f"{evaluator.base_url}/api/v1/conversations/{evaluator.conversation_id}/messages",
                json={"content": scenario["user_message"]},
                timeout=30,
            )
            # Request assistant reply
            resp_reply = evaluator.session.post(
                f"{evaluator.base_url}/api/v1/conversations/{evaluator.conversation_id}/reply",
                json={},
                timeout=60,
            )
            used_llm = None
            if resp_reply.status_code in (200, 201):
                data = resp_reply.json() or {}
                # AssistantReply schema: { id, message: { ... , content }, used_llm }
                msg = data.get("message") or {}
                companion_reply = (
                    (msg.get("content") if isinstance(msg, dict) else None)
                    or data.get("content")
                    or data.get("reply")
                    or ""
                ).strip()
                used_llm = data.get("used_llm")
            else:
                companion_reply = ""
        except Exception:
            companion_reply = ""
        c_score = evaluator.evaluate_response(scenario, companion_reply)

        # Human baseline
        human_reply = baselines.get(sid, "")
        h_score = evaluator.evaluate_response(scenario, human_reply)

        # Track scores per dimension
        dim = scenario.get("dimension", "unknown")
        dim_scores_h.setdefault(dim, []).append(h_score)
        dim_scores_c.setdefault(dim, []).append(c_score)

        rows.append(
            {
                "id": sid,
                "dimension": dim,
                "difficulty": scenario.get("difficulty", "medium"),
                "user_message": scenario.get("user_message", ""),
                "human": {"reply": human_reply, "score": h_score},
                "companion": {"reply": companion_reply, "score": c_score, "used_llm": used_llm},
                "delta": c_score - h_score,
            }
        )

    # Aggregate
    agg = {
        "human": {d: sum(v) / len(v) for d, v in dim_scores_h.items()},
        "companion": {d: sum(v) / len(v) for d, v in dim_scores_c.items()},
    }

    # Overall averages across dimensions
    def _avg(d: Dict[str, float]) -> float:
        return sum(d.values()) / len(d) if d else 0.0

    overall_h = _avg(agg["human"]) if agg["human"] else 0.0
    overall_c = _avg(agg["companion"]) if agg["companion"] else 0.0

    # Save report
    REPORTS_DIR.mkdir(exist_ok=True)
    out = {
        "overall": {"human": overall_h, "companion": overall_c, "delta": overall_c - overall_h},
        "per_dimension": {
            d: {"human": agg["human"].get(d, 0.0), "companion": agg["companion"].get(d, 0.0), "delta": agg["companion"].get(d, 0.0) - agg["human"].get(d, 0.0)}
            for d in sorted(set(list(agg["human"].keys()) + list(agg["companion"].keys())))
        },
        "rows": rows,
        "meta": {"num_scenarios": len(rows)},
    }

    with open(REPORTS_DIR / "chat_eval_h2h.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    # Print compact summary for CI logs
    print(json.dumps({"overall": out["overall"], "dimensions": out["per_dimension"]}, indent=2))


if __name__ == "__main__":
    main()
