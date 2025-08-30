"""
Semantic Deduplication Service - Prevents storing duplicate or highly similar memories.
Includes a compatibility API expected by unit tests.
"""

import logging
import re
import time
import hashlib
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
import math

try:
    import numpy as np  # type: ignore
except Exception:  # NumPy is optional in slim builds
    np = None  # type: ignore

from app.memory import embeddings
from app.crud.memory import memory as memory_crud

logger = logging.getLogger(__name__)


class DeduplicationService:
    """Compatibility service exposing the API required by unit tests.

    Provides:
    - _normalize_content
    - _generate_content_hash (SHA-256 hex, 64 chars)
    - _get_embedding (async, with simple cache)
    - _calculate_similarity (cosine)
    - is_duplicate (async)
    - count_duplicates (async) — counts duplicate pairs among recent memories
    - _cleanup_cache
    """

    def __init__(self, similarity_threshold: float = 0.85) -> None:
        self.similarity_threshold = similarity_threshold
        self._embedding_cache: Dict[str, Dict[str, object]] = {}
        self._cache_ttl_seconds = 3600

    def _normalize_content(self, content: str) -> str:
        text = (content or "").strip().lower()
        # remove punctuation and collapse spaces
        text = re.sub(r"[^a-z0-9\s]", "", text)
        text = re.sub(r"\s+", " ", text)
        return text

    def _generate_content_hash(self, content: str) -> str:
        normalized = self._normalize_content(content)
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    async def _get_embedding(self, content: str) -> List[float]:
        key = self._generate_content_hash(content)
        now = time.time()
        cached = self._embedding_cache.get(key)
        if (
            cached
            and isinstance(cached, dict)
            and (now - float(cached["timestamp"])) < self._cache_ttl_seconds
        ):
            return list(cached["embedding"])  # type: ignore[return-value]

        # Use compatibility single-text embedding function (tests patch this)
        try:
            vec = embeddings.get_embedding(content)
        except Exception:
            vec = []
        self._embedding_cache[key] = {"embedding": vec, "timestamp": now}
        self._cleanup_cache()
        return vec

    def _calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        if np is not None:
            a = np.array(vec1)
            b = np.array(vec2)
            denom = np.linalg.norm(a) * np.linalg.norm(b)
            if denom == 0:
                return 0.0
            return float(np.dot(a, b) / denom)
        # Fallback: pure Python cosine similarity
        dot = sum((x * y) for x, y in zip(vec1, vec2))
        norm_a = math.sqrt(sum((x * x) for x in vec1))
        norm_b = math.sqrt(sum((y * y) for y in vec2))
        denom = norm_a * norm_b
        if denom == 0:
            return 0.0
        return float(dot / denom)

    async def is_duplicate(
        self, content: str, user_id: str, db: Session, content_type: str = "message"
    ) -> bool:
        try:
            new_vec = await self._get_embedding(content)
            recent = memory_crud.get_user_memories(
                db, user_id=user_id, content_type=content_type, limit=100
            )
            if not recent:
                return False
            # Compare against recent
            for mem in recent:
                vec = await self._get_embedding(mem.content)
                sim = self._calculate_similarity(new_vec, vec)
                if sim >= self.similarity_threshold:
                    return True
            return False
        except Exception as exc:
            logger.error(f"is_duplicate failed: {exc}")
            return False

    async def count_duplicates(
        self, user_id: str, db: Session, content_type: str = "message"
    ) -> int:
        try:
            recents = memory_crud.get_user_memories(
                db, user_id=user_id, content_type=content_type, limit=50
            )
            if not recents or len(recents) < 2:
                return 0
            embeddings_list: List[List[float]] = []
            for mem in recents:
                embeddings_list.append(await self._get_embedding(mem.content))

            count = 0
            n = len(embeddings_list)
            for i in range(n):
                for j in range(i + 1, n):
                    sim = self._calculate_similarity(embeddings_list[i], embeddings_list[j])
                    if sim >= self.similarity_threshold:
                        count += 1
            return count
        except Exception as exc:
            logger.error(f"count_duplicates failed: {exc}")
            return 0

    def _cleanup_cache(self) -> None:
        now = time.time()
        to_delete = [
            k
            for k, v in self._embedding_cache.items()
            if (now - float(v.get("timestamp", 0))) > self._cache_ttl_seconds
        ]
        for k in to_delete:
            self._embedding_cache.pop(k, None)


