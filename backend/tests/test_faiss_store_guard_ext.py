import builtins
from typing import List

import app.memory.faiss_store as fs


def test_add_noop_when_faiss_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(fs, "_try_import_faiss", lambda: None)
    # Should not raise
    fs.add("user1", ["a", "b"], [[0.1, 0.2], [0.3, 0.4]])


def test_search_empty_when_faiss_missing(monkeypatch):
    monkeypatch.setattr(fs, "_try_import_faiss", lambda: None)
    res = fs.search("user1", [0.1, 0.2, 0.3], top_k=5)
    assert res == []


def test_update_vector_false_when_faiss_missing(monkeypatch):
    monkeypatch.setattr(fs, "_try_import_faiss", lambda: None)
    ok = fs.update_vector("user1", "faiss-id-1", [0.1, 0.2])
    assert ok is False
