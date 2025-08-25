#!/usr/bin/env python3
"""
Demo flows (public-ready):
- Continuity: schedule → "after that"
- Memory (allergy): peanut context → snack suggestion
- Recap: /recap this conversation

Usage:
  python scripts/run_demo_flows.py --base http://localhost:8000 --email test@example.com --password testpassword123

Respects Security Rules: uses JWT, no secrets logged.
"""
from __future__ import annotations

import argparse
import requests
import sys


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run demo flows against the chat API")
    p.add_argument("--base", default="http://localhost:8000", help="Base URL of backend")
    p.add_argument("--email", default="test@example.com")
    p.add_argument("--password", default="testpassword123")
    return p.parse_args()


def login_session(base: str, email: str, password: str) -> requests.Session:
    api = f"{base.rstrip('/')}/api/v1"
    s = requests.Session()
    r = s.post(f"{api}/login/access-token", data={"username": email, "password": password}, timeout=15)
    r.raise_for_status()
    token = (r.json() or {}).get("access_token")
    if not token:
        raise SystemExit("No access token returned")
    s.headers.update({"Authorization": f"Bearer {token}"})
    s.api = api  # type: ignore[attr-defined]
    return s


def create_conv(s: requests.Session, title: str) -> str:
    r = s.post(f"{s.api}/conversations", json={"title": title}, timeout=15)
    r.raise_for_status()
    return (r.json() or {}).get("id")


def reply(s: requests.Session, conv_id: str, content: str) -> dict:
    r = s.post(f"{s.api}/conversations/{conv_id}/reply", json={"role": "user", "content": content}, timeout=60)
    r.raise_for_status()
    return r.json() or {}


def msg_text(body: dict) -> str:
    try:
        return ((body.get("message") or {}).get("content")) or ""
    except Exception:
        return body.get("ai_response") or ""


def print_section(title: str, content: str) -> None:
    bar = "=" * len(title)
    print(f"\n{title}\n{bar}\n{content.strip()}\n")


def run_continuity(s: requests.Session) -> None:
    conv = create_conv(s, "Demo: Continuity")
    _ = reply(s, conv, "Schedule lunch at 3pm.")
    r2 = reply(s, conv, "Remind me after that to send the email.")
    print_section("Continuity", msg_text(r2))


def run_memory_allergy(s: requests.Session) -> None:
    conv = create_conv(s, "Demo: Memory Allergy")
    _ = reply(s, conv, "I'm allergic to peanuts.")
    r2 = reply(s, conv, "Suggest a snack.")
    print_section("Memory (Allergy)", msg_text(r2))


def run_recap(s: requests.Session) -> None:
    conv = create_conv(s, "Demo: Recap")
    _ = reply(s, conv, "I prefer morning workouts and Mediterranean meals.")
    r2 = reply(s, conv, "/recap this conversation")
    print_section("Recap", msg_text(r2))


def main() -> int:
    args = parse_args()
    try:
        s = login_session(args.base, args.email, args.password)
    except Exception as e:
        print(f"Login failed: {e}", file=sys.stderr)
        return 2

    try:
        run_continuity(s)
        run_memory_allergy(s)
        run_recap(s)
    except Exception as e:
        print(f"Demo failed: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
