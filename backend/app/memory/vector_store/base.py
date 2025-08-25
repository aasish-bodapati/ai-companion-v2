from __future__ import annotations
from typing import List, Tuple, Protocol


class VectorStore(Protocol):
    """Minimal vector store interface used by MemoryService.

    All scores are similarity scores in [0, 1] if normalized, but the
    implementation may return any float; higher is better.
    """

    def search(self, user_id: str, query_vec: List[float], k: int) -> List[Tuple[str, float]]:
        """Return a list of (item_id, score) for the given user_id.
        item_id should be resolvable back to a memory via faiss_id or equivalent.
        """
        ...

    def delete(self, user_id: str, item_id: str) -> bool:
        """Delete an item from the index for the given user.
        Returns True if removed or not present; False on error.
        """
        ...

    def add(self, user_id: str, ids: List[str], vectors: List[List[float]]) -> None:
        """Append vectors and ids for the given user. Implementations should be tolerant to backend absence."""
        ...

    def update_vector(self, user_id: str, item_id: str, new_vector: List[float]) -> bool:
        """Replace the vector for item_id for the given user. Returns True on success."""
        ...
