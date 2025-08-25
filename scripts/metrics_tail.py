#!/usr/bin/env python3
"""
Lightweight metrics dashboard: tails structured JSON logs and computes rolling stats.

Expected log format: one JSON object per line containing optional keys:
- redundancy_ratio: float (0..1)
- continuity_pass: bool
- memory_hit: int or bool (1/0)

Usage:
  python scripts/metrics_tail.py --file path/to/app.log --window 100 --interval 2

Notes:
- Works with existing logs; does not change server code.
- If a key is missing in a line, it's ignored for that metric.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from collections import deque
from typing import Deque, Optional


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Tail logs and compute rolling metrics")
    p.add_argument("--file", required=True, help="Path to the log file (JSON lines)")
    p.add_argument("--window", type=int, default=100, help="Rolling window size (lines)")
    p.add_argument("--interval", type=float, default=2.0, help="Refresh interval in seconds")
    return p.parse_args()


class Metrics:
    def __init__(self, window: int) -> None:
        self.window = window
        self.redundancy: Deque[float] = deque(maxlen=window)
        self.continuity: Deque[int] = deque(maxlen=window)  # 1 if pass else 0
        self.memory_hit: Deque[int] = deque(maxlen=window)  # 1 if hit else 0

    def add(self, obj: dict) -> None:
        rr = obj.get("redundancy_ratio")
        if isinstance(rr, (int, float)):
            # Clamp to [0,1]
            rr = max(0.0, min(1.0, float(rr)))
            self.redundancy.append(rr)
        cp = obj.get("continuity_pass")
        if isinstance(cp, bool):
            self.continuity.append(1 if cp else 0)
        mh = obj.get("memory_hit")
        if isinstance(mh, bool):
            self.memory_hit.append(1 if mh else 0)
        elif isinstance(mh, int):
            self.memory_hit.append(1 if mh > 0 else 0)

    def stats(self) -> dict:
        def avg(xs: Deque[float]) -> Optional[float]:
            return sum(xs) / len(xs) if xs else None

        return {
            "window": len(self.redundancy) or len(self.continuity) or len(self.memory_hit),
            "redundancy_ratio_avg": avg(self.redundancy),
            "continuity_pass_rate": avg(self.continuity),
            "memory_hit_rate": avg(self.memory_hit),
        }


def tail_file(path: str):
    # Simple portable tail that follows file growth.
    with open(path, "r", encoding="utf-8") as f:
        # seek to end
        f.seek(0, io.SEEK_END)
        while True:
            pos = f.tell()
            line = f.readline()
            if not line:
                time.sleep(0.2)
                f.seek(pos)
                continue
            yield line


def main() -> int:
    args = parse_args()
    if not os.path.exists(args.file):
        print(f"Log file not found: {args.file}", file=sys.stderr)
        return 2

    metrics = Metrics(window=args.window)
    last_print = 0.0

    try:
        for line in tail_file(args.file):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                # ignore non-JSON lines
                continue
            metrics.add(obj)

            now = time.time()
            if now - last_print >= args.interval:
                s = metrics.stats()
                print(
                    (
                        "[metrics] window=%s redundancy_avg=%.3f continuity_rate=%.3f memory_hit_rate=%.3f"
                        if all(v is not None for v in (
                            s.get("redundancy_ratio_avg"), s.get("continuity_pass_rate"), s.get("memory_hit_rate")
                        )) else "[metrics] window=%s redundancy_avg=%s continuity_rate=%s memory_hit_rate=%s"
                    )
                    % (
                        s.get("window") or 0,
                        s.get("redundancy_ratio_avg") if s.get("redundancy_ratio_avg") is not None else "n/a",
                        s.get("continuity_pass_rate") if s.get("continuity_pass_rate") is not None else "n/a",
                        s.get("memory_hit_rate") if s.get("memory_hit_rate") is not None else "n/a",
                    )
                )
                last_print = now
    except KeyboardInterrupt:
        return 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
