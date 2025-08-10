#!/usr/bin/env python3
"""
Add a progress journal entry to docs/progress_journal.md.

Usage examples:

  py scripts/add_journal_entry.py \
    --summary "Enabled registration and added FAISS module" \
    --why "Stabilize auth and lay memory foundation" \
    --change "Frontend: fix admin flag" \
    --change "Backend: tokenUrl alignment" \
    --tests "Backend tests green" \
    --flags "MEMORY_ENABLED=false (default)" \
    --next "Add reply endpoint with Together integration"

Notes:
- This script prepends a new dated entry after the first '---' divider in the journal.
- It creates the journal file if missing.
"""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path
import sys


def find_repo_root(start: Path) -> Path:
    cur = start
    for _ in range(5):  # climb a few levels maximum
        if (cur / "docs").exists():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return start


def build_entry(date: str, summary: str, why: str | None, changes: list[str], tests: str | None, flags: str | None, notes: str | None, next_up: list[str]) -> str:
    lines: list[str] = []
    lines.append(f"- Date: {date}")
    lines.append(f"  - Summary: {summary}")
    if why:
        lines.append(f"  - Why: {why}")
    if changes:
        lines.append("  - Key Changes:")
        for c in changes:
            lines.append(f"    - {c}")
    if tests:
        lines.append(f"  - Tests/Health:\n    - {tests}")
    if flags:
        lines.append(f"  - Flags/Config:\n    - {flags}")
    if notes:
        lines.append(f"  - Notes:\n    - {notes}")
    if next_up:
        lines.append("  - Next Up:")
        for n in next_up:
            lines.append(f"    - {n}")
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Append a progress journal entry")
    parser.add_argument("--journal", default="docs/progress_journal.md", help="Path to journal file (default: docs/progress_journal.md)")
    parser.add_argument("--date", default=dt.date.today().isoformat(), help="Entry date (YYYY-MM-DD), default: today")
    parser.add_argument("--summary", required=True, help="One-line summary")
    parser.add_argument("--why", help="Rationale for the change(s)")
    parser.add_argument("--change", action="append", default=[], help="Key change (repeatable)")
    parser.add_argument("--tests", help="Tests/Health status")
    parser.add_argument("--flags", help="Flags/Config state")
    parser.add_argument("--notes", help="Additional notes")
    parser.add_argument("--next", dest="next_up", action="append", default=[], help="Next item (repeatable)")

    args = parser.parse_args(argv)

    # Resolve journal path relative to repo root
    start = Path(__file__).resolve().parent
    root = find_repo_root(start)
    journal_path = (root / args.journal).resolve()
    journal_path.parent.mkdir(parents=True, exist_ok=True)

    entry = build_entry(
        date=args.date,
        summary=args.summary.strip(),
        why=(args.why or "").strip() or None,
        changes=[c.strip() for c in args.change if c and c.strip()],
        tests=(args.tests or "").strip() or None,
        flags=(args.flags or "").strip() or None,
        notes=(args.notes or "").strip() or None,
        next_up=[n.strip() for n in args.next_up if n and n.strip()],
    )

    if journal_path.exists():
        text = journal_path.read_text(encoding="utf-8")
    else:
        # Minimal header if creating fresh
        text = "# Engineering Progress Journal\n\n---\n\n"

    # Insert after the first '---' divider if present; else prepend at top
    divider = "\n---\n"
    if divider in text:
        head, tail = text.split(divider, 1)
        new_text = head + divider + "\n" + entry + tail
    else:
        new_text = entry + "\n" + text

    journal_path.write_text(new_text, encoding="utf-8")
    print(f"Added journal entry to {journal_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))


