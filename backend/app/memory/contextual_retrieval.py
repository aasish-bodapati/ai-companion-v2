"""
Contextual Memory Retrieval System - Retrieves memories based on conversational context,
emotional state, and relationship dynamics for human-like responses.
"""

import logging
import time
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.memory import MemorySearchResult

logger = logging.getLogger(__name__)


class ContextualMemoryRetriever:
    """Retrieves memories using contextual intelligence for human-like conversations."""
    
    def __init__(self):
        self.conversation_themes = {
            'fitness': ['workout', 'exercise', 'gym', 'run', 'training', 'fitness', 'health', 'strength'],
            'nutrition': ['food', 'eat', 'meal', 'nutrition', 'diet', 'cooking', 'recipe', 'calories'],
            'work': ['work', 'job', 'project', 'meeting', 'career', 'office', 'boss', 'colleague'],
            'relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'dating', 'marriage'],
            'travel': ['travel', 'trip', 'vacation', 'visit', 'flight', 'hotel', 'destination'],
            'hobbies': ['hobby', 'interest', 'passion', 'creative', 'art', 'music', 'reading', 'gaming'],
            'goals': ['goal', 'plan', 'achieve', 'target', 'objective', 'aspiration', 'dream'],
            'health': ['health', 'doctor', 'medical', 'wellness', 'sick', 'medicine', 'therapy'],
            'learning': ['learn', 'study', 'course', 'education', 'skill', 'knowledge', 'practice'],
            'emotions': ['feel', 'emotion', 'mood', 'happy', 'sad', 'excited', 'worried', 'stressed']
        }
    
    def get_contextual_memories(
        self,
        memory_service,
        db: Session,
        user_id: str,
        current_message: str,
        conversation_history: List[Dict],
        emotional_context: Dict[str, Any],
        limit: int = 8
    ) -> List[MemorySearchResult]:
        """
        Retrieve memories using contextual intelligence for natural conversation flow.
        """
        # Analyze conversation context
        conversation_context = self._analyze_conversation_context(
            current_message, conversation_history
        )
        
        # Build contextual query
        contextual_query = self._build_contextual_query(
            current_message, conversation_context, emotional_context
        )
        
        # Get base memories using enhanced query
        base_memories = memory_service.search_memories(
            db=db,
            query=contextual_query,
            user_id=user_id,
            content_types=None,
            limit=limit * 3,  # Get more for intelligent filtering
            min_relevance=0.2,  # Lower threshold for more options
        )
        
        # Apply contextual scoring and filtering
        contextual_memories = self._apply_contextual_scoring(
            base_memories, conversation_context, emotional_context, current_message
        )
        
        # Select best memories for human-like response
        selected_memories = self._select_optimal_memories(
            contextual_memories, conversation_context, emotional_context, limit
        )
        
        return selected_memories
    
    def _analyze_conversation_context(
        self, current_message: str, conversation_history: List[Dict]
    ) -> Dict[str, Any]:
        """Analyze the broader conversation context."""
        context = {
            'current_themes': set(),
            'conversation_depth': 'surface',
            'topic_progression': [],
            'emotional_journey': [],
            'relationship_building': False,
            'continuation_signals': [],
            'time_context': None
        }
        
        # Analyze current message themes
        current_lower = current_message.lower()
        for theme, keywords in self.conversation_themes.items():
            if any(keyword in current_lower for keyword in keywords):
                context['current_themes'].add(theme)
        
        # Analyze conversation history for depth and progression
        if conversation_history:
            recent_messages = conversation_history[-5:]  # Last 5 messages
            
            # Track topic progression
            for msg in recent_messages:
                msg_content = msg.get('content', '').lower()
                for theme, keywords in self.conversation_themes.items():
                    if any(keyword in msg_content for keyword in keywords):
                        if theme not in context['topic_progression']:
                            context['topic_progression'].append(theme)
            
            # Determine conversation depth
            total_length = sum(len(msg.get('content', '')) for msg in recent_messages)
            if total_length > 500:
                context['conversation_depth'] = 'deep'
            elif total_length > 200:
                context['conversation_depth'] = 'medium'
            
            # Check for relationship building signals
            relationship_signals = ['tell me about', 'what do you think', 'how do you feel', 'share with me']
            if any(signal in current_lower for signal in relationship_signals):
                context['relationship_building'] = True
        
        # Detect continuation signals
        continuation_words = ['also', 'and', 'but', 'however', 'speaking of', 'by the way', 'oh and']
        context['continuation_signals'] = [word for word in continuation_words if word in current_lower]
        
        # Time context
        time_words = ['today', 'yesterday', 'tomorrow', 'this week', 'last week', 'recently']
        for word in time_words:
            if word in current_lower:
                context['time_context'] = word
                break
        
        return context
    
    def _build_contextual_query(
        self, current_message: str, conversation_context: Dict, emotional_context: Dict
    ) -> str:
        """Build an enhanced query that captures conversational context."""
        query_parts = [current_message]
        
        # Add theme-based context
        if conversation_context['current_themes']:
            theme_keywords = []
            for theme in conversation_context['current_themes']:
                theme_keywords.extend(self.conversation_themes[theme][:3])  # Top 3 keywords per theme
            query_parts.append(' '.join(theme_keywords))
        
        # Add emotional context
        emotional_state = emotional_context.get('emotional_state', 'neutral')
        if emotional_state != 'neutral':
            query_parts.append(f"emotional context: {emotional_state}")
        
        # Add temporal context
        time_context = conversation_context.get('time_context')
        if time_context:
            query_parts.append(f"time reference: {time_context}")
        
        return ' '.join(query_parts)
    
    def _apply_contextual_scoring(
        self,
        memories: List[MemorySearchResult],
        conversation_context: Dict,
        emotional_context: Dict,
        current_message: str
    ) -> List[Tuple[MemorySearchResult, float]]:
        """Apply contextual scoring to memories for better relevance."""
        scored_memories = []
        
        for memory in memories:
            base_score = memory.relevance_score or 0.0
            contextual_score = base_score
            
            # Theme relevance boost
            memory_content = (memory.content or '').lower()
            theme_matches = 0
            for theme in conversation_context['current_themes']:
                if any(keyword in memory_content for keyword in self.conversation_themes[theme]):
                    theme_matches += 1
            contextual_score += theme_matches * 0.3
            
            # Emotional context matching
            emotional_state = emotional_context.get('emotional_state', 'neutral')
            if self._memory_matches_emotional_context(memory, emotional_state):
                contextual_score += 0.25
            
            # Conversation depth boost
            if conversation_context['conversation_depth'] == 'deep':
                # Boost personal and detailed memories for deep conversations
                if any(word in memory_content for word in ['personal', 'important', 'goal', 'dream', 'feel']):
                    contextual_score += 0.2
            
            # Temporal relevance
            if self._memory_has_temporal_relevance(memory, conversation_context):
                contextual_score += 0.15
            
            # Relationship building boost
            if conversation_context['relationship_building']:
                if any(word in memory_content for word in ['prefer', 'like', 'love', 'enjoy', 'value']):
                    contextual_score += 0.2
            
            # Continuation signal boost
            if conversation_context['continuation_signals']:
                # Boost memories that can naturally continue the conversation
                contextual_score += 0.1
            
            # Recency boost for recent memories
            if memory.timestamp:
                days_old = (datetime.now(timezone.utc) - memory.timestamp).days
                if days_old <= 1:
                    contextual_score += 0.2
                elif days_old <= 7:
                    contextual_score += 0.1
            
            scored_memories.append((memory, contextual_score))
        
        return scored_memories
    
    def _memory_matches_emotional_context(self, memory: MemorySearchResult, emotional_state: str) -> bool:
        """Check if memory matches current emotional context."""
        if not memory.memory_metadata:
            return False
        
        try:
            import json
            metadata = json.loads(memory.memory_metadata) if isinstance(memory.memory_metadata, str) else memory.memory_metadata
            
            # Check stored emotional state
            memory_emotional_state = metadata.get('emotional_state')
            if memory_emotional_state == emotional_state:
                return True
            
            # Check emotional compatibility
            compatible_emotions = {
                'excited': ['happy', 'proud', 'determined'],
                'happy': ['excited', 'grateful', 'proud'],
                'sad': ['disappointed', 'tired'],
                'anxious': ['worried', 'confused'],
                'frustrated': ['angry', 'tired'],
                'proud': ['excited', 'happy', 'determined'],
                'grateful': ['happy', 'proud'],
                'determined': ['excited', 'proud']
            }
            
            if emotional_state in compatible_emotions:
                return memory_emotional_state in compatible_emotions[emotional_state]
            
        except Exception:
            pass
        
        return False
    
    def _memory_has_temporal_relevance(self, memory: MemorySearchResult, conversation_context: Dict) -> bool:
        """Check if memory has temporal relevance to current conversation."""
        time_context = conversation_context.get('time_context')
        if not time_context:
            return False
        
        memory_content = (memory.content or '').lower()
        
        # Direct time reference matches
        if time_context in memory_content:
            return True
        
        # Contextual time matches
        time_mappings = {
            'today': ['today', 'now', 'currently'],
            'yesterday': ['yesterday', 'last night'],
            'tomorrow': ['tomorrow', 'next'],
            'this week': ['this week', 'recently', 'lately'],
            'last week': ['last week', 'previously']
        }
        
        if time_context in time_mappings:
            return any(term in memory_content for term in time_mappings[time_context])
        
        return False
    
    def _select_optimal_memories(
        self,
        scored_memories: List[Tuple[MemorySearchResult, float]],
        conversation_context: Dict,
        emotional_context: Dict,
        limit: int
    ) -> List[MemorySearchResult]:
        """Select optimal memories for human-like conversation flow."""
        # Sort by contextual score
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        
        selected = []
        used_content = set()
        
        # Ensure diversity in memory types
        memory_type_counts = {}
        max_per_type = max(1, limit // 3)
        
        for memory, score in scored_memories:
            if len(selected) >= limit:
                break
            
            # Avoid duplicate content
            content_key = (memory.content or '').strip().lower()
            if content_key in used_content or not content_key:
                continue
            
            # Ensure memory type diversity
            memory_type = memory.content_type or 'general'
            type_count = memory_type_counts.get(memory_type, 0)
            
            # Allow more preference/profile memories for personalization
            if memory_type in ['preference', 'profile']:
                max_allowed = max_per_type + 1
            else:
                max_allowed = max_per_type
            
            if type_count >= max_allowed:
                continue
            
            selected.append(memory)
            used_content.add(content_key)
            memory_type_counts[memory_type] = type_count + 1
        
        return selected
    
    def enhance_memory_for_context(
        self, memory: MemorySearchResult, conversation_context: Dict, emotional_context: Dict
    ) -> str:
        """Enhance memory presentation with contextual rationale for natural integration."""
        base_content = memory.content or ''
        
        # Add contextual rationale based on why this memory is relevant
        rationale_parts = []
        
        # Theme relevance
        memory_content_lower = base_content.lower()
        matching_themes = []
        for theme in conversation_context['current_themes']:
            if any(keyword in memory_content_lower for keyword in self.conversation_themes[theme]):
                matching_themes.append(theme)
        
        if matching_themes:
            rationale_parts.append(f"[Relevant to your {', '.join(matching_themes)} discussion]")
        
        # Emotional relevance
        emotional_state = emotional_context.get('emotional_state', 'neutral')
        if self._memory_matches_emotional_context(memory, emotional_state):
            rationale_parts.append(f"[Connects to your current {emotional_state} mood]")
        
        # Temporal relevance
        if self._memory_has_temporal_relevance(memory, conversation_context):
            time_context = conversation_context.get('time_context', 'recent')
            rationale_parts.append(f"[From {time_context} - still relevant]")
        
        # Relationship building
        if conversation_context['relationship_building']:
            if any(word in memory_content_lower for word in ['prefer', 'like', 'love', 'enjoy']):
                rationale_parts.append("[Personal preference to keep in mind]")
        
        # Combine content with rationale
        if rationale_parts:
            return f"{base_content} {' '.join(rationale_parts)}"
        else:
            return base_content


# Global instance
contextual_retriever = ContextualMemoryRetriever()
