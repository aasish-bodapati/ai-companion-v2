import os
import pytest

from app.memory.embeddings import embed_texts
from app.memory.faiss_store import _try_import_faiss, add, search, update_vector


def test_embeddings_fallback_works_without_model():
    vecs = embed_texts(["hello", "world"])  # uses configured or fallback model
    assert len(vecs) == 2
    assert len(vecs[0]) > 0


@pytest.mark.skipif(_try_import_faiss() is None, reason="faiss not installed")
def test_faiss_add_and_search(tmp_path, monkeypatch):
    monkeypatch.setenv("FAISS_DATA_DIR", str(tmp_path))

    user_id = "test-user"
    ids = ["m1", "m2"]
    v1 = [1.0] + [0.0] * 383
    v2 = [0.0, 1.0] + [0.0] * 382

    add(user_id, ids, [v1, v2])

    res = search(user_id, v1, top_k=2)
    assert res
    top_id, score = res[0]
    assert top_id == "m1"


@pytest.mark.skipif(_try_import_faiss() is None, reason="faiss not installed")
def test_faiss_update_vector(tmp_path, monkeypatch):
    monkeypatch.setenv("FAISS_DATA_DIR", str(tmp_path))

    user_id = "test-user"
    ids = ["m1", "m2"]
    v1 = [1.0] + [0.0] * 383
    v2 = [0.0, 1.0] + [0.0] * 382

    add(user_id, ids, [v1, v2])

    # Initially, v1 should match m1
    res1 = search(user_id, v1, top_k=1)
    assert res1 and res1[0][0] == "m1"

    # Now update m1's vector to be close to v2
    ok = update_vector(user_id, "m1", v2)
    assert ok

    # After update, both m1 and m2 have the same vector; allow tie order
    res2 = search(user_id, v2, top_k=2)
    assert res2 and {res2[0][0], res2[1][0]} == {"m1", "m2"}


