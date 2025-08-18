from fastapi.testclient import TestClient


def test_metrics_endpoint_increments(client: TestClient):
    # Call a couple of endpoints to generate traffic
    r1 = client.get("/api/v1/utils/health")
    assert r1.status_code == 200
    r2 = client.get("/api/v1/utils/retrieval-settings")
    assert r2.status_code == 200

    # Fetch metrics
    m = client.get("/api/v1/utils/metrics")
    assert m.status_code == 200
    data = m.json()
    assert set(data.keys()) == {"total_requests", "per_route"}
    assert isinstance(data["total_requests"], int)
    assert isinstance(data["per_route"], dict)

    # Should have counts for the endpoints we hit
    per = data["per_route"]
    assert any(path.endswith("/api/v1/utils/health") for path in per.keys())
    assert any(path.endswith("/api/v1/utils/retrieval-settings") for path in per.keys())
    # Each should have count and total_ms
    for v in per.values():
        assert "count" in v and isinstance(v["count"], int)
        assert "total_ms" in v and isinstance(v["total_ms"], (int, float))
