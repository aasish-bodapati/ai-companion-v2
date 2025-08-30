from __future__ import annotations
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timezone
import time as _time
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.memory import memory
from app.memory.vector_store.factory import get_vector_store
import app.memory.embeddings as embeddings
from app.memory.deduplication import deduplication_service
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

# Lightweight PII/sensitive data patterns (blocklist)
# Note: keep patterns conservative to avoid false positives; expand cautiously
_RE_SSN = re_compile = None
try:
    import re as _re

    _RE_PATTERNS = {
        "password_like": _re.compile(r"(?i)\b(pass(?:word)?|pwd)\b\s*[:=]\s*\S{3,}"),
        "api_key_common": _re.compile(r"(?i)\b(api[_-]?key|secret|token|bearer)\b\s*[:=]\s*[A-Za-z0-9_\-]{8,}"),
        "openai_key": _re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),
        "github_pat": _re.compile(r"\bghp_[A-Za-z0-9]{30,}\b"),
        "slack_bot": _re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
        "aws_access_key": _re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "aws_secret_key": _re.compile(r"(?i)aws(.{0,20})secret(.{0,5})key\s*[:=]\s*[A-Za-z0-9/+=]{30,}"),
        "ssn": _re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        # Basic credit card (Luhn not enforced here; we just avoid storing card-like strings)
        "credit_card": _re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
    }

    _RE_EMAIL = _re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    _RE_PHONE = _re.compile(r"\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}\b")
except Exception:
    _RE_PATTERNS = {}
    _RE_EMAIL = None
    _RE_PHONE = None


