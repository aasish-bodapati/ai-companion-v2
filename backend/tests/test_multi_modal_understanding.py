"""
Tests for Multi-Modal Understanding Engine
"""

import pytest
import asyncio
from datetime import datetime
from app.services.multi_modal_understanding import (
    MultiModalUnderstandingEngine,
    AmbiguityType,
    ImplicitMeaningType,
    AmbiguityContext,
    ImplicitMeaning,
    NonVerbalCues,
    MultiModalUnderstanding
)


class TestMultiModalUnderstandingEngine:
    """Test suite for Multi-Modal Understanding Engine."""
    
    @pytest.fixture
    def engine(self):
        """Create engine instance."""
        return MultiModalUnderstandingEngine()
    
    @pytest.fixture
    def sample_conversation_history(self):
        """Sample conversation history."""
        return [
            {"role": "user", "content": "I've been working on this project for weeks"},
            {"role": "assistant", "content": "That sounds like a lot of effort"},
            {"role": "user", "content": "Yeah, it's getting really complicated"}
        ]
    
    @pytest.fixture
    def sample_user_memories(self):
        """Sample user memories."""
        return [
            {"content": "User is a software developer", "timestamp": datetime.now()},
            {"content": "User prefers detailed explanations", "timestamp": datetime.now()}
        ]
    
    @pytest.mark.asyncio
    async def test_understand_complex_input_basic(self, engine):
        """Test basic complex input understanding."""
        message = "This thing isn't working properly and I don't know why"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[]
        )
        
        assert isinstance(result, MultiModalUnderstanding)
        assert result.resolved_meaning
        assert result.confidence_score > 0
    
    @pytest.mark.asyncio
    async def test_ambiguity_resolution_pronoun(self, engine, sample_conversation_history):
        """Test pronoun reference resolution."""
        message = "Can you help me fix it?"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=sample_conversation_history,
            user_memories=[]
        )
        
        # Should resolve "it" reference
        assert len(result.ambiguity_resolutions) > 0
        pronoun_resolution = next(
            (res for res in result.ambiguity_resolutions 
             if res.ambiguity_type == AmbiguityType.PRONOUN_REFERENCE),
            None
        )
        assert pronoun_resolution is not None
    
    @pytest.mark.asyncio
    async def test_implicit_meaning_detection_frustration(self, engine):
        """Test detection of implicit frustration."""
        message = "I guess it's fine... whatever"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[]
        )
        
        # Should detect frustration or resignation
        frustration_meaning = next(
            (meaning for meaning in result.implicit_meanings 
             if meaning.meaning_type in [ImplicitMeaningType.FRUSTRATION, ImplicitMeaningType.SATISFACTION]),
            None
        )
        assert frustration_meaning is not None
    
    @pytest.mark.asyncio
    async def test_non_verbal_cues_urgency(self, engine):
        """Test detection of urgency from text patterns."""
        message = "HELP! This is really urgent!!!"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[]
        )
        
        # Should detect high urgency
        assert result.non_verbal_cues.urgency_level > 0.7
    
    @pytest.mark.asyncio
    async def test_non_verbal_cues_hesitation(self, engine):
        """Test detection of hesitation patterns."""
        message = "Well, I think maybe we could try... um, possibly..."
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[]
        )
        
        # Should detect hesitation indicators
        assert len(result.non_verbal_cues.hesitation_indicators) > 0
    
    @pytest.mark.asyncio
    async def test_context_dependent_understanding(self, engine, sample_conversation_history, sample_user_memories):
        """Test context-dependent understanding."""
        message = "That approach is better"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=sample_conversation_history,
            user_memories=sample_user_memories
        )
        
        # Should use context to understand "that approach"
        assert len(result.context_used) > 0
        assert result.confidence_score > 0.5
    
    @pytest.mark.asyncio
    async def test_emotional_subtext_detection(self, engine):
        """Test emotional subtext detection."""
        message = "I'm doing great, just fantastic"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[],
            emotional_context={"emotion": "stressed"}
        )
        
        # Should detect sarcasm or hidden emotion
        assert result.non_verbal_cues.emotional_subtext
        assert result.non_verbal_cues.emotional_subtext != "positive"
    
    @pytest.mark.asyncio
    async def test_cultural_context_handling(self, engine):
        """Test handling of cultural context."""
        message = "That's really something"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=[],
            cultural_context={"region": "american_midwest"}
        )
        
        # Should provide cultural interpretation
        assert result.non_verbal_cues.cultural_context is not None
    
    @pytest.mark.asyncio
    async def test_confidence_scoring(self, engine):
        """Test confidence scoring accuracy."""
        # Clear message should have high confidence
        clear_message = "Please explain how machine learning works"
        clear_result = await engine.understand_complex_input(
            message=clear_message,
            conversation_history=[],
            user_memories=[]
        )
        
        # Ambiguous message should have lower confidence
        ambiguous_message = "Do that thing with the stuff"
        ambiguous_result = await engine.understand_complex_input(
            message=ambiguous_message,
            conversation_history=[],
            user_memories=[]
        )
        
        assert clear_result.confidence_score > ambiguous_result.confidence_score
    
    @pytest.mark.asyncio
    async def test_complex_multi_layered_understanding(self, engine, sample_conversation_history):
        """Test complex multi-layered understanding."""
        message = "I don't think that's going to work, but whatever you think is best..."
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=sample_conversation_history,
            user_memories=[]
        )
        
        # Should detect multiple layers: disagreement + resignation + deference
        assert len(result.implicit_meanings) >= 2
        assert len(result.ambiguity_resolutions) >= 1
        assert result.non_verbal_cues.emotional_subtext
    
    @pytest.mark.asyncio
    async def test_memory_integration(self, engine, sample_user_memories):
        """Test integration of user memories in understanding."""
        message = "Can you explain it in detail?"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=[],
            user_memories=sample_user_memories
        )
        
        # Should use memory about preference for detailed explanations
        assert "user memories" in " ".join(result.context_used).lower()
    
    def test_ambiguity_context_creation(self, engine):
        """Test ambiguity context creation."""
        context = AmbiguityContext(
            ambiguity_type=AmbiguityType.PRONOUN_REFERENCE,
            confidence=0.8,
            possible_interpretations=["project", "code", "issue"],
            context_clues=["mentioned in previous message"],
            resolution_strategy="conversation_history_lookup"
        )
        
        assert context.ambiguity_type == AmbiguityType.PRONOUN_REFERENCE
        assert context.confidence == 0.8
        assert len(context.possible_interpretations) == 3
    
    def test_implicit_meaning_creation(self, engine):
        """Test implicit meaning creation."""
        meaning = ImplicitMeaning(
            meaning_type=ImplicitMeaningType.FRUSTRATION,
            confidence=0.7,
            intensity=0.6,
            context_clues=["sarcastic tone", "repeated failures"],
            interpretation="User is frustrated with repeated failures"
        )
        
        assert meaning.meaning_type == ImplicitMeaningType.FRUSTRATION
        assert meaning.confidence == 0.7
        assert meaning.intensity == 0.6
    
    def test_non_verbal_cues_creation(self, engine):
        """Test non-verbal cues creation."""
        cues = NonVerbalCues(
            urgency_level=0.8,
            confidence_level=0.6,
            hesitation_indicators=["um", "maybe"],
            emotional_subtext="frustrated",
            timing_implications=["immediate_response_needed"]
        )
        
        assert cues.urgency_level == 0.8
        assert cues.confidence_level == 0.6
        assert len(cues.hesitation_indicators) == 2
    
    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling with invalid inputs."""
        # Empty message
        result = await engine.understand_complex_input(
            message="",
            conversation_history=[],
            user_memories=[]
        )
        assert result is not None
        
        # None message should raise appropriate error or handle gracefully
        with pytest.raises(Exception):
            await engine.understand_complex_input(
                message=None,
                conversation_history=[],
                user_memories=[]
            )
    
    @pytest.mark.asyncio
    async def test_performance_with_large_context(self, engine):
        """Test performance with large context."""
        large_history = [{"role": "user", "content": f"Message {i}"} for i in range(100)]
        large_memories = [{"content": f"Memory {i}", "timestamp": datetime.now()} for i in range(50)]
        
        message = "What do you think about this?"
        
        result = await engine.understand_complex_input(
            message=message,
            conversation_history=large_history,
            user_memories=large_memories
        )
        
        # Should still work with large context
        assert result is not None
        assert result.confidence_score > 0


# Integration tests
class TestMultiModalIntegration:
    """Integration tests for multi-modal understanding."""
    
    @pytest.fixture
    def engine(self):
        return MultiModalUnderstandingEngine()
    
    @pytest.mark.asyncio
    async def test_realistic_conversation_flow(self, engine):
        """Test realistic conversation flow understanding."""
        # Simulate a realistic conversation
        conversation = [
            {"role": "user", "content": "I'm having trouble with my code"},
            {"role": "assistant", "content": "What kind of trouble are you experiencing?"},
            {"role": "user", "content": "It keeps crashing when I run it"},
            {"role": "assistant", "content": "Can you share the error message?"},
        ]
        
        # Current problematic message
        current_message = "It says something about a null pointer but I don't get it"
        
        result = await engine.understand_complex_input(
            message=current_message,
            conversation_history=conversation,
            user_memories=[{"content": "User is learning programming", "timestamp": datetime.now()}]
        )
        
        # Should understand this is about debugging help
        assert "error" in result.resolved_meaning.lower() or "debug" in result.resolved_meaning.lower()
        assert result.confidence_score > 0.6
    
    @pytest.mark.asyncio
    async def test_emotional_conversation_understanding(self, engine):
        """Test understanding of emotionally charged conversation."""
        conversation = [
            {"role": "user", "content": "I've been trying to fix this for hours"},
            {"role": "assistant", "content": "That sounds frustrating"},
            {"role": "user", "content": "It really is, nothing is working"},
        ]
        
        current_message = "I just want to give up at this point"
        
        result = await engine.understand_complex_input(
            message=current_message,
            conversation_history=conversation,
            user_memories=[]
        )
        
        # Should detect emotional state and provide appropriate understanding
        emotional_meanings = [m for m in result.implicit_meanings 
                             if m.meaning_type in [ImplicitMeaningType.FRUSTRATION, ImplicitMeaningType.EMOTIONAL_STATE]]
        assert len(emotional_meanings) > 0
        
        assert result.non_verbal_cues.emotional_subtext
        assert "frustrat" in result.non_verbal_cues.emotional_subtext.lower() or "discourag" in result.non_verbal_cues.emotional_subtext.lower()
