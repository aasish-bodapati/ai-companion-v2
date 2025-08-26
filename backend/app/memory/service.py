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
from app.crud.user import user as user_crud
from app.core.llm import generate_with_openrouter
from app.crud.memory import memory
from app.crud.onboarding import get_by_user_id
from app.memory.vector_store.factory import get_vector_store
import app.memory.embeddings as embeddings
from app.schemas.memory import MemorySearchResult
from app.memory.service_mixins_lifecycle import LifecycleMixin
from app.memory.service_mixins_retrieval import RetrievalMixin
from app.memory.service_mixins_storage import StorageMixin

logger = logging.getLogger(__name__)

try:
    from app.memory.contextual_retrieval import contextual_retriever
    EMOTIONAL_ANALYSIS_ENABLED = True
except ImportError as e:
    logger.warning(f"Contextual retrieval modules not available: {e}")
    contextual_retriever = None
    EMOTIONAL_ANALYSIS_ENABLED = False

# Provide a safe fallback emotional analyzer to prevent NameError during calls.
# If a real analyzer exists elsewhere, it can override this via import order.
try:
    # If a module defines emotional_analyzer, prefer it
    from app.memory.contextual_retrieval import emotional_analyzer  # type: ignore
except Exception:
    class _FallbackEmotionalAnalyzer:
        def analyze_emotional_context(self, text: str, memories: list) -> dict:
            try:
                t = (text or "").lower()
                # very lightweight heuristic
                if any(k in t for k in ("sad", "upset", "frustrated", "disappointed", "anxious")):
                    state = "low"
                elif any(k in t for k in ("happy", "excited", "proud", "great", "awesome")):
                    state = "high"
                else:
                    state = "neutral"
            except Exception:
                state = "neutral"
            return {"emotional_state": state}

    emotional_analyzer = _FallbackEmotionalAnalyzer()  # type: ignore


