from fastapi.testclient import TestClient


def test_http_exception_shape_for_unauthorized(unauth_client: TestClient):
    # Protected route without auth should yield 401/403 with standardized shape
    r = unauth_client.get("/api/v1/conversations/")
    assert r.status_code in (401, 403)
    data = r.json()
    assert isinstance(data, dict)
    # Standard keys
    assert "detail" in data
    assert "message" in data
    assert "errors" in data
    # message mirrors detail
    assert (data.get("message") or "").strip() != ""


def test_validation_error_shape(client: TestClient):
    # Trigger a 422 by sending invalid body to create_message (missing role/content)
    # The handler should standardize the error payload
    r = client.post("/api/v1/conversations/00000000-0000-0000-0000-000000000000/messages", json={})
    assert r.status_code == 422
    data = r.json()
    assert data.get("detail") == "Validation Error"
    assert data.get("message") == "Validation Error"
    errs = data.get("errors")
    assert isinstance(errs, list) and len(errs) > 0
