"""
Tests for Authentic Human-Like Behaviors System

This module tests the authentic behaviors engine and related functionality.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from typing import Dict, List, Any

from app.services.authentic_behaviors import (
    AuthenticBehaviorsEngine,
    AuthenticBehavior,
    BehaviorType
)


class TestAuthenticBehaviors:
    """Test the AuthenticBehaviorsEngine."""

    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test."""
        return AuthenticBehaviorsEngine()

    @pytest.fixture
    def sample_conversation_data(self):
        """Sample conversation data for testing."""
        return {
            "messages": [
                {
                    "role": "user",
                    "content": "Hey, how are you doing today?",
                    "timestamp": "2024-01-15T10:00:00"
                },
                {
                    "role": "assistant",
                    "content": "I'm doing well, thank you for asking!",
                    "timestamp": "2024-01-15T10:01:00"
                },
                {
                    "role": "user",
                    "content": "That's awesome! I'm feeling really excited about my new project",
                    "timestamp": "2024-01-15T10:02:00"
                }
            ]
        }

    @pytest.fixture
    def sample_user_personality(self):
        """Sample user personality data."""
        return {
            "extroversion": 0.8,
            "openness": 0.7,
            "conscientiousness": 0.6,
            "agreeableness": 0.8,
            "neuroticism": 0.3
        }

    @pytest.fixture
    def sample_emotional_context(self):
        """Sample emotional context data."""
        return {
            "primary_emotion": "excited",
            "intensity": 0.8,
            "secondary_emotion": "happy",
            "confidence": 0.9
        }

    @pytest.mark.asyncio
    async def test_analyze_conversation_for_behaviors(self, engine, sample_conversation_data, sample_user_personality, sample_emotional_context):
        """Test behavior analysis functionality."""
        user_message = "Hey, how are you doing today?"
        conversation_history = sample_conversation_data["messages"]

        behaviors = await engine.analyze_conversation_for_behaviors(
            user_message, conversation_history, sample_user_personality, sample_emotional_context
        )

        assert isinstance(behaviors, list)
        assert len(behaviors) <= 2  # Should be limited to 2 behaviors

        for behavior in behaviors:
            assert isinstance(behavior, AuthenticBehavior)
            assert behavior.behavior_type in BehaviorType
            assert 0.0 <= behavior.confidence <= 1.0
            assert isinstance(behavior.content, str)
            assert isinstance(behavior.context, dict)

    def test_should_add_quirk(self, engine, sample_emotional_context):
        """Test quirk addition logic."""
        # Test casual message
        casual_message = "Hey, what's up?"
        assert engine._should_add_quirk(casual_message, sample_emotional_context) == True

        # Test formal message
        formal_message = "Please provide detailed information about the project requirements."
        assert engine._should_add_quirk(formal_message, sample_emotional_context) == True  # Due to emotional context

        # Test neutral message with different emotional context
        neutral_context = {"primary_emotion": "neutral", "intensity": 0.3}
        neutral_message = "What is the weather like?"
        result = engine._should_add_quirk(neutral_message, neutral_context)
        assert isinstance(result, bool)

    def test_should_add_speech_pattern(self, engine, sample_emotional_context):
        """Test speech pattern addition logic."""
        # Test conversational message
        conversational_message = "How do I solve this problem?"
        assert engine._should_add_speech_pattern(conversational_message, sample_emotional_context) == True

        # Test emotional message
        emotional_context = {"primary_emotion": "sad", "intensity": 0.8}
        emotional_message = "I'm feeling really down today"
        assert engine._should_add_speech_pattern(emotional_message, emotional_context) == True

        # Test neutral message
        neutral_message = "The sky is blue"
        result = engine._should_add_speech_pattern(neutral_message, sample_emotional_context)
        assert isinstance(result, bool)

    def test_should_add_humor(self, engine, sample_emotional_context):
        """Test humor addition logic."""
        # Test positive message
        positive_message = "This is so much fun!"
        assert engine._should_add_humor(positive_message, sample_emotional_context) == True

        # Test casual message
        casual_message = "That's really cool"
        assert engine._should_add_humor(casual_message, sample_emotional_context) == True

        # Test negative message
        negative_context = {"primary_emotion": "sad", "intensity": 0.7}
        negative_message = "I'm feeling terrible"
        assert engine._should_add_humor(negative_message, negative_context) == False

    @pytest.mark.asyncio
    async def test_apply_authentic_behaviors(self, engine):
        """Test behavior application functionality."""
        base_response = "I understand your question and I'm happy to help you with that."
        
        behaviors = [
            AuthenticBehavior(
                behavior_type=BehaviorType.CONVERSATIONAL_QUIRK,
                content="you know",
                confidence=0.8,
                context={"type": "filler_word"}
            ),
            AuthenticBehavior(
                behavior_type=BehaviorType.HUMOR_STYLE,
                content="That's really exciting!",
                confidence=0.6,
                context={"type": "contextual_humor"}
            )
        ]

        user_id = "test_user"
        enhanced_response = await engine.apply_authentic_behaviors(base_response, behaviors, user_id)

        assert isinstance(enhanced_response, str)
        assert len(enhanced_response) > len(base_response)  # Should be enhanced
        assert "you know" in enhanced_response or "That's really exciting!" in enhanced_response

    def test_apply_single_behavior_quirk(self, engine):
        """Test applying a single conversational quirk."""
        base_response = "I can help you with that question."
        
        behavior = AuthenticBehavior(
            behavior_type=BehaviorType.CONVERSATIONAL_QUIRK,
            content="you know",
            confidence=0.8,
            context={"type": "filler_word"}
        )

        enhanced_response = engine._apply_single_behavior(base_response, behavior)
        
        assert isinstance(enhanced_response, str)
        assert "you know" in enhanced_response

    def test_apply_single_behavior_speech_pattern(self, engine):
        """Test applying a single speech pattern."""
        base_response = "I am happy to help you with that question."
        
        behavior = AuthenticBehavior(
            behavior_type=BehaviorType.SPEECH_PATTERN,
            content="I'm",
            confidence=0.7,
            context={"type": "natural_speech"}
        )

        enhanced_response = engine._apply_single_behavior(base_response, behavior)
        
        assert isinstance(enhanced_response, str)
        assert "I'm" in enhanced_response
        assert "I am" not in enhanced_response  # Should be replaced

    def test_apply_single_behavior_humor(self, engine):
        """Test applying a single humor style."""
        base_response = "That's a great question."
        
        behavior = AuthenticBehavior(
            behavior_type=BehaviorType.HUMOR_STYLE,
            content="That's really exciting!",
            confidence=0.6,
            context={"type": "contextual_humor"}
        )

        enhanced_response = engine._apply_single_behavior(base_response, behavior)
        
        assert isinstance(enhanced_response, str)
        assert "That's really exciting!" in enhanced_response

    def test_get_behavior_summary(self, engine):
        """Test behavior summary retrieval."""
        user_id = "test_user"
        
        # Add some test data
        engine.behavior_frequency[user_id]["conversational_quirk"] = 5
        engine.behavior_frequency[user_id]["humor_style"] = 3

        summary = engine.get_behavior_summary(user_id)

        assert isinstance(summary, dict)
        assert "total_behaviors" in summary
        assert "behavior_distribution" in summary
        assert "most_used_behavior" in summary
        assert summary["total_behaviors"] == 8
        assert summary["behavior_distribution"]["conversational_quirk"] == 5
        assert summary["most_used_behavior"] == ("conversational_quirk", 5)

    def test_get_behavior_summary_empty(self, engine):
        """Test behavior summary for user with no behaviors."""
        user_id = "new_user"
        summary = engine.get_behavior_summary(user_id)

        assert isinstance(summary, dict)
        assert summary["total_behaviors"] == 0
        assert summary["most_used_behavior"] is None

    @pytest.mark.asyncio
    async def test_full_pipeline(self, engine, sample_conversation_data, sample_user_personality, sample_emotional_context):
        """Test the full authentic behaviors pipeline."""
        user_message = "Hey, this is really cool!"
        conversation_history = sample_conversation_data["messages"]
        user_id = "test_user"

        # Step 1: Analyze for behaviors
        behaviors = await engine.analyze_conversation_for_behaviors(
            user_message, conversation_history, sample_user_personality, sample_emotional_context
        )

        # Step 2: Apply behaviors to a base response
        base_response = "I'm glad you think so! How can I help you today?"
        enhanced_response = await engine.apply_authentic_behaviors(base_response, behaviors, user_id)

        # Step 3: Get behavior summary
        summary = engine.get_behavior_summary(user_id)

        # Verify all steps work together
        assert isinstance(behaviors, list)
        assert isinstance(enhanced_response, str)
        assert isinstance(summary, dict)
        assert len(enhanced_response) >= len(base_response)

    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling in the engine."""
        # Test with invalid data
        invalid_message = None
        invalid_history = None
        invalid_personality = None
        invalid_context = None

        # Should handle gracefully
        behaviors = await engine.analyze_conversation_for_behaviors(
            invalid_message, invalid_history, invalid_personality, invalid_context
        )
        assert isinstance(behaviors, list)

        # Test behavior application with invalid data
        enhanced_response = await engine.apply_authentic_behaviors("", [], "test_user")
        assert isinstance(enhanced_response, str)

    def test_behavior_frequency_tracking(self, engine):
        """Test that behavior frequency is properly tracked."""
        user_id = "test_user"
        
        # Simulate applying behaviors
        behaviors = [
            AuthenticBehavior(
                behavior_type=BehaviorType.CONVERSATIONAL_QUIRK,
                content="test",
                confidence=0.8,
                context={}
            )
        ]

        # Apply behaviors multiple times
        asyncio.run(engine.apply_authentic_behaviors("test", behaviors, user_id))
        asyncio.run(engine.apply_authentic_behaviors("test", behaviors, user_id))

        # Check frequency tracking
        summary = engine.get_behavior_summary(user_id)
        assert summary["behavior_distribution"]["conversational_quirk"] == 2


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.fixture
    def engine(self):
        """Create authentic behaviors engine."""
        return AuthenticBehaviorsEngine()

    @pytest.mark.asyncio
    async def test_empty_conversation_data(self, engine):
        """Test handling of empty conversation data."""
        user_message = ""
        conversation_history = []
        user_personality = {}
        emotional_context = {}

        behaviors = await engine.analyze_conversation_for_behaviors(
            user_message, conversation_history, user_personality, emotional_context
        )

        assert isinstance(behaviors, list)
        assert len(behaviors) == 0

    @pytest.mark.asyncio
    async def test_invalid_user_id(self, engine):
        """Test handling of invalid user IDs."""
        invalid_user_id = ""
        base_response = "test"
        behaviors = []

        enhanced_response = await engine.apply_authentic_behaviors(base_response, behaviors, invalid_user_id)
        assert isinstance(enhanced_response, str)

    def test_behavior_confidence_thresholds(self, engine):
        """Test behavior confidence threshold handling."""
        # Test with low confidence behavior
        low_confidence_behavior = AuthenticBehavior(
            behavior_type=BehaviorType.CONVERSATIONAL_QUIRK,
            content="test",
            confidence=0.3,  # Below threshold
            context={}
        )

        # Should not apply low confidence behaviors
        result = engine._apply_single_behavior("test", low_confidence_behavior)
        assert result == "test"  # Should remain unchanged

    def test_random_behavior_selection(self, engine):
        """Test that behavior selection includes randomness."""
        # Test multiple calls to see if different behaviors are selected
        user_message = "Hey there!"
        emotional_context = {"primary_emotion": "happy", "intensity": 0.8}

        results = []
        for _ in range(10):
            result = engine._should_add_quirk(user_message, emotional_context)
            results.append(result)

        # Should have some variation (not all True or all False)
        assert len(set(results)) > 1


if __name__ == "__main__":
    pytest.main([__file__])
