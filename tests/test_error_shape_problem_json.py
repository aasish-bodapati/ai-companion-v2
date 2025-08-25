import json
import uuid
import requests

BASE_URL = "http://localhost:8000"
API = f"{BASE_URL}/api/v1"
TEST_USER = {"username": "test@example.com", "password": "testpassword123"}


def _login_session() -> requests.Session:
    s = requests.Session()
    resp = s.post(f"{API}/login/access-token", data=TEST_USER)
    assert resp.status_code == 200, f"login failed: {resp.status_code} {resp.text}"
    token = resp.json().get("access_token")
    assert token, f"no access token in response: {resp.text}"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def _is_problem_json(resp: requests.Response, expected_status: int):
    assert resp.status_code == expected_status, resp.text
    ctype = resp.headers.get("content-type", "")
    assert "application/problem+json" in ctype, f"unexpected content-type: {ctype}"
    body = resp.json()
    # Required RFC 7807 members
    assert body.get("type") == "about:blank"
    assert isinstance(body.get("title"), str) and body["title"], body
    assert body.get("status") == expected_status, body
    assert isinstance(body.get("detail"), str), body
    assert isinstance(body.get("instance"), str), body
    # Extensions allowed
    assert "errors" in body
    return body


def test_problem_json_validation_error_invalid_uuid_on_reply():
    s = _login_session()
    invalid_conv_id = "not-a-uuid"
    payload = {"role": "user", "content": "hello"}
    r = s.post(f"{API}/conversations/{invalid_conv_id}/reply", json=payload)
    body = _is_problem_json(r, 422)
    # Expect validation errors array present
    assert isinstance(body.get("errors"), list)


def test_problem_json_404_task_update_not_found():
    s = _login_session()
    missing_task_id = str(uuid.uuid4())
    r = s.patch(f"{API}/tasks/{missing_task_id}", json={})
    body = _is_problem_json(r, 404)
    assert body.get("title") in ("Not Found", "HTTP Error")
    assert "Task not found" in (body.get("detail") or "")
