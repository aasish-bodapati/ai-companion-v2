import io
import os
import pytest
from fastapi.testclient import TestClient

from app.api.endpoints import uploads as uploads_mod


@pytest.fixture(autouse=True)
def _ensure_user_and_env(monkeypatch):
    # Ensure base upload dir exists under repo/uploads for tests
    base = uploads_mod.BASE_UPLOAD_DIR
    os.makedirs(base, exist_ok=True)


def test_empty_file_upload_returns_400(client: TestClient):
    resp = client.post(
        "/api/v1/users/me/uploads",
        files={"file": ("empty.txt", b"", "text/plain")},
    )
    assert resp.status_code == 400
    assert "Empty file" in resp.text


def test_oversized_file_returns_413(monkeypatch, client: TestClient):
    # Reduce limit to 1 MB for quick testing
    monkeypatch.setattr(uploads_mod, "MAX_UPLOAD_SIZE_MB", 1, raising=False)
    big = b"0" * (1 * 1024 * 1024 + 1)  # 1MB + 1 byte
    resp = client.post(
        "/api/v1/users/me/uploads",
        files={"file": ("big.bin", big, "application/octet-stream")},
    )
    assert resp.status_code == 413


def test_get_nonexistent_upload_404(client: TestClient):
    resp = client.get("/api/v1/users/me/uploads/does-not-exist")
    assert resp.status_code == 404


def test_add_to_memory_unsupported_type_415(client: TestClient):
    # Upload arbitrary binary so extraction returns None and mime is not image/
    data = b"\x00\x01\x02\x03randombinarydata"
    up = client.post(
        "/api/v1/users/me/uploads",
        files={"file": ("blob.dat", data, "application/octet-stream")},
    )
    assert up.status_code in (200, 201), up.text
    upload_id = up.json()["upload_id"]

    add = client.post(f"/api/v1/users/me/uploads/{upload_id}/add-to-memory")
    assert add.status_code == 415
    assert "Unsupported file type" in (add.text or "")


def test_add_to_memory_corrupted_pdf_415(client: TestClient):
    # Upload bytes labeled as PDF but not actually a pdf; extractor will fail and return None
    data = b"not a real pdf file"
    up = client.post(
        "/api/v1/users/me/uploads",
        files={"file": ("fake.pdf", data, "application/pdf")},
    )
    assert up.status_code in (200, 201), up.text
    upload_id = up.json()["upload_id"]

    add = client.post(f"/api/v1/users/me/uploads/{upload_id}/add-to-memory")
    assert add.status_code == 415
