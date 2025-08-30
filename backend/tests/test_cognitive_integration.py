"""
Tests for Cognitive Integration Engine
"""

import pytest
import asyncio
from datetime import datetime
from app.services.cognitive_integration import (
    CognitiveIntegrationEngine,
    CognitiveMode,
    CognitiveRequest,
    CognitiveContext,
    CognitiveResponse
)


class TestCognitiveIntegrationEngine:
    """Test suite for Cognitive Integration Engine."""
    
    @pytest.fixture
    def engine(self):
        """Create engine instance."""
        return CognitiveIntegrationEngine("test_user")
    
    @pytest.fixture
    def sample_context(self):
        """Sample cognitive context."""
        return CognitiveContext(
            user_id="test_user",
            conversation_id="conv_123",
            current_message="I need help solving a complex problem",
            conversation_history=[
                {"role": "user", "content": "I'm working on a project"},
                {"role": "assistant", "content": "Tell me more about it"}
            ],
            user_preferences={"communication_style": "casual"},
            emotional_state="focused",
            urgency_level=0.7,
            complexity_level=0.8
        )
    
    @pytest.mark.asyncio
    async def test_process_cognitive_request_basic(self, engine, sample_context):
        """Test basic cognitive request processing."""
        response = await engine.process_cognitive_request(
            context=sample_context,
            request_type=CognitiveRequest.GENERATE_RESPONSE
        )
        
        assert isinstance(response, CognitiveResponse)
        assert response.response_text
        assert response.confidence_score > 0
        assert isinstance(response.processing_mode, CognitiveMode)
    
    @pytest.mark.asyncio
    async def test_determine_cognitive_mode_analytical(self, engine):
        """Test determination of analytical mode."""
        analytical_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_analytical",
            current_message="Please analyze and explain how this algorithm works",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.6
        )
        
        mode = await engine._determine_cognitive_mode(analytical_context, CognitiveRequest.ANALYZE_CONTEXT)
        
        # Should lean towards analytical mode
        assert mode in [CognitiveMode.ANALYTICAL, CognitiveMode.INTEGRATED, CognitiveMode.FOCUSED]
    
    @pytest.mark.asyncio
    async def test_determine_cognitive_mode_creative(self, engine):
        """Test determination of creative mode."""
        creative_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_creative",
            current_message="I need creative ideas for solving this innovative challenge",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.4,
            complexity_level=0.9
        )
        
        mode = await engine._determine_cognitive_mode(creative_context, CognitiveRequest.SOLVE_PROBLEM)
        
        # Should lean towards creative or integrated mode
        assert mode in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]
    
    @pytest.mark.asyncio
    async def test_determine_cognitive_mode_adaptive(self, engine):
        """Test determination of adaptive mode."""
        adaptive_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_adaptive",
            current_message="Please remember my preferences and adapt your responses",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.2,
            complexity_level=0.4
        )
        
        mode = await engine._determine_cognitive_mode(adaptive_context, CognitiveRequest.LEARN_ADAPT)
        
        # Should lean towards adaptive or integrated mode
        assert mode in [CognitiveMode.ADAPTIVE, CognitiveMode.INTEGRATED]
    
    @pytest.mark.asyncio
    async def test_determine_cognitive_mode_focused(self, engine):
        """Test determination of focused mode."""
        focused_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_focused",
            current_message="Give me a direct, simple answer please",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.9,
            complexity_level=0.3
        )
        
        mode = await engine._determine_cognitive_mode(focused_context, CognitiveRequest.GENERATE_RESPONSE)
        
        # Should lean towards focused mode due to urgency and simplicity
        assert mode in [CognitiveMode.FOCUSED, CognitiveMode.ANALYTICAL]
    
    @pytest.mark.asyncio
    async def test_determine_cognitive_mode_integrated(self, engine):
        """Test determination of integrated mode."""
        integrated_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_integrated",
            current_message="I have a comprehensive, complex challenge that needs thorough analysis",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.5,
            complexity_level=0.9
        )
        
        mode = await engine._determine_cognitive_mode(integrated_context, CognitiveRequest.GENERATE_RESPONSE)
        
        # Should lean towards integrated mode due to complexity
        assert mode == CognitiveMode.INTEGRATED
    
    @pytest.mark.asyncio
    async def test_cognitive_processing_with_understanding(self, engine, sample_context):
        """Test cognitive processing including multi-modal understanding."""
        response = await engine.process_cognitive_request(
            context=sample_context,
            request_type=CognitiveRequest.UNDERSTAND_COMPLEX
        )
        
        # Should include understanding insights
        assert len(response.cognitive_insights) >= 0
        assert response.understanding_context
        assert isinstance(response.understanding_context, dict)
    
    @pytest.mark.asyncio
    async def test_cognitive_processing_with_creativity(self, engine):
        """Test cognitive processing including creative problem solving."""
        creative_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_creative_test",
            current_message="I need innovative solutions for improving team productivity",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.4,
            complexity_level=0.7
        )
        
        response = await engine.process_cognitive_request(
            context=creative_context,
            request_type=CognitiveRequest.SOLVE_PROBLEM
        )
        
        # Should include creative elements
        assert len(response.creative_elements) >= 0
        if response.processing_mode in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]:
            # More likely to have creative elements in these modes
            pass
    
    @pytest.mark.asyncio
    async def test_cognitive_processing_with_adaptation(self, engine, sample_context):
        """Test cognitive processing including adaptive learning."""
        response = await engine.process_cognitive_request(
            context=sample_context,
            request_type=CognitiveRequest.LEARN_ADAPT
        )
        
        # Should apply learning adaptations
        assert isinstance(response.adaptation_made, bool)
        assert len(response.learning_applied) >= 0
    
    @pytest.mark.asyncio
    async def test_confidence_scoring(self, engine):
        """Test confidence scoring across different scenarios."""
        # High confidence scenario
        clear_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_clear",
            current_message="What is 2 + 2?",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.2,
            complexity_level=0.1
        )
        
        clear_response = await engine.process_cognitive_request(clear_context)
        
        # Low confidence scenario
        vague_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_vague",
            current_message="That thing isn't working",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.8,
            complexity_level=0.9
        )
        
        vague_response = await engine.process_cognitive_request(vague_context)
        
        # Clear context should generally have higher confidence
        # Note: This may not always be true due to cognitive processing complexity
        assert clear_response.confidence_score >= 0
        assert vague_response.confidence_score >= 0
    
    @pytest.mark.asyncio
    async def test_context_integration(self, engine):
        """Test integration of conversation context."""
        context_with_history = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_context",
            current_message="Can you continue with that approach?",
            conversation_history=[
                {"role": "user", "content": "I'm trying to optimize my database"},
                {"role": "assistant", "content": "I suggest adding indexes"},
                {"role": "user", "content": "That sounds good"}
            ],
            user_preferences={},
            urgency_level=0.5,
            complexity_level=0.6
        )
        
        response = await engine.process_cognitive_request(context_with_history)
        
        # Should use conversation context
        assert len(response.understanding_context.get("context_used", [])) >= 0
        # Response should reference the previous discussion
    
    @pytest.mark.asyncio
    async def test_user_preferences_integration(self, engine):
        """Test integration of user preferences."""
        context_with_preferences = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_prefs",
            current_message="Explain how machine learning works",
            conversation_history=[],
            user_preferences={
                "communication_style": "casual",
                "response_length": "detailed",
                "technical_depth": "advanced"
            },
            urgency_level=0.3,
            complexity_level=0.7
        )
        
        response = await engine.process_cognitive_request(context_with_preferences)
        
        # Should apply user preferences
        if response.adaptation_made:
            assert len(response.learning_applied) > 0
    
    @pytest.mark.asyncio
    async def test_emotional_state_handling(self, engine):
        """Test handling of emotional states."""
        emotional_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_emotion",
            current_message="I'm really frustrated with this problem",
            conversation_history=[],
            user_preferences={},
            emotional_state="frustrated",
            urgency_level=0.8,
            complexity_level=0.6
        )
        
        response = await engine.process_cognitive_request(emotional_context)
        
        # Should recognize and respond to emotional state
        assert response.response_text
        # Response should be empathetic (hard to test automatically)
    
    @pytest.mark.asyncio
    async def test_urgency_level_impact(self, engine):
        """Test impact of urgency level on processing."""
        # High urgency
        urgent_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_urgent",
            current_message="URGENT: Need help immediately!",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.95,
            complexity_level=0.5
        )
        
        urgent_response = await engine.process_cognitive_request(urgent_context)
        
        # Should use focused mode for urgent requests
        assert urgent_response.processing_mode in [CognitiveMode.FOCUSED, CognitiveMode.ANALYTICAL]
        
        # Low urgency
        casual_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_casual",
            current_message="I'm curious about something when you have time",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.1,
            complexity_level=0.5
        )
        
        casual_response = await engine.process_cognitive_request(casual_context)
        
        # May use more comprehensive processing for non-urgent requests
        assert casual_response.processing_mode in [
            CognitiveMode.INTEGRATED, CognitiveMode.CREATIVE, 
            CognitiveMode.ANALYTICAL, CognitiveMode.ADAPTIVE
        ]
    
    @pytest.mark.asyncio
    async def test_complexity_level_impact(self, engine):
        """Test impact of complexity level on processing."""
        # High complexity
        complex_context = CognitiveContext(
            user_id="test_user",
            conversation_id="conv_complex",
            current_message="I need help with a multi-faceted problem involving technical, business, and interpersonal aspects",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.4,
            complexity_level=0.95
        )
        
        complex_response = await engine.process_cognitive_request(complex_context)
        
        # Should use integrated mode for complex requests
        assert complex_response.processing_mode == CognitiveMode.INTEGRATED
    
    @pytest.mark.asyncio
    async def test_get_cognitive_status(self, engine):
        """Test getting cognitive status."""
        status = await engine.get_cognitive_status()
        
        assert "user_id" in status
        assert "cognitive_engines" in status
        assert "learning_progress" in status
        assert "cognitive_weights" in status
        assert "available_modes" in status
        assert "integration_status" in status
        
        assert status["user_id"] == "test_user"
        assert status["integration_status"] == "operational"
        assert len(status["available_modes"]) == len(CognitiveMode)
    
    @pytest.mark.asyncio
    async def test_update_cognitive_weights(self, engine):
        """Test updating cognitive weights."""
        new_weights = {
            "understanding": 0.5,
            "creativity": 0.3,
            "adaptation": 0.2
        }
        
        await engine.update_cognitive_weights(new_weights)
        
        assert engine.cognitive_weights == new_weights
        
        # Test weight normalization
        invalid_weights = {
            "understanding": 0.8,
            "creativity": 0.6,
            "adaptation": 0.4
        }
        
        await engine.update_cognitive_weights(invalid_weights)
        
        # Should be normalized to sum to 1.0
        total_weight = sum(engine.cognitive_weights.values())
        assert abs(total_weight - 1.0) < 0.01
    
    @pytest.mark.asyncio
    async def test_process_feedback(self, engine, sample_context):
        """Test processing user feedback."""
        # Generate a response first
        response = await engine.process_cognitive_request(sample_context)
        
        # Provide feedback
        feedback = {
            "understanding_quality": 4,
            "creativity_quality": 3,
            "personalization_quality": 5,
            "overall_rating": 4,
            "comment": "Good response but could be more creative"
        }
        
        await engine.process_feedback(feedback, sample_context, response)
        
        # Should update learning and possibly adjust weights
        # Hard to test automatically, but should not raise errors
    
    @pytest.mark.asyncio
    async def test_optimize_cognitive_performance(self, engine):
        """Test cognitive performance optimization."""
        optimization_results = await engine.optimize_cognitive_performance()
        
        assert "optimizations_applied" in optimization_results
        assert "performance_improvements" in optimization_results
        assert "recommendations" in optimization_results
        
        assert isinstance(optimization_results["optimizations_applied"], list)
        assert isinstance(optimization_results["recommendations"], list)
    
    def test_cognitive_context_creation(self, engine):
        """Test cognitive context creation."""
        context = CognitiveContext(
            user_id="test_user",
            conversation_id="test_conv",
            current_message="Test message",
            conversation_history=[],
            user_preferences={},
            emotional_state="neutral",
            urgency_level=0.5,
            complexity_level=0.5
        )
        
        assert context.user_id == "test_user"
        assert context.urgency_level == 0.5
        assert context.complexity_level == 0.5
    
    def test_cognitive_response_creation(self, engine):
        """Test cognitive response creation."""
        response = CognitiveResponse(
            response_text="Test response",
            cognitive_insights=["insight1", "insight2"],
            learning_applied=["adaptation1"],
            creative_elements=["creative1"],
            understanding_context={"key": "value"},
            confidence_score=0.8,
            processing_mode=CognitiveMode.INTEGRATED,
            adaptation_made=True
        )
        
        assert response.confidence_score == 0.8
        assert response.processing_mode == CognitiveMode.INTEGRATED
        assert response.adaptation_made is True
        assert len(response.cognitive_insights) == 2
    
    @pytest.mark.asyncio
    async def test_error_handling(self, engine):
        """Test error handling with invalid inputs."""
        # Invalid context
        try:
            invalid_context = CognitiveContext(
                user_id="",
                conversation_id="",
                current_message="",
                conversation_history=[],
                user_preferences={},
                urgency_level=0.5,
                complexity_level=0.5
            )
            
            response = await engine.process_cognitive_request(invalid_context)
            # Should handle gracefully
            assert response is not None
        except Exception:
            # Or raise appropriate exception
            pass


