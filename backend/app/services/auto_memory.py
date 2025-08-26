"""
Automatic Memory Service - Handles invisible memory capture and management
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import re
import logging
import uuid
import hashlib
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.llm import generate_with_openrouter
from app.memory.service import MemoryService
from app.crud.memory import memory as memory_crud
from app.models.memory import MemoryNode
from app.privacy.redaction import redact_text, redact_metadata

logger = logging.getLogger(__name__)


class AutoMemoryService:
    """Fully automatic memory capture and management system"""
    
    def __init__(self):
        self.memory_service = MemoryService()
        # Precompile simple regexes used for heuristics
        self._re_preference = re.compile(r"\bI\s+(?:like|love|enjoy|prefer)\b", re.IGNORECASE)
        self._re_slash_cmd = re.compile(r"^\s*/[a-zA-Z]", re.IGNORECASE)
        self._re_explicit_remember = re.compile(
            r"\b(please\s+)?remember(\s+this|\s+that|\s+it)?\b",
            re.IGNORECASE,
        )
        self._meta_prompts = (
            "summarize", "explain", "what do you know about me", "what do you remember about me"
        )

    def _should_skip_message_capture(self, content: str) -> bool:
        """Skip auto-capturing noisy messages (commands/meta prompts)."""
        if not content:
            return True
        text = content.strip().lower()
        if not text:
            return True
        # Slash-style commands
        if self._re_slash_cmd.match(text):
            return True
        # Meta prompts without explicit self-info
        if any(m in text for m in self._meta_prompts):
            if not any(p in text for p in ("my ", "i am", "i have", "i like", "i enjoy", "i prefer")):
                return True
        return False

    def _looks_like_preference(self, content: str) -> bool:
        """Detect simple first-person preference statements to avoid duplicate message memories."""
        if not content:
            return False
        return bool(self._re_preference.search(content))
    
    def _has_explicit_remember_intent(self, content: str) -> bool:
        if not content:
            return False
        return bool(self._re_explicit_remember.search(content))
        
    def calculate_auto_importance(self, content: str, context: Dict[str, Any]) -> float:
        """
        Calculate importance score automatically based on content analysis
        Returns 0.0-1.0 where 1.0 is most important
        """
        if not content or not content.strip():
            return 0.0
            
        importance = 0.0
        content_lower = content.lower()
        
        # Content type scoring
        content_type = context.get('content_type', 'message')
        type_scores = {
            'goal': 0.9,
            'preference': 0.8, 
            'profile': 0.8,
            'fact': 0.6,
            'conversation': 0.4,
            'message': 0.3
        }
        importance += type_scores.get(content_type, 0.3)
        
        # Personal relevance indicators
        personal_keywords = [
            'goal', 'want to', 'need to', 'plan to', 'my', 'i am', 'i have',
            'prefer', 'like', 'dislike', 'always', 'never', 'usually'
        ]
        for keyword in personal_keywords:
            if keyword in content_lower:
                importance += 0.1
                
        # Actionable information
        actionable_patterns = [
            r'\d{1,2}[:/]\d{2}',  # times
            r'\d{1,2}/\d{1,2}/\d{2,4}',  # dates
            r'by\s+\w+\s+\d{1,2}',  # deadlines
        ]
        for pattern in actionable_patterns:
            if re.search(pattern, content_lower):
                importance += 0.15
                
        # Emotional significance
        emotional_keywords = [
            'excited', 'frustrated', 'proud', 'disappointed', 'motivated',
            'struggle', 'challenge', 'achievement', 'breakthrough', 'milestone'
        ]
        for keyword in emotional_keywords:
            if keyword in content_lower:
                importance += 0.1
                
        # Length and detail bonus (longer = more detailed = more important)
        if len(content) > 100:
            importance += 0.1
        if len(content) > 300:
            importance += 0.1
            
        return min(1.0, importance)
    
    def find_similar_memories(self, db: Session, user_id: str, content: str, 
                            threshold: float = 0.8) -> List[MemoryNode]:
        """Find existing memories similar to new content"""
        try:
            # Use memory service to find semantically similar memories
            existing_memories = memory_crud.get_user_memories(
                db=db, user_id=user_id, limit=50
            )
            
            # Simple similarity check based on key phrases
            content_words = set(content.lower().split())
            similar_memories = []
            
            for memory in existing_memories:
                memory_words = set(memory.content.lower().split())
                overlap = len(content_words & memory_words)
                similarity = overlap / max(len(content_words), len(memory_words), 1)
                
                if similarity >= threshold:
                    similar_memories.append(memory)
                    
            return similar_memories
            
        except Exception as e:
            logger.error(f"Error finding similar memories: {e}")
            return []
    
    def should_consolidate(self, new_content: str, existing_memory: MemoryNode) -> bool:
        """Determine if new content should be merged with existing memory"""
        # Check for update patterns
        update_indicators = [
            'now', 'current', 'latest', 'updated', 'changed', 'new'
        ]
        
        new_lower = new_content.lower()
        existing_lower = existing_memory.content.lower()
        
        # If new content has update indicators and similar topic
        has_update_indicator = any(word in new_lower for word in update_indicators)
        similar_topic = len(set(new_lower.split()) & set(existing_lower.split())) > 3
        
        return has_update_indicator and similar_topic
    
    def consolidate_memory(self, db: Session, new_content: str, existing_memory: MemoryNode) -> MemoryNode:
        """Merge new content with existing memory"""
        try:
            # Create consolidated content
            consolidated = f"{existing_memory.content}\n\nUpdate: {new_content}"
            
            # Update existing memory
            existing_memory.content = consolidated
            existing_memory.timestamp = datetime.now(timezone.utc)
            
            # Increase importance slightly for updated memories
            if existing_memory.importance_score:
                existing_memory.importance_score = min(100, existing_memory.importance_score + 5)
            
            db.commit()
            return existing_memory
            
        except Exception as e:
            logger.error(f"Error consolidating memory: {e}")
            db.rollback()
            return existing_memory
    
    def auto_capture_memory(self, db: Session, user_id: str, content: str, 
                          context: Dict[str, Any]) -> Optional[MemoryNode]:
        """
        Automatically capture memory if it meets importance threshold
        Handles consolidation with existing memories
        """
        if not settings.AUTO_MEMORY_ENABLED:
            return None
            
        try:
            # Calculate importance
            importance = self.calculate_auto_importance(content, context)
            
            if importance < settings.AUTO_IMPORTANCE_THRESHOLD:
                logger.debug(f"Content below importance threshold: {importance}")
                return None
            
            # Prepare normalized content and consolidation key irrespective of feature flag
            ct = context.get('content_type', 'message')
            # Optional gating for message-type captures
            if ct == 'message':
                # Configurable: require explicit remember intent for messages
                if getattr(settings, 'REQUIRE_EXPLICIT_REMEMBER', False):
                    if not self._has_explicit_remember_intent(content or ''):
                        return None
                # Allow global kill-switch for message auto capture
                if not getattr(settings, 'CAPTURE_MESSAGES', True):
                    return None
            norm = " ".join((content or "").strip().lower().split())
            key_src = f"{ct}|{norm}".encode('utf-8')
            consolidation_key = hashlib.sha1(key_src).hexdigest()

            # Check for similar existing memories
            if settings.AUTO_CONSOLIDATION_ENABLED:
                
                # Prefer exact-key reuse over heuristic consolidation
                try:
                    existing = memory_crud.get_by_consolidation_key(db, user_id=user_id, key=consolidation_key)
                except Exception:
                    existing = None
                if existing:
                    # If an existing node with same normalized content exists, either consolidate or reuse
                    if self.should_consolidate(content, existing):
                        return self.consolidate_memory(db, content, existing)
                    # Reinforce existing memory on repeat observations
                    if getattr(settings, 'REINFORCEMENT_ENABLED', True):
                        try:
                            import json as _json
                            md = _json.loads(existing.memory_metadata) if existing.memory_metadata else {}
                            md['reinforced_count'] = int(md.get('reinforced_count') or 0) + 1
                            memory_crud.update_content_and_metadata(db, node=existing, content=existing.content, metadata=md)
                        except Exception:
                            pass
                    return existing

                similar_memories = self.find_similar_memories(db, user_id, content)
                
                for existing in similar_memories:
                    if self.should_consolidate(content, existing):
                        logger.info(f"Consolidating memory for user {user_id}")
                        return self.consolidate_memory(db, content, existing)
            
            # Create new memory
            # Attach consolidation key into metadata
            meta = context.get('metadata', {}) or {}
            # Avoid clobbering pre-existing key
            if 'consolidation_key' not in meta:
                meta['consolidation_key'] = consolidation_key

            # Apply privacy redaction
            red_content = content
            red_meta = meta
            try:
                red_content, red_info = redact_text(content or "")
                red_meta = redact_metadata(meta)
                # attach redaction stats for audit without leaking values
                if isinstance(red_meta, dict):
                    red_meta.setdefault("redaction", {}).update({
                        "enabled": bool(getattr(settings, "PRIVACY_REDACTION_ENABLED", True)),
                        "counts": {k: int(v) for k, v in (red_info or {}).items() if k != "enabled"}
                    })
            except Exception:
                red_content = content
                red_meta = meta

            new_memory = memory_crud.create_memory_node(
                db=db,
                faiss_id=str(uuid.uuid4()),
                content=red_content,
                content_type=ct,
                user_id=user_id,
                conversation_id=(
                    str(context.get('metadata', {}).get('conversation_id'))
                    if context.get('metadata', {}).get('conversation_id') is not None
                    else None
                ),
                metadata=red_meta,
                importance_score=int(importance * 100)
            )
            logger.info(f"Auto-captured memory for user {user_id}, importance: {importance}")
            
            return new_memory
            
        except Exception as e:
            logger.error(f"Error in auto_capture_memory: {e}")
            return None
    
    def capture_from_message(self, db: Session, user_id: str, message: str, 
                           conversation_id: Optional[str] = None) -> Optional[MemoryNode]:
        """Capture memory from user message"""
        # Skip noisy messages (commands/meta prompts)
        if self._should_skip_message_capture(message):
            return None

        # If this looks like a preference, rely on the preference extractor pipeline
        # to create a dedicated preference memory, and avoid storing a redundant message memory.
        if self._looks_like_preference(message):
            return None

        context = {
            'content_type': 'message',
            'source': 'chat_message',
            'metadata': {
                'conversation_id': conversation_id,
                'captured_at': datetime.now(timezone.utc).isoformat()
            }
        }
        return self.auto_capture_memory(db, user_id, message, context)
    
    def capture_from_action(self, db: Session, user_id: str, action_name: str, 
                          action_params: Dict[str, Any], result: Dict[str, Any]) -> Optional[MemoryNode]:
        """Capture memory from action execution"""
        # Respect transient log exclusion policy
        if getattr(settings, 'EXCLUDE_TRANSIENT_LOGS', True):
            transient_actions = {
                'hydration.log_water',
                'mood.log_checkin',
                'journal.add_entry',
            }
            # Allow explicit remember override via action_params
            explicit = bool(action_params.get('remember') or action_params.get('force_capture'))
            if action_name in transient_actions and not explicit:
                return None

        # Create meaningful content from action
        content_parts = [f"Action: {action_name}"]
        
        # Extract key information from params
        # fitness/nutrition extraction removed
            
        if 'goal_description' in action_params:
            content_parts.append(f"Goal: {action_params['goal_description']}")
        
        content = ". ".join(content_parts)
        
        context = {
            'content_type': self._get_action_content_type(action_name),
            'source': f'action_{action_name}',
            'metadata': {
                'action_name': action_name,
                'action_params': action_params,
                'action_result': result,
                'captured_at': datetime.now(timezone.utc).isoformat()
            }
        }
        
        return self.auto_capture_memory(db, user_id, content, context)

    # --- Preference helpers ---
    def _create_memory_node(
        self,
        db: Session,
        *,
        user_id: str,
        content: str,
        content_type: str,
        conversation_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        importance_score: Optional[int] = None,
    ) -> Optional[MemoryNode]:
        try:
            return memory_crud.create_memory_node(
                db=db,
                faiss_id=str(uuid.uuid4()),
                content=content,
                content_type=content_type,
                user_id=user_id,
                conversation_id=conversation_id,
                metadata=metadata or {},
                importance_score=int(importance_score) if importance_score is not None else None,
            )
        except Exception as e:
            logger.error(f"Failed to create memory node: {e}")
            return None

    def store_preference(
        self,
        *,
        user_id: str,
        conversation_id: Optional[str],
        subject: str,
        context: Optional[str] = None,
        db: Session | None = None,
    ) -> Optional[MemoryNode]:
        """Create a preference memory like 'I like {subject}'.

        This is used by `_maybe_capture_preference(...)` in `conversations_utils.py`.
        When a DB session is provided, the memory is persisted immediately.
        """
        if not subject:
            return None
        content = f"I like {subject}".strip()
        meta: Dict[str, Any] = {
            "source": "chat:preference",
        }
        if context:
            meta["context_excerpt"] = (context or "")[:400]
        meta["category"] = "preference"
        # Provide a lightweight consolidation key to avoid duplicates
        try:
            norm = " ".join(content.lower().split())
        except Exception:
            norm = content
        meta.setdefault("consolidation_key", f"preference|{norm}")

        # If no DB provided, just return None (noop) to avoid breaking callers
        if db is None:
            return None
        return self._create_memory_node(
            db,
            user_id=user_id,
            content=content,
            content_type="preference",
            conversation_id=(str(conversation_id) if conversation_id is not None else None),
            metadata=meta,
            importance_score=80,
        )
    
    def _get_action_content_type(self, action_name: str) -> str:
        """Map action names to memory content types"""
        action_type_map = {
            'hydration.log_water': 'fact',
            'mood.log_checkin': 'fact',
            'journal.add_entry': 'fact'
        }
        return action_type_map.get(action_name, 'fact')
    
    def cleanup_old_memories(self, db: Session, user_id: str) -> int:
        """Background cleanup of low-importance, old memories"""
        if not settings.AUTO_LIFECYCLE_ENABLED:
            return 0
            
        try:
            # Get memories older than 30 days with low importance
            from datetime import timedelta
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
            
            old_memories = db.query(MemoryNode).filter(
                MemoryNode.user_id == user_id,
                MemoryNode.timestamp < cutoff_date,
                MemoryNode.importance_score < 30  # Low importance threshold
            ).all()
            
            deleted_count = 0
            for memory in old_memories:
                db.delete(memory)
                deleted_count += 1
            
            db.commit()
            logger.info(f"Cleaned up {deleted_count} old memories for user {user_id}")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up memories: {e}")
            db.rollback()
            return 0


# Global instance
auto_memory_service = AutoMemoryService()