def _apply_pii_policy(text: str) -> tuple[str, bool]:
    """Return (sanitized_text, blocked).

    Block if credentials/secrets-like content is detected. Otherwise, redact low-risk identifiers.
    Never log or return the original sensitive content.
    """
    try:
        t = (text or "").strip()
        if not t:
            return t, False

        # Block on high-risk secrets
        for name, rx in (_RE_PATTERNS or {}).items():
            try:
                if rx.search(t):
                    # Replace obvious key substrings to avoid leaking if upstream mishandles
                    safe = "[REDACTED_SECRET]"
                    return safe, True
            except Exception:
                continue

        # Redact low-risk PII: emails/phones (keep usefulness without exact identifiers)
        redacted = t
        try:
            if _RE_EMAIL is not None:
                redacted = _RE_EMAIL.sub("[REDACTED_EMAIL]", redacted)
        except Exception:
            pass
        try:
            if _RE_PHONE is not None:
                redacted = _RE_PHONE.sub("[REDACTED_PHONE]", redacted)
        except Exception:
            pass

        return redacted, False
    except Exception:
        return text, False


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

            # Enforce PII policy before any further processing
            sanitized, blocked = _apply_pii_policy(s)
            if blocked:
                # Do not store or embed secrets
                logger.info("Sensitive content blocked from memory storage")
                return None
            # Continue with sanitized text (emails/phones redacted)
            s = sanitized

            # Optionally bypass dedup for structured fact KV so consolidation can run
            _has_structured_kv = False
            try:
                if ":" in s:
                    _k = s.split(":", 1)[0].strip()
                    if 1 <= len(_k) <= 64 and (" " not in _k):
                        _has_structured_kv = True
            except Exception:
                _has_structured_kv = False

            # Re-enable dedup for non-fact content; keep bypass for facts and structured KV
            bypass_dedup = (content_type or "").lower() == "fact" or _has_structured_kv

            # Check for semantic duplicates before storing (unless bypassed)
            if not bypass_dedup:
                is_duplicate, existing_id = deduplication_service.check_for_duplicates(
                    db, user_id, s, content_type
                )
                if is_duplicate:
                    # Translate DB id to faiss_id for API consistency
                    try:
                        existing_node = memory.get(db, existing_id)
                        if existing_node and existing_node.faiss_id:
                            return existing_node.faiss_id
                    except Exception:
                        pass
                    logger.info(f"Skipping duplicate memory for user {user_id}")
                    return existing_id

            # Normalize metadata
            md: Dict[str, Any] = {}
            if metadata:
                md.update(metadata)

            # Heuristic + optional LLM extraction pipeline
            remember_explicit = bool(md.get("remember", False))
            norm = s

            # Detect simple structured key:value pattern early (e.g., "email: user@example.com")
            has_structured_kv = False
            try:
                if ":" in s:
                    key_part = s.split(":", 1)[0].strip()
                    if 1 <= len(key_part) <= 64 and (" " not in key_part):
                        has_structured_kv = True
            except Exception:
                has_structured_kv = False

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
                # For structured facts, allow a lower effective threshold to avoid LLM dependency in common cases
                effective_min = importance_min
                if (content_type or "").lower() == "fact" and has_structured_kv:
                    effective_min = min(importance_min, 0.3)
                if final_importance < effective_min:
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
                md.update(
                    self._enhance_memory_metadata(
                        norm, content_type, user_id, db, emotional_context, conversation_history
                    )
                )
                md.update(
                    {
                        "temporal_context": self._extract_temporal_context(
                            norm, conversation_history
                        ),
                        "emotional_patterns": self._analyze_emotional_patterns(
                            norm, emotional_context, conversation_history
                        ),
                    }
                )
            except Exception:
                pass

            # Consolidation key and hashing
            import hashlib as _hashlib

            # Compute a content hash for change detection and idempotency keying
            content_hash = _hashlib.sha1(norm.encode("utf-8")).hexdigest()

            # Idempotency guard (short-lived, process-local)
            try:
                guard = getattr(self, "_recent_write_guard", None)
                if guard is None:
                    self._recent_write_guard = {}
                    guard = self._recent_write_guard
                ttl = int(getattr(settings, "MEMORY_WRITE_IDEMPOTENCY_TTL_SEC", 30))
                now_ts = _time.time()
                # purge expired
                try:
                    for k, v in list(guard.items()):
                        if now_ts - float(v.get("ts", 0.0)) > ttl:
                            del guard[k]
                except Exception:
                    pass
                id_key = f"{user_id}:{content_hash}"
                entry = guard.get(id_key)
                if entry and (now_ts - float(entry.get("ts", 0.0)) <= ttl):
                    cached = entry.get("faiss_id")
                    if cached:
                        return cached
                    # Soft-block duplicate in-flight writes within TTL
                    return None
                guard[id_key] = {"ts": now_ts, "faiss_id": None}
            except Exception:
                pass

            # Derive a stable, human-readable consolidation key when possible.
            # Example: "email: user@example.com" -> consolidation_key == "email"
            derived_key = None
            try:
                if ":" in s:
                    candidate = s.split(":", 1)[0].strip().lower()
                    # Keep alnum + underscore/hyphen; drop other punctuation/spaces
                    derived_key = "".join(
                        ch for ch in candidate if ch.isalnum() or ch in ("_", "-")
                    )
                    if not derived_key:
                        derived_key = None
            except Exception:
                derived_key = None

            consolidation_key = md.get("consolidation_key") or derived_key or content_hash
            md["consolidation_key"] = consolidation_key
            md["content_hash"] = content_hash

            # Check if existing memory with same key
            existing = memory.get_by_consolidation_key(db, user_id=user_id, key=consolidation_key)
            embedding = None

            # Compute embedding once if needed
            try:
                embedding = embeddings.embed_texts([norm])
            except Exception as e:
                logger.warning(f"Embedding failed; proceeding DB-only. Error: {e}")
                embedding = None

            if existing:
                # Determine if content actually changed using stored content_hash in metadata
                prev_hash = None
                try:
                    prev_md = existing.memory_metadata or {}
                    if isinstance(prev_md, dict):
                        prev_hash = prev_md.get("content_hash")
                    else:
                        prev_hash = (json.loads(prev_md or "{}") or {}).get("content_hash")
                except Exception:
                    prev_hash = None

                changed = prev_hash != content_hash

                # Update DB content and metadata (content persists exact 'norm')
                memory.update_content_and_metadata(db, node=existing, content=norm, metadata=md)

                # Only update the vector when the content actually changed
                if changed and embedding is not None and existing.faiss_id:
                    try:
                        vector_store = get_vector_store()
                        vector_store.update_vector(user_id, existing.faiss_id, embedding[0])
                    except Exception as _fe:
                        logger.warning(
                            f"Vector update failed for user={user_id}, id={existing.faiss_id}: {_fe}"
                        )
                try:
                    # populate idempotency cache
                    id_key = f"{user_id}:{content_hash}"
                    guard = getattr(self, "_recent_write_guard", None)
                    if isinstance(guard, dict) and id_key in guard:
                        guard[id_key]["faiss_id"] = existing.faiss_id or None
                except Exception:
                    pass
                return existing.faiss_id or None

            # Create DB record with a generated faiss_id (required by schema)
            faiss_id = str(uuid.uuid4())
            # Map importance (0..1) to integer (0..100) if available
            importance_int = 0
            try:
                if "importance_score" in md:
                    importance_int = max(0, min(100, int(float(md["importance_score"]) * 100)))
            except Exception:
                importance_int = 0

            created = memory.create_memory_node(
                db,
                faiss_id=faiss_id,
                content=norm,
                content_type=content_type,
                user_id=user_id,
                conversation_id=(str(conversation_id) if conversation_id is not None else None),
                metadata=md,
                importance_score=importance_int,
            )
            if not created:
                return None

            # Insert into vector store (non-fatal)
            if embedding is not None:
                try:
                    vector_store = get_vector_store()
                    vector_store.add(user_id, [faiss_id], [embedding[0]])
                except Exception as _fe:
                    logger.warning(f"Vector add failed for user={user_id}, id={faiss_id}: {_fe}")

            # Baseline relevance score
            try:
                memory.update_relevance_score(db, faiss_id=faiss_id, score=1.0)
            except Exception:
                pass

            try:
                # populate idempotency cache
                id_key = f"{user_id}:{content_hash}"
                guard = getattr(self, "_recent_write_guard", None)
                if isinstance(guard, dict) and id_key in guard:
                    guard[id_key]["faiss_id"] = faiss_id
            except Exception:
                pass
            return faiss_id
        except Exception as e:
            logger.warning(f"store_memory failed for user={user_id}: {e}")
            return None

    # -------- Async path (fire-and-forget) --------
    _store_exec: ThreadPoolExecutor | None = None

    def _get_store_executor(self) -> ThreadPoolExecutor:
        exec_inst = getattr(self, "_store_exec", None)
        if exec_inst is None:
            # Small pool; memory writes are lightweight
            exec_inst = ThreadPoolExecutor(max_workers=2, thread_name_prefix="mem-store")
            setattr(self, "_store_exec", exec_inst)
        return exec_inst

    def store_memory_async(
        self,
        *,
        user_id: str,
        content: str,
        content_type: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> None:
        """Submit a background job to persist memory using a fresh DB session.

        - Respects settings.MEMORY_ASYNC_WRITES_ENABLED (default True)
        - Uses the same idempotency guard as store_memory()
        - Fire-and-forget: returns immediately
        """
        try:
            if not bool(getattr(settings, "MEMORY_ASYNC_WRITES_ENABLED", True)):
                # Fallback to synchronous write with a new session
                db = SessionLocal()
                try:
                    self.store_memory(
                        db,
                        content=content,
                        content_type=content_type,
                        user_id=user_id,
                        conversation_id=conversation_id,
                        metadata=metadata,
                        conversation_history=conversation_history,
                    )
                finally:
                    db.close()
                return

            def _task() -> None:
                db = SessionLocal()
                try:
                    self.store_memory(
                        db,
                        content=content,
                        content_type=content_type,
                        user_id=user_id,
                        conversation_id=conversation_id,
                        metadata=metadata,
                        conversation_history=conversation_history,
                    )
                except Exception:
                    # Swallow exceptions; async path is best-effort
                    pass
                finally:
                    try:
                        db.close()
                    except Exception:
                        pass

            exec_inst = self._get_store_executor()
            exec_inst.submit(_task)
        except Exception:
            # As a safety net, avoid raising in caller path
            pass

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
            memory.update_relevance_score(
                db,
                faiss_id=faiss_id,
                score=new_score,
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to reinforce memory {faiss_id}: {e}")
            return False
