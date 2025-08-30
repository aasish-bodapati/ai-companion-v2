"""
Tests for Emotional Intelligence Implementation
Tests the enhanced emotional intelligence capabilities including sentiment analysis,
emotional memory storage, and conversational intelligence.
"""

import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import Mock, patch

from app.services.sentiment_analysis import sentiment_analyzer, SentimentResult
from app.services.emotional_memory import emotional_memory_service, EmotionalMemory, EmotionalPattern
from app.services.conversational_intelligence import (
    conversational_intelligence, 
    EmotionalState, 
    ConversationContext, 
    ResponseStyle
)


class TestSentimentAnalysis:
    """Test sentiment analysis capabilities."""
    
    def test_positive_sentiment_detection(self):
        """Test detection of positive sentiment."""
        text = "I'm so excited about this amazing opportunity!"
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "positive"
        assert result.confidence > 0.6
        assert "excited" in result.emotions
        assert result.intensity > 0.5
        assert "excited" in result.keywords
        assert "amazing" in result.keywords
    
    def test_negative_sentiment_detection(self):
        """Test detection of negative sentiment."""
        text = "I'm really frustrated and stressed about this situation."
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "negative"
        assert result.confidence > 0.6
        assert "frustrated" in result.emotions
        assert "stressed" in result.emotions
        assert result.intensity > 0.5
    
    def test_neutral_sentiment_detection(self):
        """Test detection of neutral sentiment."""
        text = "The weather is cloudy today."
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "neutral"
        assert result.confidence <= 0.6
        assert result.intensity < 0.3
    
    def test_negation_detection(self):
        """Test negation handling."""
        text = "I'm not happy about this at all."
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "negative"
        assert "happy" in result.keywords  # Should still detect the word
    
    def test_intensifier_detection(self):
        """Test intensifier handling."""
        text = "I'm extremely excited about this!"
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "positive"
        assert result.intensity > 0.6  # Should be amplified
    
    def test_diminisher_detection(self):
        """Test diminisher handling."""
        text = "I'm slightly happy about this."
        result = sentiment_analyzer.analyze_sentiment(text)
        
        assert result.sentiment == "positive"
        assert result.intensity < 0.5  # Should be reduced
    
    def test_sentiment_summary(self):
        """Test comprehensive sentiment summary."""
        text = "I'm really excited about this amazing opportunity!"
        summary = sentiment_analyzer.get_sentiment_summary(text)
        
        assert summary["sentiment"] == "positive"
        assert summary["confidence"] > 0.6
        assert "excited" in summary["emotions"]
        assert summary["has_exclamation"] == True
        assert summary["text_length"] == len(text)
        assert summary["word_count"] == len(text.split())


class TestEmotionalMemory:
    """Test emotional memory storage and retrieval."""
    
    @pytest.fixture
    def sample_user_id(self):
        return "test_user_123"
    
    @pytest.fixture
    def sample_conversation_id(self):
        return "test_conversation_456"
    
    @pytest.mark.asyncio
    async def test_store_emotional_memory(self, sample_user_id, sample_conversation_id):
        """Test storing emotional memories."""
        await emotional_memory_service.store_emotional_memory(
            user_id=sample_user_id,
            emotion="excited",
            intensity=0.8,
            context="I got the job!",
            triggers=["job", "excited"],
            conversation_id=sample_conversation_id
        )
        
        # Verify memory was stored
        memories = await emotional_memory_service.get_recent_emotional_context(sample_user_id)
        assert len(memories) == 1
        assert memories[0].emotion == "excited"
        assert memories[0].intensity == 0.8
        assert memories[0].context == "I got the job!"
    
    @pytest.mark.asyncio
    async def test_emotional_continuity_context(self, sample_user_id, sample_conversation_id):
        """Test emotional continuity context retrieval."""
        # Store multiple emotional memories
        await emotional_memory_service.store_emotional_memory(
            user_id=sample_user_id,
            emotion="stressed",
            intensity=0.7,
            context="Work is overwhelming",
            triggers=["work", "overwhelmed"],
            conversation_id=sample_conversation_id
        )
        
        await emotional_memory_service.store_emotional_memory(
            user_id=sample_user_id,
            emotion="stressed",
            intensity=0.6,
            context="Still stressed about work",
            triggers=["work", "stressed"],
            conversation_id=sample_conversation_id
        )
        
        # Get continuity context
        context = await emotional_memory_service.get_emotional_continuity_context(sample_user_id)
        
        assert context["has_emotional_history"] == True
        assert context["dominant_emotion"] == "stressed"
        assert context["average_intensity"] > 0.6
        assert context["needs_emotional_support"] == True
        assert len(context["support_strategies"]) > 0
    
    @pytest.mark.asyncio
    async def test_emotional_patterns(self, sample_user_id, sample_conversation_id):
        """Test emotional pattern detection."""
        # Store multiple memories to trigger pattern detection
        for i in range(5):
            await emotional_memory_service.store_emotional_memory(
                user_id=sample_user_id,
                emotion="stressed",
                intensity=0.6 + (i * 0.1),
                context=f"Stressful day {i}",
                triggers=["work", "stress"],
                conversation_id=sample_conversation_id
            )
        
        patterns = await emotional_memory_service.get_emotional_patterns(sample_user_id)
        assert len(patterns) > 0
        
        stress_pattern = next((p for p in patterns if p.emotion == "stressed"), None)
        assert stress_pattern is not None
        assert stress_pattern.frequency >= 5
        assert stress_pattern.average_intensity > 0.6
    
    @pytest.mark.asyncio
    async def test_resolve_emotional_memory(self, sample_user_id, sample_conversation_id):
        """Test resolving emotional memories."""
        await emotional_memory_service.store_emotional_memory(
            user_id=sample_user_id,
            emotion="stressed",
            intensity=0.8,
            context="Very stressed",
            triggers=["stress"],
            conversation_id=sample_conversation_id
        )
        
        await emotional_memory_service.resolve_emotional_memory(
            user_id=sample_user_id,
            conversation_id=sample_conversation_id,
            resolution="Took a break and felt better"
        )
        
        memories = await emotional_memory_service.get_recent_emotional_context(sample_user_id)
        resolved_memory = memories[0]
        assert resolved_memory.resolution == "Took a break and felt better"
        assert resolved_memory.duration_minutes is not None


