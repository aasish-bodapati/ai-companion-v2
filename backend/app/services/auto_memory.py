"""
Automatic Memory Service - Handles invisible memory capture and management
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import re
import logging
import uuid
import hashlib
import json
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.llm import generate_response
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
        
        # Enhanced preference detection patterns
        preference_patterns = [
            r"\bi\s+(?:like|love|enjoy|prefer)\b",
            r"\bi\s+work\s+as\s+a\b",
            r"\bi\s+work\s+at\b",
            r"\bi\s+am\s+allergic\s+to\b",
            r"\bi\s+avoid\b",
        ]
        
        content_lower = content.lower()
        return any(re.search(pattern, content_lower) for pattern in preference_patterns)
    
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
        
        # Filter out trivial messages (greetings, acknowledgments, emoji-only, very short)
        trivial_patterns = [
            r'^(hi|hello|hey|sup|yo)$',  # Simple greetings
            r'^(ok|okay|k|kk)$',  # Acknowledgments
            r'^(yes|yeah|yep|no|nope|nah)$',  # Simple yes/no
            r'^(thanks?|thx|ty|thank you)$',  # Thanks
            r'^(bye|goodbye|see ya|cya|ttyl)$',  # Goodbyes
            r'^[👍👎😊😢😂🤔💯❤️😍🙏✨🔥💪🎉👏😎🤷‍♀️🤷‍♂️]+$',  # Emoji only
            r'^[.!?]+$',  # Punctuation only
        ]
        
        # Check if message is trivial
        for pattern in trivial_patterns:
            if re.search(pattern, content_lower.strip()):
                return 0.0  # Trivial messages get 0.0 importance (will not be stored)
        
        # Additional check for very short messages (1-2 characters)
        if len(content.strip()) <= 2:
            return 0.0
        
        # Content type scoring - enhanced for better capture
        content_type = context.get('content_type', 'message')
        type_scores = {
            'goal': 0.98,
            'preference': 0.95, 
            'profile': 0.95,
            'fact': 0.85,
            'conversation': 0.6,
            'message': 0.5
        }
        importance += type_scores.get(content_type, 0.5)
        
        # Enhanced personal relevance indicators - more aggressive scoring
        personal_keywords = [
            'goal', 'want to', 'need to', 'plan to', 'my', 'i am', 'i have',
            'prefer', 'like', 'dislike', 'always', 'never', 'usually',
            'work as', 'job', 'career', 'allergic to', 'can\'t eat', 'avoid',
            'schedule', 'routine', 'habit', 'pattern', 'usually', 'typically',
            'favorite', 'best', 'worst', 'enjoy', 'hate', 'love', 'struggle with'
        ]
        for keyword in personal_keywords:
            if keyword in content_lower:
                importance += 0.25  # Increased from 0.15
                
        # Enhanced actionable information patterns
        actionable_patterns = [
            r'\d{1,2}[:/]\d{2}',  # times
            r'\d{1,2}/\d{1,2}/\d{2,4}',  # dates
            r'by\s+\w+\s+\d{1,2}',  # deadlines
            r'\d+\s+(years?|months?|weeks?|days?|hours?)',  # durations
            r'\$\d+',  # money amounts
            r'\d+\s+(pounds?|kg|miles?|km)',  # measurements
        ]
        for pattern in actionable_patterns:
            if re.search(pattern, content_lower):
                importance += 0.2
                
        # Enhanced emotional significance
        emotional_keywords = [
            'excited', 'frustrated', 'proud', 'disappointed', 'motivated',
            'struggle', 'challenge', 'achievement', 'breakthrough', 'milestone',
            'stress', 'overwhelmed', 'anxious', 'happy', 'sad', 'angry',
            'confident', 'uncertain', 'worried', 'relieved', 'exhausted'
        ]
        for keyword in emotional_keywords:
            if keyword in content_lower:
                importance += 0.15
                
        # Professional/Personal context indicators
        context_indicators = [
            'meeting', 'appointment', 'deadline', 'project', 'client',
            'family', 'friend', 'relationship', 'health', 'fitness',
            'diet', 'exercise', 'sleep', 'travel', 'vacation'
        ]
        for indicator in context_indicators:
            if indicator in content_lower:
                importance += 0.1
                
        # Length and detail bonus (longer = more detailed = more important)
        if len(content) > 100:
            importance += 0.15
        if len(content) > 300:
            importance += 0.2
            
        # Specific fact patterns that should always be captured - enhanced patterns
        fact_patterns = [
            r'i\s+(?:work|am)\s+(?:a|an)\s+\w+',  # "I work as a..."
            r'i\s+work\s+as\s+a\s+\w+',  # "I work as a software engineer"
            r'i\s+work\s+at\s+\w+',  # "I work at TechCorp"
            r'i\s+(?:am|have)\s+allergic\s+to\s+\w+',  # "I am allergic to..."
            r'i\s+(?:like|love|enjoy|prefer)\s+\w+',  # "I like..."
            r'i\s+(?:hate|dislike|avoid)\s+\w+',  # "I hate..."
            r'i\s+avoid\s+\w+',  # "I avoid loud places"
            r'my\s+(?:name|job|company|team|family)\s+is\s+\w+',  # "My job is..."
            r'i\s+prefer\s+\w+',  # "I prefer quiet restaurants"
            r'i\s+live\s+in\s+\w+',  # "I live in New York"
            r'i\s+have\s+a\s+\w+',  # "I have a dog named Max"
            r'my\s+favorite\s+\w+',  # "My favorite color is blue"
            r'i\s+enjoy\s+\w+',  # "I enjoy hiking"
            r'i\s+feel\s+\w+',  # "I feel stressed"
            r'i\s+am\s+feeling\s+\w+',  # "I am feeling overwhelmed"
        ]
        for pattern in fact_patterns:
            if re.search(pattern, content_lower):
                importance += 0.6  # Increased from 0.4 for these critical patterns
                
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
        Enhanced with more aggressive capture and better consolidation
        """
        if not settings.AUTO_MEMORY_ENABLED:
            return None
            
        try:
            # Calculate importance
            importance = self.calculate_auto_importance(content, context)
            
            # Enhanced threshold logic - be more aggressive for certain content types
            content_lower = content.lower()
            ct = context.get('content_type', 'message')
            
            # Lower effective threshold for high-value content
            effective_threshold = settings.AUTO_IMPORTANCE_THRESHOLD
            
            # Special handling for allergy information - always capture
            if any(re.search(pattern, content_lower) for pattern in [
                r'i\s+(?:am|have)\s+allergic\s+to\s+\w+',
                r'i\s+can\'t\s+eat\s+\w+',
                r'i\s+avoid\s+\w+\s+because\s+of\s+allergy',
                r'allergic\s+to\s+\w+'
            ]):
                effective_threshold = 0.01  # Extremely low threshold for allergies
                importance = max(importance, 0.98)  # Ensure very high importance
            
            # Special handling for work/professional information
            elif any(re.search(pattern, content_lower) for pattern in [
                r'i\s+work\s+(?:as|at)\s+\w+',
                r'my\s+job\s+is\s+\w+',
                r'i\s+am\s+a\s+\w+',
                r'my\s+profession\s+is\s+\w+'
            ]):
                effective_threshold = 0.02  # Extremely low threshold for work info
                importance = max(importance, 0.95)  # Ensure very high importance
            
            # Special handling for preferences
            elif any(re.search(pattern, content_lower) for pattern in [
                r'i\s+(?:like|love|enjoy|prefer)\s+\w+',
                r'i\s+(?:hate|dislike|avoid)\s+\w+',
                r'my\s+favorite\s+\w+',
                r'i\s+prefer\s+\w+'
            ]):
                effective_threshold = 0.03  # Extremely low threshold for preferences
                importance = max(importance, 0.9)  # Ensure very high importance
            
            # Special handling for personal facts
            elif any(re.search(pattern, content_lower) for pattern in [
                r'i\s+(?:live|stay)\s+in\s+\w+',
                r'i\s+(?:have|own)\s+a\s+\w+',
                r'my\s+(?:name|family|friend)\s+is\s+\w+',
                r'i\s+(?:study|learn|major)\s+in\s+\w+'
            ]):
                effective_threshold = 0.05  # Very low threshold for personal facts
                importance = max(importance, 0.85)  # Ensure high importance
            
            # Special handling for emotional states
            elif any(re.search(pattern, content_lower) for pattern in [
                r'i\s+(?:feel|am)\s+(?:stressed|overwhelmed|anxious|happy|sad|angry)',
                r'i\s+(?:am|feel)\s+(?:excited|frustrated|proud|disappointed)',
                r'i\s+(?:am|feel)\s+(?:motivated|confident|uncertain|worried)'
            ]):
                effective_threshold = 0.15  # Low threshold for emotional states
                importance = max(importance, 0.7)  # Ensure decent importance
            
            # Special handling for goals and plans
            elif any(re.search(pattern, content_lower) for pattern in [
                r'i\s+(?:want|need|plan)\s+to\s+\w+',
                r'my\s+(?:goal|plan|target|objective)\s+is\s+\w+',
                r'i\s+(?:hope|wish)\s+to\s+\w+'
            ]):
                effective_threshold = 0.1  # Very low threshold for goals
                importance = max(importance, 0.85)  # Ensure high importance
            
            # Special handling for temporal information
            elif any(re.search(pattern, content_lower) for pattern in [
                r'tomorrow', r'next\s+week', r'next\s+month', r'next\s+year',
                r'deadline', r'due\s+date', r'meeting', r'appointment',
                r'schedule', r'calendar', r'plan', r'goal'
            ]):
                effective_threshold = 0.12  # Very low threshold for temporal info
                importance = max(importance, 0.8)  # Ensure good importance
            
            # Special handling for health information
            elif any(re.search(pattern, content_lower) for pattern in [
                r'medication', r'medicine', r'doctor', r'hospital', r'emergency',
                r'health', r'medical', r'condition', r'diet', r'food', r'nutrition'
            ]):
                effective_threshold = 0.08  # Very low threshold for health info
                importance = max(importance, 0.9)  # Ensure very high importance
            
            # Special handling for relationships
            elif any(re.search(pattern, content_lower) for pattern in [
                r'wife', r'husband', r'partner', r'boyfriend', r'girlfriend',
                r'family', r'children', r'kids', r'parents', r'siblings',
                r'friend', r'friends', r'relationship'
            ]):
                effective_threshold = 0.15  # Low threshold for relationships
                importance = max(importance, 0.75)  # Ensure good importance
            
            # Special handling for locations
            elif any(re.search(pattern, content_lower) for pattern in [
                r'home', r'house', r'apartment', r'city', r'town', r'country',
                r'travel', r'trip', r'vacation', r'address', r'neighborhood'
            ]):
                effective_threshold = 0.18  # Low threshold for locations
                importance = max(importance, 0.7)  # Ensure decent importance
            
            # For all other content, use the standard threshold but be more lenient
            else:
                effective_threshold = min(settings.AUTO_IMPORTANCE_THRESHOLD * 0.8, 0.12)  # Even more aggressive
            
            # Check if importance meets threshold
            if importance >= effective_threshold:
                # Enhanced consolidation logic
                similar_memories = self.find_similar_memories(db, user_id, content, threshold=0.7)  # Lowered from 0.8
                
                if similar_memories:
                    # Consolidate with existing memory
                    existing_memory = similar_memories[0]
                    consolidated_content = self.consolidate_memories(existing_memory.content, content)
                    
                    # Update existing memory with consolidated content
                    existing_memory.content = consolidated_content
                    existing_memory.importance_score = max(existing_memory.importance_score, int(importance * 100))
                    
                    # Enhanced metadata update
                    try:
                        metadata = json.loads(existing_memory.memory_metadata) if existing_memory.memory_metadata else {}
                    except:
                        metadata = {}
                    
                    # Track consolidation events
                    if 'consolidation_count' not in metadata:
                        metadata['consolidation_count'] = 0
                    metadata['consolidation_count'] += 1
                    
                    # Track sources
                    if 'sources' not in metadata:
                        metadata['sources'] = []
                    metadata['sources'].append({
                        'content': content,
                        'timestamp': datetime.utcnow().isoformat(),
                        'context': context
                    })
                    
                    existing_memory.memory_metadata = json.dumps(metadata)
                    
                    db.commit()
                    
                    # Update FAISS index with consolidated content
                    try:
                        from app.memory.embeddings import embed_texts
                        from app.memory import faiss_store
                        
                        # Generate new embedding for consolidated content and update FAISS
                        embedding = embed_texts([consolidated_content])[0]
                        faiss_store.update_vector(user_id, existing_memory.faiss_id, embedding)
                        logger.debug(f"Updated memory {existing_memory.faiss_id} in FAISS index")
                    except Exception as e:
                        logger.error(f"Failed to update memory in FAISS index: {e}")
                    
                    logger.info(f"Consolidated memory for user {user_id}, importance: {importance}, type: {ct}")
                    return existing_memory
                else:
                    # Create new memory
                    memory = MemoryNode(
                        faiss_id=str(uuid.uuid4()),
                        user_id=user_id,
                        content=content,
                        importance_score=int(importance * 100),
                        content_type=ct,
                        memory_metadata=json.dumps({
                            'auto_captured': True,
                            'capture_timestamp': datetime.utcnow().isoformat(),
                            'context': context,
                            'sources': [{
                                'content': content,
                                'timestamp': datetime.utcnow().isoformat(),
                                'context': context
                            }]
                        })
                    )
                    
                    db.add(memory)
                    db.commit()
                    
                    # Add to FAISS index
                    try:
                        from app.memory.embeddings import embed_texts
                        from app.memory import faiss_store
                        
                        # Generate embedding and add to FAISS
                        embedding = embed_texts([content])[0]
                        faiss_store.add(user_id, [memory.faiss_id], [embedding])
                        logger.debug(f"Added memory {memory.faiss_id} to FAISS index")
                    except Exception as e:
                        logger.error(f"Failed to add memory to FAISS index: {e}")
                    
                    logger.info(f"Auto-captured memory for user {user_id}, importance: {importance}, type: {ct}")
                    return memory
            
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
    
    def consolidate_memories(self, existing_content: str, new_content: str) -> str:
        """Consolidate two memory contents into a single, more comprehensive memory"""
        try:
            # Simple consolidation: combine unique information
            existing_parts = set(existing_content.split('. '))
            new_parts = set(new_content.split('. '))
            
            # Combine all unique parts
            all_parts = existing_parts.union(new_parts)
            
            # Filter out empty parts and join
            consolidated = '. '.join([part.strip() for part in all_parts if part.strip()])
            
            # If consolidation would be too long, keep the more recent content
            if len(consolidated) > 500:
                return new_content
            
            return consolidated
            
        except Exception as e:
            logger.error(f"Error consolidating memories: {e}")
            # Fallback to keeping the newer content
            return new_content

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
