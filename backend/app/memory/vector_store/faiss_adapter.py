from __future__ import annotations
from typing import List, Tuple
from app.memory import faiss_store


class FaissVectorStore:
    """Adapter to match VectorStore interface using existing faiss_store module."""

    def search(self, user_id: str, query_vec: List[float], k: int) -> List[Tuple[str, float]]:
        return faiss_store.search(user_id, query_vec, k)

    def delete(self, user_id: str, item_id: str) -> bool:
        try:
            return bool(faiss_store.delete(user_id, item_id))
        except Exception:
            return False

    def add(self, user_id: str, ids: List[str], vectors: List[List[float]]) -> None:
        """Append vectors and ids to a user's FAISS shard. No-ops on failure."""
        try:
            faiss_store.add(user_id, ids, vectors)
        except Exception:
            # Keep DB authoritative even if FAISS is unavailable
            pass

    def update_vector(self, user_id: str, item_id: str, new_vector: List[float]) -> bool:
        """Replace the vector for item_id by delegating to faiss_store.update_vector."""
        try:
            return bool(faiss_store.update_vector(user_id, item_id, new_vector))
        except Exception:
            return False
