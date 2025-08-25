from __future__ import annotations
from typing import Dict, Any
from datetime import datetime, timedelta, timezone
import time
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.memory import memory

logger = logging.getLogger(__name__)


class LifecycleMixin:
    def enforce_lifecycle(
        self,
        db: Session,
        *,
        user_id: str,
        consolidate: bool = True,
    ) -> Dict[str, int]:
        """Run lifecycle maintenance for a user.

        - Soft-forget stale, low-importance, non-core memories to keep store lean.
        - Optionally consolidate duplicates by consolidation_key, suppressing older ones.

        Returns: {"suppressed": int, "consolidated": int}
        """
        suppressed = 0
        consolidated = 0
        try:
            # Throttle per user (at most once per minute) to avoid heavy churn in tight test loops
            now = time.time()
            gate_ts = self._cleanup_gate.get(user_id, 0.0)
            if now - gate_ts < 60:
                # Still report zero/last-known values to keep endpoint stable
                return {"suppressed": 0, "consolidated": 0}
            self._cleanup_gate[user_id] = now

            # Soft forget
            try:
                suppressed = int(self._maybe_soft_forget(db, user_id))
            except Exception:
                suppressed = 0

            # Consolidation
            if consolidate:
                try:
                    res = self.consolidate_user_memories(db, user_id=user_id)
                    consolidated = int(res.get("suppressed", 0))
                except Exception:
                    consolidated = 0

            return {"suppressed": suppressed, "consolidated": consolidated}
        except Exception:
            return {"suppressed": 0, "consolidated": 0}

    def consolidate_user_memories(
        self,
        db: Session,
        *,
        user_id: str,
        limit: int = 2000,
    ) -> Dict[str, int]:
        """
        Consolidate user memories by consolidation_key, keeping the most recent
        and suppressing older duplicates.

        Returns a dict of counts: {"keys": n_keys, "suppressed": n_suppressed}
        """
        import json as _json

        keys: Dict[str, Any] = {}
        suppressed = 0
        try:
            items = memory.get_user_memories(db, user_id=user_id, content_type=None, limit=limit)
            # Build map of key -> latest node
            for n in items:
                try:
                    md = {}
                    if n.memory_metadata:
                        if isinstance(n.memory_metadata, dict):
                            md = dict(n.memory_metadata)
                        else:
                            md = _json.loads(n.memory_metadata)
                except Exception:
                    md = {}
                # Skip deleted
                try:
                    if bool(md.get("deleted")):
                        continue
                except Exception:
                    pass
                # Skip suppressed
                suppressed_until = md.get("suppressed_until")
                if suppressed_until:
                    try:
                        su = datetime.fromisoformat(suppressed_until)
                        if su.tzinfo is None:
                            su = su.replace(tzinfo=timezone.utc)
                        if su > datetime.now(timezone.utc):
                            continue
                    except Exception:
                        pass
                ck = md.get("consolidation_key")
                if not ck:
                    continue
                cur = keys.get(ck)
                # Keep the latest by timestamp
                if not cur or getattr(n, "timestamp", None) > getattr(cur, "timestamp", None):
                    keys[ck] = n

            # Second pass: suppress duplicates
            now = datetime.now(timezone.utc)
            for n in items:
                try:
                    md = {}
                    if n.memory_metadata:
                        if isinstance(n.memory_metadata, dict):
                            md = dict(n.memory_metadata)
                        else:
                            md = _json.loads(n.memory_metadata)
                except Exception:
                    md = {}
                ck = md.get("consolidation_key")
                if not ck:
                    continue
                latest = keys.get(ck)
                if latest and latest.faiss_id != n.faiss_id:
                    # soft suppress dup for 1 year
                    md["suppressed_until"] = (now + timedelta(days=365)).isoformat()
                    memory.update_content_and_metadata(db, node=n, content=n.content, metadata=md)
                    suppressed += 1
            return {"keys": len(keys), "suppressed": suppressed}
        except Exception as e:
            logger.debug(f"Consolidation failed for user {user_id}: {e}")
            return {"keys": len(keys), "suppressed": suppressed}

    def _maybe_soft_forget(self, db: Session, user_id: str) -> int:
        """Soft-forget stale, low-importance, non-core memories by long suppression.
        Conditions:
        - total memories > MEMORY_MAX_MEMORIES (default 500)
        - item is older than MEMORY_FORGET_AGE_DAYS (default 90)
        - not core, importance < 0.8, reinforced_count == 0
        """
        try:
            import json as _json

            max_n = int(getattr(settings, "MEMORY_MAX_MEMORIES", 500))
            forget_age_days = int(getattr(settings, "MEMORY_FORGET_AGE_DAYS", 90))
            if max_n <= 0:
                return 0
            items = memory.get_user_memories(
                db, user_id=user_id, content_type=None, limit=max(1000, max_n * 3)
            )
            if not items or len(items) <= max_n:
                return 0
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(days=max(1, forget_age_days))
            suppressed = 0
            for n in items:
                try:
                    md = {}
                    if n.memory_metadata:
                        if isinstance(n.memory_metadata, dict):
                            md = dict(n.memory_metadata)
                        else:
                            md = _json.loads(n.memory_metadata)
                except Exception:
                    md = {}
                try:
                    if bool(md.get("deleted")):
                        continue
                except Exception:
                    pass
                ts = getattr(n, "timestamp", None)
                if not ts or ts > cutoff:
                    continue
                try:
                    core = bool(md.get("core"))
                except Exception:
                    core = False
                if core:
                    continue
                try:
                    imp = float(md.get("importance", 0.0))
                except Exception:
                    imp = 0.0
                try:
                    reinforced = int(md.get("reinforced_count", 0))
                except Exception:
                    reinforced = 0
                if imp >= 0.8 or reinforced > 0:
                    continue
                md["suppressed_until"] = (now + timedelta(days=365)).isoformat()
                memory.update_content_and_metadata(db, node=n, content=n.content, metadata=md)
                suppressed += 1
                if len(items) - suppressed <= max_n:
                    break
            if suppressed:
                logger.info(
                    "Soft-forgot %d stale memories for user %s",
                    suppressed,
                    user_id,
                )
            return suppressed
        except Exception as e:
            logger.debug(f"Soft forget failed: {e}")
            return 0
