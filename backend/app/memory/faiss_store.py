import os
import json
from typing import List, Tuple

from app.core.config import settings


def _try_import_faiss():
    try:
        import faiss  # type: ignore
        return faiss
    except Exception:
        return None


def _index_paths(user_id: str):
    base = getattr(settings, "FAISS_DATA_DIR", "data/faiss")
    os.makedirs(base, exist_ok=True)
    return (
        os.path.join(base, f"{user_id}.index"),
        os.path.join(base, f"{user_id}.meta.json"),
    )


def _load_index(user_id: str):
    faiss = _try_import_faiss()
    if not faiss:
        return None, []
    idx_path, meta_path = _index_paths(user_id)
    ids: List[str] = []
    if os.path.exists(idx_path):
        index = faiss.read_index(idx_path)
    else:
        dim = 384  # embedding dim for all-MiniLM-L6-v2
        index = faiss.IndexFlatIP(dim)
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                ids = json.load(f)
        except Exception:
            ids = []
    return index, ids


def _save_index(user_id: str, index, ids: List[str]) -> None:
    faiss = _try_import_faiss()
    if not faiss:
        return
    idx_path, meta_path = _index_paths(user_id)
    faiss.write_index(index, idx_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(ids, f)


def add(user_id: str, ids: List[str], vectors: List[List[float]]) -> None:
    """Append vectors and ids to a user's FAISS shard. No-ops if faiss missing."""
    faiss = _try_import_faiss()
    if not faiss:
        return
    index, existing_ids = _load_index(user_id)
    if index is None:
        return
    import numpy as np
    xb = np.array(vectors, dtype="float32")
    index.add(xb)
    existing_ids.extend(ids)
    _save_index(user_id, index, existing_ids)


def search(user_id: str, query_vec: List[float], top_k: int) -> List[Tuple[str, float]]:
    """Return list of (id, score). Empty if no index or faiss missing."""
    faiss = _try_import_faiss()
    if not faiss:
        return []
    index, ids = _load_index(user_id)
    if index is None or index.ntotal == 0:
        return []
    import numpy as np
    q = np.array([query_vec], dtype="float32")
    k = min(top_k, max(1, index.ntotal))
    D, I = index.search(q, k)
    result: List[Tuple[str, float]] = []
    for idx, score in zip(I[0], D[0]):
        if 0 <= idx < len(ids):
            result.append((ids[idx], float(score)))
    return result