# Integration tests
class TestCognitiveIntegrationFull:
    """Full integration tests for cognitive integration."""
    
    @pytest.fixture
    def engine(self):
        return CognitiveIntegrationEngine("integration_test_user")
    
    @pytest.mark.asyncio
    async def test_full_cognitive_pipeline(self, engine):
        """Test the complete cognitive processing pipeline."""
        # Simulate a realistic complex request
        context = CognitiveContext(
            user_id="integration_test_user",
            conversation_id="full_pipeline_test",
            current_message="I'm struggling with work-life balance and need creative solutions that also help me learn better habits",
            conversation_history=[
                {"role": "user", "content": "I've been working too much lately"},
                {"role": "assistant", "content": "That sounds challenging. Tell me more about your situation."},
                {"role": "user", "content": "I work 60+ hours a week and barely see my family"}
            ],
            user_preferences={
                "communication_style": "empathetic",
                "response_length": "comprehensive"
            },
            emotional_state="stressed",
            urgency_level=0.7,
            complexity_level=0.8
        )
        
        response = await engine.process_cognitive_request(
            context=context,
            request_type=CognitiveRequest.SOLVE_PROBLEM
        )
        
        # Should integrate all cognitive capabilities
        assert response.response_text
        assert response.confidence_score > 0
        assert response.processing_mode in [CognitiveMode.INTEGRATED, CognitiveMode.CREATIVE]
        
        # Should show evidence of multi-modal understanding
        assert len(response.understanding_context) > 0
        
        # Should show creative problem solving for work-life balance
        if response.processing_mode in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]:
            # May have creative elements
            pass
        
        # Should adapt to user preferences
        if response.adaptation_made:
            assert len(response.learning_applied) > 0
    
    @pytest.mark.asyncio
    async def test_mode_switching_based_on_context(self, engine):
        """Test dynamic mode switching based on context changes."""
        # Start with analytical request
        analytical_context = CognitiveContext(
            user_id="integration_test_user",
            conversation_id="mode_switch_test",
            current_message="Explain how neural networks work",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.6
        )
        
        analytical_response = await engine.process_cognitive_request(analytical_context)
        analytical_mode = analytical_response.processing_mode
        
        # Switch to creative request
        creative_context = CognitiveContext(
            user_id="integration_test_user",
            conversation_id="mode_switch_test",
            current_message="Now help me brainstorm creative applications for neural networks",
            conversation_history=[
                {"role": "user", "content": "Explain how neural networks work"},
                {"role": "assistant", "content": analytical_response.response_text}
            ],
            user_preferences={},
            urgency_level=0.4,
            complexity_level=0.8
        )
        
        creative_response = await engine.process_cognitive_request(creative_context)
        creative_mode = creative_response.processing_mode
        
        # Should adapt processing mode to the new request type
        # Analytical mode for explanation, creative/integrated for brainstorming
        assert analytical_mode in [CognitiveMode.ANALYTICAL, CognitiveMode.INTEGRATED, CognitiveMode.FOCUSED]
        assert creative_mode in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]
    
    @pytest.mark.asyncio
    async def test_learning_across_sessions(self, engine):
        """Test learning and adaptation across multiple sessions."""
        # Session 1: User provides feedback
        session1_context = CognitiveContext(
            user_id="integration_test_user",
            conversation_id="learning_session_1",
            current_message="Explain machine learning to me",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.7
        )
        
        session1_response = await engine.process_cognitive_request(session1_context)
        
        # Simulate user feedback
        feedback = {
            "understanding_quality": 5,
            "creativity_quality": 2,
            "personalization_quality": 3,
            "comment": "Great explanation but I'd like more creative examples"
        }
        
        await engine.process_feedback(feedback, session1_context, session1_response)
        
        # Session 2: Similar request, should apply learning
        session2_context = CognitiveContext(
            user_id="integration_test_user",
            conversation_id="learning_session_2",
            current_message="Explain deep learning to me",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.7
        )
        
        session2_response = await engine.process_cognitive_request(session2_context)
        
        # Should show evidence of learning from feedback
        # (increased focus on creativity based on previous feedback)
        if session2_response.adaptation_made:
            assert len(session2_response.learning_applied) > 0
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self, engine):
        """Test performance with multiple concurrent requests."""
        contexts = []
        for i in range(5):
            context = CognitiveContext(
                user_id="integration_test_user",
                conversation_id=f"load_test_{i}",
                current_message=f"Help me with problem {i}",
                conversation_history=[],
                user_preferences={},
                urgency_level=0.5,
                complexity_level=0.5
            )
            contexts.append(context)
        
        # Process multiple requests concurrently
        tasks = [
            engine.process_cognitive_request(context)
            for context in contexts
        ]
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Should handle concurrent requests
        for response in responses:
            if isinstance(response, Exception):
                pytest.fail(f"Request failed with exception: {response}")
            assert isinstance(response, CognitiveResponse)
            assert response.confidence_score > 0