class MemoryService(LifecycleMixin, RetrievalMixin, StorageMixin):
    """Service for integrating FAISS memory search with database operations."""

    def __init__(self):
        # Simple in-process caches with short TTL to reduce repeated work between quick turns
        self._sys_prompt_cache: Dict[str, Dict[str, Any]] = {}
        self._conv_ctx_cache: Dict[str, Dict[str, Any]] = {}
        # Compatibility alias expected by some unit tests
        # _memory_cache historically stored conversation/memory snippets
        # Map it to the consolidated conversation context cache
        self._memory_cache = self._conv_ctx_cache
        self._sys_prompt_ttl_sec = 60
        self._conv_ctx_ttl_sec = 20
        # Cleanup throttle per user
        self._cleanup_gate: Dict[str, float] = {}
        # Lightweight retrieval metrics (process-local)
        self._retrieval_metrics: Dict[str, Any] = {
            "total_requests": 0,
            "last": {},
        }

    def enforce_lifecycle(
        self,
        db: Session,
        *,
        user_id: str,
        consolidate: bool = True,
    ) -> Dict[str, int]:
        """Delegate to LifecycleMixin.enforce_lifecycle (extracted)."""
        return super().enforce_lifecycle(db, user_id=user_id, consolidate=consolidate)

    def get_retrieval_metrics(self) -> Dict[str, Any]:
        """Delegate to RetrievalMixin.get_retrieval_metrics (extracted)."""
        return super().get_retrieval_metrics()

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
            reply = generate_with_openrouter(
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
            resp = generate_with_openrouter(
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
                    if isinstance(node.memory_metadata, dict):
                        md = dict(node.memory_metadata)
                    else:
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
            # Use separate cache for profile memory to avoid collision with system prompt cache
            profile_cache_key = f"profile_{user_id}"
            now = time.time()
            c = self._sys_prompt_cache.get(profile_cache_key)
            if c and (now - c.get("ts", 0)) < self._sys_prompt_ttl_sec:
                return c.get("val")

            # Get the most recent completed onboarding profile
            profile = get_by_user_id(db, user_id=user_id)
            if profile and profile.completed:
                from app.memory.profile import serialize_onboarding_profile

                val = serialize_onboarding_profile(profile)
                self._sys_prompt_cache[profile_cache_key] = {"ts": now, "val": val}
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
        """Delegate to RetrievalMixin.search_memories (extracted)."""
        return super().search_memories(
            db=db,
            query=query,
            user_id=user_id,
            content_types=content_types,
            limit=limit,
            min_relevance=min_relevance,
            debug=debug,
        )


    def get_conversation_context(
        self,
        db: Session,
        user_id: str,
        conversation_id: str,
        recent_messages: int = 5,
        memory_limit: int = 5,
        self_referential: bool = False,
        current_message: str = "",
    ) -> str:
        """
        Get conversation context by combining recent messages with relevant memories.
        Enhanced for human-like conversations with better memory integration and
        contextual awareness. Prioritizes memories that create natural conversation flow.
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

        # Fetch conversation-specific memories (recent messages from this conversation)
        from app import crud
        conversation_memories = crud.message.get_by_conversation(
            db, conversation_id=conversation_id, skip=0, limit=recent_messages
        )

        if conversation_memories:
            context_parts.append("Recent conversation:")
            for msg in reversed(conversation_memories[-recent_messages:]):
                role_prefix = "You" if msg.role == "assistant" else "User"
                content = (msg.content or "")[:200] + ("..." if len(msg.content or "") > 200 else "")
                context_parts.append(f"- {role_prefix}: {content}")

        # Include rolling per-conversation summary if available
        try:
            summaries = self.search_memories(
                db=db,
                query="",
                user_id=user_id,
                content_types=["summary"],
                limit=5,
                min_relevance=0.0,
                debug=False,
            ) or []
            selected_summary = None
            if summaries:
                import json as _json
                for s in summaries:
                    try:
                        md = _json.loads(s.memory_metadata) if s.memory_metadata else {}
                    except Exception:
                        md = {}
                    ck = (md.get("consolidation_key") or "").strip().lower()
                    if ck == f"summary:{conversation_id}".lower():
                        selected_summary = s
                        break
            if selected_summary and (selected_summary.content or "").strip():
                context_parts.append("")
                context_parts.append("Conversation Summary (rolling):")
                context_parts.append(selected_summary.content.strip())
        except Exception:
            # Non-fatal: proceed without summary if retrieval fails
            pass

        # Get user memories - use broader search for "what do you know about me" queries
        if memory_limit > 0:
            if current_message and any(phrase in current_message.lower() for phrase in ["what do you know", "tell me about", "who am i", "about me"]):
                # For profile queries, get general memories without strict relevance filtering
                general_memories = self.search_memories(
                    db=db,
                    query="preferences interests likes",
                    user_id=user_id,
                    content_types=None,
                    limit=memory_limit,
                    min_relevance=0.1,
                )
            elif current_message:
                # For specific queries, use current message with moderate relevance
                general_memories = self.search_memories(
                    db=db,
                    query=current_message,
                    user_id=user_id,
                    content_types=None,
                    limit=memory_limit,
                    min_relevance=0.2,
                )
            else:
                general_memories = []
        else:
            general_memories = []

        # Process memories with enhanced contextual presentation
        if general_memories:
            # Skip lexical filtering for profile queries to show stored memories
            def _overlap_ok(mem_text: str, cur_text: str) -> bool:
                if current_message and any(phrase in current_message.lower() for phrase in ["what do you know", "tell me about", "who am i", "about me"]):
                    return True  # Always include memories for profile queries
                try:
                    a = set((mem_text or "").lower().split())
                    b = set((cur_text or "").lower().split())
                    if not a or not b:
                        return False
                    inter = len(a & b)
                    union = max(1, len(a | b))
                    jacc = inter / union
                    # Loosen lexical gating: allow if Jaccard >= 0.05 or at least 1 overlapping token
                    return jacc >= 0.05 or inter >= 1
                except Exception:
                    return False

            dedup_general = []
            seen_gen: Set[str] = set()

            # Group memories by category for better organization
            categorized_memories = {}

            for mem in general_memories:
                norm = (mem.content or "").strip().lower()
                if not norm or norm in seen_gen:
                    continue
                # Only keep if it overlaps with current message to reduce off-topic recalls
                if current_message and not _overlap_ok(norm, current_message):
                    continue
                seen_gen.add(norm)

                # Extract categories from metadata
                categories = []
                try:
                    if mem.memory_metadata:
                        import json as _json
                        md = _json.loads(mem.memory_metadata)
                        categories = md.get("categories", [])
                except Exception:
                    pass

                # Group by primary category
                primary_category = categories[0] if categories else "general"
                if primary_category not in categorized_memories:
                    categorized_memories[primary_category] = []

                categorized_memories[primary_category].append(mem)

                if len(dedup_general) >= memory_limit:
                    break

            if categorized_memories:
                context_parts.append("EXACT MEMORIES - ONLY reference these (do not invent others):")

                # Present memories by category for better context
                for category, memories in categorized_memories.items():
                    if memories:
                        # Human-readable category names
                        category_display = {
                            "preference": "Preferences & Likes",
                            "transportation": "Transportation & Travel",
                            "hobbies": "Hobbies & Interests",
                            "daily_patterns": "Daily Patterns & Schedule",
                            "schedule": "Schedule & Routine",
                            "health": "Health & Wellness",
                            "fitness": "Fitness & Exercise",
                            "nutrition": "Nutrition & Food",
                            "food_preferences": "Food Preferences",
                            "work": "Work & Career",
                            "career": "Career & Professional"
                        }.get(category, category.title())

                        context_parts.append(f"\n{category_display}:")
                        for mem in memories:
                            context_parts.append(f"- {mem.content}")

                context_parts.append("")
                context_parts.append("IMPORTANT: Only use the memories listed above. Do not reference any other conversations, memories, or facts that are not explicitly listed.")

                # Add temporal and emotional intelligence insights
                temporal_insights = self._get_temporal_intelligence_insights(categorized_memories)
                if temporal_insights:
                    context_parts.append("")
                    context_parts.append("Temporal Intelligence:")
                    context_parts.extend(temporal_insights)

                emotional_insights = self._get_emotional_intelligence_insights(categorized_memories)
                if emotional_insights:
                    context_parts.append("")
                    context_parts.append("Emotional Intelligence:")
                    context_parts.extend(emotional_insights)

                # Proactive domain suggestions disabled to keep assistant memory-first and user-led
                # (previous proactive suggestions removed)

        t1 = time.perf_counter()
        logger.info(
            "Enhanced context assembly timings: total=%.2fms (conv_mem=%d, gen_mem_in=%d, gen_mem_out=%d)",
            (t1 - t0) * 1000.0,
            len(conversation_memories) if conversation_memories else 0,
            len(general_memories) if general_memories else 0,
            len(dedup_general) if 'dedup_general' in locals() else 0,
        )

        return "\n".join(context_parts) if context_parts else "No specific context available."

    def has_known_fact_contains(self, db: Session, user_id: str, phrases: List[str]) -> bool:
        """Return True if any of the given phrases appear in stored profile/preference/fact memories.

        This supports a check-before-ask gate in the reply path.
        """
        try:
            if not phrases:
                return False
            mems = self.search_memories(
                db=db,
                query=" ".join(phrases),
                user_id=user_id,
                content_types=["profile", "preference", "fact"],
                limit=16,
                min_relevance=0.0,
                debug=False,
            ) or []
            if not mems:
                return False
            ph_low = [p.lower() for p in phrases if isinstance(p, str) and p.strip()]
            for m in mems:
                txt = (m.content or "").lower()
                if any(p in txt for p in ph_low):
                    return True
            return False
        except Exception:
            return False

    def build_personalized_system_prompt(self, db: Session, user_id: str) -> str:
        """
        Build a personalized system prompt that creates human-like conversations.
        """
        # Cache by user
        now = time.time()
        c = self._sys_prompt_cache.get(user_id)
        if c and (now - c.get("ts", 0)) < self._sys_prompt_ttl_sec:
            return c.get("val")

        profile_memory = self.get_user_profile_memory(db, user_id)

        # Get user's name from profile if available
        user_name = "there"
        if profile_memory:
            # Extract name from profile
            import re
            name_match = re.search(r"name[^:]*:\s*([^\n,]+)", profile_memory, re.IGNORECASE)
            if name_match:
                user_name = name_match.group(1).strip()

        base_prompt = f"""
You are an expert AI companion who knows {user_name} well. You're warm, intelligent, and genuinely care about their wellbeing and goals. You remember everything about them and weave that knowledge naturally into conversations.

CRITICAL RULES - NEVER VIOLATE THESE:
- ONLY reference information that is explicitly provided in the Context below
- NEVER make up conversations, memories, or facts that aren't in the Context
- NEVER say "I recall" or "I remember" unless the information is actually in the Context
- If you don't have specific information about something, say so honestly
- Do not invent past conversations or interactions
 - Do not propose managing calendar, fitness, or nutrition unless the user asks explicitly; when in doubt, ask for permission with one short question

Personality & Voice:
- Speak like a knowledgeable friend who truly cares
- Be warm but not overly familiar
- Show genuine interest and enthusiasm about their progress
- Reference their preferences, goals, and past conversations naturally
- Use their name occasionally but not excessively
- Demonstrate empathy by acknowledging their feelings and challenges
- Celebrate achievements with genuine excitement
- Offer encouragement during difficult times

Personal Assistant Mode (Notepad):
- Behave like a human personal assistant with a notepad, quietly capturing facts and preferences as notes. Do not announce note-taking.
- Use known facts without re-asking. If something is missing and necessary, ask at most one short clarifying question.
- Propose next steps concisely (one sentence). For any action that changes data or creates artifacts, ask one short confirmation first.
- If the user says “yes”, proceed. If the user ignores or says “no”, drop the action gracefully.
- Keep responses succinct and natural; avoid templates or checklists unless the user requests structure.

Output format:
- Keep replies short and readable (2-5 sentences unless the user asks for detail)
- Use bullets only when helpful
- Avoid repeating yourself or restating the user's message
- Be concrete and actionable when making suggestions

Conversational Style:
- Connect new topics to what you know about them
- Ask thoughtful follow-up questions that show you're listening
- Celebrate their wins and offer support during challenges
- Make relevant suggestions based on their interests and goals
- Remember context from earlier in the conversation
- Use emotional intelligence to read between the lines
- Adapt your tone to match their energy and mood
- Be proactive in offering help when you sense they need it

Memory Integration:
- Seamlessly reference their preferences, habits, and goals from the Context
- Connect current topics to their past experiences (only if in Context)
- Show progression awareness based on actual stored information
- Reference their schedule, preferences, and relationships naturally (only if in Context)
- Use memories to provide personalized encouragement and advice
- If asked about something not in Context, say "I don't have that information saved yet"

Temporal Intelligence:
- Pay attention to time references in their memories (morning, weekend, seasonal)
- Consider timing when making suggestions (e.g., morning activities for early risers)
- Use temporal patterns to provide more relevant advice
- Acknowledge seasonal preferences and patterns

Emotional Intelligence:
- Read emotional context from their messages and memories
- Adapt your tone based on their emotional state
- Offer support when they seem stressed or overwhelmed
- Match their energy level (excited, calm, etc.)
- Use emotional insights to provide more empathetic responses

Proactive Assistance:
- Use the proactive suggestions provided in Context
- Anticipate needs based on their patterns and preferences
- Offer relevant suggestions before they ask
- Connect different aspects of their life naturally
- Help them see connections between their goals and current situation
"""

        if profile_memory:
            highlights = self._extract_profile_highlights(profile_memory, max_bullets=4)
            if highlights:
                base_prompt += "\n\nKey things about " + user_name + ":\n" + "\n".join(highlights)
            else:
                # Fallback: use raw profile text (truncated)
                truncated = profile_memory[:400] + "..." if len(profile_memory) > 400 else profile_memory
                base_prompt += f"\n\nBackground: {truncated}"
        else:
            base_prompt += f"\n\nNote: Learn about {user_name}'s preferences, goals, and background to provide personalized assistance."

        # Response personalization based on user energy and mood
        base_prompt += f"""

Response Personalization:
- Adapt your energy level to match the user's current state
- If they seem excited or motivated, match their enthusiasm
- If they seem tired or overwhelmed, be more gentle and supportive
- Use conversation flow analysis to determine appropriate tone
- Reference their emotional journey and celebrate progress
- Provide encouragement that feels genuine and specific to their situation

Natural Conversation Flow:
- Use smooth topic transitions that feel organic
- Reference earlier parts of the conversation naturally
- Build on their responses with thoughtful follow-ups
- Show you're actively listening by connecting ideas
- Ask questions that demonstrate understanding of their context
"""

        # Response guidelines for human-like interaction
        base_prompt += f"""

Response Guidelines:
- Always acknowledge what {user_name} shared and respond thoughtfully
- If unclear, ask one specific clarifying question
- Keep responses conversational (2-4 sentences unless more detail requested)
- Show you remember and care about their journey
- Make connections to their interests, goals, or past conversations
- Be proactive with relevant suggestions when appropriate
- Never give empty or generic responses
"""

        # Cache the result
        self._sys_prompt_cache[user_id] = {"ts": now, "val": base_prompt}
        return base_prompt

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
        """Delegate to StorageMixin implementation to keep concerns modular."""
        return super().store_memory(
            db=db,
            content=content,
            content_type=content_type,
            user_id=user_id,
            conversation_id=conversation_id,
            metadata=metadata,
            conversation_history=conversation_history,
        )

    def _enhance_memory_metadata(
        self,
        content: str,
        content_type: str,
        user_id: str,
        db: Session,
        emotional_context: Dict[str, Any],
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Enhance memory metadata with additional context, categories, and related memories.
        """
        enhanced_md = {}
        try:
            # Add emotional context
            enhanced_md.update(emotional_analyzer.enhance_memory_with_emotion(content, emotional_context))

            # Add categories and tags
            categories = self._extract_memory_categories(content, content_type)
            if categories:
                enhanced_md["categories"] = categories
                enhanced_md["primary_category"] = categories[0] if categories else None

            # Add temporal context
            temporal_context = self._extract_temporal_context(content, conversation_history)
            if temporal_context:
                enhanced_md["temporal_context"] = temporal_context

            # Add emotional patterns
            emotional_patterns = self._analyze_emotional_patterns(content, emotional_context, conversation_history)
            if emotional_patterns:
                enhanced_md["emotional_patterns"] = emotional_patterns

            # Add related memories
            related_memories = self._find_related_memories(db, user_id, content, categories)
            if related_memories:
                enhanced_md["related_memories"] = related_memories
                enhanced_md["memory_relationships"] = self._build_memory_relationships(related_memories)

            # Add usage contexts
            usage_contexts = self._determine_usage_contexts(content, content_type, categories)
            if usage_contexts:
                enhanced_md["usage_contexts"] = usage_contexts

            # Add goal relevance
            goal_relevance = self._assess_goal_relevance(content, categories, user_id, db)
            if goal_relevance:
                enhanced_md["goal_relevance"] = goal_relevance

            # Add LLM classification if enabled
            if getattr(settings, "MEMORY_LLM_CLASSIFIER_ENABLED", True):
                try:
                    cls = self._classify_with_llm(content)
                    if cls:
                        enhanced_md["llm_importance"] = float(cls.get("importance", 0.5))
                        enhanced_md["llm_sensitivity"] = float(cls.get("sensitivity", 0.5))
                        enhanced_md["llm_reason"] = cls.get("reason")
                except Exception:
                    pass

        except Exception as e:
            logger.warning(f"Memory enhancement failed: {e}")
        return enhanced_md

    def _extract_temporal_context(self, content: str, conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Extract temporal context from memory content and conversation history.
        """
        temporal_context = {
            "time_references": [],
            "frequency": "one_time",
            "seasonal": False,
            "time_sensitive": False
        }
        
        try:
            content_lower = content.lower()
            
            # Extract time references
            time_patterns = {
                "morning": ["morning", "am", "early", "dawn", "sunrise"],
                "afternoon": ["afternoon", "pm", "midday", "noon"],
                "evening": ["evening", "night", "pm", "late", "sunset"],
                "weekend": ["weekend", "saturday", "sunday", "fri", "sat", "sun"],
                "weekday": ["weekday", "monday", "tuesday", "wednesday", "thursday", "friday"],
                "seasonal": ["summer", "winter", "spring", "fall", "autumn", "christmas", "holiday"],
                "frequency": ["always", "never", "sometimes", "often", "rarely", "daily", "weekly", "monthly"]
            }
            
            for time_category, patterns in time_patterns.items():
                for pattern in patterns:
                    if pattern in content_lower:
                        temporal_context["time_references"].append(time_category)
                        break
            
            # Determine frequency
            if any(word in content_lower for word in ["always", "daily", "every day", "routine"]):
                temporal_context["frequency"] = "continuous"
            elif any(word in content_lower for word in ["sometimes", "often", "weekly", "monthly"]):
                temporal_context["frequency"] = "recurring"
            elif any(word in content_lower for word in ["never", "once", "one time"]):
                temporal_context["frequency"] = "one_time"
            
            # Check if seasonal
            if any(word in content_lower for word in ["summer", "winter", "spring", "fall", "christmas", "holiday"]):
                temporal_context["seasonal"] = True
            
            # Check if time sensitive
            if any(word in content_lower for word in ["deadline", "due", "urgent", "asap", "now", "today"]):
                temporal_context["time_sensitive"] = True
            
            # Add conversation timing context
            if conversation_history:
                temporal_context["conversation_timing"] = self._analyze_conversation_timing(conversation_history)
            
        except Exception as e:
            logger.warning(f"Temporal context extraction failed: {e}")
        
        return temporal_context

    def _analyze_conversation_timing(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """
        Analyze timing patterns in conversation history.
        """
        timing_analysis = {
            "time_of_day": "unknown",
            "day_of_week": "unknown",
            "urgency_level": "normal"
        }
        
        try:
            # This would ideally use actual timestamps from conversation history
            # For now, we'll analyze content for timing indicators
            all_content = " ".join([msg.get("content", "") for msg in conversation_history])
            content_lower = all_content.lower()
            
            # Time of day indicators
            if any(word in content_lower for word in ["morning", "early", "am"]):
                timing_analysis["time_of_day"] = "morning"
            elif any(word in content_lower for word in ["afternoon", "noon", "midday"]):
                timing_analysis["time_of_day"] = "afternoon"
            elif any(word in content_lower for word in ["evening", "night", "late", "pm"]):
                timing_analysis["time_of_day"] = "evening"
            
            # Day of week indicators
            if any(word in content_lower for word in ["monday", "tuesday", "wednesday", "thursday", "friday"]):
                timing_analysis["day_of_week"] = "weekday"
            elif any(word in content_lower for word in ["saturday", "sunday", "weekend"]):
                timing_analysis["day_of_week"] = "weekend"
            
            # Urgency indicators
            if any(word in content_lower for word in ["urgent", "asap", "now", "immediately", "deadline"]):
                timing_analysis["urgency_level"] = "high"
            elif any(word in content_lower for word in ["soon", "later", "when you can"]):
                timing_analysis["urgency_level"] = "medium"
            
        except Exception as e:
            logger.warning(f"Conversation timing analysis failed: {e}")
        
        return timing_analysis

    def _analyze_emotional_patterns(self, content: str, emotional_context: Dict[str, Any], conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Analyze emotional patterns and trends in memory content.
        """
        emotional_patterns = {
            "emotional_state": "neutral",
            "energy_level": "medium",
            "mood_trend": "stable",
            "emotional_triggers": [],
            "coping_patterns": []
        }
        
        try:
            # Analyze current emotional state
            current_emotion = emotional_context.get("emotional_state", "neutral")
            emotional_patterns["emotional_state"] = current_emotion
            
            # Determine energy level
            content_lower = content.lower()
            high_energy_words = ["excited", "energetic", "motivated", "passionate", "enthusiastic"]
            low_energy_words = ["tired", "exhausted", "drained", "overwhelmed", "stressed"]
            
            if any(word in content_lower for word in high_energy_words):
                emotional_patterns["energy_level"] = "high"
            elif any(word in content_lower for word in low_energy_words):
                emotional_patterns["energy_level"] = "low"
            
            # Identify emotional triggers
            trigger_patterns = {
                "stress": ["stress", "overwhelmed", "anxious", "worried", "pressure"],
                "excitement": ["excited", "thrilled", "can't wait", "looking forward"],
                "frustration": ["frustrated", "annoyed", "upset", "disappointed"],
                "joy": ["happy", "joy", "pleased", "delighted", "grateful"],
                "motivation": ["motivated", "inspired", "determined", "focused"]
            }
            
            for trigger, patterns in trigger_patterns.items():
                if any(pattern in content_lower for pattern in patterns):
                    emotional_patterns["emotional_triggers"].append(trigger)
            
            # Analyze conversation history for mood trends
            if conversation_history:
                mood_trend = self._analyze_mood_trend(conversation_history)
                emotional_patterns["mood_trend"] = mood_trend
            
        except Exception as e:
            logger.warning(f"Emotional pattern analysis failed: {e}")
        
        return emotional_patterns

    def _analyze_mood_trend(self, conversation_history: List[Dict]) -> str:
        """
        Analyze mood trends across conversation history.
        """
        try:
            # Simple mood trend analysis based on emotional keywords
            positive_words = ["happy", "excited", "great", "awesome", "love", "enjoy", "pleased"]
            negative_words = ["sad", "angry", "frustrated", "disappointed", "worried", "stressed"]
            neutral_words = ["okay", "fine", "alright", "normal", "usual"]
            
            positive_count = 0
            negative_count = 0
            neutral_count = 0
            
            for msg in conversation_history:
                content = msg.get("content", "").lower()
                positive_count += sum(1 for word in positive_words if word in content)
                negative_count += sum(1 for word in negative_words if word in content)
                neutral_count += sum(1 for word in neutral_words if word in content)
            
            if positive_count > negative_count and positive_count > neutral_count:
                return "improving"
            elif negative_count > positive_count and negative_count > neutral_count:
                return "declining"
            else:
                return "stable"
                
        except Exception:
            return "stable"

    def _assess_goal_relevance(self, content: str, categories: List[str], user_id: str, db: Session) -> Dict[str, Any]:
        """
        Assess how relevant a memory is to the user's current goals.
        """
        goal_relevance = {
            "fitness_goals": 0.0,
            "health_goals": 0.0,
            "career_goals": 0.0,
            "personal_goals": 0.0,
            "overall_relevance": 0.0
        }
        
        try:
            content_lower = content.lower()
            
            # Fitness goal relevance
            fitness_keywords = ["exercise", "workout", "gym", "run", "active", "fit", "healthy"]
            fitness_score = sum(0.2 for word in fitness_keywords if word in content_lower)
            goal_relevance["fitness_goals"] = min(1.0, fitness_score)
            
            # Health goal relevance
            health_keywords = ["nutrition", "diet", "sleep", "wellness", "mental health", "stress"]
            health_score = sum(0.2 for word in health_keywords if word in content_lower)
            goal_relevance["health_goals"] = min(1.0, health_score)
            
            # Career goal relevance
            career_keywords = ["work", "project", "career", "job", "professional", "skill", "learning"]
            career_score = sum(0.2 for word in career_keywords if word in content_lower)
            goal_relevance["career_goals"] = min(1.0, career_score)
            
            # Personal goal relevance
            personal_keywords = ["hobby", "interest", "passion", "relationship", "family", "travel"]
            personal_score = sum(0.2 for word in personal_keywords if word in content_lower)
            goal_relevance["personal_goals"] = min(1.0, personal_score)
            
            # Overall relevance (average of all goal types)
            goal_relevance["overall_relevance"] = sum([
                goal_relevance["fitness_goals"],
                goal_relevance["health_goals"], 
                goal_relevance["career_goals"],
                goal_relevance["personal_goals"]
            ]) / 4.0
            
        except Exception as e:
            logger.warning(f"Goal relevance assessment failed: {e}")
        
        return goal_relevance

    def _extract_memory_categories(self, content: str, content_type: str) -> List[str]:
        """
        Extract relevant categories for a memory based on content and type.
        """
        categories = []
        content_lower = content.lower()
        
        # Basic category mapping based on content
        if any(word in content_lower for word in ["like", "love", "enjoy", "prefer"]):
            categories.append("preference")
        
        if any(word in content_lower for word in ["boat", "car", "travel", "vacation"]):
            categories.append("transportation")
            categories.append("hobbies")
        
        if any(word in content_lower for word in ["morning", "schedule", "routine", "5-8"]):
            categories.append("daily_patterns")
            categories.append("schedule")
        
        if any(word in content_lower for word in ["fitness", "exercise", "workout", "active"]):
            categories.append("health")
            categories.append("fitness")
        
        if any(word in content_lower for word in ["food", "eat", "nutrition", "diet"]):
            categories.append("nutrition")
            categories.append("food_preferences")
        
        if any(word in content_lower for word in ["work", "project", "career", "job"]):
            categories.append("work")
            categories.append("career")
        
        # Add content type as category
        if content_type:
            categories.append(content_type)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_categories = []
        for cat in categories:
            if cat not in seen:
                seen.add(cat)
                unique_categories.append(cat)
        
        return unique_categories

    def _find_related_memories(self, db: Session, user_id: str, content: str, categories: List[str]) -> List[Dict[str, Any]]:
        """
        Find memories that are related to the current content based on categories and content similarity.
        """
        related = []
        try:
            if not categories:
                return related
            
            # Search for memories with similar categories
            for category in categories[:3]:  # Limit to top 3 categories
                memories = memory.get_user_memories_by_category(db, user_id=user_id, category=category, limit=5)
                for mem in memories:
                    if mem.content != content:  # Don't include self
                        related.append({
                            "faiss_id": mem.faiss_id,
                            "content": mem.content,
                            "category": category,
                            "relevance": self._calculate_memory_relevance(content, mem.content)
                        })
            
            # Sort by relevance and remove duplicates
            related.sort(key=lambda x: x["relevance"], reverse=True)
            seen_contents = set()
            unique_related = []
            for rel in related:
                if rel["content"] not in seen_contents:
                    seen_contents.add(rel["content"])
                    unique_related.append(rel)
                    if len(unique_related) >= 5:  # Limit to top 5 related memories
                        break
            
            return unique_related
            
        except Exception as e:
            logger.warning(f"Failed to find related memories: {e}")
            return []

    def _calculate_memory_relevance(self, content1: str, content2: str) -> float:
        """
        Calculate relevance score between two memory contents.
        """
        try:
            # Simple word overlap scoring
            words1 = set(content1.lower().split())
            words2 = set(content2.lower().split())
            
            if not words1 or not words2:
                return 0.0
            
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            
            if union == 0:
                return 0.0
            
            return intersection / union
            
        except Exception:
            return 0.0

    def _build_memory_relationships(self, related_memories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Build relationship structure between related memories.
        """
        relationships = {
            "count": len(related_memories),
            "categories": {},
            "strength": "weak"
        }
        
        try:
            if not related_memories:
                return relationships
            
            # Count categories
            for rel in related_memories:
                category = rel.get("category", "unknown")
                if category not in relationships["categories"]:
                    relationships["categories"][category] = 0
                relationships["categories"][category] += 1
            
            # Determine relationship strength
            if len(related_memories) >= 3:
                relationships["strength"] = "strong"
            elif len(related_memories) >= 1:
                relationships["strength"] = "moderate"
            
            return relationships
            
        except Exception:
            return relationships

    def _determine_usage_contexts(self, content: str, content_type: str, categories: List[str]) -> List[str]:
        """
        Determine in what contexts this memory would be most useful.
        """
        contexts = []
        
        try:
            # Add content type contexts
            if content_type == "preference":
                contexts.extend(["conversation", "planning", "recommendations"])
            elif content_type == "fact":
                contexts.extend(["conversation", "planning", "problem_solving"])
            elif content_type == "profile":
                contexts.extend(["personalization", "conversation", "planning"])
            
            # Add category-specific contexts
            if "transportation" in categories:
                contexts.extend(["travel_planning", "weekend_activities", "hobby_discussions"])
            if "health" in categories or "fitness" in categories:
                contexts.extend(["health_goals", "motivation", "progress_tracking"])
            if "schedule" in categories:
                contexts.extend(["planning", "routine_optimization", "productivity"])
            if "food_preferences" in categories:
                contexts.extend(["meal_planning", "restaurant_recommendations", "social_events"])
            
            # Remove duplicates
            return list(set(contexts))
            
        except Exception:
            return ["conversation"]  # Default fallback

    def _maybe_soft_forget(self, db: Session, user_id: str) -> int:
        """Delegate to LifecycleMixin._maybe_soft_forget (extracted)."""
        return super()._maybe_soft_forget(db, user_id)

    def consolidate_user_memories(
        self,
        db: Session,
        *,
        user_id: str,
        limit: int = 2000,
    ) -> Dict[str, int]:
        """Delegate to LifecycleMixin.consolidate_user_memories (extracted)."""
        return super().consolidate_user_memories(db, user_id=user_id, limit=limit)

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
                # Parse metadata whether it's already a dict or a JSON string
                md = {}
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
                # Auto-reinforce every 5 views (bounded behavior)
                if seen % 5 == 0:
                    cur = int(md.get("reinforced_count", 0))
                    md["reinforced_count"] = cur + 1
                memory.update_content_and_metadata(db, node=node, content=node.content, metadata=md)
            except Exception:
                # best-effort; skip failures
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

            # Safe-load metadata that may already be a dict
            md = {}
            if node.memory_metadata:
                try:
                    if isinstance(node.memory_metadata, dict):
                        md = dict(node.memory_metadata)
                    else:
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
                    if isinstance(node.memory_metadata, dict):
                        md = dict(node.memory_metadata)
                    else:
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

    def _get_temporal_intelligence_insights(self, categorized_memories: Dict[str, List]) -> List[str]:
        """
        Generate insights about temporal intelligence based on memory content.
        """
        insights = []
        
        try:
            # Look for patterns in time references
            time_references = set()
            for mem in categorized_memories.values():
                for item in mem:
                    if item.memory_metadata:
                        import json as _json
                        try:
                            if isinstance(item.memory_metadata, dict):
                                md = dict(item.memory_metadata)
                            else:
                                md = _json.loads(item.memory_metadata)
                        except Exception:
                            md = {}
                        if "time_references" in md:
                            tr = md["time_references"]
                            if isinstance(tr, list):
                                for t in tr:
                                    time_references.add(str(t))
            for time_category in ["morning", "afternoon", "evening", "weekend", "weekday", "seasonal"]:
                if time_category in time_references:
                    insights.append(f"- You have a strong memory for {time_category} activities")
            
            # Check for seasonal trends
            if "summer" in time_references and "winter" in time_references:
                insights.append("- You have memories spanning both summer and winter")
            elif "summer" in time_references:
                insights.append("- You have memories predominantly from the summer season")
            elif "winter" in time_references:
                insights.append("- You have memories predominantly from the winter season")
            
            # Check for frequency patterns
            if "continuous" in time_references and "recurring" in time_references:
                insights.append("- You have memories that span both continuous and recurring patterns")
            elif "continuous" in time_references:
                insights.append("- You have memories that span continuous patterns")
            elif "recurring" in time_references:
                insights.append("- You have memories that span recurring patterns")
            
            # Check for time sensitivity
            if "time_sensitive" in time_references:
                insights.append("- You have memories that are time-sensitive")
            
            # Check for conversational timing
            if "conversation_timing" in time_references:
                insights.append("- You have memories that are timed to the conversation")
            
        except Exception as e:
            logger.warning(f"Failed to generate temporal intelligence insights: {e}")
        
        return insights

    def _get_emotional_intelligence_insights(self, categorized_memories: Dict[str, List]) -> List[str]:
        """
        Generate insights about emotional intelligence based on memory content.
        """
        insights = []
        
        try:
            # Look for emotional states and trends
            emotional_states = set()
            emotional_trends = set()
            emotional_triggers = set()
            coping_patterns = set()
            for mem in categorized_memories.values():
                for item in mem:
                    if item.memory_metadata:
                        import json as _json
                        try:
                            if isinstance(item.memory_metadata, dict):
                                md = dict(item.memory_metadata)
                            else:
                                md = _json.loads(item.memory_metadata)
                        except Exception:
                            md = {}
                        # Extract emotional states
                        if "emotional_states" in md and isinstance(md["emotional_states"], list):
                            emotional_states.update(set(str(s) for s in md["emotional_states"]))
                        if "mood_trend" in md:
                            emotional_trends.add(md["mood_trend"])
                        if "emotional_triggers" in md:
                            emotional_triggers.update(md["emotional_triggers"])
                        if "coping_patterns" in md:
                            coping_patterns.update(md["coping_patterns"])
            
            # Generate insights based on emotional states and trends
            for state in emotional_states:
                insights.append(f"- You have a strong memory for {state} emotions")
            for trend in emotional_trends:
                insights.append(f"- You have a strong memory for {trend} mood trends")
            for trigger in emotional_triggers:
                insights.append(f"- You have a strong memory for {trigger} emotional triggers")
            for pattern in coping_patterns:
                insights.append(f"- You have a strong memory for {pattern} coping patterns")
            
            # Check for emotional consistency
            if len(emotional_states) > 1:
                insights.append("- Your memories show a range of emotional states")
            if len(emotional_trends) > 1:
                insights.append("- Your memories show a range of mood trends")
            if len(emotional_triggers) > 1:
                insights.append("- Your memories show a range of emotional triggers")
            if len(coping_patterns) > 1:
                insights.append("- Your memories show a range of coping patterns")
            
            # Check for emotional context
            if "emotional_context" in categorized_memories:
                insights.append("- Your memories are emotionally context-aware")
            
        except Exception as e:
            logger.warning(f"Failed to generate emotional intelligence insights: {e}")
        
        return insights

    def _generate_proactive_suggestions(self, categorized_memories: Dict[str, List], current_message: str, user_id: str, db: Session) -> List[str]:
        """
        Generate proactive suggestions based on current context and memory content.
        """
        suggestions = []
        
        try:
            # Look for relevant memories in each category
            for category, memories in categorized_memories.items():
                for mem in memories:
                    if mem.memory_metadata:
                        import json as _json
                        try:
                            if isinstance(mem.memory_metadata, dict):
                                md = dict(mem.memory_metadata)
                            else:
                                md = _json.loads(mem.memory_metadata)
                        except Exception:
                            md = {}
                        if "related_memories" in md:
                            related = md["related_memories"]
                            if isinstance(related, list):
                                for r in related:
                                    if isinstance(r, dict) and "content" in r:
                                        suggestions.append(f"- Consider mentioning {r['content']} in your response")
            
            # Add general suggestions based on current message
            suggestions.append(f"- Consider mentioning {current_message} in your response")
            
            # Add proactive advice based on emotional context
            emotional_context = emotional_analyzer.analyze_emotional_context(current_message, [])
            if emotional_context:
                if emotional_context["emotional_state"] == "high":
                    suggestions.append("- Be positive and uplifting in your response")
                elif emotional_context["emotional_state"] == "low":
                    suggestions.append("- Be empathetic and supportive in your response")
                elif emotional_context["emotional_state"] == "neutral":
                    suggestions.append("- Be neutral and informative in your response")
            
            # Add advice based on user's preferences and goals
            profile_memory = self.get_user_profile_memory(db, user_id)
            if profile_memory:
                highlights = self._extract_profile_highlights(profile_memory, max_bullets=3)
                if highlights:
                    suggestions.append(f"- Consider mentioning {', '.join(highlights)} in your response")
            
            # Add advice based on current topic
            suggestions.append(f"- Consider mentioning {current_message} in your response")
            
        except Exception as e:
            logger.warning(f"Failed to generate proactive suggestions: {e}")
        
        return suggestions


# Global instance
memory_service = MemoryService()
