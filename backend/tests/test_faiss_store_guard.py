import importlib
from typing import List, Tuple

import pytest

from app.memory import faiss_store


def test_faiss_guard_when_unavailable(monkeypatch):
    # Simulate FAISS permanently unavailable via cached flag
    monkeypatch.setattr(faiss_store, "_FAISS_AVAILABLE", False, raising=False)
    monkeypatch.setattr(faiss_store, "_FAISS_OBJ", None, raising=False)
    monkeypatch.setattr(faiss_store, "_FAISS_ERR", "test failure", raising=False)

    # add/search/update should not raise and should no-op or return empty/False
    faiss_store.add("u1", ["id1"], [[0.0] * 384])
    res = faiss_store.search("u1", [0.0] * 384, 3)
    assert res == []
    ok = faiss_store.update_vector("u1", "id1", [0.0] * 384)
    assert ok is False


def test_faiss_normal_flow_smoke(monkeypatch):
    # If FAISS is installed in env, these should run; otherwise guard returns should apply automatically
    # We won't assert on availability; only that functions don't raise and return expected shapes/types.
    try:
        faiss_store.add("u2", ["id2"], [[0.1] * 384])
        out = faiss_store.search("u2", [0.1] * 384, 1)
        assert isinstance(out, list)
        # update may return False if id isn't present yet in this environment
        ok = faiss_store.update_vector("u2", "id2", [0.2] * 384)
        assert isinstance(ok, bool)
    except Exception as e:
        pytest.fail(f"faiss_store functions raised unexpectedly: {e}")
