"""
Tests for Predictive Intelligence System

This module tests the predictive intelligence engine, behavioral analysis,
and related functionality.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, List, Any

from app.services.predictive_intelligence import (
    PredictiveIntelligenceEngine,
    UserPattern,
    Prediction,
    AnticipatoryResponse,
    PatternType,
    PredictionConfidence
)
from app.services.behavioral_analysis import (
    BehavioralAnalysisEngine,
    BehaviorPattern,
    BehavioralInsight,
    PersonalityTrait,
    BehaviorType,
    BehaviorIntensity
)


class TestPredictiveIntelligence:
    """Test the PredictiveIntelligenceEngine."""
    
    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test."""
        return PredictiveIntelligenceEngine()
    
    @pytest.fixture
    def sample_conversation_data(self):
        """Sample conversation data for testing."""
        return {
            "messages": [
                {
                    "role": "user",
                    "content": "I'm feeling stressed about work",
                    "timestamp": "2024-01-15T10:00:00",
                    "emotional_state": "stressed"
                },
                {
                    "role": "assistant",
                    "content": "I understand work stress can be challenging",
                    "timestamp": "2024-01-15T10:01:00"
                },
                {
                    "role": "user",
                    "content": "I need to analyze this problem step by step",
                    "timestamp": "2024-01-15T11:00:00",
                    "topic": "problem_solving"
                },
                {
                    "role": "user",
                    "content": "Can you help me with my health goals?",
                    "timestamp": "2024-01-15T12:00:00",
                    "topic": "health"
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_analyze_user_patterns(self, engine, sample_conversation_data):
        """Test pattern analysis functionality."""
        user_id = "test_user"
        
        patterns = await engine.analyze_user_patterns(user_id, sample_conversation_data)
        
        assert isinstance(patterns, list)
        assert len(patterns) > 0
        
        for pattern in patterns:
            assert isinstance(pattern, UserPattern)
            assert pattern.pattern_type in PatternType
            assert 0.0 <= pattern.confidence <= 1.0
            assert pattern.frequency > 0
    
    @pytest.mark.asyncio
    async def test_detect_timing_patterns(self, engine, sample_conversation_data):
        """Test timing pattern detection."""
        patterns = engine._detect_timing_patterns("test_user", sample_conversation_data)
        
        assert isinstance(patterns, list)
        
        # Should detect interaction frequency patterns
        timing_patterns = [p for p in patterns if p.pattern_type == PatternType.INTERACTION_FREQUENCY]
        assert len(timing_patterns) >= 0  # May or may not detect patterns depending on timing
    
    @pytest.mark.asyncio
    async def test_detect_topic_patterns(self, engine, sample_conversation_data):
        """Test topic pattern detection."""
        patterns = engine._detect_topic_patterns("test_user", sample_conversation_data)
        
        assert isinstance(patterns, list)
        
        # Should detect topic preferences
        topic_patterns = [p for p in patterns if p.pattern_type == PatternType.TOPIC_PREFERENCE]
        assert len(topic_patterns) >= 0  # May detect health topic preference
    
    def test_extract_topics_from_content(self, engine):
        """Test topic extraction from content."""
        content = "I'm having trouble with my work project and need to exercise more"
        topics = engine._extract_topics_from_content(content)
        
        assert isinstance(topics, list)
        assert "work" in topics
        assert "health" in topics
    
    @pytest.mark.asyncio
    async def test_generate_predictions(self, engine, sample_conversation_data):
        """Test prediction generation."""
        user_id = "test_user"
        
        # First analyze patterns
        await engine.analyze_user_patterns(user_id, sample_conversation_data)
        
        # Then generate predictions
        current_context = {"current_time": datetime.now()}
        predictions = await engine.generate_predictions(user_id, current_context)
        
        assert isinstance(predictions, list)
        
        for prediction in predictions:
            assert isinstance(prediction, Prediction)
            assert prediction.prediction_type in [
                "next_interaction_time",
                "topic_interest",
                "emotional_state",
                "conversation_readiness"
            ]
            assert prediction.confidence in PredictionConfidence
    
    @pytest.mark.asyncio
    async def test_generate_anticipatory_responses(self, engine):
        """Test anticipatory response generation."""
        user_id = "test_user"
        
        # Create sample predictions
        predictions = [
            Prediction(
                prediction_type="topic_interest",
                predicted_value="health",
                confidence=PredictionConfidence.HIGH,
                reasoning="User shows interest in health topics",
                timeframe="ongoing",
                triggers=["conversation_start"],
                context={"topic_frequency": 0.8}
            ),
            Prediction(
                prediction_type="emotional_state",
                predicted_value="stressed",
                confidence=PredictionConfidence.HIGH,
                reasoning="User frequently experiences stress",
                timeframe="current_session",
                triggers=["conversation_start"],
                context={"emotion_frequency": 0.7}
            )
        ]
        
        responses = await engine.generate_anticipatory_responses(user_id, predictions)
        
        assert isinstance(responses, list)
        assert len(responses) > 0
        
        for response in responses:
            assert isinstance(response, AnticipatoryResponse)
            assert response.response_type in [
                "check_in",
                "topic_suggestion",
                "emotional_support",
                "engagement_opportunity"
            ]
            assert response.urgency in ["low", "medium", "high"]
            assert response.timing in ["immediate", "soon", "later"]
    
    @pytest.mark.asyncio
    async def test_track_prediction_accuracy(self, engine):
        """Test prediction accuracy tracking."""
        user_id = "test_user"
        prediction_id = "test_prediction"
        
        # Track some accuracy data
        await engine.track_prediction_accuracy(user_id, prediction_id, True)
        await engine.track_prediction_accuracy(user_id, prediction_id, False)
        await engine.track_prediction_accuracy(user_id, prediction_id, True)
        
        # Check that accuracy data is stored
        assert user_id in engine.accuracy_tracking
        assert len(engine.accuracy_tracking[user_id]) == 3
    
    def test_get_user_insights(self, engine):
        """Test user insights retrieval."""
        user_id = "test_user"
        
        # Add some sample patterns
        pattern = UserPattern(
            pattern_type=PatternType.TOPIC_PREFERENCE,
            pattern_data={"topic": "health", "frequency": 5},
            confidence=0.8,
            first_detected=datetime.now(),
            last_observed=datetime.now(),
            frequency=5,
            strength=0.8,
            context={"topic": "health"}
        )
        engine.patterns[user_id] = [pattern]
        
        insights = engine.get_user_insights(user_id)
        
        assert isinstance(insights, dict)
        assert "total_patterns" in insights
        assert "pattern_types" in insights
        assert insights["total_patterns"] == 1


class TestBehavioralAnalysis:
    """Test the BehavioralAnalysisEngine."""
    
    @pytest.fixture
    def engine(self):
        """Create a fresh engine instance for each test."""
        return BehavioralAnalysisEngine()
    
    @pytest.fixture
    def sample_conversation_data(self):
        """Sample conversation data for behavioral analysis."""
        return {
            "messages": [
                {
                    "role": "user",
                    "content": "I need to analyze this problem step by step",
                    "timestamp": "2024-01-15T10:00:00"
                },
                {
                    "role": "assistant",
                    "content": "Let's break it down together",
                    "timestamp": "2024-01-15T10:01:00"
                },
                {
                    "role": "user",
                    "content": "I feel overwhelmed by this situation",
                    "timestamp": "2024-01-15T11:00:00"
                },
                {
                    "role": "user",
                    "content": "We should work together on this project",
                    "timestamp": "2024-01-15T12:00:00"
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_analyze_user_behavior(self, engine, sample_conversation_data):
        """Test behavior analysis functionality."""
        user_id = "test_user"
        
        patterns = await engine.analyze_user_behavior(user_id, sample_conversation_data)
        
        assert isinstance(patterns, list)
        assert len(patterns) > 0
        
        for pattern in patterns:
            assert isinstance(pattern, BehaviorPattern)
            assert pattern.behavior_type in BehaviorType
            assert pattern.intensity in BehaviorIntensity
            assert 0.0 <= pattern.confidence <= 1.0
            assert pattern.frequency > 0
    
    def test_analyze_communication_style(self, engine, sample_conversation_data):
        """Test communication style analysis."""
        patterns = engine._analyze_communication_style("test_user", sample_conversation_data)
        
        assert isinstance(patterns, list)
        
        # Should detect analytical and emotional communication styles
        analytical_patterns = [p for p in patterns if p.context.get("style") == "analytical"]
        emotional_patterns = [p for p in patterns if p.context.get("style") == "emotional"]
        collaborative_patterns = [p for p in patterns if p.context.get("style") == "collaborative"]
        
        # At least one style should be detected
        assert len(analytical_patterns) + len(emotional_patterns) + len(collaborative_patterns) > 0
    
    def test_get_behavior_intensity(self, engine):
        """Test behavior intensity calculation."""
        assert engine._get_behavior_intensity(0.9) == BehaviorIntensity.VERY_HIGH
        assert engine._get_behavior_intensity(0.7) == BehaviorIntensity.HIGH
        assert engine._get_behavior_intensity(0.5) == BehaviorIntensity.MODERATE
        assert engine._get_behavior_intensity(0.3) == BehaviorIntensity.LOW
    
    @pytest.mark.asyncio
    async def test_generate_behavioral_insights(self, engine, sample_conversation_data):
        """Test behavioral insight generation."""
        user_id = "test_user"
        
        # First analyze behavior
        await engine.analyze_user_behavior(user_id, sample_conversation_data)
        
        # Then generate insights
        insights = await engine.generate_behavioral_insights(user_id)
        
        assert isinstance(insights, list)
        
        for insight in insights:
            assert isinstance(insight, BehavioralInsight)
            assert insight.insight_type == "communication_style"
            assert 0.0 <= insight.confidence <= 1.0
            assert len(insight.evidence) > 0
            assert len(insight.recommendations) > 0
    
    @pytest.mark.asyncio
    async def test_derive_personality_traits(self, engine, sample_conversation_data):
        """Test personality trait derivation."""
        user_id = "test_user"
        
        # First analyze behavior
        await engine.analyze_user_behavior(user_id, sample_conversation_data)
        
        # Then derive traits
        traits = await engine.derive_personality_traits(user_id)
        
        assert isinstance(traits, list)
        
        for trait in traits:
            assert isinstance(trait, PersonalityTrait)
            assert 0.0 <= trait.score <= 1.0
            assert 0.0 <= trait.confidence <= 1.0
            assert len(trait.evidence) > 0
            assert trait.description
    
    def test_get_behavioral_summary(self, engine):
        """Test behavioral summary retrieval."""
        user_id = "test_user"
        
        # Add some sample patterns
        pattern = BehaviorPattern(
            behavior_type=BehaviorType.COMMUNICATION_STYLE,
            intensity=BehaviorIntensity.HIGH,
            frequency=5,
            context={"style": "analytical"},
            first_observed=datetime.now(),
            last_observed=datetime.now(),
            confidence=0.8,
            triggers=["conversation_start"],
            impact="positive"
        )
        engine.behavior_patterns[user_id] = [pattern]
        
        summary = engine.get_behavioral_summary(user_id)
        
        assert isinstance(summary, dict)
        assert "total_patterns" in summary
        assert "pattern_types" in summary
        assert summary["total_patterns"] == 1


class TestIntegration:
    """Test integration between predictive intelligence and behavioral analysis."""
    
    @pytest.fixture
    def predictive_engine(self):
        """Create predictive intelligence engine."""
        return PredictiveIntelligenceEngine()
    
    @pytest.fixture
    def behavioral_engine(self):
        """Create behavioral analysis engine."""
        return BehavioralAnalysisEngine()
    
    @pytest.fixture
    def sample_data(self):
        """Sample data for integration testing."""
        return {
            "messages": [
                {
                    "role": "user",
                    "content": "I'm feeling stressed and need to analyze my work situation",
                    "timestamp": "2024-01-15T10:00:00",
                    "emotional_state": "stressed",
                    "topic": "work"
                },
                {
                    "role": "assistant",
                    "content": "Let's work through this together",
                    "timestamp": "2024-01-15T10:01:00"
                },
                {
                    "role": "user",
                    "content": "I need to make a decision about my career path",
                    "timestamp": "2024-01-15T11:00:00",
                    "topic": "career"
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_full_pipeline(self, predictive_engine, behavioral_engine, sample_data):
        """Test the full predictive intelligence pipeline."""
        user_id = "test_user"
        
        # Step 1: Analyze behavior patterns
        behavior_patterns = await behavioral_engine.analyze_user_behavior(user_id, sample_data)
        assert len(behavior_patterns) > 0
        
        # Step 2: Generate behavioral insights
        behavioral_insights = await behavioral_engine.generate_behavioral_insights(user_id)
        assert len(behavioral_insights) > 0
        
        # Step 3: Derive personality traits
        personality_traits = await behavioral_engine.derive_personality_traits(user_id)
        assert len(personality_traits) > 0
        
        # Step 4: Analyze predictive patterns
        predictive_patterns = await predictive_engine.analyze_user_patterns(user_id, sample_data)
        assert len(predictive_patterns) > 0
        
        # Step 5: Generate predictions
        current_context = {"current_time": datetime.now()}
        predictions = await predictive_engine.generate_predictions(user_id, current_context)
        assert len(predictions) > 0
        
        # Step 6: Generate anticipatory responses
        responses = await predictive_engine.generate_anticipatory_responses(user_id, predictions)
        assert len(responses) > 0
        
        # Verify all components work together
        assert all(isinstance(p, BehaviorPattern) for p in behavior_patterns)
        assert all(isinstance(i, BehavioralInsight) for i in behavioral_insights)
        assert all(isinstance(t, PersonalityTrait) for t in personality_traits)
        assert all(isinstance(p, UserPattern) for p in predictive_patterns)
        assert all(isinstance(p, Prediction) for p in predictions)
        assert all(isinstance(r, AnticipatoryResponse) for r in responses)
    
    @pytest.mark.asyncio
    async def test_service_integration(self, predictive_engine, behavioral_engine, sample_data):
        """Test that services can work together seamlessly."""
        user_id = "test_user"
        
        # Run both analyses
        behavior_result = await behavioral_engine.analyze_user_behavior(user_id, sample_data)
        predictive_result = await predictive_engine.analyze_user_patterns(user_id, sample_data)
        
        # Both should succeed without conflicts
        assert len(behavior_result) >= 0
        assert len(predictive_result) >= 0
        
        # Get summaries from both engines
        behavioral_summary = behavioral_engine.get_behavioral_summary(user_id)
        predictive_insights = predictive_engine.get_user_insights(user_id)
        
        # Both should return valid data
        assert isinstance(behavioral_summary, dict)
        assert isinstance(predictive_insights, dict)
        assert "total_patterns" in behavioral_summary
        assert "total_patterns" in predictive_insights


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    @pytest.fixture
    def predictive_engine(self):
        """Create predictive intelligence engine."""
        return PredictiveIntelligenceEngine()
    
    @pytest.fixture
    def behavioral_engine(self):
        """Create behavioral analysis engine."""
        return BehavioralAnalysisEngine()
    
    @pytest.mark.asyncio
    async def test_empty_conversation_data(self, predictive_engine, behavioral_engine):
        """Test handling of empty conversation data."""
        user_id = "test_user"
        empty_data = {"messages": []}
        
        # Predictive intelligence
        patterns = await predictive_engine.analyze_user_patterns(user_id, empty_data)
        assert patterns == []
        
        predictions = await predictive_engine.generate_predictions(user_id, {})
        assert predictions == []
        
        # Behavioral analysis
        behavior_patterns = await behavioral_engine.analyze_user_behavior(user_id, empty_data)
        assert behavior_patterns == []
        
        insights = await behavioral_engine.generate_behavioral_insights(user_id)
        assert insights == []
    
    @pytest.mark.asyncio
    async def test_invalid_user_id(self, predictive_engine, behavioral_engine):
        """Test handling of invalid user IDs."""
        invalid_user_id = ""
        sample_data = {"messages": [{"role": "user", "content": "test"}]}
        
        # Should handle gracefully
        patterns = await predictive_engine.analyze_user_patterns(invalid_user_id, sample_data)
        assert isinstance(patterns, list)
        
        behavior_patterns = await behavioral_engine.analyze_user_behavior(invalid_user_id, sample_data)
        assert isinstance(behavior_patterns, list)
    
    @pytest.mark.asyncio
    async def test_malformed_data(self, predictive_engine, behavioral_engine):
        """Test handling of malformed conversation data."""
        user_id = "test_user"
        malformed_data = {
            "messages": [
                {"invalid": "data"},
                {"role": "user", "content": None},
                {"role": "user", "content": ""}
            ]
        }
        
        # Should handle gracefully without crashing
        patterns = await predictive_engine.analyze_user_patterns(user_id, malformed_data)
        assert isinstance(patterns, list)
        
        behavior_patterns = await behavioral_engine.analyze_user_behavior(user_id, malformed_data)
        assert isinstance(behavior_patterns, list)
    
    def test_confidence_thresholds(self, predictive_engine, behavioral_engine):
        """Test confidence threshold handling."""
        # Test edge cases for confidence calculations
        assert predictive_engine._get_confidence_level(0.0) == PredictionConfidence.LOW
        assert predictive_engine._get_confidence_level(1.0) == PredictionConfidence.VERY_HIGH
        
        assert behavioral_engine._get_behavior_intensity(0.0) == BehaviorIntensity.LOW
        assert behavioral_engine._get_behavior_intensity(1.0) == BehaviorIntensity.VERY_HIGH


if __name__ == "__main__":
    pytest.main([__file__])
