from __future__ import annotations
from typing import List, Tuple, Dict, Any

try:
    import hnswlib  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    hnswlib = None  # type: ignore


class HnswlibVectorStore:
    """Minimal HNSWLIB-backed vector search.

    Notes:
    - This is a stub that returns empty results unless an index is built.
    - Proper integration would add upsert/delete APIs and on-disk persistence.
    - Included so the backend can switch via VECTOR_STORE_BACKEND without import errors.
    """

    def __init__(self, dim: int = 384, space: str = "cosine") -> None:
        self.dim = dim
        self.space = space
        self._index = None
        self._id_map: Dict[int, str] = {}

        if hnswlib is not None:
            try:
                self._index = hnswlib.Index(space=self.space, dim=self.dim)
            except Exception:
                self._index = None

    def search(self, user_id: str, query_vec: List[float], k: int) -> List[Tuple[str, float]]:
        # Until we wire indexing, return empty to avoid changing behavior
        if self._index is None or not isinstance(query_vec, list):
            return []
        try:
            import numpy as np  # type: ignore
        except Exception:
            return []

        try:
            q = np.array([query_vec], dtype=np.float32)
            if self._index.get_current_count() == 0:
                return []
            labels, distances = self._index.knn_query(q, k=min(k, self._index.get_current_count()))
            out: List[Tuple[str, float]] = []
            for lbl, dist in zip(labels[0], distances[0]):
                item_id = self._id_map.get(int(lbl))
                if item_id is None:
                    continue
                # For cosine, smaller distance means higher similarity; map to score
                score = 1.0 - float(dist)
                out.append((item_id, score))
            return out
        except Exception:
            return []
