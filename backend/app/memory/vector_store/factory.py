from __future__ import annotations
from typing import Optional
from app.core.config import settings
from .base import VectorStore
from .faiss_adapter import FaissVectorStore

# Future: add HnswlibVectorStore and QdrantVectorStore here

_singleton: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _singleton
    if _singleton is not None:
        return _singleton

    backend = getattr(settings, "VECTOR_STORE_BACKEND", "faiss").lower()
    # Only faiss is wired by default to avoid behavior change
    if backend == "faiss":
        _singleton = FaissVectorStore()
    else:
        # Fallback to faiss to keep system functional
        _singleton = FaissVectorStore()
    return _singleton
