#!/usr/bin/env python3
"""
Aggregate chat metrics from backend logs.

Parses lines that start with 'chat_metrics ' followed by JSON payload as emitted by
backend/app/api/endpoints/conversations_messages.py.

Outputs a summary JSON and prints brief stats:
- memory_hit_rate (0..1)
- avg_redundancy_ratio (0..1)
- continuity_pass_rate (0..1)

Usage:
  python scripts/aggregate_chat_metrics.py [--log backend.log] [--out reports/chat_metrics_summary.json]

Env (optional):
  METRICS_LOG_PATH, METRICS_OUT_PATH

PEP8, <400 lines.
"""
from __future__ import annotations

import argparse
import json
import os
from typing import Dict, Any, List


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Aggregate chat metrics from logs")
    parser.add_argument(
        "--log",
        default=os.environ.get("METRICS_LOG_PATH", os.path.join("backend.log")),
        help="Path to backend log file",
    )
    parser.add_argument(
        "--out",
        default=os.environ.get(
            "METRICS_OUT_PATH", os.path.join("reports", "chat_metrics_summary.json")
        ),
        help="Output JSON path",
    )
    return parser.parse_args()


def ensure_reports_dir(path: str) -> None:
    try:
        d = os.path.dirname(path)
        if d and not os.path.isdir(d):
            os.makedirs(d, exist_ok=True)
    except Exception:
        pass


def load_metrics_lines(log_path: str) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "chat_metrics " not in line:
                    continue
                try:
                    # Find JSON payload after the prefix
                    idx = line.index("chat_metrics ") + len("chat_metrics ")
                    payload = line[idx:].strip()
                    data = json.loads(payload)
                    # Basic shape validation
                    if isinstance(data, dict) and "memory_hit" in data:
                        items.append(data)
                except Exception:
                    continue
    except FileNotFoundError:
        return []
    return items


def compute_summary(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(rows)
    if total == 0:
        return {
            "total": 0,
            "memory_hit_rate": 0.0,
            "avg_redundancy_ratio": 0.0,
            "continuity_pass_rate": 0.0,
        }
    hits = sum(1 for r in rows if bool(r.get("memory_hit")))
    cont = sum(1 for r in rows if bool(r.get("continuity_pass")))
    red_vals = [float(r.get("redundancy_ratio", 0.0)) for r in rows]
    avg_red = sum(red_vals) / total if red_vals else 0.0
    return {
        "total": total,
        "memory_hit_rate": round(hits / total, 3),
        "avg_redundancy_ratio": round(avg_red, 3),
        "continuity_pass_rate": round(cont / total, 3),
    }


def main() -> None:
    args = parse_args()
    rows = load_metrics_lines(args.log)
    summary = compute_summary(rows)
    ensure_reports_dir(args.out)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(
        f"metrics: total={summary['total']} hit_rate={summary['memory_hit_rate']} "
        f"avg_redundancy={summary['avg_redundancy_ratio']} continuity%={summary['continuity_pass_rate']}"
    )


if __name__ == "__main__":
    main()
