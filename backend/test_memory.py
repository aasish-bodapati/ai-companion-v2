import os
import pytest

from app.memory.embeddings import embed_texts
from app.memory.faiss_store import _try_import_faiss, add, search


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


