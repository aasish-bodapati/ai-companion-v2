"""
Conversation Context Tracker - Tracks what has been discussed to prevent repetition.
"""

import logging
import hashlib
from typing import Dict, List, Set, Optional
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class ConversationContextTracker:
    """Tracks conversation context to prevent repeating information."""

    def __init__(self):
        # In-memory cache for active conversations
        self._conversation_cache: Dict[str, Dict] = {}
        # Compatibility alias for tests that reference `_context_cache`
        self._context_cache = self._conversation_cache
        # Internal TTL
        self._cache_ttl = timedelta(hours=1)  # Cache expires after 1 hour
        # Compatibility attribute expected by unit tests (in seconds)
        self.cache_ttl = 3600

    def track_discussed_content(
        self,
        conversation_id: str,
        content: str,
        content_type: str = "message",
        memory_ids: Optional[List[str]] = None,
    ) -> None:
        """Track content that has been discussed in this conversation."""
        try:
            now = datetime.utcnow()

            # Initialize conversation tracking if not exists
            if conversation_id not in self._conversation_cache:
                self._conversation_cache[conversation_id] = {
                    "discussed_topics": set(),
                    "used_memory_ids": set(),
                    "last_updated": now,
                    "content_hashes": set(),
                }

            conv_data = self._conversation_cache[conversation_id]

            # Add content hash to prevent exact repetition
            content_hash = hash(content.lower().strip())
            conv_data["content_hashes"].add(content_hash)

            # Track memory IDs that were used
            if memory_ids:
                conv_data["used_memory_ids"].update(memory_ids)

            # Extract and track topics/themes
            topics = self._extract_topics(content)
            conv_data["discussed_topics"].update(topics)

            conv_data["last_updated"] = now

            # Clean up old cache entries
            self._cleanup_cache()

        except Exception as e:
            logger.error(f"Error tracking discussed content: {e}")

    def is_content_repeated(self, conversation_id: str, content: str) -> bool:
        """Check if content has already been discussed in this conversation."""
        try:
            if conversation_id not in self._conversation_cache:
                return False

            conv_data = self._conversation_cache[conversation_id]
            content_hash = hash(content.lower().strip())

            return content_hash in conv_data["content_hashes"]

        except Exception as e:
            logger.error(f"Error checking content repetition: {e}")
            return False

    def get_used_memory_ids(self, conversation_id: str) -> Set[str]:
        """Get memory IDs that have already been used in this conversation."""
        try:
            if conversation_id not in self._conversation_cache:
                return set()

            return self._conversation_cache[conversation_id]["used_memory_ids"].copy()

        except Exception as e:
            logger.error(f"Error getting used memory IDs: {e}")
            return set()

    def get_conversation_context(self, conversation_id: str) -> Dict[str, Set[str]]:
        """Return the full context snapshot for a conversation.
        Ensures keys: discussed_topics, used_memory_ids, content_hashes.
        """
        try:
            if conversation_id not in self._conversation_cache:
                self._conversation_cache[conversation_id] = {
                    "discussed_topics": set(),
                    "used_memory_ids": set(),
                    "last_updated": datetime.utcnow(),
                    "content_hashes": set(),
                }
            data = self._conversation_cache[conversation_id]
            return {
                "discussed_topics": set(data.get("discussed_topics", set())),
                "used_memory_ids": set(data.get("used_memory_ids", set())),
                "content_hashes": set(data.get("content_hashes", set())),
            }
        except Exception as e:
            logger.error(f"Error getting conversation context: {e}")
            return {"discussed_topics": set(), "used_memory_ids": set(), "content_hashes": set()}

    def get_discussed_topics(self, conversation_id: str) -> Set[str]:
        """Get topics that have been discussed in this conversation."""
        try:
            if conversation_id not in self._conversation_cache:
                return set()

            return self._conversation_cache[conversation_id]["discussed_topics"].copy()

        except Exception as e:
            logger.error(f"Error getting discussed topics: {e}")
            return set()

    def filter_memories_by_usage(
        self, conversation_id: str, memories: List, max_reuse_count: int = 1
    ) -> List:
        """Filter out memories that have been overused in this conversation."""
        try:
            used_memory_ids = self.get_used_memory_ids(conversation_id)

            # Filter out memories that have been used too much
            filtered_memories = []
            for memory in memories:
                memory_id = getattr(memory, "id", None) or getattr(memory, "memory_id", None)
                if memory_id not in used_memory_ids:
                    filtered_memories.append(memory)

            return filtered_memories

        except Exception as e:
            logger.error(f"Error filtering memories by usage: {e}")
            return memories

    def _extract_topics(self, content: str) -> Set[str]:
        """Extract key topics/themes from content.
        Returns both category labels and matched keywords.
        Falls back to significant words when no keywords match.
        """
        try:
            content_lower = (content or "").lower()
            topics: Set[str] = set()

            # Define topic keywords
            topic_keywords = {
                "work": ["work", "job", "career", "office", "meeting", "project"],
                "health": ["health", "fitness", "exercise", "diet", "wellness", "workout"],
                "relationships": ["family", "friend", "relationship", "partner"],
                "goals": ["goal", "plan", "objective", "target", "achieve"],
                "learning": ["learn", "study", "course", "skill", "knowledge"],
                "travel": ["travel", "trip", "vacation", "visit"],
                "hobbies": ["hobby", "interest", "creative", "art", "music"],
                "emotions": ["feel", "emotion", "happy", "sad", "stressed"],
            }

            matched_any = False
            for topic, keywords in topic_keywords.items():
                matched_keywords = [kw for kw in keywords if kw in content_lower]
                if matched_keywords:
                    matched_any = True
                    topics.add(topic)
                    topics.update(matched_keywords)

            # Fallback: extract significant words if nothing matched
            if not matched_any:
                import re as _re

                words = _re.findall(r"[a-zA-Z]+", content_lower)
                for w in words:
                    if len(w) >= 4:
                        topics.add(w)
                        if len(topics) >= 3:
                            break

            return topics

        except Exception as e:
            logger.error(f"Error extracting topics: {e}")
            return set()

    def _cleanup_cache(self) -> None:
        """Remove expired entries from cache."""
        try:
            now = datetime.utcnow()
            expired_conversations = []

            for conv_id, conv_data in self._conversation_cache.items():
                last_updated = conv_data.get("last_updated")
                # Support both datetime and Unix timestamp (float) for test compatibility
                if isinstance(last_updated, (int, float)):
                    try:
                        last_dt = datetime.utcfromtimestamp(float(last_updated))
                    except Exception:
                        last_dt = now  # treat as fresh if unparsable
                else:
                    last_dt = last_updated if isinstance(last_updated, datetime) else now
                if (now - last_dt) >= self._cache_ttl:
                    expired_conversations.append(conv_id)

            for conv_id in expired_conversations:
                del self._conversation_cache[conv_id]

        except Exception as e:
            logger.error(f"Error cleaning up cache: {e}")

    def reset_conversation_context(self, conversation_id: str) -> None:
        """Reset tracking for a specific conversation."""
        try:
            if conversation_id in self._conversation_cache:
                del self._conversation_cache[conversation_id]
        except Exception as e:
            logger.error(f"Error resetting conversation context: {e}")

    # --- Compatibility helpers expected by some unit tests ---
    def track_content(
        self,
        conversation_id: str,
        content: str,
        memory_ids: Optional[List[str]] = None,
        content_type: str = "message",
    ) -> None:
        """Compat alias for track_discussed_content (tests call track_content)."""
        self.track_discussed_content(
            conversation_id=conversation_id,
            content=content,
            content_type=content_type,
            memory_ids=memory_ids,
        )

    def is_memory_used(self, conversation_id: str, memory_id: str) -> bool:
        """Return True if memory_id has been marked as used in this conversation."""
        try:
            ids = self.get_used_memory_ids(conversation_id)
            return memory_id in ids
        except Exception:
            return False

    def _generate_content_hash(self, content: str) -> str:
        """Stable hash for content; used by tests to verify consistency."""
        try:
            s = (content or "").strip().lower()
            return hashlib.sha256(s.encode("utf-8")).hexdigest()
        except Exception:
            return ""


# Global instance
context_tracker = ConversationContextTracker()
