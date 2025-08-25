from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ConversationState:
    """Track conversation state for better continuity and natural flow."""
    
    conversation_id: str
    user_id: str
    current_themes: Set[str]
    emotional_context: Optional[str]
    last_topic: Optional[str]
    ongoing_goals: List[str]
    recent_mentions: Dict[str, datetime]
    conversation_stage: str  # "greeting", "ongoing", "wrapping_up"
    energy_level: str  # "high", "medium", "low"
    
    def __post_init__(self):
        if not self.current_themes:
            self.current_themes = set()
        if not self.ongoing_goals:
            self.ongoing_goals = []
        if not self.recent_mentions:
            self.recent_mentions = {}


class ConversationStateManager:
    """Manages conversation state for human-like interactions."""
    
    def __init__(self):
        self._states: Dict[str, ConversationState] = {}
        self._state_ttl_seconds = 3600  # 1 hour
    
    def get_or_create_state(self, conversation_id: str, user_id: str) -> ConversationState:
        """Get existing conversation state or create new one."""
        if conversation_id not in self._states:
            self._states[conversation_id] = ConversationState(
                conversation_id=conversation_id,
                user_id=user_id,
                current_themes=set(),
                emotional_context=None,
                last_topic=None,
                ongoing_goals=[],
                recent_mentions={},
                conversation_stage="greeting",
                energy_level="medium"
            )
        return self._states[conversation_id]
    
    def update_themes(self, conversation_id: str, new_themes: Set[str]):
        """Update conversation themes based on recent messages."""
        if conversation_id in self._states:
            state = self._states[conversation_id]
            state.current_themes.update(new_themes)
            # Keep only recent themes (last 10)
            if len(state.current_themes) > 10:
                # Convert to list, sort by recency, keep top 10
                themes_list = list(state.current_themes)
                state.current_themes = set(themes_list[-10:])
    
    def update_emotional_context(self, conversation_id: str, emotion: str):
        """Update emotional context from user messages."""
        if conversation_id in self._states:
            self._states[conversation_id].emotional_context = emotion
    
    def add_ongoing_goal(self, conversation_id: str, goal: str):
        """Add an ongoing goal mentioned by the user."""
        if conversation_id in self._states:
            state = self._states[conversation_id]
            if goal not in state.ongoing_goals:
                state.ongoing_goals.append(goal)
                # Keep only recent goals (last 5)
                if len(state.ongoing_goals) > 5:
                    state.ongoing_goals = state.ongoing_goals[-5:]
    
    def mark_mention(self, conversation_id: str, topic: str):
        """Mark when a topic was mentioned for follow-up opportunities."""
        if conversation_id in self._states:
            self._states[conversation_id].recent_mentions[topic] = datetime.now(timezone.utc)
    
    def get_follow_up_opportunities(self, conversation_id: str) -> List[str]:
        """Get potential follow-up topics based on conversation state."""
        if conversation_id not in self._states:
            return []
        
        state = self._states[conversation_id]
        opportunities = []
        
        # Check for goals that haven't been mentioned recently
        now = datetime.now(timezone.utc)
        for goal in state.ongoing_goals:
            if goal not in state.recent_mentions or \
               (now - state.recent_mentions[goal]).total_seconds() > 86400:  # 24 hours
                opportunities.append(f"How's your progress with {goal}?")
        
        # Theme-based follow-ups
        if "fitness" in state.current_themes:
            opportunities.append("How was your last workout?")
        if "nutrition" in state.current_themes:
            opportunities.append("How's your nutrition plan going?")
        if "work" in state.current_themes:
            opportunities.append("How are things at work?")
        
        return opportunities[:3]  # Limit to top 3
    
    def should_show_proactive_engagement(self, conversation_id: str) -> bool:
        """Determine if we should show proactive engagement based on conversation state."""
        if conversation_id not in self._states:
            return False
        
        state = self._states[conversation_id]
        
        # Show proactive engagement if:
        # 1. We have ongoing goals
        # 2. Conversation has established themes
        # 3. User seems engaged (medium/high energy)
        return (
            len(state.ongoing_goals) > 0 or
            len(state.current_themes) > 2 or
            state.energy_level in ["medium", "high"]
        )
    
    def cleanup_old_states(self):
        """Remove old conversation states to prevent memory leaks."""
        now = datetime.now(timezone.utc)
        to_remove = []
        
        for conv_id, state in self._states.items():
            # Remove states older than TTL
            last_activity = max(state.recent_mentions.values()) if state.recent_mentions else datetime.min.replace(tzinfo=timezone.utc)
            if (now - last_activity).total_seconds() > self._state_ttl_seconds:
                to_remove.append(conv_id)
        
        for conv_id in to_remove:
            del self._states[conv_id]


# Global instance
conversation_state_manager = ConversationStateManager()
