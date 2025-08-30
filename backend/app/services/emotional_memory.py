"""
Emotional Memory Service
Stores and manages emotional context, patterns, and continuity across conversations.
This enables the AI to maintain emotional awareness and provide consistent emotional support.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)


class EmotionType(Enum):
    """Types of emotions we track."""
    EXCITED = "excited"
    STRESSED = "stressed"
    CALM = "calm"
    FRUSTRATED = "frustrated"
    SAD = "sad"
    GRATEFUL = "grateful"
    CONFUSED = "confused"
    NEUTRAL = "neutral"


@dataclass
class EmotionalMemory:
    """Represents a stored emotional memory."""
    emotion: str
    intensity: float
    timestamp: datetime
    context: str
    triggers: List[str]
    conversation_id: str
    user_id: str
    duration_minutes: Optional[int] = None
    resolution: Optional[str] = None  # How the emotion was resolved


@dataclass
class EmotionalPattern:
    """Represents a pattern in emotional responses."""
    pattern_type: str  # "daily", "weekly", "triggered", "situational"
    emotion: str
    frequency: int
    average_intensity: float
    common_triggers: List[str]
    time_of_day: Optional[str] = None
    day_of_week: Optional[str] = None
    context_keywords: List[str] = None


class EmotionalMemoryService:
    """
    Manages emotional memories and patterns to provide emotional continuity
    and support across conversations.
    """
    
    def __init__(self, memory_service=None):
        self.memory_service = memory_service
        self.emotional_memories: Dict[str, List[EmotionalMemory]] = {}  # user_id -> memories
        self.emotional_patterns: Dict[str, List[EmotionalPattern]] = {}  # user_id -> patterns
        
        # Emotional support strategies
        self.emotional_support_strategies = {
            "stressed": [
                "acknowledge_overwhelm",
                "offer_breakdown",
                "suggest_prioritization",
                "validate_feelings"
            ],
            "frustrated": [
                "acknowledge_frustration",
                "offer_perspective",
                "suggest_alternatives",
                "validate_emotion"
            ],
            "sad": [
                "show_empathy",
                "offer_comfort",
                "suggest_self_care",
                "validate_sadness"
            ],
            "excited": [
                "match_enthusiasm",
                "celebrate_achievement",
                "encourage_momentum",
                "share_joy"
            ],
            "grateful": [
                "acknowledge_gratitude",
                "reflect_positivity",
                "encourage_appreciation",
                "share_appreciation"
            ]
        }
    
    async def store_emotional_memory(self, 
                                   user_id: str, 
                                   emotion: str, 
                                   intensity: float, 
                                   context: str,
                                   triggers: List[str],
                                   conversation_id: str) -> None:
        """Store an emotional memory for the user."""
        
        emotional_memory = EmotionalMemory(
            emotion=emotion,
            intensity=intensity,
            timestamp=datetime.now(timezone.utc),
            context=context,
            triggers=triggers,
            conversation_id=conversation_id,
            user_id=user_id
        )
        
        if user_id not in self.emotional_memories:
            self.emotional_memories[user_id] = []
        
        self.emotional_memories[user_id].append(emotional_memory)
        
        # Keep only last 100 emotional memories per user
        if len(self.emotional_memories[user_id]) > 100:
            self.emotional_memories[user_id] = self.emotional_memories[user_id][-100:]
        
        # Update emotional patterns
        await self._update_emotional_patterns(user_id)
        
        logger.info(f"Stored emotional memory for user {user_id}: {emotion} (intensity: {intensity})")
    
    async def get_recent_emotional_context(self, user_id: str, hours: int = 24) -> List[EmotionalMemory]:
        """Get recent emotional memories for context."""
        if user_id not in self.emotional_memories:
            return []
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_memories = [
            memory for memory in self.emotional_memories[user_id]
            if memory.timestamp >= cutoff_time
        ]
        
        return recent_memories
    
    async def get_emotional_patterns(self, user_id: str) -> List[EmotionalPattern]:
        """Get emotional patterns for the user."""
        if user_id not in self.emotional_patterns:
            return []
        
        return self.emotional_patterns[user_id]
    
    async def get_emotional_support_strategy(self, emotion: str, intensity: float) -> List[str]:
        """Get appropriate emotional support strategies for the emotion."""
        strategies = self.emotional_support_strategies.get(emotion, [])
        
        # Adjust strategies based on intensity
        if intensity > 0.7:
            # High intensity - focus on immediate support
            return strategies[:2]
        elif intensity > 0.4:
            # Medium intensity - balanced support
            return strategies[:3]
        else:
            # Low intensity - light support
            return strategies[:1]
    
    async def get_emotional_continuity_context(self, user_id: str) -> Dict[str, Any]:
        """Get emotional continuity context for the user."""
        recent_memories = await self.get_recent_emotional_context(user_id, hours=48)
        patterns = await self.get_emotional_patterns(user_id)
        
        if not recent_memories:
            return {"has_emotional_history": False}
        
        # Analyze recent emotional state
        recent_emotions = [m.emotion for m in recent_memories[-5:]]
        recent_intensities = [m.intensity for m in recent_memories[-5:]]
        
        # Find most common recent emotion
        emotion_counts = {}
        for emotion in recent_emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral"
        average_intensity = sum(recent_intensities) / len(recent_intensities) if recent_intensities else 0.0
        
        # Check for emotional patterns
        current_patterns = [p for p in patterns if p.emotion == dominant_emotion]
        
        return {
            "has_emotional_history": True,
            "dominant_emotion": dominant_emotion,
            "average_intensity": average_intensity,
            "recent_emotions": recent_emotions,
            "emotional_patterns": [asdict(p) for p in current_patterns],
            "needs_emotional_support": average_intensity > 0.5 and dominant_emotion in ["stressed", "frustrated", "sad"],
            "emotional_stability": self._calculate_emotional_stability(recent_emotions),
            "support_strategies": await self.get_emotional_support_strategy(dominant_emotion, average_intensity)
        }
    
    async def resolve_emotional_memory(self, 
                                     user_id: str, 
                                     conversation_id: str, 
                                     resolution: str) -> None:
        """Mark an emotional memory as resolved."""
        if user_id not in self.emotional_memories:
            return
        
        # Find the most recent unresolved memory for this conversation
        for memory in reversed(self.emotional_memories[user_id]):
            if (memory.conversation_id == conversation_id and 
                memory.resolution is None):
                memory.resolution = resolution
                memory.duration_minutes = int((datetime.now(timezone.utc) - memory.timestamp).total_seconds() / 60)
                break
    
    def _calculate_emotional_stability(self, recent_emotions: List[str]) -> float:
        """Calculate emotional stability based on recent emotions."""
        if len(recent_emotions) < 2:
            return 1.0
        
        # Count emotion changes
        changes = 0
        for i in range(1, len(recent_emotions)):
            if recent_emotions[i] != recent_emotions[i-1]:
                changes += 1
        
        # Stability is inverse of change frequency
        stability = 1.0 - (changes / (len(recent_emotions) - 1))
        return max(0.0, min(1.0, stability))
    
    async def _update_emotional_patterns(self, user_id: str) -> None:
        """Update emotional patterns based on recent memories."""
        if user_id not in self.emotional_memories:
            return
        
        memories = self.emotional_memories[user_id]
        if len(memories) < 5:
            return
        
        # Group memories by emotion
        emotion_groups = {}
        for memory in memories:
            if memory.emotion not in emotion_groups:
                emotion_groups[memory.emotion] = []
            emotion_groups[memory.emotion].append(memory)
        
        patterns = []
        
        for emotion, emotion_memories in emotion_groups.items():
            if len(emotion_memories) < 2:
                continue
            
            # Calculate frequency
            frequency = len(emotion_memories)
            
            # Calculate average intensity
            average_intensity = sum(m.intensity for m in emotion_memories) / len(emotion_memories)
            
            # Find common triggers
            all_triggers = []
            for memory in emotion_memories:
                all_triggers.extend(memory.triggers)
            
            trigger_counts = {}
            for trigger in all_triggers:
                trigger_counts[trigger] = trigger_counts.get(trigger, 0) + 1
            
            common_triggers = [trigger for trigger, count in trigger_counts.items() if count > 1]
            
            # Analyze time patterns
            time_of_day = self._analyze_time_pattern(emotion_memories)
            day_of_week = self._analyze_day_pattern(emotion_memories)
            
            # Extract context keywords
            context_keywords = self._extract_context_keywords(emotion_memories)
            
            pattern = EmotionalPattern(
                pattern_type="frequent" if frequency > 5 else "occasional",
                emotion=emotion,
                frequency=frequency,
                average_intensity=average_intensity,
                common_triggers=common_triggers,
                time_of_day=time_of_day,
                day_of_week=day_of_week,
                context_keywords=context_keywords
            )
            
            patterns.append(pattern)
        
        self.emotional_patterns[user_id] = patterns
    
    def _analyze_time_pattern(self, memories: List[EmotionalMemory]) -> Optional[str]:
        """Analyze if there's a time pattern in the memories."""
        if len(memories) < 3:
            return None
        
        hours = [memory.timestamp.hour for memory in memories]
        hour_counts = {}
        for hour in hours:
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        # Find most common hour
        most_common_hour = max(hour_counts.items(), key=lambda x: x[1])[0]
        most_common_count = hour_counts[most_common_hour]
        
        # If more than 50% of memories are at the same hour, it's a pattern
        if most_common_count / len(memories) > 0.5:
            if 6 <= most_common_hour < 12:
                return "morning"
            elif 12 <= most_common_hour < 17:
                return "afternoon"
            elif 17 <= most_common_hour < 21:
                return "evening"
            else:
                return "night"
        
        return None
    
    def _analyze_day_pattern(self, memories: List[EmotionalMemory]) -> Optional[str]:
        """Analyze if there's a day pattern in the memories."""
        if len(memories) < 3:
            return None
        
        days = [memory.timestamp.strftime("%A") for memory in memories]
        day_counts = {}
        for day in days:
            day_counts[day] = day_counts.get(day, 0) + 1
        
        # Find most common day
        most_common_day = max(day_counts.items(), key=lambda x: x[1])[0]
        most_common_count = day_counts[most_common_day]
        
        # If more than 40% of memories are on the same day, it's a pattern
        if most_common_count / len(memories) > 0.4:
            return most_common_day.lower()
        
        return None
    
    def _extract_context_keywords(self, memories: List[EmotionalMemory]) -> List[str]:
        """Extract common keywords from memory contexts."""
        all_contexts = " ".join([memory.context for memory in memories])
        
        # Simple keyword extraction (in a real implementation, you'd use NLP)
        words = all_contexts.lower().split()
        word_counts = {}
        
        for word in words:
            if len(word) > 3:  # Only consider words longer than 3 characters
                word_counts[word] = word_counts.get(word, 0) + 1
        
        # Return most common words
        common_words = [word for word, count in word_counts.items() if count > 1]
        return common_words[:5]  # Top 5 keywords


# Global instance
emotional_memory_service = EmotionalMemoryService()
