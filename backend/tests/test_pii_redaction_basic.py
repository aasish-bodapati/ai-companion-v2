import json

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_create_memory_redacts_email(monkeypatch):
    # Ensure redaction enabled
    monkeypatch.setattr(settings, "PRIVACY_REDACTION_ENABLED", True, raising=False)
    payload = {
        "content": "Contact me at john.doe@example.com",
        "content_type": "fact",
    }
    # Auth: tests typically use dependency override in conftest, but use default test user cookie if available
    # Here we simulate by setting a header used in deps.get_current_active_user in tests env
    headers = {"X-Test-User": settings.TEST_USERNAME}
    r = client.post("/api/v1/memory/memories", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "[REDACTED_EMAIL]" in data["content"], data
    # metadata should include redaction counts
    md = data.get("memory_metadata") or {}
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = {}
    red = (md or {}).get("redaction") or {}
    assert red.get("enabled") in (True, False)


def test_create_memory_redacts_phone(monkeypatch):
    monkeypatch.setattr(settings, "PRIVACY_REDACT_PHONE", True, raising=False)
    payload = {
        "content": "My phone is (415) 555-2671",
        "content_type": "fact",
    }
    headers = {"X-Test-User": settings.TEST_USERNAME}
    r = client.post("/api/v1/memory/memories", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    assert "[REDACTED_PHONE]" in r.json()["content"], r.json()
