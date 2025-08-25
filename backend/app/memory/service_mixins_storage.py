from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import logging

from app.core.config import settings
from app.crud.memory import memory
from app.memory.vector_store.factory import get_vector_store
import app.memory.embeddings as embeddings

logger = logging.getLogger(__name__)


class StorageMixin:
    """Storage-related operations for memories and vector store.

    This mixin is extracted from service.py. It assumes the concrete class
    implements helper methods referenced via self.* (e.g., _estimate_importance,
    _classify_with_llm, _extract_memory_candidates_with_llm, _enhance_memory_metadata,
    _extract_temporal_context, _analyze_emotional_patterns), and any caches/flags.
    """

    def store_memory(
        self,
        db: Session,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Optional[str]:
        """Store new memory in vector store and DB with consolidation-aware behavior.

        Delegates vector operations to the configured vector store backend.
        Tolerates vector backend absence; DB remains authoritative.
        """
        try:
            s = (content or "").strip()
            if not s:
                return None

            # Normalize metadata
            md: Dict[str, Any] = {}
            if metadata:
                md.update(metadata)

            # Heuristic + optional LLM extraction pipeline
            remember_explicit = bool(md.get("remember", False))
            norm = s

            # Importance gating when not explicit
            importance_source = "heuristic"
            final_importance = 0.0
            if not remember_explicit:
                importance_min = float(getattr(settings, "MEMORY_IMPORTANCE_MIN", 0.7))
                est_importance = self._estimate_importance(norm)
                cls = self._classify_with_llm(norm)
                final_importance = est_importance
                if cls and isinstance(cls, dict):
                    try:
                        final_importance = max(final_importance, float(cls.get("importance", 0.0)))
                        md["llm_sensitivity"] = float(cls.get("sensitivity", 0.5))
                        md["llm_reason"] = cls.get("reason")
                        importance_source = "heuristic+llm"
                    except Exception:
                        pass
                if final_importance < importance_min:
                    return None
                md["importance_source"] = importance_source
                md["importance_score"] = float(final_importance)

            # Extract additional concise candidates (optional)
            try:
                candidates = self._extract_memory_candidates_with_llm(norm)
                if candidates:
                    md["extracted_candidates"] = candidates
            except Exception:
                pass

            # Emotional/context enrichment (best-effort)
            try:
                emotional_context: Dict[str, Any] = {
                    "emotional_state": md.get("emotional_state", "neutral"),
                    "energy_level": md.get("energy_level", "medium"),
                }
                md.update(self._enhance_memory_metadata(norm, content_type, user_id, db, emotional_context, conversation_history))
                md.update({
                    "temporal_context": self._extract_temporal_context(norm, conversation_history),
                    "emotional_patterns": self._analyze_emotional_patterns(norm, emotional_context, conversation_history),
                })
            except Exception:
                pass

            # Consolidation key and hashing
            import hashlib as _hashlib

            content_hash = _hashlib.sha1(norm.encode("utf-8")).hexdigest()
            consolidation_key = md.get("consolidation_key") or content_hash
            md["consolidation_key"] = consolidation_key
            md["content_hash"] = content_hash

            # Check if existing memory with same key
            existing = memory.get_by_consolidation_key(db, user_id=user_id, consolidation_key=consolidation_key)
            embedding = None

            # Compute embedding once if needed
            try:
                embedding = embeddings.embed_texts([norm])
            except Exception as e:
                logger.warning(f"Embedding failed; proceeding DB-only. Error: {e}")
                embedding = None

            if existing:
                # Update DB content/metadata
                memory.update_content_and_metadata(db, node=existing, content=norm, metadata=md)
                # Try updating vector if we have an embedding and a FAISS id
                if embedding is not None and existing.faiss_id:
                    try:
                        vector_store = get_vector_store()
                        vector_store.update_vector(user_id, existing.faiss_id, embedding[0])
                    except Exception as _fe:
                        logger.warning(f"Vector update failed for user={user_id}, id={existing.faiss_id}: {_fe}")
                return existing.faiss_id or None

            # Create DB record first to ensure we have authoritative state
            created = memory.create(
                db,
                user_id=user_id,
                content=norm,
                content_type=content_type,
                conversation_id=conversation_id,
                metadata=md,
            )
            if not created:
                return None

            # Insert into vector store (non-fatal)
            faiss_id = None
            if embedding is not None:
                import uuid as _uuid

                faiss_id = str(_uuid.uuid4())
                try:
                    vector_store = get_vector_store()
                    vector_store.add(user_id, [faiss_id], [embedding[0]])
                except Exception as _fe:
                    logger.warning(f"Vector add failed for user={user_id}, id={faiss_id}: {_fe}")
                    faiss_id = None

            # Persist faiss_id and a baseline relevance score
            if faiss_id:
                try:
                    memory.update_faiss_id(db, node=created, faiss_id=faiss_id)
                    memory.update_relevance_score(db, faiss_id=faiss_id, score=1.0)
                except Exception:
                    pass

            return faiss_id
        except Exception as e:
            logger.warning(f"store_memory failed for user={user_id}: {e}")
            return None

    def mark_memories_seen(self, db: Session, *, user_id: str, faiss_ids: List[str]) -> None:
        """Mark memories as seen; increment seen_count and occasionally reinforce."""
        if not faiss_ids:
            return
        import json as _json

        now_iso = datetime.now(timezone.utc).isoformat()
        for fid in faiss_ids:
            try:
                node = memory.get_memory_by_faiss_id(db, fid)
                if not node or node.user_id != user_id:
                    continue
                md: Dict[str, Any] = {}
                if node.memory_metadata:
                    try:
                        if isinstance(node.memory_metadata, dict):
                            md = dict(node.memory_metadata)
                        else:
                            md = _json.loads(node.memory_metadata)
                    except Exception:
                        md = {}
                seen = int(md.get("seen_count", 0)) + 1
                md["seen_count"] = seen
                md["last_seen_at"] = now_iso
                if seen % 5 == 0:
                    cur = int(md.get("reinforced_count", 0))
                    md["reinforced_count"] = cur + 1
                memory.update_content_and_metadata(db, node=node, content=node.content, metadata=md)
            except Exception:
                continue

    def suppress_memory_by_faiss_id(
        self,
        db: Session,
        *,
        user_id: str,
        faiss_id: str,
        ttl_days: int = 14,
    ) -> bool:
        """Mark a memory as suppressed for a period via metadata."""
        try:
            node = memory.get_memory_by_faiss_id(db, faiss_id)
            if not node or node.user_id != user_id:
                return False
            import json as _json

            md: Dict[str, Any] = {}
            if node.memory_metadata:
                try:
                    if isinstance(node.memory_metadata, dict):
                        md = dict(node.memory_metadata)
                    else:
                        md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            from datetime import timedelta as _timedelta

            until = datetime.now(timezone.utc) + _timedelta(days=max(1, ttl_days))
            md["suppressed_until"] = until.isoformat()
            memory.update_content_and_metadata(db, node=node, content=node.content, metadata=md)
            return True
        except Exception as e:
            logger.warning(f"Failed to suppress memory {faiss_id}: {e}")
            return False

    def reinforce_memory_by_faiss_id(
        self,
        db: Session,
        *,
        user_id: str,
        faiss_id: str,
        increment: int = 1,
    ) -> bool:
        """Reinforce a memory by increasing reinforced_count and optional relevance score."""
        try:
            node = memory.get_memory_by_faiss_id(db, faiss_id)
            if not node or node.user_id != user_id:
                return False
            import json as _json

            md: Dict[str, Any] = {}
            if node.memory_metadata:
                try:
                    if isinstance(node.memory_metadata, dict):
                        md = dict(node.memory_metadata)
                    else:
                        md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            current = int(md.get("reinforced_count", 0))
            md["reinforced_count"] = max(0, current + max(1, increment))
            try:
                new_score = min((node.relevance_score or 1.0) * 1.1, 3.0)
            except Exception:
                new_score = 1.0
            memory.update_content_and_metadata(db, node=node, content=node.content, metadata=md)
            memory.update_relevance_score(db, faiss_id=faiss_id, score=new_score)
            return True
        except Exception as e:
            logger.warning(f"Failed to reinforce memory {faiss_id}: {e}")
            return False
