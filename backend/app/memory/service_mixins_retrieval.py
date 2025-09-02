from __future__ import annotations
from typing import Any, Dict, List, Optional, Set
import time
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.user import user as user_crud
from app.crud.memory import memory
# Vector store factory removed for MVP - use direct FAISS
from app.memory.faiss_store import faiss_store
from app.schemas.memory import MemorySearchResult


def _mmr_select(
    candidates: List[MemorySearchResult],
    k: int,
    mmr_lambda: float = 0.7,
) -> List[MemorySearchResult]:
    """
    Maximal Marginal Relevance selection over pre-scored candidates.
    Relies on MemorySearchResult.relevance_score and content for diversity.
    """

    def _token_set(s: str) -> Set[str]:
        try:
            return set(t for t in (s or "").lower().split() if t and len(t) >= 3)
        except Exception:
            return set()

    def _sim(a: MemorySearchResult, b: MemorySearchResult) -> float:
        try:
            A = _token_set(getattr(a, "content", ""))
            B = _token_set(getattr(b, "content", ""))
            if not A or not B:
                return 0.0
            inter = len(A & B)
            union = len(A | B)
            return float(inter) / float(union) if union else 0.0
        except Exception:
            return 0.0

    selected: List[MemorySearchResult] = []
    pool = list(candidates)
    k = max(0, int(k))
    mmr_lambda = max(0.0, min(1.0, float(mmr_lambda)))

    while pool and len(selected) < k:
        best_idx = 0
        best_score = -1e12
        for idx, cand in enumerate(pool):
            rel = float(getattr(cand, "relevance_score", 0.0))
            if not selected:
                score = rel
            else:
                max_sim = 0.0
                for s in selected:
                    max_sim = max(max_sim, _sim(cand, s))
                score = mmr_lambda * rel - (1.0 - mmr_lambda) * max_sim
            if score > best_score:
                best_score = score
                best_idx = idx
        chosen = pool.pop(best_idx)
        selected.append(chosen)

    return selected

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
        min_relevance: float = 0.1,
        debug: bool = False,
        conversation_id: Optional[str] = None,
    ) -> List[MemorySearchResult]:
        """
        Simplified memory search with clear, predictable behavior.
        Removes complex fallback layers for easier debugging.
        """
        # Check if memory system is enabled
        if not settings.MEMORY_ENABLED:
            logger.info("Memory system disabled, returning empty results")
            return []
        
        try:
            # Get user and check if memory is enabled for them
            user = user_crud.get(db, id=user_id)
            if user is not None and getattr(user, "memory_enabled", True) is False:
                logger.info(f"Memory disabled for user {user_id}")
                return []
            
            # Generate query embedding
            query_embedding = self._get_embedding(query)
            if query_embedding is None:
                logger.warning("Failed to generate query embedding")
                return []
            
            # Get FAISS store
            store = self._get_faiss_store(user_id)
            if store is None:
                logger.warning(f"No FAISS store found for user {user_id}")
                return []
            
            # Simple FAISS search - query_embedding is already a list, not a tuple
            faiss_results = store.search(user_id, query_embedding, limit * 2)
            
            logger.info(f"FAISS search returned {len(faiss_results)} results")
            
            if not faiss_results:
                logger.info(f"No FAISS results found for query: {query}")
                return []
            
            # Process results
            memory_results = []
            for faiss_id, score in faiss_results:
                logger.info(f"Processing FAISS result: {faiss_id} with score {score}")
                
                # Skip if below relevance threshold
                if score < min_relevance:
                    logger.info(f"Skipping {faiss_id} - score {score} below threshold {min_relevance}")
                    continue
                
                # Get memory from database
                memory_record = memory.get_memory_by_faiss_id(db, faiss_id)
                if memory_record is None:
                    logger.warning(f"No memory found in DB for FAISS ID: {faiss_id}")
                    continue
                
                logger.info(f"Found memory: {memory_record.content[:50]}...")
                
                # Filter by content type if specified
                if content_types and memory_record.content_type not in content_types:
                    logger.info(f"Skipping {faiss_id} - content type {memory_record.content_type} not in {content_types}")
                    continue
                
                # Create result
                result = MemorySearchResult(
                    faiss_id=memory_record.faiss_id,
                    content=memory_record.content,
                    content_type=memory_record.content_type,
                    relevance_score=score,
                    timestamp=memory_record.timestamp,
                    memory_metadata=memory_record.memory_metadata
                )
                memory_results.append(result)
                logger.info(f"Added memory result: {memory_record.content[:50]}...")
            
            logger.info(f"Final memory results: {len(memory_results)}")
            
            # Sort by relevance and limit results
            memory_results.sort(key=lambda x: x.relevance_score, reverse=True)
            return memory_results[:limit]
            
        except Exception as e:
            logger.error(f"Error in memory search: {e}")
            return []
    
    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Get embedding for text using the configured embedding model."""
        try:
            # Use the embedding function directly
            from app.memory.embeddings import get_embedding
            return get_embedding(text)
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return None
    
    def _get_faiss_store(self, user_id: str):
        """Get FAISS store for user."""
        try:
            return faiss_store
        except Exception as e:
            logger.error(f"Error getting FAISS store: {e}")
            return None

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
            if self_referential and not getattr(
                settings, "PROFILE_VERBATIM_DISCLOSURE_ALLOWED", False
            ):
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
                content = (msg.content or "")[:200] + (
                    "..." if len(msg.content or "") > 200 else ""
                )
                context_parts.append(f"- {role_prefix}: {content}")

        # Enhanced contextual memory retrieval using new system
        if (
            memory_limit > 0
            and current_message
            and getattr(self, "EMOTIONAL_ANALYSIS_ENABLED", True)
        ):
            try:
                from app.memory.contextual_retrieval import contextual_retriever as _cr

                # Use contextual retrieval for human-like memory selection
                general_memories = _cr.get_contextual_memories(
                    memory_service=self,
                    db=db,
                    user_id=user_id,
                    current_message=current_message,
                    conversation_history=[
                        {"content": msg.content, "role": msg.role} for msg in conversation_memories
                    ]
                    if conversation_memories
                    else [],
                    emotional_context={},
                    conversation_id=conversation_id,
                    limit=memory_limit,
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
                context_parts.append(
                    "EXACT MEMORIES - ONLY reference these (do not invent others):"
                )

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
                            "career": "Career & Professional",
                        }.get(category, category.title())

                        context_parts.append(f"\n{category_display}:")
                        for mem in memories:
                            context_parts.append(f"- {mem.content}")

                context_parts.append("")
                context_parts.append(
                    "IMPORTANT: Only use the memories listed above. Do not reference any other conversations, memories, or facts that are not explicitly listed."
                )

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
                    categorized_memories, current_message, user_id, db
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
            len(dedup_general) if "dedup_general" in locals() else 0,
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
STOP! READ THIS FIRST - CRITICAL INSTRUCTION:

You are an expert AI companion who knows {user_name} well. You're warm, intelligent, and genuinely care about their wellbeing and goals. You remember everything about them and weave that knowledge naturally into conversations.

ABSOLUTE RULE - NEVER VIOLATE THIS:
- When someone says "next Tuesday", "later", "after that", etc., you MUST ask for clarification BEFORE doing anything else
- NEVER make assumptions about ambiguous temporal references
- For "next Tuesday" specifically, ALWAYS ask: "When you say 'next Tuesday', do you mean the upcoming Tuesday or the Tuesday of the following week?"
- Do NOT proceed with scheduling, planning, or making suggestions until you clarify the ambiguous reference
- This rule takes precedence over ALL other instructions

EXAMPLE: If someone says "Schedule a checkup next Tuesday", you MUST respond with: "I'd be happy to help schedule a checkup! When you say 'next Tuesday', do you mean the upcoming Tuesday or the Tuesday of the following week? I want to make sure I get the right date for you." Do NOT suggest any specific date until they clarify.

REMEMBER: This is the MOST IMPORTANT rule. Follow it above all else.

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
- When referencing appointments or scheduled events, use the EXACT time format from memory
- For temporal references, maintain consistency with how they were originally mentioned

Temporal Intelligence:
- Pay attention to time references in their memories (morning, weekend, seasonal)
- Consider timing when making suggestions (e.g., morning activities for early risers)
- Use temporal patterns to provide more relevant advice
- Acknowledge seasonal preferences and patterns
- When referencing specific times from memory, use the EXACT format mentioned (e.g., "3pm" not "3 pm")
- For ambiguous time references like "next Tuesday", ask for clarification before making assumptions
- Clarify ambiguous temporal references by asking: "When you say 'next Tuesday', do you mean the upcoming Tuesday or the Tuesday of the following week?"

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

AMBIGUITY RESOLUTION - CRITICAL:
- When faced with ambiguous references like "next Tuesday", "after that", "later", etc., ALWAYS ask for clarification
- NEVER make assumptions about ambiguous temporal references
- For "next Tuesday" specifically, ALWAYS ask: "When you say 'next Tuesday', do you mean the upcoming Tuesday or the Tuesday of the following week?"
- For "after that" or similar references, ask for clarification if the antecedent isn't clear
- Always prioritize clarity over assumptions - this is a core rule that must be followed
"""

        if profile_memory:
            highlights = self._extract_profile_highlights(profile_memory, max_bullets=4)
            if highlights:
                base_prompt += "\n\nKey things about " + user_name + ":\n" + "\n".join(highlights)
            else:
                # Fallback: use raw profile text (truncated)
                truncated = (
                    profile_memory[:400] + "..." if len(profile_memory) > 400 else profile_memory
                )
                base_prompt += f"\n\nBackground: {truncated}"
        else:
            base_prompt += f"\n\nNote: Learn about {user_name}'s preferences, goals, and background to provide personalized assistance."

        # Response personalization based on user energy and mood
        base_prompt += """

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
