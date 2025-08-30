"""
Cognitive Integration Service

This service coordinates all Phase 5 advanced cognitive capabilities,
integrating multi-modal understanding, creative problem solving, and
adaptive learning into a cohesive cognitive system.
"""

import logging
import asyncio
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

from .multi_modal_understanding import MultiModalUnderstandingEngine, MultiModalUnderstanding
from .creative_problem_solving import CreativeProblemSolvingEngine, CreativeSession
from .adaptive_learning import AdaptiveLearningEngine, LearningInsight, AdaptationResult

logger = logging.getLogger(__name__)


class CognitiveMode(Enum):
    """Different cognitive processing modes."""
    ANALYTICAL = "analytical"          # Logical, step-by-step processing
    CREATIVE = "creative"              # Innovative, out-of-the-box thinking
    ADAPTIVE = "adaptive"              # Learning-focused, personalized
    INTEGRATED = "integrated"          # Full cognitive capabilities
    FOCUSED = "focused"                # Single capability focus


class CognitiveRequest(Enum):
    """Types of cognitive requests."""
    UNDERSTAND_COMPLEX = "understand_complex"
    SOLVE_PROBLEM = "solve_problem"
    LEARN_ADAPT = "learn_adapt"
    GENERATE_RESPONSE = "generate_response"
    ANALYZE_CONTEXT = "analyze_context"


@dataclass
class CognitiveContext:
    """Context for cognitive processing."""
    user_id: str
    conversation_id: str
    current_message: str
    conversation_history: List[Dict[str, Any]]
    user_preferences: Dict[str, Any]
    emotional_state: Optional[str] = None
    urgency_level: float = 0.5
    complexity_level: float = 0.5


@dataclass
class CognitiveResponse:
    """Integrated cognitive response."""
    response_text: str
    cognitive_insights: List[str]
    learning_applied: List[str]
    creative_elements: List[str]
    understanding_context: Dict[str, Any]
    confidence_score: float
    processing_mode: CognitiveMode
    adaptation_made: bool


