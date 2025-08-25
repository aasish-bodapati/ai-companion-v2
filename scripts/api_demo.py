#!/usr/bin/env python3
"""
Minimal API demo script for AI Companion backend.

Flow:
1) Login with test creds (config defaults) or provided --email/--password.
   - If login fails with 400 and registration is enabled, optionally register and retry.
2) Create a conversation.
3) Send a calendar add command via /conversations/{id}/reply with MessageCreate.content.
4) List calendar events to verify creation.

Environment variables (optional):
- BASE_URL: defaults to http://localhost:8000/api/v1
- EMAIL, PASSWORD: override credentials

Run examples:
  python scripts/api_demo.py \
    --email test@example.com --password testpassword123 \
    --title "E2E Chat Path" --date 2025-08-20 --start 10:00 --end 11:00

This script avoids printing access tokens per security rules.
"""
from __future__ import annotations

import argparse
import dataclasses
import os
import sys
from typing import Any, Dict, Optional

import requests


DEFAULT_BASE = os.getenv("BASE_URL", "http://localhost:8000/api/v1").rstrip("/")
DEFAULT_EMAIL = os.getenv("EMAIL", "test@example.com")
DEFAULT_PASSWORD = os.getenv("PASSWORD", "testpassword123")


@dataclasses.dataclass
class ApiContext:
    base: str
    session: requests.Session
    token: Optional[str] = None  # Bearer token (not printed)


def _problem_text(resp: requests.Response) -> str:
    try:
        data = resp.json()
        return data.get("detail") or data.get("title") or resp.text
    except Exception:
        return resp.text


def login(ctx: ApiContext, email: str, password: str) -> bool:
    url = f"{ctx.base}/login/access-token"
    form = {"username": email, "password": password}
    resp = ctx.session.post(url, data=form, headers={"Content-Type": "application/x-www-form-urlencoded"})
    if resp.ok:
        token = (resp.json() or {}).get("access_token")
        if not token:
            print("Login succeeded but no access_token in response.", file=sys.stderr)
            return False
        ctx.token = token
        return True
    else:
        print(f"Login failed ({resp.status_code}): {_problem_text(resp)}")
        return False


def register(ctx: ApiContext, email: str, password: str, full_name: str) -> bool:
    url = f"{ctx.base}/register"
    payload = {"email": email, "password": password, "full_name": full_name}
    resp = ctx.session.post(url, json=payload)
    if resp.ok or resp.status_code == 201:
        print(f"Registered user: {email}")
        return True
    else:
        print(f"Register failed ({resp.status_code}): {_problem_text(resp)}")
        return False


def auth_headers(ctx: ApiContext) -> Dict[str, str]:
    return {"Authorization": f"Bearer {ctx.token}"} if ctx.token else {}


def users_me(ctx: ApiContext) -> Dict[str, Any]:
    url = f"{ctx.base}/users/me"
    resp = ctx.session.get(url, headers=auth_headers(ctx))
    resp.raise_for_status()
    return resp.json()


def create_conversation(ctx: ApiContext) -> Dict[str, Any]:
    url = f"{ctx.base}/conversations/"
    resp = ctx.session.post(url, headers={**auth_headers(ctx), "Content-Type": "application/json"}, json={})
    resp.raise_for_status()
    return resp.json()


def reply(ctx: ApiContext, conversation_id: str, content: str) -> Dict[str, Any]:
    url = f"{ctx.base}/conversations/{conversation_id}/reply"
    payload = {"content": content}
    resp = ctx.session.post(url, headers={**auth_headers(ctx), "Content-Type": "application/json"}, json=payload)
    resp.raise_for_status()
    return resp.json()


def list_events(ctx: ApiContext, start_iso: str, end_iso: str) -> Dict[str, Any]:
    url = f"{ctx.base}/calendar/events"
    resp = ctx.session.get(url, headers=auth_headers(ctx), params={"start": start_iso, "end": end_iso})
    resp.raise_for_status()
    return resp.json()


def build_calendar_command(title: str, date: str, start: str, end: str) -> str:
    # Prefer explicit phrasing to help parsers: "on <date> from <start> to <end>"
    return f"/calendar add {title} on {date} from {start} to {end}"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="AI Companion API demo")
    p.add_argument("--base", default=DEFAULT_BASE, help=f"Base API URL (default: {DEFAULT_BASE})")
    p.add_argument("--email", default=DEFAULT_EMAIL, help=f"Login email (default: {DEFAULT_EMAIL})")
    p.add_argument("--password", default=DEFAULT_PASSWORD, help="Login password (default: hidden)")
    p.add_argument("--full-name", default="Demo User", help="Full name used if registering")
    p.add_argument("--title", default="E2E Chat Path", help="Calendar event title")
    p.add_argument("--date", required=True, help="Event date (YYYY-MM-DD)")
    p.add_argument("--start", required=True, help="Start time (HH:MM)")
    p.add_argument("--end", required=True, help="End time (HH:MM)")
    p.add_argument("--register-on-fail", action="store_true", help="Attempt to register if login fails")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    ctx = ApiContext(base=args.base.rstrip("/"), session=requests.Session())

    # 1) Login (try provided/test creds)
    if not login(ctx, args.email, args.password):
        if not args.register_on_fail:
            return 1
        print("Attempting to register and retry login...")
        if not register(ctx, args.email, args.password, args.full_name):
            return 1
        if not login(ctx, args.email, args.password):
            return 1

    # 2) Verify identity
    me = users_me(ctx)
    print(f"Logged in as: {me.get('email')} (id={me.get('id')})")

    # 3) Create conversation
    conv = create_conversation(ctx)
    conv_id = str(conv.get("id"))
    print(f"Created conversation: {conv_id}")

    # 4) Send calendar add command
    content = build_calendar_command(args.title, args.date, args.start, args.end)
    reply_res = reply(ctx, conv_id, content)
    # Expect a message body containing an "Added:" acknowledgement depending on implementation
    print("Reply result:")
    print(reply_res)

    # 5) List events for +/- 1 day window around date
    start_iso = f"{args.date}T00:00:00Z"
    end_iso = f"{args.date}T23:59:59Z"
    try:
        events = list_events(ctx, start_iso, end_iso)
        print("Events:")
        print(events)
    except requests.HTTPError as e:
        # Calendar may be optional; don't fail the whole script if listing isn't implemented
        print(f"List events failed: {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
