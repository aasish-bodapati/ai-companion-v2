from fastapi.testclient import TestClient
from app.main import app


def test_metrics_endpoint_emits_basic_metrics():
    client = TestClient(app)
    # Trigger a couple of requests to populate metrics
    client.get("/health")
    client.get("/")
    r = client.get("/metrics")
    assert r.status_code == 200
    body = r.text
    assert "ai_companion_requests_total" in body
    assert "ai_companion_request_duration_ms_bucket" in body
