"""
Tests for conversation state management.
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from app.core.conversation_state import (
    ConversationState,
    ConversationStateManager,
    conversation_state_manager
)


class TestConversationState:
    """Test ConversationState dataclass."""

    def test_conversation_state_creation(self):
        """Test creating a conversation state."""
        state = ConversationState(
            conversation_id="conv_123",
            user_id="user_456",
            current_themes={"fitness", "health"},
            emotional_context="excited",
            last_topic="workout plans",
            ongoing_goals=["lose weight", "build muscle"],
            recent_mentions={"fitness": datetime.now(timezone.utc)},
            conversation_stage="ongoing",
            energy_level="high"
        )
        
        assert state.conversation_id == "conv_123"
        assert state.user_id == "user_456"
        assert "fitness" in state.current_themes
        assert "health" in state.current_themes
        assert state.emotional_context == "excited"
        assert state.last_topic == "workout plans"
        assert "lose weight" in state.ongoing_goals
        assert "build muscle" in state.ongoing_goals
        assert state.conversation_stage == "ongoing"
        assert state.energy_level == "high"

    def test_conversation_state_post_init_empty_collections(self):
        """Test post_init with empty collections."""
        state = ConversationState(
            conversation_id="conv_123",
            user_id="user_456",
            current_themes=set(),
            emotional_context=None,
            last_topic=None,
            ongoing_goals=[],
            recent_mentions={},
            conversation_stage="greeting",
            energy_level="medium"
        )
        
        assert isinstance(state.current_themes, set)
        assert isinstance(state.ongoing_goals, list)
        assert isinstance(state.recent_mentions, dict)

    def test_conversation_state_post_init_none_collections(self):
        """Test post_init with None collections."""
        state = ConversationState(
            conversation_id="conv_123",
            user_id="user_456",
            current_themes=None,
            emotional_context=None,
            last_topic=None,
            ongoing_goals=None,
            recent_mentions=None,
            conversation_stage="greeting",
            energy_level="medium"
        )
        
        assert isinstance(state.current_themes, set)
        assert isinstance(state.ongoing_goals, list)
        assert isinstance(state.recent_mentions, dict)


class TestConversationStateManager:
    """Test ConversationStateManager class."""

    def setup_method(self):
        """Set up fresh manager for each test."""
        self.manager = ConversationStateManager()

    def test_get_or_create_state_new(self):
        """Test creating a new conversation state."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        assert state.conversation_id == "conv_123"
        assert state.user_id == "user_456"
        assert state.current_themes == set()
        assert state.emotional_context is None
        assert state.last_topic is None
        assert state.ongoing_goals == []
        assert state.recent_mentions == {}
        assert state.conversation_stage == "greeting"
        assert state.energy_level == "medium"

    def test_get_or_create_state_existing(self):
        """Test getting an existing conversation state."""
        # Create state first
        state1 = self.manager.get_or_create_state("conv_123", "user_456")
        state1.current_themes.add("fitness")
        
        # Get the same state
        state2 = self.manager.get_or_create_state("conv_123", "user_456")
        
        assert state1 is state2
        assert "fitness" in state2.current_themes

    def test_update_themes(self):
        """Test updating conversation themes."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        new_themes = {"fitness", "nutrition"}
        
        self.manager.update_themes("conv_123", new_themes)
        
        assert "fitness" in state.current_themes
        assert "nutrition" in state.current_themes

    def test_update_themes_limit(self):
        """Test that themes are limited to 10."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        # Add more than 10 themes
        many_themes = {f"theme_{i}" for i in range(15)}
        self.manager.update_themes("conv_123", many_themes)
        
        assert len(state.current_themes) == 10

    def test_update_themes_nonexistent_conversation(self):
        """Test updating themes for nonexistent conversation."""
        # Should not raise an error
        self.manager.update_themes("nonexistent", {"fitness"})

    def test_update_emotional_context(self):
        """Test updating emotional context."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        self.manager.update_emotional_context("conv_123", "excited")
        
        assert state.emotional_context == "excited"

    def test_update_emotional_context_nonexistent_conversation(self):
        """Test updating emotional context for nonexistent conversation."""
        # Should not raise an error
        self.manager.update_emotional_context("nonexistent", "happy")

    def test_add_ongoing_goal(self):
        """Test adding an ongoing goal."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        self.manager.add_ongoing_goal("conv_123", "lose weight")
        
        assert "lose weight" in state.ongoing_goals

    def test_add_ongoing_goal_duplicate(self):
        """Test adding duplicate goals."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        self.manager.add_ongoing_goal("conv_123", "lose weight")
        self.manager.add_ongoing_goal("conv_123", "lose weight")
        
        assert state.ongoing_goals.count("lose weight") == 1

    def test_add_ongoing_goal_limit(self):
        """Test that goals are limited to 5."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        # Add more than 5 goals
        for i in range(7):
            self.manager.add_ongoing_goal("conv_123", f"goal_{i}")
        
        assert len(state.ongoing_goals) == 5
        assert "goal_2" in state.ongoing_goals  # Should keep the last 5

    def test_add_ongoing_goal_nonexistent_conversation(self):
        """Test adding goal for nonexistent conversation."""
        # Should not raise an error
        self.manager.add_ongoing_goal("nonexistent", "test goal")

    def test_mark_mention(self):
        """Test marking a topic mention."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        self.manager.mark_mention("conv_123", "fitness")
        
        assert "fitness" in state.recent_mentions
        assert isinstance(state.recent_mentions["fitness"], datetime)

    def test_mark_mention_nonexistent_conversation(self):
        """Test marking mention for nonexistent conversation."""
        # Should not raise an error
        self.manager.mark_mention("nonexistent", "test topic")

    def test_get_follow_up_opportunities_empty(self):
        """Test getting follow-up opportunities for empty state."""
        opportunities = self.manager.get_follow_up_opportunities("conv_123")
        
        assert opportunities == []

    def test_get_follow_up_opportunities_with_goals(self):
        """Test getting follow-up opportunities with goals."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        self.manager.add_ongoing_goal("conv_123", "lose weight")
        
        opportunities = self.manager.get_follow_up_opportunities("conv_123")
        
        assert len(opportunities) > 0
        assert any("lose weight" in opp for opp in opportunities)

    def test_get_follow_up_opportunities_with_themes(self):
        """Test getting follow-up opportunities with themes."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        self.manager.update_themes("conv_123", {"work", "health", "learning"})
        
        opportunities = self.manager.get_follow_up_opportunities("conv_123")
        
        assert len(opportunities) > 0
        assert any("work" in opp for opp in opportunities)
        assert any("wellness" in opp for opp in opportunities)
        assert any("learning" in opp for opp in opportunities)

    def test_get_follow_up_opportunities_limit(self):
        """Test that follow-up opportunities are limited to 3."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        self.manager.update_themes("conv_123", {"work", "health", "learning", "fitness"})
        self.manager.add_ongoing_goal("conv_123", "goal1")
        self.manager.add_ongoing_goal("conv_123", "goal2")
        
        opportunities = self.manager.get_follow_up_opportunities("conv_123")
        
        assert len(opportunities) <= 3

    def test_should_show_proactive_engagement_false(self):
        """Test proactive engagement when conditions not met."""
        result = self.manager.should_show_proactive_engagement("conv_123")
        
        assert result is False

    def test_should_show_proactive_engagement_with_goals(self):
        """Test proactive engagement with goals."""
        self.manager.add_ongoing_goal("conv_123", "lose weight")
        
        result = self.manager.should_show_proactive_engagement("conv_123")
        
        assert result is True

    def test_should_show_proactive_engagement_with_themes(self):
        """Test proactive engagement with themes."""
        self.manager.update_themes("conv_123", {"work", "health", "learning"})
        
        result = self.manager.should_show_proactive_engagement("conv_123")
        
        assert result is True

    def test_should_show_proactive_engagement_with_energy(self):
        """Test proactive engagement with high energy."""
        state = self.manager.get_or_create_state("conv_123", "user_456")
        state.energy_level = "high"
        
        result = self.manager.should_show_proactive_engagement("conv_123")
        
        assert result is True

    def test_should_show_proactive_engagement_nonexistent(self):
        """Test proactive engagement for nonexistent conversation."""
        result = self.manager.should_show_proactive_engagement("nonexistent")
        
        assert result is False

    def test_cleanup_old_states(self):
        """Test cleaning up old conversation states."""
        # Create a state
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        # Mark it as old by setting a very old mention
        old_time = datetime.now(timezone.utc) - timedelta(hours=2)
        state.recent_mentions["old_topic"] = old_time
        
        # Clean up
        self.manager.cleanup_old_states()
        
        # State should be removed
        assert "conv_123" not in self.manager._states

    def test_cleanup_old_states_recent_activity(self):
        """Test that recent states are not cleaned up."""
        # Create a state
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        # Mark it as recent
        recent_time = datetime.now(timezone.utc) - timedelta(minutes=30)
        state.recent_mentions["recent_topic"] = recent_time
        
        # Clean up
        self.manager.cleanup_old_states()
        
        # State should remain
        assert "conv_123" in self.manager._states

    def test_cleanup_old_states_no_mentions(self):
        """Test cleanup of states with no mentions."""
        # Create a state
        state = self.manager.get_or_create_state("conv_123", "user_456")
        
        # Clean up
        self.manager.cleanup_old_states()
        
        # State should be removed (no mentions = very old)
        assert "conv_123" not in self.manager._states


class TestGlobalConversationStateManager:
    """Test the global conversation state manager instance."""

    def test_global_instance_exists(self):
        """Test that the global instance exists."""
        assert conversation_state_manager is not None
        assert isinstance(conversation_state_manager, ConversationStateManager)

    def test_global_instance_singleton(self):
        """Test that the global instance is a singleton."""
        from app.core.conversation_state import conversation_state_manager as instance1
        from app.core.conversation_state import conversation_state_manager as instance2
        
        assert instance1 is instance2