class MemoryDeduplicationService:
    """Service to prevent duplicate memory storage through semantic similarity."""

    def __init__(self, similarity_threshold: float = 0.85):
        """
        Initialize deduplication service.

        Args:
            similarity_threshold: Cosine similarity threshold above which memories are considered duplicates
        """
        self.similarity_threshold = similarity_threshold

    # --- Compatibility helpers expected by endpoints/tests ---
    async def is_duplicate(
        self,
        content: str,
        user_id: str,
        db: Session,
        content_type: str = "message",
    ) -> bool:
        """Async wrapper returning only the boolean duplication flag.
        Keeps backward-compat with endpoints/tests that expect `is_duplicate`.
        """
        is_dup, _ = self.check_for_duplicates(
            db=db, user_id=user_id, content=content, content_type=content_type
        )
        return is_dup

    async def count_duplicates(self, user_id: str, db: Session) -> int:
        """Return an approximate duplicate count for metrics.
        In absence of a full duplicate index, return 0 as conservative default.
        Tests can patch this method.
        """
        return 0

    def _generate_content_hash(self, content: str) -> str:
        """Generate a simple stable-ish hash for content to be returned by APIs."""
        try:
            return str(abs(hash(content.lower().strip())))
        except Exception:
            return "0"

    def check_for_duplicates(
        self, db: Session, user_id: str, content: str, content_type: str = "message"
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if content is semantically similar to existing memories.

        Returns:
            Tuple of (is_duplicate, existing_memory_id)
        """
        try:
            # Get embedding for new content
            new_embedding = embeddings.embed_texts([content])
            if not new_embedding:
                logger.warning("Failed to generate embedding for deduplication check")
                return False, None

            # Get recent memories of same type for comparison
            recent_memories = memory_crud.get_user_memories(
                db,
                user_id=user_id,
                content_type=content_type,
                limit=100,  # Check against recent memories
            )

            if not recent_memories:
                return False, None

            # Get embeddings for existing memories
            existing_contents = [mem.content for mem in recent_memories]
            existing_embeddings = embeddings.embed_texts(existing_contents)

            if not existing_embeddings:
                return False, None

            # Calculate cosine similarities
            new_vec = new_embedding[0] if np is None else np.array(new_embedding[0])
            max_similarity = 0.0
            most_similar_id = None

            for i, existing_vec in enumerate(existing_embeddings):
                v2 = existing_vec if np is None else np.array(existing_vec)
                similarity = self._cosine_similarity(new_vec, v2)
                if similarity > max_similarity:
                    max_similarity = similarity
                    most_similar_id = recent_memories[i].id

            is_duplicate = max_similarity >= self.similarity_threshold

            if is_duplicate:
                logger.info(
                    f"Duplicate memory detected: similarity={max_similarity:.3f}, "
                    f"threshold={self.similarity_threshold}"
                )

            return is_duplicate, most_similar_id if is_duplicate else None

        except Exception as e:
            logger.error(f"Error in duplicate check: {e}")
            return False, None

    def should_consolidate(
        self, db: Session, user_id: str, content: str, content_type: str = "message"
    ) -> List[str]:
        """
        Find memories that should be consolidated with new content.

        Returns:
            List of memory IDs that are similar enough to consolidate
        """
        try:
            # Get embedding for new content
            new_embedding = embeddings.embed_texts([content])
            if not new_embedding:
                return []

            # Get memories for consolidation check (lower threshold)
            consolidation_threshold = self.similarity_threshold - 0.15  # More lenient

            memories = memory_crud.get_user_memories(
                db, user_id=user_id, content_type=content_type, limit=50
            )

            if not memories:
                return []

            # Find similar memories
            existing_contents = [mem.content for mem in memories]
            existing_embeddings = embeddings.embed_texts(existing_contents)

            if not existing_embeddings:
                return []

            new_vec = new_embedding[0] if np is None else np.array(new_embedding[0])
            similar_ids = []

            for i, existing_vec in enumerate(existing_embeddings):
                v2 = existing_vec if np is None else np.array(existing_vec)
                similarity = self._cosine_similarity(new_vec, v2)
                if similarity >= consolidation_threshold:
                    similar_ids.append(memories[i].id)

            return similar_ids

        except Exception as e:
            logger.error(f"Error in consolidation check: {e}")
            return []

    def _cosine_similarity(self, vec1, vec2) -> float:
        """Calculate cosine similarity between two vectors.
        Works with numpy arrays if available, else with Python lists.
        """
        try:
            if np is not None:
                dot_product = np.dot(vec1, vec2)
                norm1 = np.linalg.norm(vec1)
                norm2 = np.linalg.norm(vec2)
            else:
                dot_product = float(sum((x * y) for x, y in zip(vec1, vec2)))
                norm1 = math.sqrt(sum((x * x) for x in vec1))
                norm2 = math.sqrt(sum((y * y) for y in vec2))
            if norm1 == 0 or norm2 == 0:
                return 0.0
            return float(dot_product / (norm1 * norm2))
        except Exception:
            return 0.0


# Global instance
deduplication_service = MemoryDeduplicationService()
