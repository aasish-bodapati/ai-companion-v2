# file: quick_mem_create.py
import os
import sys
import json
import requests

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000/api/v1")
USERNAME = os.getenv("USERNAME", "test@example.com")  # change me
PASSWORD = os.getenv("PASSWORD", "testpassword123")  # change me

def try_register(session: requests.Session) -> bool:
    """Register a user if registration is enabled. Returns True on 2xx."""
    url = f"{BASE_URL}/register"
    payload = {
        "email": USERNAME,
        "password": PASSWORD,
        "full_name": "Test User",
    }
    try:
        r = session.post(url, json=payload, timeout=10)
        return 200 <= r.status_code < 300
    except Exception:
        return False

def login(session: requests.Session) -> str:
    url = f"{BASE_URL}/login/access-token"
    # OAuth2 password flow expects x-www-form-urlencoded
    data = {
        "username": USERNAME,
        "password": PASSWORD,
    }
    r = session.post(url, data=data)
    if r.status_code != 200:
        # Attempt auto-register, then retry once
        if try_register(session):
            r = session.post(url, data=data)
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}", file=sys.stderr)
            sys.exit(1)

    tok = r.json().get("access_token")
    if not tok:
        print(f"No access_token in response: {r.text}", file=sys.stderr)
        sys.exit(1)
    return tok

def create_memory(session: requests.Session, token: str) -> dict:
    url = f"{BASE_URL}/memories"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "content": "alpha bravo charlie",
        "content_type": "fact",
        "source": "test",
    }
    r = session.post(url, headers=headers, json=payload, timeout=10)
    if r.status_code not in (200, 201):
        print(f"Create memory failed: {r.status_code} {r.text}", file=sys.stderr)
        sys.exit(1)
    return r.json()

def main():
    with requests.Session() as s:
        token = login(s)
        mem = create_memory(s, token)
        print(json.dumps(mem, indent=2))

if __name__ == "__main__":
    main()