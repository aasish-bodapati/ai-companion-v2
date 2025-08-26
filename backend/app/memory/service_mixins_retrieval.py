from __future__ import annotations
from typing import List, Optional, Dict, Any, Set
import json
from datetime import datetime, timezone
import logging
import time
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.user import user as user_crud
from app.crud.memory import memory
from app.memory.vector_store.factory import get_vector_store
import app.memory.embeddings as embeddings
from app.schemas.memory import MemorySearchResult
from app.memory.context_tracker import context_tracker
from app.memory.deduplication import deduplication_service

logger = logging.getLogger(__name__)


class RetrievalMixin:
    def get_retrieval_metrics(self) -> Dict[str, Any]:
        """Return a shallow copy of retrieval metrics for diagnostics."""
        try:
            return {
                "total_requests": int(self._retrieval_metrics.get("total_requests", 0)),
                "last": dict(self._retrieval_metrics.get("last", {})),
            }
        except Exception:
            return {"total_requests": 0, "last": {}}

    def search_memories(
        self,
        db: Session,
        query: str,
        user_id: str,
        content_types: Optional[List[str]] = None,
        limit: int = 8,
        min_relevance: float = 0.5,
        debug: bool = False,
        conversation_id: Optional[str] = None,
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
        # Global or per-user disabled
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, returning empty results")
            return []
        try:
            u = user_crud.get(db, id=user_id)
            if u is not None and getattr(u, "memory_enabled", None) is False:
                return []
        except Exception:
            pass

        try:
            # Get query embedding
            query_embedding = embeddings.embed_texts([query])
            if query_embedding is None:
                logger.warning("Failed to generate query embedding")
                return []

            # Search vector store (FAISS by default; pluggable via factory)
            store = get_vector_store()
            faiss_results = store.search(
                user_id,
                query_embedding[0],
                limit * 2,  # Get more results to filter by relevance
            )

            # Local carryover for secondary fallback when faiss_id is missing
            fallback_map: Dict[str, Any] = {}

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
                            # Pure-Python dot product to avoid numpy dependency in fallback
                            qv = list(map(float, query_embedding[0]))

                            def _dot(a: list[float], b: list[float]) -> float:
                                try:
                                    # Assume both are normalized from embeddings.embed_texts()
                                    m = min(len(a), len(b))
                                    s = 0.0
                                    for i in range(m):
                                        s += float(a[i]) * float(b[i])
                                    return float(s)
                                except Exception:
                                    return 0.0

                            scores: list[tuple[str, float]] = []
                            for n, v in zip(cand_nodes, vecs):
                                sv = _dot(qv, list(map(float, v)))
                                scores.append((n.faiss_id, sv))
                            # Sort by score desc and keep top 2x limit similar to FAISS branch
                            scores.sort(key=lambda t: t[1], reverse=True)
                            faiss_results = scores[: max(1, limit * 2)]
                except Exception:
                    # If fallback fails, proceed with empty results
                    faiss_results = []

            if not faiss_results:
                logger.info("No retrieval results (FAISS and fallback empty)")
                # Secondary fallback: surface recent preference/profile memories
                # so explicit user-stated preferences are discoverable even without FAISS/NumPy.
                try:
                    recent_prefs = memory.get_user_memories(
                        db, user_id=user_id, content_type="preference", limit=max(5, limit)
                    )
                except Exception:
                    recent_prefs = []
                try:
                    recent_profile = memory.get_user_memories(
                        db, user_id=user_id, content_type="profile", limit=2
                    )
                except Exception:
                    recent_profile = []

                fallback_nodes = list(recent_prefs) + list(recent_profile)
                if not fallback_nodes:
                    return []

                ql = (query or "").strip().lower()
                scored: list[tuple[str, float]] = []
                for n in fallback_nodes:
                    try:
                        txt = (n.content or "").strip()
                        tl = txt.lower()
                        # Simple heuristic: exact match > substring > token overlap
                        if tl == ql and tl:
                            s = 1.0
                        elif ql and ql in tl:
                            s = 0.85
                        else:
                            q_terms = set(t for t in ql.split() if t and len(t) >= 3)
                            m_terms = set(t for t in tl.split() if t and len(t) >= 3)
                            overlap = len(q_terms & m_terms)
                            s = 0.10 * overlap
                        # Build a synthetic key if faiss_id is missing so we can recover the node later
                        key = n.faiss_id if getattr(n, "faiss_id", None) else f"mem:{getattr(n, 'id', uuid.uuid4())}"
                        fallback_map[key] = n
                        scored.append((key, float(s)))
                    except Exception:
                        continue
                scored.sort(key=lambda t: t[1], reverse=True)
                faiss_results = scored[: max(1, limit)]

            # Filter out already used memories if conversation_id provided
            if conversation_id:
                used_memory_ids = context_tracker.get_used_memory_ids(conversation_id)
                filtered_faiss_results = []
                for faiss_id, score in faiss_results:
                    # Check if this memory was already used
                    memory_node = memory.get_memory_by_faiss_id(db, faiss_id)
                    if memory_node and memory_node.id not in used_memory_ids:
                        filtered_faiss_results.append((faiss_id, score))
                faiss_results = filtered_faiss_results

            # Retrieve memory nodes from database (collect more for reranking)
            memory_results = []
            seen_norm_contents: Set[str] = set()
            for faiss_id, score in faiss_results:
                # Prefer local fallback_map resolution if present (handles missing faiss_id)
                memory_node = None
                try:
                    memory_node = fallback_map.get(faiss_id)  # type: ignore[arg-type]
                except Exception:
                    memory_node = None
                if memory_node is None:
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

                    if not memory_node.memory_metadata:
                        md = {}
                    elif isinstance(memory_node.memory_metadata, dict):
                        md = dict(memory_node.memory_metadata)
                    else:
                        md = _json.loads(memory_node.memory_metadata)
                except Exception:
                    md = {}
                # Skip soft-deleted items entirely
                try:
                    if bool(md.get("deleted")):
                        continue
                except Exception:
                    pass
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
                            if isinstance(memory_node.memory_metadata, dict):
                                _md_obj = dict(memory_node.memory_metadata)
                            else:
                                _md_obj = _json.loads(memory_node.memory_metadata)
                    except Exception:
                        _md_obj = {}

                memory_results.append(
                    MemorySearchResult(
                        faiss_id=memory_node.faiss_id,
                        content=memory_node.content,
                        content_type=memory_node.content_type,
                        memory_metadata=json.dumps(_md_obj) if debug else memory_node.memory_metadata,
                        relevance_score=float(max(0.0, min(1.0, boosted_score))),
                        timestamp=memory_node.timestamp,
                    )
                )

            # Rerank and select top-K
            out = sorted(
                memory_results, key=lambda r: float(getattr(r, "relevance_score", 0.0)), reverse=True
            )[: max(0, int(limit))]

            # Update simple metrics
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

        # Enhanced contextual memory retrieval using new system
        if memory_limit > 0 and current_message and getattr(self, 'EMOTIONAL_ANALYSIS_ENABLED', True):
            try:
                from app.memory.contextual_retrieval import contextual_retriever as _cr
                
                # Use contextual retrieval for human-like memory selection
                general_memories = _cr.get_contextual_memories(
                    memory_service=self,
                    db=db,
                    user_id=user_id,
                    current_message=current_message,
                    conversation_history=[{'content': msg.content, 'role': msg.role} for msg in conversation_memories] if conversation_memories else [],
                    emotional_context={},
                    limit=memory_limit
                )
            except Exception as e:
                logger.warning(f"Enhanced memory retrieval failed, falling back to basic: {e}")
                # Fallback to basic memory search
                query_parts = []
                if conversation_memories:
                    for msg in conversation_memories[-3:]:
                        if msg.content:
                            query_parts.append(msg.content)

                query = " ".join(query_parts) if query_parts else "general context"
                general_memories = self.search_memories(
                    db=db,
                    query=query,
                    user_id=user_id,
                    content_types=None,
                    limit=memory_limit,
                    min_relevance=0.25,
                )
        elif memory_limit > 0:
            # Fallback to original method if no current message
            query_parts = []
            if conversation_memories:
                for msg in conversation_memories[-3:]:
                    if msg.content:
                        query_parts.append(msg.content)

            query = " ".join(query_parts) if query_parts else "general context"
            general_memories = self.search_memories(
                db=db,
                query=query,
                user_id=user_id,
                content_types=None,
                limit=memory_limit,
                min_relevance=0.25,
            )
        else:
            general_memories = []

        # Process memories with enhanced contextual presentation
        if general_memories:
            dedup_general = []
            seen_gen: Set[str] = set()

            # Group memories by category for better organization
            categorized_memories = {}

            for mem in general_memories:
                norm = (mem.content or "").strip().lower()
                if not norm or norm in seen_gen:
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

                # Add proactive suggestions based on current context
                proactive_suggestions = self._generate_proactive_suggestions(
                    categorized_memories,
                    current_message,
                    user_id,
                    db
                )
                if proactive_suggestions:
                    context_parts.append("")
                    context_parts.append("Proactive Suggestions:")
                    context_parts.extend(proactive_suggestions)

        t1 = time.perf_counter()
        logger.info(
            "Enhanced context assembly timings: total=%.2fms (conv_mem=%d, gen_mem_in=%d, gen_mem_out=%d)",
            (t1 - t0) * 1000.0,
            len(conversation_memories) if conversation_memories else 0,
            len(general_memories) if general_memories else 0,
            len(dedup_general) if 'dedup_general' in locals() else 0,
        )

        return "\n".join(context_parts) if context_parts else "No specific context available."

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

Personality & Voice:
- Speak like a knowledgeable friend who truly cares
- Be warm but not overly familiar
- Show genuine interest and enthusiasm about their progress
- Reference their preferences, goals, and past conversations naturally
- Use their name occasionally but not excessively
- Demonstrate empathy by acknowledging their feelings and challenges
- Celebrate achievements with genuine excitement
- Offer encouragement during difficult times

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
