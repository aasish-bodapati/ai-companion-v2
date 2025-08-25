#!/usr/bin/env python3
"""
Network diagnostics script for AI Companion

Checks connectivity to the backend API and logs detailed results to diagnose
net::ERR_CONNECTION_REFUSED and Failed to fetch errors from the frontend.

Usage:
  python scripts/network_diagnostics.py --url http://localhost:8000 --origin http://localhost:3000

Defaults:
  --url defaults to http://localhost:8000 (the backend base, without /api/v1)
  --origin defaults to http://localhost:3000 (Next.js dev server)

What it does:
- Reads frontend/.env.local to detect NEXT_PUBLIC_API_URL (if present)
- TCP connectivity check to host:port
- DNS resolution check
- HTTP checks for:
  - /
  - /health
  - /api/v1/openapi.json
  - /api/v1/conversations/
  - /api/v1/memory/users/me/memories/digest (unauthenticated; likely 401)
- CORS header inspection with Origin header
- Prints clear, actionable findings
"""

from __future__ import annotations
import argparse
import os
import socket
import ssl
import sys
import time
from pathlib import Path
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse
import http.client

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ENV = ROOT / "frontend" / ".env.local"


def read_frontend_api_url() -> Optional[str]:
    try:
        if FRONTEND_ENV.exists():
            for line in FRONTEND_ENV.read_text(encoding="utf-8").splitlines():
                s = line.strip()
                if s.startswith("NEXT_PUBLIC_API_URL="):
                    return s.split("=", 1)[1].strip()
    except Exception:
        pass
    return None


def resolve_host(host: str) -> Tuple[bool, str]:
    try:
        infos = socket.getaddrinfo(host, None)
        addrs = sorted({item[4][0] for item in infos})
        return True, ", ".join(addrs)
    except Exception as e:
        return False, f"DNS resolution failed: {e}"


def tcp_connect(host: str, port: int, timeout: float = 2.0) -> Tuple[bool, str]:
    sock = None
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        return True, "TCP connection successful"
    except Exception as e:
        return False, f"TCP connection failed: {e}"
    finally:
        try:
            if sock:
                sock.close()
        except Exception:
            pass


def http_request(parsed, method: str, path: str, headers: Optional[Dict[str, str]] = None, timeout: float = 5.0):
    headers = headers or {}
    conn = None
    start = time.time()
    try:
        if parsed.scheme == "https":
            context = ssl.create_default_context()
            conn = http.client.HTTPSConnection(parsed.hostname, parsed.port or 443, timeout=timeout, context=context)
        else:
            conn = http.client.HTTPConnection(parsed.hostname, parsed.port or 80, timeout=timeout)
        conn.request(method, path, headers=headers)
        resp = conn.getresponse()
        duration = (time.time() - start) * 1000.0
        body = resp.read(512)  # preview first 512 bytes
        return {
            "ok": True,
            "status": resp.status,
            "reason": resp.reason,
            "headers": {k: v for k, v in resp.getheaders()},
            "body_preview": body.decode(errors="replace"),
            "ms": round(duration, 1),
        }
    except Exception as e:
        duration = (time.time() - start) * 1000.0
        return {"ok": False, "error": str(e), "ms": round(duration, 1)}
    finally:
        try:
            if conn:
                conn.close()
        except Exception:
            pass


def print_header(title: str):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.environ.get("API_URL", "http://localhost:8000"), help="Backend base URL (no trailing slash)")
    parser.add_argument("--origin", default=os.environ.get("ORIGIN", "http://localhost:3000"), help="Origin value to test CORS")
    args = parser.parse_args()

    env_api = read_frontend_api_url()

    print_header("Inputs & Environment")
    print(f"Requested URL: {args.url}")
    print(f"Origin header: {args.origin}")
    print(f"frontend/.env.local NEXT_PUBLIC_API_URL: {env_api if env_api else 'Not set'}")

    parsed = urlparse(args.url.rstrip('/'))
    host = parsed.hostname or "localhost"
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    print_header("DNS & TCP Connectivity")
    ok_dns, dns_info = resolve_host(host)
    print(f"DNS: {'OK' if ok_dns else 'FAIL'} - {dns_info}")

    ok_tcp, tcp_info = tcp_connect(host, port)
    print(f"TCP {host}:{port}: {'OPEN' if ok_tcp else 'CLOSED'} - {tcp_info}")

    print_header("HTTP Checks (no auth)")
    headers = {"User-Agent": "diagnostics/1.0", "Accept": "application/json"}
    cors_headers = headers | {"Origin": args.origin}

    # Basic endpoints
    for p in ["/", "/health"]:
        res = http_request(parsed, "GET", p, headers=headers)
        print(f"GET {p} -> {res}")

    # Versioned endpoints
    for p in ["/api/v1/openapi.json", "/api/v1/conversations/", "/api/v1/memory/users/me/memories/digest"]:
        res = http_request(parsed, "GET", p, headers=headers)
        print(f"GET {p} -> {res}")

    print_header("CORS Headers Inspection")
    res_cors = http_request(parsed, "GET", "/api/v1/openapi.json", headers=cors_headers)
    print(f"GET /api/v1/openapi.json with Origin -> {res_cors}")

    print_header("Findings")
    if not ok_tcp:
        print("- Backend port appears CLOSED. If the server is running, verify it is bound to the correct host and port.")
        print("  Example: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("- TCP port is open.")

    # Interpret HTTP findings
    hints = []
    # Health
    health = http_request(parsed, "GET", "/health", headers=headers)
    if not health.get("ok"):
        hints.append("/health unreachable — backend not serving HTTP or blocked by firewall")
    elif health.get("status") != 200:
        hints.append(f"/health returned {health.get('status')} {health.get('reason')}")

    # OpenAPI
    openapi = http_request(parsed, "GET", "/api/v1/openapi.json", headers=headers)
    if not openapi.get("ok"):
        hints.append("/api/v1/openapi.json unreachable — wrong base URL or backend not running")
    elif openapi.get("status") != 200:
        hints.append(f"/api/v1/openapi.json returned {openapi.get('status')} {openapi.get('reason')}")

    # Conversations
    conv = http_request(parsed, "GET", "/api/v1/conversations/", headers=headers)
    if not conv.get("ok"):
        hints.append("/api/v1/conversations/ unreachable — connection refused or routing issue")
    elif conv.get("status") in (401, 403):
        hints.append("/api/v1/conversations/ requires auth — this is expected without a token")

    # CORS
    if isinstance(res_cors, dict) and res_cors.get("ok"):
        acao = (res_cors.get("headers") or {}).get("access-control-allow-origin")
        if not acao:
            hints.append("CORS: No Access-Control-Allow-Origin in response — check BACKEND_CORS_ORIGINS in backend/.env")
        else:
            print(f"- CORS: Access-Control-Allow-Origin -> {acao}")

    if hints:
        print("- Hints:")
        for h in hints:
            print(f"  * {h}")
    else:
        print("- No obvious issues detected.")

    print("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