class CognitiveIntegrationEngine:
    """
    Master coordinator for all Phase 5 cognitive capabilities.
    
    This engine orchestrates:
    - Multi-modal understanding for complex input processing
    - Creative problem solving for innovative solutions
    - Adaptive learning for continuous personalization
    - Integrated cognitive responses
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        
        # Initialize cognitive engines
        self.understanding_engine = MultiModalUnderstandingEngine()
        self.creative_engine = CreativeProblemSolvingEngine()
        self.learning_engine = AdaptiveLearningEngine(user_id)
        
        # Cognitive coordination parameters
        self.cognitive_weights = {
            "understanding": 0.4,
            "creativity": 0.3,
            "adaptation": 0.3
        }
        
        # Mode selection criteria
        self.mode_triggers = {
            CognitiveMode.ANALYTICAL: ["analyze", "explain", "understand", "clarify"],
            CognitiveMode.CREATIVE: ["creative", "innovative", "brainstorm", "solve", "idea"],
            CognitiveMode.ADAPTIVE: ["prefer", "learn", "remember", "adapt", "personal"],
            CognitiveMode.INTEGRATED: ["complex", "comprehensive", "complete", "thorough"],
            CognitiveMode.FOCUSED: ["focus", "specific", "direct", "simple"]
        }

    async def process_cognitive_request(
        self,
        context: CognitiveContext,
        request_type: CognitiveRequest = CognitiveRequest.GENERATE_RESPONSE
    ) -> CognitiveResponse:
        """
        Process a cognitive request using integrated capabilities.
        
        Args:
            context: The cognitive context for processing
            request_type: Type of cognitive request
            
        Returns:
            Integrated cognitive response
        """
        logger.info(f"Processing cognitive request: {request_type.value}")
        
        # Determine optimal cognitive mode
        cognitive_mode = await self._determine_cognitive_mode(context, request_type)
        
        # Process with multi-modal understanding
        understanding_result = await self._process_understanding(context, cognitive_mode)
        
        # Apply creative problem solving if needed
        creative_result = await self._apply_creative_processing(
            context, understanding_result, cognitive_mode
        )
        
        # Apply adaptive learning
        adaptation_result = await self._apply_adaptive_learning(
            context, understanding_result, creative_result, cognitive_mode
        )
        
        # Integrate all cognitive outputs
        integrated_response = await self._integrate_cognitive_outputs(
            context, understanding_result, creative_result, adaptation_result, cognitive_mode
        )
        
        # Learn from this interaction
        await self._update_cognitive_learning(context, integrated_response)
        
        logger.info(f"Cognitive processing completed in {cognitive_mode.value} mode")
        return integrated_response

    async def _determine_cognitive_mode(
        self,
        context: CognitiveContext,
        request_type: CognitiveRequest
    ) -> CognitiveMode:
        """Determine the optimal cognitive processing mode."""
        
        message_lower = context.current_message.lower()
        
        # Count trigger words for each mode
        mode_scores = {}
        for mode, triggers in self.mode_triggers.items():
            score = sum(1 for trigger in triggers if trigger in message_lower)
            mode_scores[mode] = score
        
        # Factor in context complexity and user preferences
        if context.complexity_level > 0.7:
            mode_scores[CognitiveMode.INTEGRATED] += 2
        
        if context.urgency_level > 0.8:
            mode_scores[CognitiveMode.FOCUSED] += 1
        
        # Check for problem-solving context
        problem_indicators = ["problem", "issue", "challenge", "stuck", "help", "solution"]
        if any(indicator in message_lower for indicator in problem_indicators):
            mode_scores[CognitiveMode.CREATIVE] += 2
        
        # Select mode with highest score
        if mode_scores:
            selected_mode = max(mode_scores.items(), key=lambda x: x[1])[0]
            if mode_scores[selected_mode] > 0:
                return selected_mode
        
        # Default to integrated mode for comprehensive processing
        return CognitiveMode.INTEGRATED

    async def _process_understanding(
        self,
        context: CognitiveContext,
        mode: CognitiveMode
    ) -> MultiModalUnderstanding:
        """Process input through multi-modal understanding engine."""
        
        try:
            understanding = await self.understanding_engine.understand_complex_input(
                message=context.current_message,
                conversation_history=context.conversation_history,
                user_memories=[],  # Would be populated from memory system
                emotional_context={"emotion": context.emotional_state} if context.emotional_state else None
            )
            
            logger.info(f"Multi-modal understanding completed with confidence: {understanding.confidence_score}")
            return understanding
            
        except Exception as e:
            logger.error(f"Understanding processing failed: {e}")
            # Return minimal understanding
            from .multi_modal_understanding import NonVerbalCues
            
            return MultiModalUnderstanding(
                resolved_meaning=context.current_message,
                ambiguity_resolutions=[],
                implicit_meanings=[],
                non_verbal_cues=NonVerbalCues(
                    urgency_level=context.urgency_level,
                    confidence_level=0.5,
                    hesitation_indicators=[],
                    emotional_subtext=context.emotional_state or "neutral",
                    timing_implications=[]
                ),
                confidence_score=0.5,
                context_used=[]
            )

    async def _apply_creative_processing(
        self,
        context: CognitiveContext,
        understanding: MultiModalUnderstanding,
        mode: CognitiveMode
    ) -> Optional[CreativeSession]:
        """Apply creative problem solving if appropriate."""
        
        # Only apply creative processing for certain modes and contexts
        if mode not in [CognitiveMode.CREATIVE, CognitiveMode.INTEGRATED]:
            return None
        
        # Check if creative processing is needed
        creative_triggers = ["solve", "idea", "creative", "innovative", "brainstorm", "problem"]
        if not any(trigger in understanding.resolved_meaning.lower() for trigger in creative_triggers):
            return None
        
        try:
            # Extract problem context from understanding
            problem_statement = understanding.resolved_meaning
            
            # Determine problem type from context
            problem_type = self._infer_problem_type_from_understanding(understanding)
            
            # Apply creative problem solving
            creative_session = await self.creative_engine.solve_problem_creatively(
                problem_statement=problem_statement,
                problem_type=problem_type,
                constraints=[],  # Would extract from context
                context={
                    "user_id": context.user_id,
                    "conversation_id": context.conversation_id,
                    "urgency": context.urgency_level
                },
                user_preferences=context.user_preferences
            )
            
            logger.info(f"Creative processing generated {len(creative_session.solutions)} solutions")
            return creative_session
            
        except Exception as e:
            logger.error(f"Creative processing failed: {e}")
            return None

    async def _apply_adaptive_learning(
        self,
        context: CognitiveContext,
        understanding: MultiModalUnderstanding,
        creative_result: Optional[CreativeSession],
        mode: CognitiveMode
    ) -> Optional[AdaptationResult]:
        """Apply adaptive learning to improve responses."""
        
        try:
            # Prepare conversation data for learning
            conversation_data = {
                "conversation_id": context.conversation_id,
                "message_count": len(context.conversation_history),
                "user_questions": sum(1 for msg in context.conversation_history if "?" in msg.get("content", "")),
                "topics": self._extract_topics_from_history(context.conversation_history),
                "complexity_level": context.complexity_level
            }
            
            # Learn from the interaction
            insights = await self.learning_engine.learn_from_interaction(
                conversation_data=conversation_data,
                user_feedback=None,  # Would come from explicit feedback
                context={
                    "understanding_confidence": understanding.confidence_score,
                    "creative_solutions": len(creative_result.solutions) if creative_result else 0,
                    "cognitive_mode": mode.value
                }
            )
            
            # Adapt response generation
            base_response = self._generate_base_response(understanding, creative_result)
            
            from .adaptive_learning import AdaptationScope
            adapted_response, adaptation_result = await self.learning_engine.adapt_response_generation(
                context={
                    "user_emotion": context.emotional_state,
                    "urgency": context.urgency_level,
                    "complexity": context.complexity_level
                },
                base_response=base_response,
                adaptation_scope=AdaptationScope.SESSION
            )
            
            logger.info(f"Adaptive learning applied {len(adaptation_result.changes_made)} adaptations")
            return adaptation_result
            
        except Exception as e:
            logger.error(f"Adaptive learning failed: {e}")
            return None

    async def _integrate_cognitive_outputs(
        self,
        context: CognitiveContext,
        understanding: MultiModalUnderstanding,
        creative_result: Optional[CreativeSession],
        adaptation_result: Optional[AdaptationResult],
        mode: CognitiveMode
    ) -> CognitiveResponse:
        """Integrate all cognitive processing outputs into a cohesive response."""
        
        # Start with base understanding
        response_parts = [understanding.resolved_meaning]
        cognitive_insights = []
        learning_applied = []
        creative_elements = []
        
        # Add understanding insights
        if understanding.ambiguity_resolutions:
            cognitive_insights.append(f"Resolved {len(understanding.ambiguity_resolutions)} ambiguities")
        
        if understanding.implicit_meanings:
            cognitive_insights.append(f"Detected {len(understanding.implicit_meanings)} implicit meanings")
        
        # Integrate creative solutions
        if creative_result and creative_result.solutions:
            best_solution = creative_result.recommended_solution or creative_result.solutions[0]
            response_parts.append(f"\nCreative approach: {best_solution.solution_text}")
            creative_elements.append(f"Applied {best_solution.method_used.value} method")
            creative_elements.extend(best_solution.implementation_steps[:2])  # Top 2 steps
        
        # Apply adaptations
        if adaptation_result and adaptation_result.changes_made:
            learning_applied.extend(adaptation_result.changes_made)
            # The adapted response would be used here
        
        # Construct final response
        final_response = self._construct_final_response(
            response_parts, understanding, creative_result, adaptation_result, mode
        )
        
        # Calculate overall confidence
        confidence_factors = [understanding.confidence_score]
        if creative_result:
            confidence_factors.append(creative_result.confidence_score)
        if adaptation_result:
            confidence_factors.append(adaptation_result.confidence)
        
        overall_confidence = sum(confidence_factors) / len(confidence_factors)
        
        return CognitiveResponse(
            response_text=final_response,
            cognitive_insights=cognitive_insights,
            learning_applied=learning_applied,
            creative_elements=creative_elements,
            understanding_context={
                "ambiguities_resolved": len(understanding.ambiguity_resolutions),
                "implicit_meanings": len(understanding.implicit_meanings),
                "context_used": understanding.context_used
            },
            confidence_score=overall_confidence,
            processing_mode=mode,
            adaptation_made=adaptation_result is not None and len(adaptation_result.changes_made) > 0
        )

    def _construct_final_response(
        self,
        response_parts: List[str],
        understanding: MultiModalUnderstanding,
        creative_result: Optional[CreativeSession],
        adaptation_result: Optional[AdaptationResult],
        mode: CognitiveMode
    ) -> str:
        """Construct the final integrated response."""
        
        # Base response from understanding
        final_response = understanding.resolved_meaning
        
        # Add creative insights if available
        if creative_result and creative_result.recommended_solution:
            solution = creative_result.recommended_solution
            if mode == CognitiveMode.CREATIVE:
                final_response = solution.solution_text
            else:
                # Integrate creative elements naturally
                final_response += f"\n\nHere's a creative approach: {solution.solution_text}"
        
        # Apply learned adaptations if available
        if adaptation_result and hasattr(adaptation_result, 'adapted_response'):
            final_response = getattr(adaptation_result, 'adapted_response', final_response)
        
        # Add cognitive insights for transparency (optional)
        if mode == CognitiveMode.INTEGRATED:
            insights = []
            if understanding.confidence_score > 0.8:
                insights.append("I have high confidence in understanding your request")
            if creative_result and len(creative_result.solutions) > 3:
                insights.append(f"I generated {len(creative_result.solutions)} creative approaches")
            
            if insights:
                final_response += f"\n\n*Cognitive note: {' and '.join(insights)}.*"
        
        return final_response

    async def _update_cognitive_learning(
        self,
        context: CognitiveContext,
        response: CognitiveResponse
    ) -> None:
        """Update learning based on cognitive processing results."""
        
        try:
            # Prepare learning data
            interaction_data = {
                "conversation_id": context.conversation_id,
                "cognitive_mode": response.processing_mode.value,
                "confidence_achieved": response.confidence_score,
                "adaptations_applied": len(response.learning_applied),
                "creative_elements_used": len(response.creative_elements)
            }
            
            # Update learning engine with interaction results
            await self.learning_engine.learn_from_interaction(
                conversation_data=interaction_data,
                context={
                    "cognitive_integration": True,
                    "mode_effectiveness": response.confidence_score,
                    "adaptation_success": response.adaptation_made
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to update cognitive learning: {e}")

    def _infer_problem_type_from_understanding(
        self,
        understanding: MultiModalUnderstanding
    ) -> str:
        """Infer problem type from multi-modal understanding results."""
        
        text = understanding.resolved_meaning.lower()
        
        # Technical problem indicators
        if any(word in text for word in ["code", "software", "system", "bug", "technical"]):
            return "technical"
        
        # Personal problem indicators
        if any(word in text for word in ["feel", "relationship", "personal", "emotion"]):
            return "personal"
        
        # Business problem indicators
        if any(word in text for word in ["business", "work", "project", "team"]):
            return "business"
        
        # Creative problem indicators
        if any(word in text for word in ["design", "creative", "art", "innovative"]):
            return "creative"
        
        return "personal"  # Default

    def _extract_topics_from_history(self, history: List[Dict[str, Any]]) -> List[str]:
        """Extract topics from conversation history."""
        
        topics = []
        for message in history:
            content = message.get("content", "").lower()
            # Simple topic extraction (would be more sophisticated in practice)
            if "work" in content:
                topics.append("work")
            if "family" in content:
                topics.append("family")
            if "health" in content:
                topics.append("health")
            if "technology" in content:
                topics.append("technology")
        
        return list(set(topics))  # Remove duplicates

    def _generate_base_response(
        self,
        understanding: MultiModalUnderstanding,
        creative_result: Optional[CreativeSession]
    ) -> str:
        """Generate a base response before adaptation."""
        
        base_response = f"I understand you're saying: {understanding.resolved_meaning}"
        
        if creative_result and creative_result.recommended_solution:
            base_response += f" Here's a suggested approach: {creative_result.recommended_solution.solution_text}"
        
        return base_response

    async def get_cognitive_status(self) -> Dict[str, Any]:
        """Get the current status of cognitive capabilities."""
        
        learning_summary = await self.learning_engine.get_learning_summary()
        
        return {
            "user_id": self.user_id,
            "cognitive_engines": {
                "understanding": "active",
                "creative": "active",
                "adaptive": "active"
            },
            "learning_progress": learning_summary.get("overall_learning_progress", 0.0),
            "stable_preferences": len(learning_summary.get("stable_preferences", {})),
            "cognitive_weights": self.cognitive_weights,
            "available_modes": [mode.value for mode in CognitiveMode],
            "integration_status": "operational"
        }

    async def update_cognitive_weights(self, new_weights: Dict[str, float]) -> None:
        """Update the weights for different cognitive capabilities."""
        
        # Validate weights sum to 1.0
        total_weight = sum(new_weights.values())
        if abs(total_weight - 1.0) > 0.01:
            logger.warning(f"Cognitive weights don't sum to 1.0: {total_weight}")
            # Normalize weights
            new_weights = {k: v / total_weight for k, v in new_weights.items()}
        
        self.cognitive_weights.update(new_weights)
        logger.info(f"Updated cognitive weights: {self.cognitive_weights}")

    async def process_feedback(
        self,
        feedback: Dict[str, Any],
        context: CognitiveContext,
        response: CognitiveResponse
    ) -> None:
        """Process user feedback to improve cognitive integration."""
        
        try:
            # Extract feedback about different cognitive aspects
            understanding_feedback = feedback.get("understanding_quality")
            creativity_feedback = feedback.get("creativity_quality")
            adaptation_feedback = feedback.get("personalization_quality")
            
            # Update learning engine with feedback
            await self.learning_engine.learn_from_interaction(
                conversation_data={
                    "conversation_id": context.conversation_id,
                    "cognitive_mode": response.processing_mode.value,
                    "response_confidence": response.confidence_score
                },
                user_feedback=feedback,
                context={
                    "cognitive_integration": True,
                    "understanding_used": len(response.understanding_context) > 0,
                    "creativity_used": len(response.creative_elements) > 0,
                    "adaptation_used": response.adaptation_made
                }
            )
            
            # Adjust cognitive weights based on feedback
            if understanding_feedback and creativity_feedback and adaptation_feedback:
                # Simple weight adjustment based on relative feedback scores
                feedback_scores = {
                    "understanding": understanding_feedback,
                    "creativity": creativity_feedback,
                    "adaptation": adaptation_feedback
                }
                
                # Adjust weights towards better-performing capabilities
                best_aspect = max(feedback_scores.items(), key=lambda x: x[1])[0]
                if feedback_scores[best_aspect] > 4:  # Assuming 1-5 scale
                    adjustment = 0.05
                    if best_aspect == "understanding":
                        self.cognitive_weights["understanding"] += adjustment
                    elif best_aspect == "creativity":
                        self.cognitive_weights["creativity"] += adjustment
                    elif best_aspect == "adaptation":
                        self.cognitive_weights["adaptation"] += adjustment
                    
                    # Renormalize weights
                    total = sum(self.cognitive_weights.values())
                    self.cognitive_weights = {k: v / total for k, v in self.cognitive_weights.items()}
            
            logger.info("Processed cognitive feedback and updated system")
            
        except Exception as e:
            logger.error(f"Failed to process cognitive feedback: {e}")

    async def optimize_cognitive_performance(self) -> Dict[str, Any]:
        """Optimize cognitive performance based on historical data."""
        
        optimization_results = {
            "optimizations_applied": [],
            "performance_improvements": {},
            "recommendations": []
        }
        
        try:
            # Analyze learning engine performance
            learning_summary = await self.learning_engine.get_learning_summary()
            
            # Optimize based on learning progress
            if learning_summary.get("overall_learning_progress", 0) < 0.3:
                # Increase learning focus
                self.cognitive_weights["adaptation"] += 0.1
                optimization_results["optimizations_applied"].append("Increased adaptive learning focus")
            
            # Optimize based on recent cognitive mode usage
            # This would analyze which modes are most effective
            
            # Renormalize weights if changed
            total = sum(self.cognitive_weights.values())
            if abs(total - 1.0) > 0.01:
                self.cognitive_weights = {k: v / total for k, v in self.cognitive_weights.items()}
                optimization_results["optimizations_applied"].append("Renormalized cognitive weights")
            
            # Generate recommendations
            if learning_summary.get("learning_gaps", 0) > 3:
                optimization_results["recommendations"].append(
                    "Focus on gathering more user preference data"
                )
            
            logger.info("Cognitive performance optimization completed")
            
        except Exception as e:
            logger.error(f"Cognitive optimization failed: {e}")
            optimization_results["error"] = str(e)
        
        return optimization_results