class TestConversationalIntelligence:
    """Test conversational intelligence capabilities."""
    
    def test_emotional_state_detection(self):
        """Test advanced emotional state detection."""
        message = "I'm so excited about this amazing opportunity!"
        history = []
        
        emotional_state = conversational_intelligence._detect_emotional_state_advanced(message, history)
        
        assert emotional_state.primary_emotion == "excited"
        assert emotional_state.intensity > 0.5
        assert emotional_state.confidence > 0.6
        assert "excited" in emotional_state.triggers
        assert "amazing" in emotional_state.triggers
    
    def test_conversation_context_analysis(self):
        """Test conversation context analysis."""
        message = "I'm really stressed about work and need help."
        history = [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}]
        memories = [{"content": "I work as a software developer"}]
        
        context = conversational_intelligence.analyze_conversation_context(
            user_message=message,
            conversation_history=history,
            user_memories=memories
        )
        
        assert context.emotional_state.primary_emotion == "stressed"
        assert context.conversation_stage == "problem_solving"
        assert context.current_topic == "work"
        assert context.user_energy == "low"
        assert "work" in context.recent_themes
    
    def test_response_style_determination(self):
        """Test response style determination."""
        emotional_state = EmotionalState(
            primary_emotion="stressed",
            intensity=0.7,
            confidence=0.8,
            triggers=["work", "overwhelmed"]
        )
        
        context = ConversationContext(
            current_topic="work",
            emotional_state=emotional_state,
            conversation_stage="problem_solving",
            user_energy="low",
            recent_themes=["work", "stress"],
            ongoing_goals=["reduce stress"],
            relationship_dynamics={"familiarity_level": "high"}
        )
        
        style = conversational_intelligence.determine_response_style(context)
        
        assert style.tone == "empathetic"
        assert style.approach == "empathetic"
        assert style.emotional_support == True
        assert style.humor_appropriate == False
    
    def test_contextual_prompt_generation(self):
        """Test contextual prompt generation."""
        emotional_state = EmotionalState(
            primary_emotion="excited",
            intensity=0.8,
            confidence=0.9,
            triggers=["amazing", "excited"]
        )
        
        context = ConversationContext(
            current_topic="personal",
            emotional_state=emotional_state,
            conversation_stage="sharing",
            user_energy="high",
            recent_themes=["good news"],
            ongoing_goals=[],
            relationship_dynamics={"familiarity_level": "high"}
        )
        
        style = ResponseStyle(
            tone="excited",
            length="conversational",
            approach="encouraging",
            include_memories=True,
            proactive_suggestions=False,
            emotional_support=False,
            humor_appropriate=True
        )
        
        memories = [{"content": "I love celebrating achievements"}]
        
        prompt = conversational_intelligence.generate_contextual_prompt(
            context=context,
            style=style,
            user_memories=memories
        )
        
        assert "excited" in prompt.lower()
        assert "natural conversation" in prompt.lower()
        assert "humor" in prompt.lower()
        assert "memories" in prompt.lower()


class TestIntegration:
    """Test integration between all emotional intelligence components."""
    
    @pytest.mark.asyncio
    async def test_full_emotional_intelligence_pipeline(self):
        """Test the complete emotional intelligence pipeline."""
        user_id = "test_user_integration"
        conversation_id = "test_conversation_integration"
        
        # Test message
        message = "I'm really stressed about my upcoming presentation and need some help."
        history = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello!"}]
        memories = [{"content": "I work in marketing and get nervous about presentations"}]
        
        # 1. Sentiment analysis
        sentiment_result = sentiment_analyzer.analyze_sentiment(message)
        assert sentiment_result.sentiment == "negative"
        assert "stressed" in sentiment_result.emotions
        
        # 2. Conversational intelligence
        context = conversational_intelligence.analyze_conversation_context(
            user_message=message,
            conversation_history=history,
            user_memories=memories
        )
        assert context.emotional_state.primary_emotion == "stressed"
        assert context.conversation_stage == "problem_solving"
        
        # 3. Response style
        style = conversational_intelligence.determine_response_style(context)
        assert style.emotional_support == True
        assert style.tone == "empathetic"
        
        # 4. Emotional memory storage
        await emotional_memory_service.store_emotional_memory(
            user_id=user_id,
            emotion=context.emotional_state.primary_emotion,
            intensity=context.emotional_state.intensity,
            context=message[:200],
            triggers=context.emotional_state.triggers,
            conversation_id=conversation_id
        )
        
        # 5. Emotional continuity
        continuity = await emotional_memory_service.get_emotional_continuity_context(user_id)
        assert continuity["has_emotional_history"] == True
        assert continuity["dominant_emotion"] == "stressed"
        assert continuity["needs_emotional_support"] == True
        
        # 6. Support strategies
        strategies = await emotional_memory_service.get_emotional_support_strategy(
            "stressed", context.emotional_state.intensity
        )
        assert len(strategies) > 0
        
        # 7. Contextual prompt
        prompt = conversational_intelligence.generate_contextual_prompt(
            context=context,
            style=style,
            user_memories=memories
        )
        assert "stressed" in prompt.lower()
        assert "empathetic" in prompt.lower()
        assert "support" in prompt.lower()


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
