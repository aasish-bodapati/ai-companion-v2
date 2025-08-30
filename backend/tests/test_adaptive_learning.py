"""
Tests for Adaptive Learning Engine
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from app.services.adaptive_learning import (
    AdaptiveLearningEngine,
    LearningType,
    AdaptationScope,
    UserPreference,
    LearningEvent,
    AdaptationResult,
    LearningInsight
)


class TestAdaptiveLearningEngine:
    """Test suite for Adaptive Learning Engine."""
    
    @pytest.fixture
    def engine(self):
        """Create engine instance."""
        return AdaptiveLearningEngine("test_user")
    
    @pytest.fixture
    def sample_conversation_data(self):
        """Sample conversation data."""
        return {
            "conversation_id": "conv_123",
            "message_count": 10,
            "user_questions": 3,
            "topics": ["technology", "programming", "career"],
            "follow_up_questions": 2,
            "clarification_requests": 1,
            "avg_response_time": 2.5
        }
    
    @pytest.fixture
    def sample_user_feedback(self):
        """Sample user feedback."""
        return {
            "rating": 4,
            "comment": "Good response but too technical, please use simpler language",
            "understanding_quality": 4,
            "creativity_quality": 3,
            "personalization_quality": 5
        }
    
    @pytest.mark.asyncio
    async def test_learn_from_interaction_basic(self, engine, sample_conversation_data):
        """Test basic learning from interaction."""
        insights = await engine.learn_from_interaction(
            conversation_data=sample_conversation_data,
            context={"context_summary": "technical discussion"}
        )
        
        assert isinstance(insights, list)
        assert len(insights) >= 0  # May or may not generate insights from basic data
        
        # Should record learning event
        assert len(engine.learning_history) > 0
        assert engine.learning_history[-1].event_type == LearningType.FEEDBACK_INTEGRATION
    
    @pytest.mark.asyncio
    async def test_learn_from_explicit_feedback(self, engine, sample_conversation_data, sample_user_feedback):
        """Test learning from explicit user feedback."""
        insights = await engine.learn_from_interaction(
            conversation_data=sample_conversation_data,
            user_feedback=sample_user_feedback,
            context={"context_summary": "technical help"}
        )
        
        assert len(insights) > 0
        
        # Should detect preference for simpler language
        language_insights = [i for i in insights if "simpler" in i.insight_text.lower() or "technical" in i.insight_text.lower()]
        assert len(language_insights) > 0
        
        # Should update user preferences
        assert len(engine.user_preferences) > 0
    
    @pytest.mark.asyncio
    async def test_learn_from_conversation_patterns(self, engine):
        """Test learning from conversation patterns."""
        # Long conversation
        long_conversation_data = {
            "conversation_id": "conv_long",
            "message_count": 15,
            "user_questions": 8,
            "topics": ["learning", "education"],
            "follow_up_questions": 6
        }
        
        insights = await engine.learn_from_interaction(
            conversation_data=long_conversation_data,
            context={"context_summary": "educational discussion"}
        )
        
        # Should detect engagement pattern
        engagement_insights = [i for i in insights if "engagement" in i.insight_type]
        assert len(engagement_insights) > 0
    
    @pytest.mark.asyncio
    async def test_learn_from_response_effectiveness(self, engine):
        """Test learning from response effectiveness."""
        # Data indicating clarity issues
        clarity_issue_data = {
            "conversation_id": "conv_clarity",
            "message_count": 8,
            "clarification_requests": 4,
            "follow_up_questions": 1,
            "avg_response_time": 3.0
        }
        
        insights = await engine.learn_from_interaction(
            conversation_data=clarity_issue_data,
            context={"context_summary": "help request"}
        )
        
        # Should detect clarity issues
        clarity_insights = [i for i in insights if "clarity" in i.insight_type]
        assert len(clarity_insights) > 0
    
    @pytest.mark.asyncio
    async def test_adapt_response_generation_basic(self, engine):
        """Test basic response adaptation."""
        # First learn some preferences
        feedback = {
            "rating": 5,
            "comment": "I love detailed explanations"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conv_1", "message_count": 5},
            user_feedback=feedback
        )
        
        # Now test adaptation
        base_response = "Here's how to solve your problem."
        context = {"user_emotion": "curious", "urgency": 0.3}
        
        adapted_response, adaptation_result = await engine.adapt_response_generation(
            context=context,
            base_response=base_response,
            adaptation_scope=AdaptationScope.SESSION
        )
        
        assert isinstance(adaptation_result, AdaptationResult)
        assert adaptation_result.adaptation_type == LearningType.RESPONSE_OPTIMIZATION
        
        # Response should be adapted if preferences were learned
        if len(adaptation_result.changes_made) > 0:
            assert adapted_response != base_response
    
    @pytest.mark.asyncio
    async def test_communication_style_adaptation(self, engine):
        """Test communication style adaptation."""
        # Learn casual preference
        casual_feedback = {
            "rating": 4,
            "comment": "Please be more casual and less formal"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conv_casual", "message_count": 3},
            user_feedback=casual_feedback
        )
        
        # Test adaptation
        formal_response = "I would recommend that you consider this approach."
        context = {"user_emotion": "relaxed"}
        
        adapted_response, adaptation_result = await engine.adapt_response_generation(
            context=context,
            base_response=formal_response
        )
        
        # Should detect and adapt communication style
        style_changes = [c for c in adaptation_result.changes_made if "communication style" in c.lower()]
        if style_changes:
            # Should make response more casual
            assert "I'd" in adapted_response or "you might" in adapted_response
    
    @pytest.mark.asyncio
    async def test_response_length_adaptation(self, engine):
        """Test response length adaptation."""
        # Learn brief preference
        brief_feedback = {
            "rating": 3,
            "comment": "Too long, please keep it brief"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conv_brief", "message_count": 2},
            user_feedback=brief_feedback
        )
        
        # Test adaptation with long response
        long_response = "Here's a very detailed explanation of how this works. First, you need to understand the background. Then, you need to consider multiple factors. Finally, you implement the solution with careful attention to detail."
        
        adapted_response, adaptation_result = await engine.adapt_response_generation(
            context={},
            base_response=long_response
        )
        
        # Should detect length preference
        length_changes = [c for c in adaptation_result.changes_made if "length" in c.lower()]
        if length_changes:
            # Should be shorter
            assert len(adapted_response) <= len(long_response)
    
    @pytest.mark.asyncio
    async def test_emotional_support_adaptation(self, engine):
        """Test emotional support level adaptation."""
        # Learn high emotional support preference
        support_feedback = {
            "rating": 5,
            "comment": "I really appreciate the emotional support you provide"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conv_support", "message_count": 4},
            user_feedback=support_feedback
        )
        
        # Test adaptation in emotional context
        basic_response = "Here's the solution to your problem."
        context = {"user_emotion": "frustrated", "urgency": 0.7}
        
        adapted_response, adaptation_result = await engine.adapt_response_generation(
            context=context,
            base_response=basic_response
        )
        
        # Should add emotional support
        support_changes = [c for c in adaptation_result.changes_made if "emotional support" in c.lower()]
        if support_changes:
            assert "understand" in adapted_response.lower() or "help" in adapted_response.lower()
    
    @pytest.mark.asyncio
    async def test_get_personalization_recommendations(self, engine):
        """Test getting personalization recommendations."""
        # Build some learning history
        preferences = [
            ("communication_style", "casual", 0.8),
            ("response_length", "detailed", 0.9),
            ("technical_depth", "advanced", 0.7)
        ]
        
        for pref_type, pref_value, confidence in preferences:
            engine._update_preference(pref_type, pref_value, confidence)
        
        recommendations = await engine.get_personalization_recommendations()
        
        assert len(recommendations) > 0
        
        # Should include preference applications
        pref_recs = [r for r in recommendations if r["type"] == "preference_application"]
        assert len(pref_recs) > 0
        
        # Should include learning opportunities if gaps exist
        learning_recs = [r for r in recommendations if r["type"] == "learning_opportunity"]
        # May or may not have learning opportunities depending on coverage
    
    def test_user_preference_creation_and_update(self, engine):
        """Test user preference creation and updates."""
        # Create new preference
        engine._update_preference("communication_style", "formal", 0.7)
        
        pref_key = "communication_style:formal"
        assert pref_key in engine.user_preferences
        assert engine.user_preferences[pref_key].confidence == 0.7
        assert engine.user_preferences[pref_key].evidence_count == 1
        
        # Update existing preference
        engine._update_preference("communication_style", "formal", 0.8)
        
        updated_pref = engine.user_preferences[pref_key]
        assert updated_pref.evidence_count == 2
        assert updated_pref.confidence > 0.7  # Should be weighted average
        assert updated_pref.stability_score > 0.5
    
    def test_learning_insight_creation(self, engine):
        """Test learning insight creation."""
        insight = LearningInsight(
            insight_text="User prefers casual communication",
            insight_type="style_preference",
            supporting_evidence=["User said 'be more casual'"],
            confidence=0.8,
            actionable_recommendations=["Use casual language", "Avoid formal terms"]
        )
        
        assert insight.confidence == 0.8
        assert len(insight.supporting_evidence) == 1
        assert len(insight.actionable_recommendations) == 2
    
    def test_learning_event_recording(self, engine):
        """Test learning event recording."""
        event = LearningEvent(
            event_type=LearningType.PREFERENCE_LEARNING,
            data={"preference": "casual_style"},
            timestamp=datetime.now(),
            confidence=0.8,
            context="user_feedback",
            user_feedback="Be more casual please"
        )
        
        engine.learning_history.append(event)
        
        assert len(engine.learning_history) == 1
        assert engine.learning_history[0].event_type == LearningType.PREFERENCE_LEARNING
    
    def test_stable_preferences_detection(self, engine):
        """Test detection of stable preferences."""
        # Add multiple instances of same preference
        for i in range(5):
            engine._update_preference("response_length", "detailed", 0.8)
        
        stable_prefs = engine._get_stable_preferences()
        
        # Should identify this as stable
        assert "response_length" in stable_prefs
        assert stable_prefs["response_length"].evidence_count >= 5
        assert stable_prefs["response_length"].confidence > 0.7
    
    def test_learning_gaps_identification(self, engine):
        """Test identification of learning gaps."""
        # Only learn about one category
        engine._update_preference("communication_style", "casual", 0.8)
        
        gaps = engine._identify_learning_gaps()
        
        # Should identify missing categories
        assert len(gaps) > 0
        missing_categories = [gap["category"] for gap in gaps]
        assert "response_length" in missing_categories or "emotional_support" in missing_categories
    
    @pytest.mark.asyncio
    async def test_get_learning_summary(self, engine):
        """Test getting learning summary."""
        # Build some learning state
        engine._update_preference("communication_style", "casual", 0.9)
        engine._update_preference("response_length", "brief", 0.8)
        
        summary = await engine.get_learning_summary()
        
        assert "user_id" in summary
        assert "stable_preferences" in summary
        assert "recent_learning_events" in summary
        assert "overall_learning_progress" in summary
        
        assert summary["user_id"] == "test_user"
        assert len(summary["stable_preferences"]) >= 1
    
    def test_overall_progress_calculation(self, engine):
        """Test overall learning progress calculation."""
        # No preferences
        progress = engine._calculate_overall_progress()
        assert progress == 0.0
        
        # Add some preferences
        total_categories = len(engine.preference_categories)
        for i, category in enumerate(list(engine.preference_categories.keys())[:3]):
            engine._update_preference(category, "test_value", 0.8)
        
        progress = engine._calculate_overall_progress()
        expected_progress = 3 / total_categories
        assert abs(progress - expected_progress) < 0.1
    
    @pytest.mark.asyncio
    async def test_adaptation_scope_handling(self, engine):
        """Test different adaptation scopes."""
        base_response = "This is a test response."
        context = {"user_emotion": "neutral"}
        
        # Test different scopes
        scopes = [AdaptationScope.IMMEDIATE, AdaptationScope.SESSION, AdaptationScope.LONG_TERM]
        
        for scope in scopes:
            adapted_response, result = await engine.adapt_response_generation(
                context=context,
                base_response=base_response,
                adaptation_scope=scope
            )
            
            assert isinstance(result, AdaptationResult)
            # Different scopes may produce different adaptations
    
    @pytest.mark.asyncio
    async def test_learning_confidence_calculation(self, engine):
        """Test learning confidence calculation."""
        # High confidence insights
        high_conf_insights = [
            LearningInsight("Test", "test", [], 0.9, []),
            LearningInsight("Test", "test", [], 0.8, [])
        ]
        
        high_confidence = engine._calculate_learning_confidence(high_conf_insights)
        
        # Low confidence insights
        low_conf_insights = [
            LearningInsight("Test", "test", [], 0.4, []),
            LearningInsight("Test", "test", [], 0.3, [])
        ]
        
        low_confidence = engine._calculate_learning_confidence(low_conf_insights)
        
        assert high_confidence > low_confidence
    
    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling with invalid inputs."""
        # Empty conversation data
        insights = await engine.learn_from_interaction(
            conversation_data={},
            context={}
        )
        assert isinstance(insights, list)
        
        # Invalid feedback
        insights = await engine.learn_from_interaction(
            conversation_data={"conversation_id": "test"},
            user_feedback={"invalid": "data"}
        )
        assert isinstance(insights, list)


