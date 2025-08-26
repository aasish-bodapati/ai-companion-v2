import os
import time
import uuid
from typing import List

import numpy as np
import pytest

try:
    from backend.app.memory import faiss_store  # type: ignore
except Exception:  # pragma: no cover
    from app.memory import faiss_store  # type: ignore


def _faiss_available() -> bool:
    try:
        return getattr(faiss_store, "_try_import_faiss")() is not None
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _faiss_available(), reason="FAISS unavailable in this environment")


def _mk_cluster(center_seed: int, n: int, dim: int = 384, noise: float = 0.05) -> np.ndarray:
    rng = np.random.default_rng(center_seed)
    center = rng.normal(0, 1, size=(dim,)).astype("float32")
    center /= (np.linalg.norm(center) + 1e-9)
    pts = center + rng.normal(0, noise, size=(n, dim)).astype("float32")
    pts /= (np.linalg.norm(pts, axis=1, keepdims=True) + 1e-9)
    return pts


def test_vector_search_nearest_neighbor_and_update_delete_roundtrip(tmp_path):
    user = f"test_user_{uuid.uuid4().hex[:8]}"
    dim = 384

    # Two distinct clusters
    a = _mk_cluster(123, 20, dim)
    b = _mk_cluster(456, 20, dim)

    ids_a = [f"{user}_A_{i}" for i in range(len(a))]
    ids_b = [f"{user}_B_{i}" for i in range(len(b))]

    # Seed
    faiss_store.add(user, ids_a + ids_b, np.vstack([a, b]).tolist())

    # Query near cluster A's first point
    q = a[0].tolist()
    top = faiss_store.search(user, q, 5)
    assert top, "Expected non-empty results"
    # Top results should be predominantly from cluster A
    top_ids = [t[0] for t in top]
    assert any(tid.startswith(f"{user}_A_") for tid in top_ids)

    # Update one vector from cluster B to be identical to q, should become rank-1
    target_b = ids_b[0]
    ok = faiss_store.update_vector(user, target_b, q)
    assert ok is True
    top2 = faiss_store.search(user, q, 1)
    assert top2 and top2[0][0] == target_b

    # Delete the updated vector, it should disappear from results
    ok_del = faiss_store.delete(user, target_b)
    assert ok_del is True
    top3 = faiss_store.search(user, q, 10)
    assert target_b not in [t[0] for t in top3]

    # Cleanup: attempt to delete remaining ids (best-effort)
    for _id in ids_a + ids_b[1:]:
        faiss_store.delete(user, _id)


def test_search_empty_index_returns_empty():
    user = f"test_user_{uuid.uuid4().hex[:8]}"
    out = faiss_store.search(user, [0.0] * 384, 5)
    assert out == []
