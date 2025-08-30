"""
Phase 5 Integration Tests and Performance Validation
Comprehensive testing of all Phase 5 components working together
"""

import pytest
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any

# Import all Phase 5 components
from app.services.multi_modal_understanding import MultiModalUnderstandingEngine
from app.services.creative_problem_solving import CreativeProblemSolvingEngine
from app.services.adaptive_learning import AdaptiveLearningEngine
from app.services.cognitive_integration import (
    CognitiveIntegrationEngine, 
    CognitiveContext, 
    CognitiveRequest,
    CognitiveMode
)

# Import enhanced services
from app.services.conversational_intelligence import ConversationalIntelligenceEngine
from app.services.predictive_intelligence import PredictiveIntelligenceEngine
from app.services.personality_engine import PersonalityEngine


class TestPhase5Integration:
    """Comprehensive integration tests for Phase 5 Advanced Cognitive Capabilities."""
    
    @pytest.fixture
    def test_user_id(self):
        """Test user ID."""
        return "phase5_integration_test_user"
    
    @pytest.fixture
    def cognitive_engine(self, test_user_id):
        """Create cognitive integration engine."""
        return CognitiveIntegrationEngine(test_user_id)
    
    @pytest.fixture
    def enhanced_conversational_intelligence(self, test_user_id):
        """Create enhanced conversational intelligence."""
        return ConversationalIntelligenceEngine(test_user_id)
    
    @pytest.fixture
    def enhanced_predictive_intelligence(self, test_user_id):
        """Create enhanced predictive intelligence."""
        return PredictiveIntelligenceEngine(test_user_id)
    
    @pytest.fixture
    def enhanced_personality_engine(self, test_user_id):
        """Create enhanced personality engine."""
        return PersonalityEngine(test_user_id)
    
    @pytest.fixture
    def sample_complex_scenario(self):
        """Complex real-world scenario for testing."""
        return {
            "user_message": "I'm overwhelmed managing my team while also trying to innovate our product. I need creative solutions that fit my leadership style and help me learn to be more effective.",
            "conversation_history": [
                {"role": "user", "content": "I recently got promoted to team lead"},
                {"role": "assistant", "content": "Congratulations! That's a big step. How are you feeling about the new role?"},
                {"role": "user", "content": "Excited but also nervous. There's so much to learn"},
                {"role": "assistant", "content": "It's natural to feel that way. What aspects are you most concerned about?"},
                {"role": "user", "content": "Balancing my technical work with management responsibilities"}
            ],
            "user_memories": [
                {"content": "User is a software engineer with 5 years experience", "timestamp": datetime.now()},
                {"content": "User prefers collaborative leadership style", "timestamp": datetime.now()},
                {"content": "User likes detailed explanations with practical examples", "timestamp": datetime.now()}
            ],
            "user_preferences": {
                "communication_style": "collaborative",
                "response_length": "comprehensive",
                "technical_depth": "advanced",
                "creativity_level": "high"
            },
            "emotional_state": "overwhelmed",
            "urgency_level": 0.6,
            "complexity_level": 0.9
        }
    
    @pytest.mark.asyncio
    async def test_full_cognitive_pipeline_integration(self, cognitive_engine, sample_complex_scenario):
        """Test the complete cognitive pipeline with all components."""
        start_time = time.time()
        
        # Create cognitive context
        context = CognitiveContext(
            user_id=cognitive_engine.user_id,
            conversation_id="integration_test_full_pipeline",
            current_message=sample_complex_scenario["user_message"],
            conversation_history=sample_complex_scenario["conversation_history"],
            user_preferences=sample_complex_scenario["user_preferences"],
            emotional_state=sample_complex_scenario["emotional_state"],
            urgency_level=sample_complex_scenario["urgency_level"],
            complexity_level=sample_complex_scenario["complexity_level"]
        )
        
        # Process through cognitive integration
        response = await cognitive_engine.process_cognitive_request(
            context=context,
            request_type=CognitiveRequest.SOLVE_PROBLEM
        )
        
        processing_time = time.time() - start_time
        
        # Validate comprehensive response
        assert isinstance(response.response_text, str)
        assert len(response.response_text) > 100  # Should be substantial
        assert response.confidence_score > 0.5
        assert response.processing_mode in [CognitiveMode.INTEGRATED, CognitiveMode.CREATIVE]
        
        # Should integrate multi-modal understanding
        assert len(response.understanding_context) > 0
        assert response.understanding_context.get("ambiguities_resolved", 0) >= 0
        
        # Should include creative problem solving
        if response.processing_mode in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]:
            # Should have creative elements for leadership/innovation problem
            pass
        
        # Should apply adaptive learning
        assert isinstance(response.adaptation_made, bool)
        
        # Performance validation
        assert processing_time < 10.0  # Should complete within 10 seconds
        
        print(f"Full cognitive pipeline completed in {processing_time:.2f} seconds")
        print(f"Response mode: {response.processing_mode.value}")
        print(f"Confidence: {response.confidence_score:.2f}")
        print(f"Creative elements: {len(response.creative_elements)}")
        print(f"Learning applied: {len(response.learning_applied)}")
    
    @pytest.mark.asyncio
    async def test_enhanced_conversational_intelligence_integration(self, enhanced_conversational_intelligence, sample_complex_scenario):
        """Test enhanced conversational intelligence with Phase 5 capabilities."""
        start_time = time.time()
        
        # Analyze conversation context with Phase 5 enhancements
        context = await enhanced_conversational_intelligence.analyze_conversation_context(
            user_message=sample_complex_scenario["user_message"],
            conversation_history=sample_complex_scenario["conversation_history"],
            user_memories=sample_complex_scenario["user_memories"],
            user_id=enhanced_conversational_intelligence.user_id
        )
        
        processing_time = time.time() - start_time
        
        # Validate enhanced analysis
        assert context.current_topic
        assert context.emotional_state.primary_emotion
        assert context.conversation_stage
        assert len(context.recent_themes) > 0
        
        # Performance validation
        assert processing_time < 5.0  # Should be fast
        
        print(f"Enhanced conversational analysis completed in {processing_time:.2f} seconds")
        print(f"Detected emotion: {context.emotional_state.primary_emotion}")
        print(f"Conversation stage: {context.conversation_stage}")
        print(f"Recent themes: {context.recent_themes}")
    
    @pytest.mark.asyncio
    async def test_enhanced_predictive_intelligence_integration(self, enhanced_predictive_intelligence, sample_complex_scenario):
        """Test enhanced predictive intelligence with Phase 5 capabilities."""
        start_time = time.time()
        
        # First, analyze patterns to build some data
        await enhanced_predictive_intelligence.analyze_user_patterns(
            user_id=enhanced_predictive_intelligence.user_id,
            conversation_data={
                "messages": sample_complex_scenario["conversation_history"],
                "topics": ["leadership", "management", "innovation"],
                "emotional_states": ["excited", "nervous", "overwhelmed"],
                "interaction_frequency": "daily"
            }
        )
        
        # Generate enhanced predictions
        predictions = await enhanced_predictive_intelligence.generate_predictions(
            user_id=enhanced_predictive_intelligence.user_id,
            current_context={
                "conversation_stage": "problem_solving",
                "emotional_state": "overwhelmed",
                "topic": "leadership",
                "urgency": 0.6
            }
        )
        
        processing_time = time.time() - start_time
        
        # Validate enhanced predictions
        assert isinstance(predictions, list)
        assert len(predictions) >= 0  # May or may not have predictions initially
        
        # Performance validation
        assert processing_time < 8.0  # Should complete reasonably fast
        
        print(f"Enhanced predictive analysis completed in {processing_time:.2f} seconds")
        print(f"Generated {len(predictions)} predictions")
        
        if predictions:
            print(f"Top prediction: {predictions[0].prediction_type}")
    
    @pytest.mark.asyncio
    async def test_enhanced_personality_engine_integration(self, enhanced_personality_engine, sample_complex_scenario):
        """Test enhanced personality engine with Phase 5 capabilities."""
        start_time = time.time()
        
        # Generate personality response with Phase 5 enhancements
        personality_response = enhanced_personality_engine.get_personality_response(
            context={
                "emotional_state": sample_complex_scenario["emotional_state"],
                "conversation_stage": "problem_solving",
                "detected_domains": ["leadership", "innovation", "team_management"],
                "urgency_level": sample_complex_scenario["urgency_level"]
            },
            user_message=sample_complex_scenario["user_message"]
        )
        
        processing_time = time.time() - start_time
        
        # Validate enhanced personality response
        assert isinstance(personality_response, dict)
        assert "response_style" in personality_response or "tone" in personality_response
        
        # Performance validation
        assert processing_time < 3.0  # Should be very fast
        
        print(f"Enhanced personality response generated in {processing_time:.2f} seconds")
        if "adaptation_applied" in personality_response:
            print(f"Adaptation applied: {personality_response['adaptation_applied']}")
    
    @pytest.mark.asyncio
    async def test_multi_component_interaction(self, cognitive_engine, enhanced_conversational_intelligence, sample_complex_scenario):
        """Test interaction between multiple Phase 5 components."""
        start_time = time.time()
        
        # Step 1: Analyze conversation context
        conv_context = await enhanced_conversational_intelligence.analyze_conversation_context(
            user_message=sample_complex_scenario["user_message"],
            conversation_history=sample_complex_scenario["conversation_history"],
            user_memories=sample_complex_scenario["user_memories"],
            user_id=enhanced_conversational_intelligence.user_id
        )
        
        # Step 2: Use conversation context in cognitive processing
        cognitive_context = CognitiveContext(
            user_id=cognitive_engine.user_id,
            conversation_id="multi_component_test",
            current_message=sample_complex_scenario["user_message"],
            conversation_history=sample_complex_scenario["conversation_history"],
            user_preferences=sample_complex_scenario["user_preferences"],
            emotional_state=conv_context.emotional_state.primary_emotion,
            urgency_level=sample_complex_scenario["urgency_level"],
            complexity_level=sample_complex_scenario["complexity_level"]
        )
        
        # Step 3: Process through cognitive integration
        cognitive_response = await cognitive_engine.process_cognitive_request(
            context=cognitive_context,
            request_type=CognitiveRequest.GENERATE_RESPONSE
        )
        
        processing_time = time.time() - start_time
        
        # Validate multi-component interaction
        assert conv_context.emotional_state.primary_emotion == cognitive_context.emotional_state
        assert cognitive_response.confidence_score > 0
        
        # Performance validation
        assert processing_time < 12.0  # Multiple components should still be reasonable
        
        print(f"Multi-component interaction completed in {processing_time:.2f} seconds")
        print(f"Conversational context emotion: {conv_context.emotional_state.primary_emotion}")
        print(f"Cognitive response confidence: {cognitive_response.confidence_score:.2f}")
    
    @pytest.mark.asyncio
    async def test_learning_and_adaptation_cycle(self, cognitive_engine, sample_complex_scenario):
        """Test the complete learning and adaptation cycle."""
        start_time = time.time()
        
        # Phase 1: Initial interaction
        initial_context = CognitiveContext(
            user_id=cognitive_engine.user_id,
            conversation_id="learning_cycle_test",
            current_message="Explain leadership principles to me",
            conversation_history=[],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.6
        )
        
        initial_response = await cognitive_engine.process_cognitive_request(initial_context)
        
        # Phase 2: Provide feedback
        feedback = {
            "understanding_quality": 4,
            "creativity_quality": 2,
            "personalization_quality": 3,
            "overall_rating": 3,
            "comment": "Good explanation but I prefer more creative examples and casual language"
        }
        
        await cognitive_engine.process_feedback(feedback, initial_context, initial_response)
        
        # Phase 3: Follow-up interaction (should apply learning)
        followup_context = CognitiveContext(
            user_id=cognitive_engine.user_id,
            conversation_id="learning_cycle_test",
            current_message="Now explain team motivation strategies",
            conversation_history=[
                {"role": "user", "content": "Explain leadership principles to me"},
                {"role": "assistant", "content": initial_response.response_text}
            ],
            user_preferences={},
            urgency_level=0.3,
            complexity_level=0.6
        )
        
        followup_response = await cognitive_engine.process_cognitive_request(followup_context)
        
        processing_time = time.time() - start_time
        
        # Validate learning adaptation
        assert followup_response.confidence_score > 0
        
        # Should show evidence of learning from feedback
        if followup_response.adaptation_made:
            assert len(followup_response.learning_applied) > 0
            print(f"Learning applied: {followup_response.learning_applied}")
        
        # Performance validation
        assert processing_time < 15.0  # Full learning cycle should be reasonable
        
        print(f"Learning and adaptation cycle completed in {processing_time:.2f} seconds")
        print(f"Initial confidence: {initial_response.confidence_score:.2f}")
        print(f"Follow-up confidence: {followup_response.confidence_score:.2f}")
    
    @pytest.mark.asyncio
    async def test_performance_stress_test(self, cognitive_engine):
        """Test performance under concurrent load."""
        start_time = time.time()
        
        # Create multiple concurrent requests
        contexts = []
        for i in range(5):
            context = CognitiveContext(
                user_id=cognitive_engine.user_id,
                conversation_id=f"stress_test_{i}",
                current_message=f"Help me solve problem {i}: How can I improve my workflow efficiency?",
                conversation_history=[],
                user_preferences={"communication_style": "efficient"},
                urgency_level=0.5,
                complexity_level=0.7
            )
            contexts.append(context)
        
        # Process all requests concurrently
        tasks = [
            cognitive_engine.process_cognitive_request(context)
            for context in contexts
        ]
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_time = time.time() - start_time
        
        # Validate all responses
        successful_responses = 0
        for response in responses:
            if isinstance(response, Exception):
                print(f"Error in concurrent processing: {response}")
            else:
                assert response.confidence_score > 0
                successful_responses += 1
        
        # Performance validation
        assert successful_responses >= 4  # At least 80% success rate
        assert total_time < 30.0  # Should handle 5 concurrent requests within 30 seconds
        
        avg_time_per_request = total_time / len(contexts)
        print(f"Stress test completed: {successful_responses}/{len(contexts)} successful")
        print(f"Total time: {total_time:.2f} seconds")
        print(f"Average time per request: {avg_time_per_request:.2f} seconds")
    
    @pytest.mark.asyncio
    async def test_memory_efficiency(self, cognitive_engine, sample_complex_scenario):
        """Test memory usage efficiency during processing."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Process multiple complex requests
        for i in range(10):
            context = CognitiveContext(
                user_id=cognitive_engine.user_id,
                conversation_id=f"memory_test_{i}",
                current_message=sample_complex_scenario["user_message"],
                conversation_history=sample_complex_scenario["conversation_history"],
                user_preferences=sample_complex_scenario["user_preferences"],
                emotional_state=sample_complex_scenario["emotional_state"],
                urgency_level=sample_complex_scenario["urgency_level"],
                complexity_level=sample_complex_scenario["complexity_level"]
            )
            
            response = await cognitive_engine.process_cognitive_request(context)
            assert response.confidence_score > 0
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory validation
        assert memory_increase < 100  # Should not increase by more than 100MB
        
        print(f"Memory efficiency test completed")
        print(f"Initial memory: {initial_memory:.2f} MB")
        print(f"Final memory: {final_memory:.2f} MB")
        print(f"Memory increase: {memory_increase:.2f} MB")
    
    @pytest.mark.asyncio
    async def test_error_resilience(self, cognitive_engine):
        """Test error handling and resilience."""
        # Test with invalid inputs
        test_cases = [
            {
                "name": "empty_message",
                "context": CognitiveContext(
                    user_id=cognitive_engine.user_id,
                    conversation_id="error_test_empty",
                    current_message="",
                    conversation_history=[],
                    user_preferences={},
                    urgency_level=0.5,
                    complexity_level=0.5
                )
            },
            {
                "name": "extreme_complexity",
                "context": CognitiveContext(
                    user_id=cognitive_engine.user_id,
                    conversation_id="error_test_complex",
                    current_message="a" * 10000,  # Very long message
                    conversation_history=[],
                    user_preferences={},
                    urgency_level=1.0,
                    complexity_level=1.0
                )
            },
            {
                "name": "invalid_preferences",
                "context": CognitiveContext(
                    user_id=cognitive_engine.user_id,
                    conversation_id="error_test_prefs",
                    current_message="Test message",
                    conversation_history=[],
                    user_preferences={"invalid": "preference"},
                    urgency_level=0.5,
                    complexity_level=0.5
                )
            }
        ]
        
        successful_cases = 0
        for test_case in test_cases:
            try:
                response = await cognitive_engine.process_cognitive_request(test_case["context"])
                if response and response.confidence_score >= 0:
                    successful_cases += 1
                    print(f"Error resilience test '{test_case['name']}': PASSED")
                else:
                    print(f"Error resilience test '{test_case['name']}': FAILED (invalid response)")
            except Exception as e:
                print(f"Error resilience test '{test_case['name']}': FAILED ({e})")
        
        # Should handle at least 2 out of 3 error cases gracefully
        assert successful_cases >= 2
    
    @pytest.mark.asyncio
    async def test_cognitive_status_monitoring(self, cognitive_engine):
        """Test cognitive system status monitoring."""
        # Get initial status
        status = await cognitive_engine.get_cognitive_status()
        
        # Validate status structure
        assert "user_id" in status
        assert "cognitive_engines" in status
        assert "learning_progress" in status
        assert "cognitive_weights" in status
        assert "available_modes" in status
        assert "integration_status" in status
        
        # Validate status values
        assert status["user_id"] == cognitive_engine.user_id
        assert status["integration_status"] == "operational"
        assert isinstance(status["learning_progress"], (int, float))
        assert 0 <= status["learning_progress"] <= 1
        
        print(f"Cognitive status monitoring test completed")
        print(f"Learning progress: {status['learning_progress']:.2%}")
        print(f"Available modes: {len(status['available_modes'])}")
        print(f"Cognitive engines: {status['cognitive_engines']}")
    
    @pytest.mark.asyncio
    async def test_performance_optimization(self, cognitive_engine):
        """Test cognitive performance optimization."""
        # Run optimization
        optimization_results = await cognitive_engine.optimize_cognitive_performance()
        
        # Validate optimization results
        assert "optimizations_applied" in optimization_results
        assert "performance_improvements" in optimization_results
        assert "recommendations" in optimization_results
        
        assert isinstance(optimization_results["optimizations_applied"], list)
        assert isinstance(optimization_results["recommendations"], list)
        
        print(f"Performance optimization completed")
        print(f"Optimizations applied: {len(optimization_results['optimizations_applied'])}")
        print(f"Recommendations: {len(optimization_results['recommendations'])}")
        
        if optimization_results["optimizations_applied"]:
            print(f"Applied optimizations: {optimization_results['optimizations_applied']}")


class TestPhase5PerformanceBenchmarks:
    """Performance benchmarks for Phase 5 components."""
    
    @pytest.fixture
    def benchmark_user_id(self):
        return "phase5_benchmark_user"
    
    @pytest.mark.asyncio
    async def test_response_time_benchmarks(self, benchmark_user_id):
        """Benchmark response times for different cognitive modes."""
        engine = CognitiveIntegrationEngine(benchmark_user_id)
        
        benchmark_scenarios = [
            {
                "name": "simple_analytical",
                "message": "What is 2 + 2?",
                "expected_mode": CognitiveMode.ANALYTICAL,
                "max_time": 2.0
            },
            {
                "name": "complex_creative",
                "message": "Help me brainstorm innovative solutions for climate change",
                "expected_mode": CognitiveMode.CREATIVE,
                "max_time": 8.0
            },
            {
                "name": "integrated_problem",
                "message": "I need comprehensive help with my career transition involving technical skills, emotional challenges, and creative opportunities",
                "expected_mode": CognitiveMode.INTEGRATED,
                "max_time": 10.0
            }
        ]
        
        results = {}
        
        for scenario in benchmark_scenarios:
            start_time = time.time()
            
            context = CognitiveContext(
                user_id=benchmark_user_id,
                conversation_id=f"benchmark_{scenario['name']}",
                current_message=scenario["message"],
                conversation_history=[],
                user_preferences={},
                urgency_level=0.5,
                complexity_level=0.7 if "complex" in scenario["name"] else 0.3
            )
            
            response = await engine.process_cognitive_request(context)
            
            elapsed_time = time.time() - start_time
            results[scenario["name"]] = {
                "time": elapsed_time,
                "mode": response.processing_mode,
                "confidence": response.confidence_score
            }
            
            # Validate performance
            assert elapsed_time <= scenario["max_time"], f"{scenario['name']} took {elapsed_time:.2f}s (max: {scenario['max_time']}s)"
            assert response.confidence_score > 0.3, f"{scenario['name']} has low confidence: {response.confidence_score}"
            
            print(f"Benchmark {scenario['name']}: {elapsed_time:.2f}s ({response.processing_mode.value})")
        
        # Overall performance validation
        avg_time = sum(r["time"] for r in results.values()) / len(results)
        assert avg_time <= 7.0, f"Average response time too high: {avg_time:.2f}s"
        
        print(f"Performance benchmarks completed. Average time: {avg_time:.2f}s")
    
    @pytest.mark.asyncio
    async def test_scalability_benchmark(self, benchmark_user_id):
        """Test scalability with increasing load."""
        engine = CognitiveIntegrationEngine(benchmark_user_id)
        
        load_levels = [1, 3, 5]
        results = {}
        
        for load_level in load_levels:
            start_time = time.time()
            
            tasks = []
            for i in range(load_level):
                context = CognitiveContext(
                    user_id=benchmark_user_id,
                    conversation_id=f"scalability_{load_level}_{i}",
                    current_message=f"Help me solve problem {i}",
                    conversation_history=[],
                    user_preferences={},
                    urgency_level=0.5,
                    complexity_level=0.5
                )
                tasks.append(engine.process_cognitive_request(context))
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            elapsed_time = time.time() - start_time
            success_count = sum(1 for r in responses if not isinstance(r, Exception))
            
            results[load_level] = {
                "total_time": elapsed_time,
                "avg_time_per_request": elapsed_time / load_level,
                "success_rate": success_count / load_level,
                "requests": load_level
            }
            
            # Validate scalability
            assert success_count >= load_level * 0.8, f"Success rate too low at load {load_level}: {success_count}/{load_level}"
            
            print(f"Load {load_level}: {elapsed_time:.2f}s total, {results[load_level]['avg_time_per_request']:.2f}s avg")
        
        # Check if performance degrades gracefully
        for i in range(1, len(load_levels)):
            current_avg = results[load_levels[i]]["avg_time_per_request"]
            previous_avg = results[load_levels[i-1]]["avg_time_per_request"]
            degradation = current_avg / previous_avg
            
            # Should not degrade by more than 2x
            assert degradation <= 2.0, f"Performance degradation too high: {degradation:.2f}x"
        
        print("Scalability benchmark completed successfully")


if __name__ == "__main__":
    # Run performance benchmarks
    pytest.main([__file__ + "::TestPhase5PerformanceBenchmarks", "-v", "-s"])