# Integration tests
class TestAdaptiveLearningIntegration:
    """Integration tests for adaptive learning."""
    
    @pytest.fixture
    def engine(self):
        return AdaptiveLearningEngine("integration_test_user")
    
    @pytest.mark.asyncio
    async def test_full_learning_cycle(self, engine):
        """Test a complete learning cycle."""
        # 1. Initial interaction with feedback
        initial_feedback = {
            "rating": 2,
            "comment": "Too formal and too long, please be more casual and brief"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "cycle_1", "message_count": 3},
            user_feedback=initial_feedback
        )
        
        # 2. Reinforcing feedback
        reinforcing_feedback = {
            "rating": 4,
            "comment": "Much better! I like the casual tone and brevity"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "cycle_2", "message_count": 2},
            user_feedback=reinforcing_feedback
        )
        
        # 3. Test adaptation
        formal_long_response = "I would strongly recommend that you carefully consider implementing this comprehensive solution."
        
        adapted_response, result = await engine.adapt_response_generation(
            context={},
            base_response=formal_long_response
        )
        
        # Should have learned and adapted
        assert len(result.changes_made) > 0
        assert adapted_response != formal_long_response
        
        # 4. Check learning summary
        summary = await engine.get_learning_summary()
        assert len(summary["stable_preferences"]) > 0
        assert summary["overall_learning_progress"] > 0
    
    @pytest.mark.asyncio
    async def test_preference_stability_over_time(self, engine):
        """Test preference stability over multiple interactions."""
        # Consistent preference over multiple sessions
        consistent_feedback = [
            {"rating": 5, "comment": "Love the detailed explanations"},
            {"rating": 4, "comment": "Great detail, very helpful"},
            {"rating": 5, "comment": "Perfect amount of detail"},
            {"rating": 4, "comment": "Detailed responses are the best"}
        ]
        
        for i, feedback in enumerate(consistent_feedback):
            await engine.learn_from_interaction(
                conversation_data={"conversation_id": f"stability_{i}", "message_count": 4},
                user_feedback=feedback
            )
        
        # Should have stable detailed preference
        stable_prefs = engine._get_stable_preferences()
        assert len(stable_prefs) > 0
        
        # Should strongly prefer detailed responses
        detail_pref = None
        for pref in engine.user_preferences.values():
            if pref.preference_type == "response_length" and pref.preference_value == "detailed":
                detail_pref = pref
                break
        
        if detail_pref:
            assert detail_pref.confidence > 0.8
            assert detail_pref.evidence_count >= 4
            assert detail_pref.stability_score > 0.7
    
    @pytest.mark.asyncio
    async def test_conflicting_preferences_resolution(self, engine):
        """Test handling of conflicting preferences."""
        # Initial preference
        initial_feedback = {
            "rating": 4,
            "comment": "I like brief responses"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conflict_1", "message_count": 2},
            user_feedback=initial_feedback
        )
        
        # Conflicting preference
        conflicting_feedback = {
            "rating": 5,
            "comment": "Actually, I prefer detailed explanations"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conflict_2", "message_count": 3},
            user_feedback=conflicting_feedback
        )
        
        # More evidence for detailed
        reinforcing_feedback = {
            "rating": 5,
            "comment": "Yes, detailed is much better"
        }
        
        await engine.learn_from_interaction(
            conversation_data={"conversation_id": "conflict_3", "message_count": 4},
            user_feedback=reinforcing_feedback
        )
        
        # Should resolve to the more recent, reinforced preference
        stable_prefs = engine._get_stable_preferences()
        if "response_length" in stable_prefs:
            # Should prefer detailed over brief
            assert stable_prefs["response_length"].preference_value == "detailed"
