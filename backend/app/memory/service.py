from typing import List, Optional, Dict, Any, Set
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import logging
import uuid
import time
import math
import hashlib
import json

from app.core.config import settings
from app.core.llm import generate_with_together
from app.crud.memory import memory
from app.crud.onboarding import get_by_user_id
from app.memory import faiss_store
import app.memory.embeddings as embeddings
from app.schemas.memory import MemorySearchResult

logger = logging.getLogger(__name__)


class MemoryService:
    """Service for integrating FAISS memory search with database operations."""

    def __init__(self):
        # Simple in-process caches with short TTL to reduce repeated work between quick turns
        self._sys_prompt_cache: Dict[str, Dict[str, Any]] = {}
        self._conv_ctx_cache: Dict[str, Dict[str, Any]] = {}
        self._sys_prompt_ttl_sec = 60
        self._conv_ctx_ttl_sec = 20
        # Cleanup throttle per user
        self._cleanup_gate: Dict[str, float] = {}
        # Lightweight retrieval metrics (process-local)
        self._retrieval_metrics: Dict[str, Any] = {
            "total_requests": 0,
            "last": {},
        }

    def get_retrieval_metrics(self) -> Dict[str, Any]:
        """Return a shallow copy of retrieval metrics for diagnostics."""
        try:
            return {
                "total_requests": int(self._retrieval_metrics.get("total_requests", 0)),
                "last": dict(self._retrieval_metrics.get("last", {})),
            }
        except Exception:
            return {"total_requests": 0, "last": {}}

    def _normalize_consolidation_key(self, text: str) -> Optional[str]:
        """Extract and normalize a consolidation key from content.

        Pattern: "Key: Value" → key is left of first colon with no spaces, 1..64 chars.
        Normalization: strip, lowercase. Returns None if no valid key.
        """
        try:
            s = (text or "").strip()
            if ":" not in s:
                return None
            key_part = s.split(":", 1)[0].strip()
            if 1 <= len(key_part) <= 64 and (" " not in key_part):
                return key_part.lower()
            return None
        except Exception:
            return None

    def _extract_profile_highlights(self, profile_text: str, max_bullets: int = 3) -> List[str]:
        """Return up to max_bullets concise bullets from serialized profile text.

        Heuristics:
        - Prefer existing lines starting with '- '
        - Otherwise split by lines or sentences and pick short statements
        """
        try:
            s = (profile_text or "").strip()
            if not s:
                return []
            lines = [ln.strip() for ln in s.splitlines() if ln.strip()]
            bullets = [ln for ln in lines if ln.startswith("- ")]
            if not bullets:
                # fallback: use short lines
                bullets = [ln if ln.startswith("- ") else f"- {ln}" for ln in lines if len(ln) <= 140]
            # Trim and cap
            out: List[str] = []
            for b in bullets:
                # Ensure bullet prefix
                if not b.startswith("- "):
                    b = f"- {b}"
                out.append(b)
                if len(out) >= max_bullets:
                    break
            return out
        except Exception:
            return []
            key_part = s.split(":", 1)[0].strip()
            if 1 <= len(key_part) <= 64 and (" " not in key_part):
                return key_part.lower()
            return None
        except Exception:
            return None

    def _content_hash(self, text: str) -> str:
        """Return a stable content hash (sha256 of normalized text)."""
        s = (text or "").strip()
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    def _estimate_importance(self, text: str) -> float:
        """Heuristic importance estimator in [0.0, 1.0].

        Factors:
        - Length: more tokens -> higher base
        - Digits/dates/amounts -> boost
        - Punctuation like ':' or '=' suggesting key-value facts -> boost
        - Keywords like 'remember', 'note', 'todo', 'deadline', 'phone', 'email' -> boost
        Bounded to [0,1].
        """
        try:
            s = (text or "").strip()
            if not s:
                return 0.0
            n = len(s)
            # Base on length (up to ~280 chars)
            base = min(1.0, max(0.1, n / 280.0))
            # Signal features
            has_digits = any(c.isdigit() for c in s)
            punct_boost = 0.1 if (":" in s or "=" in s or "- " in s) else 0.0
            digit_boost = 0.1 if has_digits else 0.0
            kw = s.lower()
            keywords = [
                "remember",
                "note",
                "todo",
                "deadline",
                "call",
                "email",
                "phone",
                "address",
                "birthday",
                "meeting",
            ]
            kw_boost = 0.15 if any(k in kw for k in keywords) else 0.0
            score = base + punct_boost + digit_boost + kw_boost
            return float(min(1.0, max(0.0, score)))
        except Exception:
            return 0.5

    def grade_importance(self, text: str, content_type: Optional[str] = None) -> int:
        """Return a UI-facing importance score in [0..100].

        Strategy:
        - Start with heuristic estimate in [0..1].
        - If LLM classifier is enabled, blend with LLM importance (max of the two).
        - Map the resulting [0..1] to banded UI scores for stability: 10/30/60/85/100.
        - Apply small type prior adjustments (e.g., preferences/profile a bit higher).
        """
        try:
            s = (text or "").strip()
            if not s:
                return 0

            # Base heuristic
            est = self._estimate_importance(s)  # 0..1

            # Optional LLM rubric
            imp_llm: Optional[float] = None
            if getattr(settings, "MEMORY_LLM_CLASSIFIER_ENABLED", True) and getattr(settings, "IMPORTANCE_LLM_ENABLED", True):
                try:
                    cls = self._classify_with_llm(s)
                    if cls and isinstance(cls.get("importance"), (int, float)):
                        imp_llm = max(0.0, min(1.0, float(cls["importance"])))
                except Exception:
                    imp_llm = None

            fused = est
            if imp_llm is not None:
                fused = max(fused, imp_llm)

            # Type prior bumps
            ct = (content_type or "").lower()
            if ct in ("preference", "profile"):
                fused = min(1.0, fused + 0.1)
            elif ct in ("message", "conversation"):
                fused = min(1.0, fused + 0.02)

            # Map to bands for UI stability
            if fused >= 0.92:
                ui = 100
            elif fused >= 0.80:
                ui = 85
            elif fused >= 0.55:
                ui = 60
            elif fused >= 0.25:
                ui = 30
            elif fused > 0.0:
                ui = 10
            else:
                ui = 0
            return int(ui)
        except Exception:
            return 0

    def _classify_with_llm(self, text: str) -> Optional[Dict[str, Any]]:
        """Use LLM to classify message importance and sensitivity.

        Returns a dict like {"importance": float[0..1], "sensitivity": float[0..1], "reason": str}
        or None on failure. Honors MEMORY_LLM_CLASSIFIER_ENABLED.
        """
        try:
            if not getattr(settings, "MEMORY_LLM_CLASSIFIER_ENABLED", True):
                return None
            s = (text or "").strip()
            if not s:
                return None
            # Build strict JSON instruction
            system_prompt = (
                "You are a classifier. Output ONLY compact JSON with keys: "
                "importance (0..1), sensitivity (0..1), reason (string). "
                "importance: likelihood this should be saved as a memory for future "
                "personalization. "
                "sensitivity: likelihood content includes private/secret data that should NOT "
                "be stored. "
                "Do not add commentary."
            )
            model = (
                getattr(settings, "LLM_MODEL_FAST", "")
                or getattr(settings, "LLM_MODEL_DEFAULT", "")
                or "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
            )
            reply = generate_with_together(
                model=model,
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": s}],
                max_tokens=128,
            )
            raw = (reply or "").strip()
            # Extract JSON if wrapped
            import json as _json

            parsed = None
            if raw.startswith("{") and raw.endswith("}"):
                try:
                    parsed = _json.loads(raw)
                except Exception:
                    parsed = None
            if parsed is None:
                # Fallback: find first JSON object substring
                start = raw.find("{")
                end = raw.rfind("}")
                if start != -1 and end != -1 and end > start:
                    try:
                        parsed = _json.loads(raw[start : end + 1])
                    except Exception:
                        parsed = None
            if not isinstance(parsed, dict):
                return None

            def _clip01(v: Any) -> Optional[float]:
                try:
                    f = float(v)
                    return max(0.0, min(1.0, f))
                except Exception:
                    return None

            imp = _clip01(parsed.get("importance"))
            sen = _clip01(parsed.get("sensitivity"))
            reason = parsed.get("reason") if isinstance(parsed.get("reason"), str) else None
            out: Dict[str, Any] = {}
            if imp is not None:
                out["importance"] = imp
            if sen is not None:
                out["sensitivity"] = sen
            if reason:
                out["reason"] = reason
            return out or None
        except Exception:
            return None

    def _extract_memory_candidates_with_llm(self, text: str) -> Optional[List[str]]:
        """Use LLM to extract concise, memory-worthy facts from a message.

        Returns a list of short strings (each <= 200 chars) or None if no candidates.
        Controlled by MEMORY_LLM_EXTRACTION_ENABLED (default: True).
        """
        try:
            if not getattr(settings, "MEMORY_LLM_EXTRACTION_ENABLED", True):
                return None
            s = (text or "").strip()
            if not s:
                return None
            system_prompt = (
                "Extract only concrete, reusable facts or preferences suitable for future recall. "
                "Return strict JSON: {\"memories\": [\"...\", \"...\"]}. "
                "Rules: keep items short (<= 200 chars), no PII unless explicitly provided by user, "
                "omit greetings, general chit-chat, or one-off requests."
            )
            user_prompt = (
                "Message:\n" + s + "\n\nRespond with JSON only."
            )
            resp = generate_with_together(
                model=(getattr(settings, "LLM_MODEL_DEFAULT", "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free")),
                system_prompt=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                max_tokens=256,
                temperature=0.2,
            )
            if not resp:
                return None
            # Best-effort JSON parse
            parsed: Optional[Dict[str, Any]] = None
            try:
                parsed = json.loads(resp)
            except Exception:
                # Try to recover JSON block if model added text
                try:
                    start = resp.find("{")
                    end = resp.rfind("}")
                    if start != -1 and end != -1:
                        parsed = json.loads(resp[start : end + 1])
                except Exception:
                    parsed = None
            if not isinstance(parsed, dict):
                return None
            arr = parsed.get("memories")
            if not isinstance(arr, list):
                return None
            out: List[str] = []
            for item in arr:
                if isinstance(item, str):
                    it = item.strip()
                    if it and len(it) <= 200:
                        out.append(it)
            return out or None
        except Exception:
            return None

    def is_auto_promote_eligible(self, metadata: Optional[Dict[str, Any]]) -> bool:
        """Return True if a memory meets auto-promotion criteria.

        Criteria (feature-flagged):
        - MEMORY_CORE_AUTOPROMOTE_ENABLED must be True
        - importance >= MEMORY_CORE_IMPORTANCE_MIN (default 0.85)
        - reinforced_count >= MEMORY_CORE_REINFORCE_MIN (default 2)

        Notes:
        - This only inspects metadata. Callers should pass the parsed JSON dict from
          `memory_metadata`.
        - Future extensibility: incorporate consolidation stability signals when available.
        """
        if not getattr(settings, "MEMORY_CORE_AUTOPROMOTE_ENABLED", False):
            return False

    def increase_rank_boost_by_faiss_id(
        self,
        db: Session,
        *,
        user_id: str,
        faiss_id: str,
        delta: float = 0.2,
        cap: float = 1.0,
    ) -> bool:
        """Increase metadata.rank_boost for a memory to strengthen future ranking.

        Returns True on success. No-ops if memory not owned by user.
        """
        try:
            node = memory.get_memory_by_faiss_id(db, faiss_id)
            if not node or node.user_id != user_id:
                return False
            import json as _json

            md = {}
            if node.memory_metadata:
                try:
                    md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            try:
                cur = float(md.get("rank_boost", 0.0))
            except Exception:
                cur = 0.0
            new_val = max(0.0, min(cap, cur + max(0.0, float(delta))))
            if new_val != cur:
                md["rank_boost"] = new_val
                memory.update_content_and_metadata(db, node=node, content=node.content, metadata=md)
            return True
        except Exception as e:
            logger.warning(f"Failed to increase rank_boost for {faiss_id}: {e}")
            return False
        if not metadata:
            return False
        try:
            importance_min = float(getattr(settings, "MEMORY_CORE_IMPORTANCE_MIN", 0.85))
            reinforce_min = int(getattr(settings, "MEMORY_CORE_REINFORCE_MIN", 2))
            imp = float(metadata.get("importance", 0.0) or 0.0)
            reinforced = int(metadata.get("reinforced_count", 0) or 0)
            if imp >= importance_min and reinforced >= reinforce_min:
                return True
        except Exception:
            return False
        return False

    def get_user_profile_memory(self, db: Session, user_id: str) -> Optional[str]:
        """
        Get the user's onboarding profile memory as the foundational context.
        This is always included in conversation context.
        """
        try:
            # Cache by user
            now = time.time()
            c = self._sys_prompt_cache.get(user_id)
            if c and (now - c.get("ts", 0)) < self._sys_prompt_ttl_sec:
                return c.get("val")

            # Get the most recent completed onboarding profile
            profile = get_by_user_id(db, user_id=user_id)
            if profile and profile.completed:
                from app.memory.profile import serialize_onboarding_profile

                val = serialize_onboarding_profile(profile)
                self._sys_prompt_cache[user_id] = {"ts": now, "val": val}
                return val

        except Exception as e:
            logger.warning(f"Failed to retrieve profile memory for user {user_id}: {e}")

        return None

    def search_memories(
        self,
        db: Session,
        query: str,
        user_id: str,
        content_types: Optional[List[str]] = None,
        limit: int = 8,
        min_relevance: float = 0.5,
        debug: bool = False,
    ) -> List[MemorySearchResult]:
        """
        Search for relevant memories using FAISS and return enriched results.

        Args:
            db: Database session
            query: Search query text
            user_id: User ID to search within
            content_types: Optional list of content types to filter by
            limit: Maximum number of results to return
            min_relevance: Minimum relevance score threshold

        Returns:
            List of memory search results with content and metadata
        """
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, returning empty results")
            return []

        try:
            # Get query embedding
            query_embedding = embeddings.embed_texts([query])
            if query_embedding is None:
                logger.warning("Failed to generate query embedding")
                return []

            # Search FAISS for similar vectors
            faiss_results = faiss_store.search(
                user_id,
                query_embedding[0],
                limit * 2,  # Get more results to filter by relevance
            )

            # Fallback: if FAISS is unavailable or empty, do a simple in-DB embedding search
            if not faiss_results:
                try:
                    # Pull a reasonable slice of user memories and rank by dot-product with query
                    cand_nodes = memory.get_user_memories(
                        db, user_id=user_id, content_type=None, limit=200
                    )
                    texts = [n.content or "" for n in cand_nodes]
                    if texts:
                        vecs = embeddings.embed_texts(texts)
                        if vecs is not None and len(vecs) == len(texts):
                            import numpy as _np

                            qv = _np.array(query_embedding[0], dtype="float32")
                            scores: list[tuple[str, float]] = []
                            for n, v in zip(cand_nodes, vecs):
                                try:
                                    sv = float(_np.dot(qv, _np.array(v, dtype="float32")))
                                except Exception:
                                    sv = 0.0
                                scores.append((n.faiss_id, sv))
                            # Sort by score desc and keep top 2x limit similar to FAISS branch
                            scores.sort(key=lambda t: t[1], reverse=True)
                            faiss_results = scores[: max(1, limit * 2)]
                except Exception:
                    # If fallback fails, proceed with empty results
                    faiss_results = []

            if not faiss_results:
                logger.info("No retrieval results (FAISS and fallback empty)")
                return []

            # Retrieve memory nodes from database (collect more for reranking)
            memory_results = []
            seen_norm_contents: Set[str] = set()
            for faiss_id, score in faiss_results:
                memory_node = memory.get_memory_by_faiss_id(db, faiss_id)
                # Ensure comparison on same type to avoid filtering out valid results
                if not memory_node or str(memory_node.user_id) != str(user_id):
                    continue

                # Apply content type filter if specified
                if content_types and memory_node.content_type not in content_types:
                    continue

                # Filter out suppressed memories and collect evolution metadata
                try:
                    import json as _json

                    md = (
                        _json.loads(memory_node.memory_metadata)
                        if memory_node.memory_metadata
                        else {}
                    )
                except Exception:
                    md = {}
                suppressed_until = md.get("suppressed_until")
                if suppressed_until:
                    try:
                        sup_dt = datetime.fromisoformat(suppressed_until)
                        now = datetime.now(timezone.utc)
                        if sup_dt.tzinfo is None:
                            sup_dt = sup_dt.replace(tzinfo=timezone.utc)
                        if sup_dt > now:
                            # Skip suppressed for now
                            continue
                    except Exception:
                        # If parse fails, treat as not suppressed
                        pass

                # Allow core memories to bypass minimum similarity threshold
                is_core = False
                try:
                    is_core = bool(md.get("core"))
                except Exception:
                    is_core = False
                if score < min_relevance and not is_core:
                    continue

                # Evolution-aware fused scoring
                boosted_score = score
                _dbg: Dict[str, Any] = {"raw_score": float(score)} if debug else {}

                # Importance boost (bounded)
                try:
                    importance = float(md.get("importance", 1.0))
                except Exception:
                    importance = 1.0
                importance_boost = max(0.5, min(2.0, importance))
                boosted_score *= importance_boost
                if debug:
                    _dbg["importance"] = float(importance)
                    _dbg["importance_boost"] = float(importance_boost)

                # Core boost
                core_boost = 1.0
                try:
                    if bool(md.get("core")):
                        core_boost = 1.3
                except Exception:
                    core_boost = 1.0
                boosted_score *= core_boost
                if debug:
                    _dbg["core"] = bool(core_boost > 1.0)
                    _dbg["core_boost"] = float(core_boost)

                # Reinforcement boost (capped)
                reinforced_count = 0
                try:
                    reinforced_count = int(md.get("reinforced_count", 0))
                except Exception:
                    reinforced_count = 0
                _reinforce_factor = 1.0 + min(0.25 * reinforced_count, 1.0)
                boosted_score *= _reinforce_factor
                if debug:
                    _dbg["reinforced_count"] = int(reinforced_count)
                    _dbg["reinforce_factor"] = float(_reinforce_factor)

                # Rank boost from feedback learning (optional, capped)
                try:
                    rb = float(md.get("rank_boost", 0.0))
                except Exception:
                    rb = 0.0
                if rb > 0:
                    boosted_score *= 1.0 + min(rb, 1.0)
                if debug:
                    _dbg["rank_boost"] = float(rb)

                # Recency decay (new tunable) based on content type and last seen/timestamp
                try:
                    if getattr(settings, "RELEVANCE_RECENCY_DECAY_ENABLED", True):
                        last_seen_iso = md.get("last_seen_at")
                        if last_seen_iso:
                            last_seen = datetime.fromisoformat(last_seen_iso)
                            if last_seen.tzinfo is None:
                                last_seen = last_seen.replace(tzinfo=timezone.utc)
                        else:
                            last_seen = memory_node.timestamp
                            if last_seen.tzinfo is None:
                                last_seen = last_seen.replace(tzinfo=timezone.utc)
                        now = datetime.now(timezone.utc)
                        age_days = max(0.0, (now - last_seen).total_seconds() / 86400.0)

                        ct = (memory_node.content_type or "").lower()
                        if ct == "preference":
                            hl = int(getattr(settings, "RELEVANCE_HALFLIFE_PREFERENCE_DAYS", 365))
                        elif ct == "profile":
                            hl = int(getattr(settings, "RELEVANCE_HALFLIFE_PROFILE_DAYS", 365))
                        elif ct == "message":
                            hl = int(getattr(settings, "RELEVANCE_HALFLIFE_MESSAGE_DAYS", 7))
                        elif ct == "conversation":
                            hl = int(getattr(settings, "RELEVANCE_HALFLIFE_CONVERSATION_DAYS", 14))
                        else:
                            hl = int(getattr(settings, "RELEVANCE_HALFLIFE_FACT_DAYS", 14))
                        hl = max(1, min(3650, hl))

                        decay_factor = 0.5 ** (age_days / float(hl))
                        decay_factor = max(0.05, min(1.0, decay_factor))
                        boosted_score *= decay_factor
                        if debug:
                            _dbg["recency_days"] = float(age_days)
                            _dbg["halflife_days"] = int(hl)
                            _dbg["decay_factor"] = float(decay_factor)
                except Exception:
                    pass

                # Type/source prior (small multiplicative bump)
                try:
                    ct = (memory_node.content_type or "").lower()
                    prior = 0.0
                    if ct == "preference":
                        prior = float(getattr(settings, "RELEVANCE_PRIOR_PREFERENCE", 0.05))
                    elif ct == "profile":
                        prior = float(getattr(settings, "RELEVANCE_PRIOR_PROFILE", 0.03))
                    elif ct == "message":
                        prior = float(getattr(settings, "RELEVANCE_PRIOR_MESSAGE", 0.02))
                    elif ct == "conversation":
                        prior = float(getattr(settings, "RELEVANCE_PRIOR_CONVERSATION", 0.01))
                    else:
                        prior = float(getattr(settings, "RELEVANCE_PRIOR_FACT", 0.02))
                    prior = max(0.0, min(0.5, prior))
                    boosted_score *= (1.0 + prior)
                    if debug:
                        _dbg["type_prior"] = float(prior)
                except Exception:
                    pass

                # Overlap bonus between query terms and memory content (capped additive)
                try:
                    q_terms = set(t for t in (query or "").lower().split() if t and len(t) >= 3)
                    m_terms = set(t for t in (memory_node.content or "").lower().split() if t and len(t) >= 3)
                    matches = len(q_terms & m_terms)
                    per = float(getattr(settings, "RELEVANCE_OVERLAP_BONUS_PER_MATCH", 0.02))
                    cap = float(getattr(settings, "RELEVANCE_OVERLAP_BONUS_MAX", 0.08))
                    bonus = min(cap, per * float(matches))
                    boosted_score *= (1.0 + max(0.0, bonus))
                    if debug:
                        _dbg["overlap_matches"] = int(matches)
                        _dbg["overlap_bonus"] = float(bonus)
                except Exception:
                    pass

                # Strict dedupe by normalized content
                norm_content = (memory_node.content or "").strip().lower()
                if norm_content in seen_norm_contents or not norm_content:
                    continue
                seen_norm_contents.add(norm_content)

                # Attach debug info into metadata if enabled
                _md_obj: Dict[str, Any] = {}
                if debug:
                    try:
                        if memory_node.memory_metadata:
                            import json as _json
                            _md_obj = _json.loads(memory_node.memory_metadata)
                        else:
                            _md_obj = {}
                    except Exception:
                        _md_obj = {}
                    _md_obj.setdefault("_retrieval_debug", {}).update({
                        **_dbg,
                        "boosted_score": float(boosted_score),
                    })
                memory_results.append(
                    MemorySearchResult(
                        faiss_id=memory_node.faiss_id,
                        content=memory_node.content,
                        content_type=memory_node.content_type,
                        relevance_score=boosted_score,
                        timestamp=memory_node.timestamp,
                        memory_metadata=_md_obj if debug else memory_node.memory_metadata,
                    )
                )

            # MMR reranking to diversify results
            try:
                mmr_lambda = float(getattr(settings, "RETRIEVAL_MMR_LAMBDA", 0.7))
                mmr_lambda = max(0.0, min(1.0, mmr_lambda))
                # Prepare embeddings for candidate contents
                texts = [m.content or "" for m in memory_results]
                vecs = embeddings.embed_texts(texts) if texts else None
                # Fallback to relevance sort if embeddings not available
                if not vecs or len(vecs) != len(texts):
                    memory_results.sort(key=lambda x: x.relevance_score, reverse=True)
                    memory_results = memory_results[:limit]
                else:
                    import numpy as _np

                    qv = _np.array(query_embedding[0], dtype="float32")
                    cands = list(memory_results)
                    cand_vecs = [_np.array(v, dtype="float32") for v in vecs]
                    selected: list[int] = []
                    remaining: list[int] = list(range(len(cands)))

                    def _cos(a: _np.ndarray, b: _np.ndarray) -> float:
                        try:
                            denom = float(_np.linalg.norm(a) * _np.linalg.norm(b))
                            if denom <= 0:
                                return 0.0
                            return float(_np.dot(a, b) / denom)
                        except Exception:
                            return 0.0

                    # Precompute sim to query
                    sim_q = [_cos(cv, qv) for cv in cand_vecs]

                    while remaining and len(selected) < max(1, limit):
                        best_idx = None
                        best_score = -1e9
                        for idx in remaining:
                            # Diversity penalty: max similarity to already selected
                            if not selected:
                                div = 0.0
                            else:
                                div = max(_cos(cand_vecs[idx], cand_vecs[j]) for j in selected)
                            score = mmr_lambda * sim_q[idx] - (1.0 - mmr_lambda) * div
                            if score > best_score:
                                best_score = score
                                best_idx = idx
                        if best_idx is None:
                            break
                        selected.append(best_idx)
                        remaining.remove(best_idx)

                    memory_results = [cands[i] for i in selected]

                # Update retrieval metrics
                try:
                    self._retrieval_metrics["total_requests"] = int(
                        self._retrieval_metrics.get("total_requests", 0)
                    ) + 1
                    self._retrieval_metrics["last"] = {
                        "query_prefix": (query or "")[:50],
                        "mmr_lambda": mmr_lambda,
                        "top_k_limit": int(limit),
                        "min_relevance": float(min_relevance),
                        "selected_count": len(memory_results),
                    }
                except Exception:
                    pass

                logger.info(
                    "Found %d relevant memories (post-MMR) for query: %s...",
                    len(memory_results),
                    query[:50],
                )
                return memory_results
            except Exception:
                # Fallback: simple relevance sort
                memory_results.sort(key=lambda x: x.relevance_score, reverse=True)
                out = memory_results[:limit]
                try:
                    self._retrieval_metrics["total_requests"] = int(
                        self._retrieval_metrics.get("total_requests", 0)
                    ) + 1
                    self._retrieval_metrics["last"] = {
                        "query_prefix": (query or "")[:50],
                        "mmr_lambda": None,
                        "top_k_limit": int(limit),
                        "min_relevance": float(min_relevance),
                        "selected_count": len(out),
                    }
                except Exception:
                    pass
                return out

        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            try:
                self._retrieval_metrics["total_requests"] = int(
                    self._retrieval_metrics.get("total_requests", 0)
                ) + 1
                self._retrieval_metrics["last"] = {
                    "query_prefix": (query or "")[:50],
                    "error": str(e),
                }
            except Exception:
                pass
            return []

    def get_conversation_context(
        self,
        db: Session,
        user_id: str,
        conversation_id: str,
        recent_messages: int = 5,
        memory_limit: int = 3,
        self_referential: bool = False,
    ) -> str:
        """
        Get conversation context by combining recent messages with relevant memories.
        Bases personalization on the user's profile; when the user asks about
        themselves (self_referential=True), avoid verbatim disclosure of the full
        serialized onboarding profile and provide only high-level highlights.
        """
        t0 = time.perf_counter()
        context_parts: List[str] = []

        # Always ground personalization on the profile; redact on self-referential queries
        profile_memory = self.get_user_profile_memory(db, user_id)
        if profile_memory:
            context_parts.append("User Profile & Preferences:")
            if self_referential and not getattr(settings, "PROFILE_VERBATIM_DISCLOSURE_ALLOWED", False):
                # Only provide high-level highlights to prevent verbatim disclosure
                hl = self._extract_profile_highlights(profile_memory, max_bullets=3)
                if hl:
                    context_parts.append("Profile highlights (high-level, no verbatim):")
                    context_parts.extend(hl)
                    context_parts.append("")
                # Do NOT include full serialized profile in self-referential mode
            else:
                # Include full serialized profile as reference for personalization
                context_parts.append(profile_memory)
                context_parts.append("")  # Empty line for separation

        # Get recent conversation memories
        conversation_memories = memory.get_conversation_memories(
            db, conversation_id, limit=recent_messages
        )
        # Deduplicate recent conversation memories by normalized content,
        # preserving order (most recent first)
        if conversation_memories:
            seen_conv: Set[str] = set()
            dedup_conv: List[str] = []
            for mem in conversation_memories:
                norm = (mem.content or "").strip().lower()
                if not norm or norm in seen_conv:
                    continue
                seen_conv.add(norm)
                dedup_conv.append(f"- {mem.content}")
            if dedup_conv:
                context_parts.append("Recent conversation context:")
                context_parts.extend(dedup_conv)
                context_parts.append("")  # Empty line for separation

        # Get relevant general memories (facts, etc.) - exclude onboarding as it's already included
        general_memories = self.search_memories(
            db=db,
            query="user preferences background information facts",
            user_id=user_id,
            content_types=["fact"],  # Exclude onboarding as it's handled separately
            limit=settings.RETRIEVAL_TOP_K,
            min_relevance=settings.MEMORY_MIN_RELEVANCE,
        )
        # Sort by relevance desc, then timestamp desc; and deduplicate by normalized content
        if general_memories:
            sorted_general = sorted(
                general_memories,
                key=lambda m: (m.relevance_score or 0.0, m.timestamp or 0),
                reverse=True,
            )
            seen_gen: Set[str] = set()
            dedup_general: List[str] = []
            for mem in sorted_general:
                norm = (mem.content or "").strip().lower()
                if not norm or norm in seen_gen:
                    continue
                seen_gen.add(norm)
                # Attach a brief rationale to help the model prioritize
                rationale = ""
                try:
                    import json as _json

                    md = _json.loads(mem.memory_metadata) if mem.memory_metadata else {}
                    rc = int(md.get("reinforced_count", 0))
                    # Age in days from timestamp
                    age_days = None
                    if mem.timestamp:
                        try:
                            ts = mem.timestamp
                            if ts.tzinfo is None:
                                ts = ts.replace(tzinfo=timezone.utc)
                            age_days = int(max(0.0, (datetime.now(timezone.utc) - ts).total_seconds() / 86400.0))
                        except Exception:
                            age_days = None
                    parts = []
                    if rc > 0:
                        parts.append(f"reinforced x{rc}")
                    if age_days is not None:
                        parts.append(f"~{age_days}d old")
                    if parts:
                        rationale = " (" + ", ".join(parts) + ")"
                except Exception:
                    rationale = ""
                dedup_general.append(f"- {mem.content}{rationale}")
                if len(dedup_general) >= memory_limit:
                    break
            if dedup_general:
                context_parts.append("Relevant background information:")
                context_parts.extend(dedup_general)
        t1 = time.perf_counter()
        logger.info(
            "Context assembly timings: total=%.2fms (conv_mem=%d, gen_mem_in=%d, gen_mem_out=%d)",
            (t1 - t0) * 1000.0,
            len(conversation_memories) if conversation_memories else 0,
            len(general_memories) if general_memories else 0,
            len(dedup_general) if general_memories else 0,
        )

        return "\n".join(context_parts) if context_parts else "No specific context available."

    def build_personalized_system_prompt(self, db: Session, user_id: str) -> str:
        """
        Build a personalized system prompt based on the user's onboarding profile.
        """
        # Cache by user
        now = time.time()
        c = self._sys_prompt_cache.get(user_id)
        if c and (now - c.get("ts", 0)) < self._sys_prompt_ttl_sec:
            return c.get("val")

        profile_memory = self.get_user_profile_memory(db, user_id)

        base_prompt = (
            "You are a helpful, attentive AI companion. Be context-aware and personalized "
            "based on the user's preferences and background information."
        )

        if profile_memory:
            # Extract key preferences for the system prompt
            lines = profile_memory.split(" | ")
            preferences = []

            for line in lines:
                if "ResponseStyle:" in line:
                    style = line.split(": ")[1]
                    if style == "Concise":
                        preferences.append("Keep responses brief and to the point")
                    elif style == "Detailed":
                        preferences.append("Provide comprehensive, detailed responses")
                    elif style == "Balanced":
                        preferences.append("Balance between concise and detailed responses")

                elif "Tone:" in line:
                    tone = line.split(": ")[1]
                    preferences.append(f"Maintain a {tone.lower()} tone")

                elif "AIPersona:" in line:
                    persona = line.split(": ")[1]
                    preferences.append(f"Act as: {persona}")

                elif "AvoidTopics:" in line:
                    topics = line.split(": ")[1]
                    preferences.append(f"Never discuss: {topics}")

            if preferences:
                base_prompt += "\n\nYour specific instructions:\n" + "\n".join(
                    f"- {p}" for p in preferences
                )

        # Global response guarantees to prevent empty or missing replies
        base_prompt += (
            "\n\nResponse Guarantees:\n"
            "- Always produce a concise answer to the user's latest message.\n"
            "- If the request is unclear or underspecified, ask a single brief clarifying question instead of staying silent.\n"
            "- Never return an empty response.\n"
            "- If you must refuse, give a short, actionable explanation and suggest a next step.\n"
            "- Default to brevity (about 1–3 sentences) unless the user asks for more detail.\n"
        )

        return base_prompt

    def store_memory(
        self,
        db: Session,
        content: str,
        content_type: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Store new memory in both FAISS and database.

        Args:
            db: Database session
            content: Text content to store
            content_type: Type of content (message, onboarding, fact, etc.)
            user_id: User ID
            conversation_id: Optional conversation ID
            metadata: Optional metadata

        Returns:
            FAISS ID if successful, None otherwise
        """
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, skipping memory storage")
            return None
        # Guard: skip trivial messages
        #   - very short or common greetings/acks
        #   - low-entropy content
        norm = (content or "").strip()
        if not norm:
            return None
        norm_lower = norm.lower()
        trivial_set = {"hi", "hello", "hey", "ok", "k", "👍", "👋"}
        if len(norm) < 3 or norm_lower in trivial_set:
            logger.info(
                "Skipping trivial memory content: '%s'",
                norm if len(norm) <= 20 else (norm[:20] + "…"),
            )
            return None
        # Simple low-entropy check: single token repeated or same char
        if len(set(norm_lower)) <= 2:
            logger.info("Skipping low-entropy memory content")
            return None

        # Smart gating: only save when explicitly remembered or important enough
        # - Always allow non-"message" content types (onboarding, facts, uploads)
        # - For messages: allow if metadata.remember is True; otherwise importance >= threshold
        # - By default, do not store assistant messages unless explicitly remembered
        # - Enforce allowlist of content types for auto-capture and apply per-minute/day quotas
        try:
            role = None
            remember_explicit = False
            if metadata:
                role = metadata.get("role")
                remember_explicit = bool(metadata.get("remember") is True)
            if content_type == "message":
                # Skip assistant messages unless explicitly remembered
                if (role and role != "user") and not remember_explicit:
                    return None
                # Optional: simple PII guard (block or redact) before any LLM calls
                try:
                    import re as _re
                    pii_email = _re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
                    pii_phone = _re.compile(r"(?:\+\d{1,3}[ -]?)?(?:\d[ -]?){7,15}")
                    block_pii = bool(getattr(settings, "MEMORY_BLOCK_PII", True))
                    if block_pii and (pii_email.search(norm) or pii_phone.search(norm)) and not remember_explicit:
                        # Do not auto-capture suspected PII unless explicitly requested
                        return None
                    redact_pii = bool(getattr(settings, "MEMORY_REDACT_PII", False))
                    if redact_pii and not remember_explicit:
                        norm = pii_email.sub("[redacted-email]", norm)
                        norm = pii_phone.sub("[redacted-phone]", norm)
                except Exception:
                    pass
                # Estimate importance and apply threshold if not explicit
                if not remember_explicit:
                    importance_min = float(getattr(settings, "MEMORY_IMPORTANCE_MIN", 0.7))
                    est_importance = self._estimate_importance(norm)
                    # Optional LLM classification (importance + sensitivity)
                    cls = self._classify_with_llm(norm)
                    final_importance = est_importance
                    importance_source = "heuristic"
                    sensitivity_block_min = float(
                        getattr(
                            settings,
                            "MEMORY_SENSITIVITY_BLOCK_MIN",
                            0.85,
                        )
                    )
                    if cls:
                        try:
                            imp_llm = (
                                float(cls.get("importance"))
                                if cls.get("importance") is not None
                                else None
                            )
                        except Exception:
                            imp_llm = None
                        try:
                            sens = (
                                float(cls.get("sensitivity"))
                                if cls.get("sensitivity") is not None
                                else None
                            )
                        except Exception:
                            sens = None
                        if sens is not None and sens >= sensitivity_block_min:
                            # Block storage of sensitive content
                            return None
                        if imp_llm is not None:
                            final_importance = max(est_importance, max(0.0, min(1.0, imp_llm)))
                            importance_source = "hybrid-llm"
                        # Persist classifier outputs
                        metadata = {
                            **(metadata or {}),
                            "importance_heuristic": est_importance,
                            **(
                                {"importance_llm": imp_llm}
                                if cls.get("importance") is not None
                                else {}
                            ),
                            **({"sensitivity": sens} if cls.get("sensitivity") is not None else {}),
                            **(
                                {"importance_reason": cls.get("reason")}
                                if isinstance(cls.get("reason"), str)
                                else {}
                            ),
                        }
                    # LLM extraction: attempt BEFORE final threshold check to capture short but valuable facts
                    extracted = self._extract_memory_candidates_with_llm(norm)
                    if extracted:
                        # Combine into compact bullets to store as a single memory text
                        combined = "\n".join(f"- {e}" for e in extracted)
                        # Mark provenance and prefer extracted content
                        metadata = {**(metadata or {}), "provenance": "llm_extracted", "source": "message"}
                        content = combined
                        # Apply an importance floor when extraction succeeded to avoid dropping short self-facts
                        extraction_floor = float(getattr(settings, "MEMORY_EXTRACTION_IMPORTANCE_FLOOR", 0.75))
                        final_importance = max(final_importance, extraction_floor)

                    # Persist final importance and provenance
                    metadata = {
                        **(metadata or {}),
                        "importance": final_importance,
                        "importance_source": importance_source,
                        "auto_captured": True,
                    }
                    if final_importance < importance_min:
                        return None
                # Allowlist of content types when auto-capturing from chat messages
                allowed_types = set(getattr(settings, "MEMORY_ALLOWED_TYPES", [
                    "preference",
                    "fact",
                    "profile",
                    "message",
                    "onboarding",
                    "conversation",
                ]))
                if content_type not in allowed_types and not remember_explicit:
                    return None

                # Quotas: cap number of auto-captured memories per-minute and per-day
                try:
                    import json as _json
                    from datetime import datetime as _dt
                    from datetime import timezone as _tz

                    per_min = int(getattr(settings, "MEMORY_MAX_AUTOSAVED_PER_MINUTE", 2))
                    per_day = int(getattr(settings, "MEMORY_MAX_AUTOSAVED_PER_DAY", 40))
                    if per_min > 0 or per_day > 0:
                        recent = memory.get_user_memories(db, user_id=user_id, content_type=None, limit=200)
                        now = _dt.now(_tz.utc)
                        mins_ago = now - timedelta(minutes=1)
                        day_ago = now - timedelta(days=1)
                        c_min = 0
                        c_day = 0
                        for it in recent:
                            try:
                                ts = getattr(it, "timestamp", None)
                                if not ts:
                                    continue
                                md = _json.loads(it.memory_metadata) if it.memory_metadata else {}
                                if not bool(md.get("auto_captured")):
                                    continue
                                if ts >= day_ago:
                                    c_day += 1
                                    if ts >= mins_ago:
                                        c_min += 1
                            except Exception:
                                continue
                        if per_min > 0 and c_min >= per_min and not remember_explicit:
                            return None
                        if per_day > 0 and c_day >= per_day and not remember_explicit:
                            return None
                except Exception:
                    pass
            else:
                # For non-message content, optionally set a sane default importance if not provided
                if metadata is None or "importance" not in metadata:
                    metadata = {**(metadata or {}), "importance": 0.9}
        except Exception:
            # Best-effort gating; on failure, proceed conservatively (skip)
            return None

        try:
            # Consolidation + dedupe: upsert by normalized fact key if present,
            # and avoid re-embedding if content is unchanged.
            consolidation_key: Optional[str] = self._normalize_consolidation_key(content)
            # Persist detected key and content hash in metadata
            content_hash = self._content_hash(content)
            metadata = {
                **(metadata or {}),
                **({"consolidation_key": consolidation_key} if consolidation_key else {}),
                "content_hash": content_hash,
            }

            # If we have a consolidation key, update existing memory instead of creating a new node
            if consolidation_key:
                existing = memory.get_by_consolidation_key(
                    db,
                    user_id=user_id,
                    key=consolidation_key,
                )
                if existing:
                    # If content hash unchanged, update metadata only and skip FAISS work
                    try:
                        import json as _json

                        old_md: Dict[str, Any] = (
                            _json.loads(existing.memory_metadata)
                            if existing.memory_metadata
                            else {}
                        )
                    except Exception:
                        old_md = {}
                    if old_md.get("content_hash") == content_hash:
                        memory.update_content_and_metadata(
                            db,
                            node=existing,
                            content=existing.content,
                            metadata={**old_md, **metadata},
                        )
                        logger.info(
                            "Consolidation no-op for key '%s' (unchanged content)",
                            consolidation_key,
                        )
                        return existing.faiss_id

                    # Content changed: update DB and FAISS vector
                    memory.update_content_and_metadata(
                        db,
                        node=existing,
                        content=content,
                        metadata=metadata,
                    )
                    try:
                        embedding = embeddings.embed_texts([content])
                        if embedding is not None:
                            updated = faiss_store.update_vector(
                                user_id,
                                existing.faiss_id,
                                embedding[0],
                            )
                            if not updated:
                                logger.warning(
                                    "FAISS update_vector failed; index missing or faiss unavailable"
                                )
                        else:
                            logger.warning(
                                "Embedding failed during consolidation; FAISS vector not updated"
                            )
                    except Exception as e:
                        logger.warning(
                            "Error updating FAISS vector for consolidated memory: %s", e
                        )
                    logger.info(
                        "Consolidated memory for key '%s' (updated node & vector)",
                        consolidation_key,
                    )
                    return existing.faiss_id

            # Generate embedding
            embedding = embeddings.embed_texts([content])
            if embedding is None:
                logger.warning("Failed to generate embedding for memory storage")
                return None

            # Store in FAISS (non-fatal if FAISS is unavailable)
            faiss_id = str(uuid.uuid4())  # Generate a unique ID
            try:
                faiss_store.add(user_id, [faiss_id], [embedding[0]])
            except Exception as _fe:
                logger.warning(
                    "FAISS add failed; proceeding with DB write only for %s: %s",
                    faiss_id,
                    _fe,
                )

            # Store in database
            memory_node = memory.create_memory_node(
                db=db,
                faiss_id=faiss_id,
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                metadata=metadata,
            )

            logger.info(f"Successfully stored memory: {content_type} for user {user_id}")

            # Optional: auto-promote to Core based on metadata thresholds
            try:
                import json as _json

                md: Dict[str, Any] = {}
                if memory_node.memory_metadata:
                    try:
                        md = _json.loads(memory_node.memory_metadata)
                    except Exception:
                        md = {}
                # Only promote if not already core
                if not bool(md.get("core")) and self.is_auto_promote_eligible(md):
                    md["core"] = True
                    try:
                        now_iso = datetime.now(timezone.utc).isoformat()
                    except Exception:
                        now_iso = None
                    if now_iso:
                        md.setdefault("auto_promoted_at", now_iso)
                    memory.update_content_and_metadata(
                        db,
                        node=memory_node,
                        content=memory_node.content,
                        metadata=md,
                    )
                    logger.info(
                        "Auto-promoted memory %s to Core for user %s",
                        memory_node.faiss_id,
                        user_id,
                    )
            except Exception as _ap_err:
                logger.warning("Auto-promotion check failed: %s", _ap_err)

            # Opportunistic lifecycle enforcement: soft-forget on write
            try:
                if getattr(settings, "MEMORY_SOFT_FORGET_ON_WRITE", True):
                    # Attempt to suppress stale, low-importance items beyond per-user cap
                    suppressed = self._maybe_soft_forget(db, user_id)
                    if suppressed:
                        logger.info(
                            "Soft-forgot %s items for user %s after write",
                            suppressed,
                            user_id,
                        )
            except Exception as _sf_err:
                logger.warning("Soft-forget on write failed: %s", _sf_err)

            # Opportunistic forgetting/cleanup (soft) throttled per user (no more than once/hour)
            try:
                now_ts = time.time()
                gate_ts = self._cleanup_gate.get(user_id, 0.0)
                if (now_ts - gate_ts) > 3600.0:
                    self._cleanup_gate[user_id] = now_ts
                    self._maybe_soft_forget(db, user_id)
            except Exception as _ce:
                logger.debug(f"Cleanup skipped: {_ce}")
            return faiss_id

        except Exception as e:
            logger.error(f"Error storing memory: {e}")
            return None

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
                db,
                user_id=user_id,
                content_type=None,
                limit=max_n * 2,
            )
            if not items or len(items) <= max_n:
                return 0
            now = datetime.now(timezone.utc)
            stale_cutoff = now - timedelta(days=max(7, forget_age_days))
            suppressed = 0
            for n in items:
                if getattr(n, "timestamp", None) and n.timestamp < stale_cutoff:
                    try:
                        md = _json.loads(n.memory_metadata) if n.memory_metadata else {}
                    except Exception:
                        md = {}
                    if md.get("core"):
                        continue
                    try:
                        imp = float(md.get("importance", 1.0))
                    except Exception:
                        imp = 1.0
                    if imp >= 0.8:
                        continue
                    try:
                        rc = int(md.get("reinforced_count", 0))
                    except Exception:
                        rc = 0
                    if rc > 0:
                        continue
                    # Long suppression = soft forget (1 year)
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
                    md = _json.loads(n.memory_metadata) if n.memory_metadata else {}
                except Exception:
                    md = {}
                ck = md.get("consolidation_key")
                if not ck:
                    continue
                prev = keys.get(ck)
                if not prev or (
                    getattr(n, "timestamp", None)
                    and getattr(prev, "timestamp", None)
                    and n.timestamp > prev.timestamp
                ):
                    keys[ck] = n
            # Suppress older duplicates
            now = datetime.now(timezone.utc)
            for n in items:
                try:
                    md = _json.loads(n.memory_metadata) if n.memory_metadata else {}
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

    def mark_memories_seen(self, db: Session, *, user_id: str, faiss_ids: List[str]) -> None:
        """Mark memories as seen now; increment seen_count and occasionally reinforce."""
        if not faiss_ids:
            return
        import json as _json

        now_iso = datetime.now(timezone.utc).isoformat()
        for fid in faiss_ids:
            try:
                node = memory.get_memory_by_faiss_id(db, fid)
                if not node or node.user_id != user_id:
                    continue
                md = {}
                if node.memory_metadata:
                    try:
                        md = _json.loads(node.memory_metadata)
                    except Exception:
                        md = {}
                seen = int(md.get("seen_count", 0)) + 1
                md["seen_count"] = seen
                md["last_seen_at"] = now_iso
                # Auto-reinforce every 5 views (bounded behavior)
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

            md = {}
            if node.memory_metadata:
                try:
                    md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            until = datetime.now(timezone.utc) + timedelta(days=max(1, ttl_days))
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

            md = {}
            if node.memory_metadata:
                try:
                    md = _json.loads(node.memory_metadata)
                except Exception:
                    md = {}
            current = int(md.get("reinforced_count", 0))
            md["reinforced_count"] = max(0, current + max(1, increment))
            # Optionally bump stored relevance_score slightly (capped)
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

    def enforce_lifecycle(
        self,
        db: Session,
        *,
        user_id: str,
        consolidate: bool = True,
    ) -> Dict[str, int]:
        """Enforce memory lifecycle controls for a user.

        - Soft-forget stale, low-importance, non-core items beyond cap
        - Optionally consolidate duplicates by consolidation_key

        Returns counts: {"suppressed": n_suppressed, "consolidated": n_consolidated}
        """
        suppressed = 0
        consolidated = 0
        try:
            suppressed = self._maybe_soft_forget(db, user_id)
        except Exception as e:
            logger.warning("Lifecycle: soft-forget failed for user %s: %s", user_id, e)
        if consolidate:
            try:
                res = self.consolidate_user_memories(db, user_id=user_id, limit=2000)
                consolidated = int(res.get("suppressed", 0)) if isinstance(res, dict) else 0
            except Exception as e:
                logger.warning("Lifecycle: consolidate failed for user %s: %s", user_id, e)
        return {"suppressed": suppressed, "consolidated": consolidated}


# Global instance
memory_service = MemoryService()
