"""
Adaptive Learning Engine

This service provides continuous learning and adaptation capabilities to improve
the AI companion's performance over time. It learns user preferences, adapts
response generation, and implements continuous improvement systems.
"""

import logging
import json
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from collections import defaultdict, deque
import asyncio

logger = logging.getLogger(__name__)


class LearningType(Enum):
    """Types of learning that can be performed."""
    PREFERENCE_LEARNING = "preference_learning"
    BEHAVIORAL_ADAPTATION = "behavioral_adaptation"
    RESPONSE_OPTIMIZATION = "response_optimization"
    CONTEXTUAL_LEARNING = "contextual_learning"
    FEEDBACK_INTEGRATION = "feedback_integration"


class AdaptationScope(Enum):
    """Scope of adaptation."""
    IMMEDIATE = "immediate"          # Current conversation
    SESSION = "session"              # Current session
    SHORT_TERM = "short_term"        # Recent interactions (days)
    LONG_TERM = "long_term"          # Extended history (weeks/months)
    PERMANENT = "permanent"          # Persistent learning


@dataclass
class UserPreference:
    """A learned user preference."""
    preference_type: str
    preference_value: Any
    confidence: float
    evidence_count: int
    last_updated: datetime
    context: Optional[str] = None
    stability_score: float = 0.5  # How stable/consistent this preference is


@dataclass
class LearningEvent:
    """An event that contributes to learning."""
    event_type: LearningType
    data: Dict[str, Any]
    timestamp: datetime
    confidence: float
    context: str
    user_feedback: Optional[str] = None


@dataclass
class AdaptationResult:
    """Result of an adaptation process."""
    adaptation_type: LearningType
    changes_made: List[str]
    confidence: float
    expected_impact: str
    rollback_info: Optional[Dict[str, Any]] = None


@dataclass
class LearningInsight:
    """An insight discovered through learning."""
    insight_text: str
    insight_type: str
    supporting_evidence: List[str]
    confidence: float
    actionable_recommendations: List[str]


class AdaptiveLearningEngine:
    """
    Advanced engine for continuous learning and adaptation.
    
    This engine provides:
    - User preference learning from behavior and feedback
    - Adaptive response generation based on learned patterns
    - Continuous improvement through feedback integration
    - Contextual learning for better personalization
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        
        # Learning storage
        self.user_preferences: Dict[str, UserPreference] = {}
        self.learning_history: deque = deque(maxlen=1000)  # Recent learning events
        self.adaptation_history: List[AdaptationResult] = []
        
        # Learning parameters
        self.learning_rate = 0.1
        self.confidence_threshold = 0.7
        self.min_evidence_count = 3
        self.preference_decay_rate = 0.02  # How quickly preferences fade without reinforcement
        
        # Preference categories
        self.preference_categories = {
            "communication_style": ["formal", "casual", "humorous", "direct", "detailed"],
            "response_length": ["brief", "moderate", "detailed", "comprehensive"],
            "proactivity_level": ["reactive", "balanced", "proactive", "highly_proactive"],
            "emotional_support": ["minimal", "moderate", "high", "very_high"],
            "technical_depth": ["basic", "intermediate", "advanced", "expert"],
            "creativity_level": ["practical", "balanced", "creative", "highly_creative"],
            "problem_solving_approach": ["methodical", "intuitive", "collaborative", "independent"]
        }
        
        # Learning weights for different signals
        self.signal_weights = {
            "explicit_feedback": 1.0,
            "conversation_length": 0.3,
            "response_ratings": 0.8,
            "follow_up_questions": 0.4,
            "topic_engagement": 0.5,
            "repetition_patterns": 0.6,
            "correction_requests": 0.9
        }

    async def learn_from_interaction(
        self,
        conversation_data: Dict[str, Any],
        user_feedback: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[LearningInsight]:
        """
        Learn from a user interaction to improve future responses.
        
        Args:
            conversation_data: Data about the conversation
            user_feedback: Explicit user feedback
            context: Additional context information
            
        Returns:
            List of insights gained from the interaction
        """
        logger.info(f"Learning from interaction for user {self.user_id}")
        
        insights = []
        
        # Process explicit feedback
        if user_feedback:
            feedback_insights = await self._process_explicit_feedback(
                user_feedback, conversation_data, context
            )
            insights.extend(feedback_insights)
        
        # Learn from conversation patterns
        pattern_insights = await self._learn_from_conversation_patterns(
            conversation_data, context
        )
        insights.extend(pattern_insights)
        
        # Learn from response effectiveness
        effectiveness_insights = await self._learn_from_response_effectiveness(
            conversation_data, context
        )
        insights.extend(effectiveness_insights)
        
        # Update user preferences based on learning
        await self._update_user_preferences(insights, conversation_data)
        
        # Record learning event
        learning_event = LearningEvent(
            event_type=LearningType.FEEDBACK_INTEGRATION,
            data={
                "conversation_id": conversation_data.get("conversation_id"),
                "insights_count": len(insights),
                "feedback_provided": user_feedback is not None
            },
            timestamp=datetime.now(),
            confidence=self._calculate_learning_confidence(insights),
            context=context.get("context_summary", "general") if context else "general",
            user_feedback=str(user_feedback) if user_feedback else None
        )
        
        self.learning_history.append(learning_event)
        
        logger.info(f"Generated {len(insights)} learning insights")
        return insights

    async def adapt_response_generation(
        self,
        context: Dict[str, Any],
        base_response: str,
        adaptation_scope: AdaptationScope = AdaptationScope.SESSION
    ) -> Tuple[str, AdaptationResult]:
        """
        Adapt response generation based on learned preferences.
        
        Args:
            context: Current conversation context
            base_response: The base response to adapt
            adaptation_scope: Scope of adaptation to apply
            
        Returns:
            Tuple of (adapted_response, adaptation_result)
        """
        logger.info(f"Adapting response generation with scope: {adaptation_scope.value}")
        
        adapted_response = base_response
        changes_made = []
        
        # Apply communication style preferences
        style_adaptation = await self._adapt_communication_style(
            adapted_response, context, adaptation_scope
        )
        if style_adaptation["changed"]:
            adapted_response = style_adaptation["response"]
            changes_made.append(f"Applied {style_adaptation['style']} communication style")
        
        # Apply length preferences
        length_adaptation = await self._adapt_response_length(
            adapted_response, context, adaptation_scope
        )
        if length_adaptation["changed"]:
            adapted_response = length_adaptation["response"]
            changes_made.append(f"Adjusted to {length_adaptation['length']} response length")
        
        # Apply technical depth preferences
        depth_adaptation = await self._adapt_technical_depth(
            adapted_response, context, adaptation_scope
        )
        if depth_adaptation["changed"]:
            adapted_response = depth_adaptation["response"]
            changes_made.append(f"Adjusted to {depth_adaptation['depth']} technical depth")
        
        # Apply emotional support preferences
        emotional_adaptation = await self._adapt_emotional_support(
            adapted_response, context, adaptation_scope
        )
        if emotional_adaptation["changed"]:
            adapted_response = emotional_adaptation["response"]
            changes_made.append(f"Applied {emotional_adaptation['level']} emotional support")
        
        adaptation_result = AdaptationResult(
            adaptation_type=LearningType.RESPONSE_OPTIMIZATION,
            changes_made=changes_made,
            confidence=self._calculate_adaptation_confidence(changes_made),
            expected_impact="Improved response alignment with user preferences",
            rollback_info={"original_response": base_response}
        )
        
        self.adaptation_history.append(adaptation_result)
        
        return adapted_response, adaptation_result

    async def get_personalization_recommendations(
        self,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get recommendations for personalizing the AI's behavior.
        
        Args:
            context: Current context for recommendations
            
        Returns:
            List of personalization recommendations
        """
        recommendations = []
        
        # Analyze current preferences
        stable_preferences = self._get_stable_preferences()
        
        for category, preference in stable_preferences.items():
            if preference.confidence > self.confidence_threshold:
                recommendations.append({
                    "type": "preference_application",
                    "category": category,
                    "recommendation": f"Apply {preference.preference_value} {category}",
                    "confidence": preference.confidence,
                    "reasoning": f"User consistently prefers {preference.preference_value} based on {preference.evidence_count} interactions"
                })
        
        # Identify learning opportunities
        learning_gaps = self._identify_learning_gaps()
        for gap in learning_gaps:
            recommendations.append({
                "type": "learning_opportunity",
                "category": gap["category"],
                "recommendation": gap["action"],
                "confidence": gap["potential_value"],
                "reasoning": gap["reasoning"]
            })
        
        # Suggest adaptation experiments
        experiments = self._suggest_adaptation_experiments(context)
        recommendations.extend(experiments)
        
        return recommendations

    async def _process_explicit_feedback(
        self,
        feedback: Dict[str, Any],
        conversation_data: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> List[LearningInsight]:
        """Process explicit user feedback to extract learning insights."""
        
        insights = []
        
        # Process rating feedback
        if "rating" in feedback:
            rating = feedback["rating"]
            if rating >= 4:  # Positive feedback
                insights.append(LearningInsight(
                    insight_text=f"User rated response highly ({rating}/5)",
                    insight_type="positive_feedback",
                    supporting_evidence=[f"Rating: {rating}"],
                    confidence=0.9,
                    actionable_recommendations=["Reinforce current approach", "Identify successful patterns"]
                ))
            elif rating <= 2:  # Negative feedback
                insights.append(LearningInsight(
                    insight_text=f"User gave low rating ({rating}/5)",
                    insight_type="negative_feedback",
                    supporting_evidence=[f"Rating: {rating}"],
                    confidence=0.9,
                    actionable_recommendations=["Analyze failure points", "Adjust approach"]
                ))
        
        # Process textual feedback
        if "comment" in feedback:
            comment = feedback["comment"].lower()
            
            # Analyze feedback sentiment and content
            if any(word in comment for word in ["too long", "verbose", "lengthy"]):
                insights.append(LearningInsight(
                    insight_text="User prefers shorter responses",
                    insight_type="length_preference",
                    supporting_evidence=[feedback["comment"]],
                    confidence=0.8,
                    actionable_recommendations=["Reduce response length", "Be more concise"]
                ))
            
            if any(word in comment for word in ["more detail", "explain", "elaborate"]):
                insights.append(LearningInsight(
                    insight_text="User wants more detailed responses",
                    insight_type="detail_preference",
                    supporting_evidence=[feedback["comment"]],
                    confidence=0.8,
                    actionable_recommendations=["Increase response detail", "Provide more explanations"]
                ))
            
            if any(word in comment for word in ["too formal", "stiff", "robotic"]):
                insights.append(LearningInsight(
                    insight_text="User prefers more casual communication style",
                    insight_type="style_preference",
                    supporting_evidence=[feedback["comment"]],
                    confidence=0.8,
                    actionable_recommendations=["Use more casual language", "Add personality"]
                ))
        
        return insights

    async def _learn_from_conversation_patterns(
        self,
        conversation_data: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> List[LearningInsight]:
        """Learn from patterns in conversation behavior."""
        
        insights = []
        
        # Analyze conversation length
        message_count = conversation_data.get("message_count", 0)
        if message_count > 10:
            insights.append(LearningInsight(
                insight_text="User engages in long conversations",
                insight_type="engagement_pattern",
                supporting_evidence=[f"Conversation length: {message_count} messages"],
                confidence=0.7,
                actionable_recommendations=["Encourage deeper discussions", "Provide comprehensive responses"]
            ))
        elif message_count < 3:
            insights.append(LearningInsight(
                insight_text="User prefers brief interactions",
                insight_type="engagement_pattern",
                supporting_evidence=[f"Conversation length: {message_count} messages"],
                confidence=0.6,
                actionable_recommendations=["Keep responses concise", "Get to the point quickly"]
            ))
        
        # Analyze question patterns
        questions_asked = conversation_data.get("user_questions", 0)
        if questions_asked > 5:
            insights.append(LearningInsight(
                insight_text="User is highly inquisitive",
                insight_type="interaction_pattern",
                supporting_evidence=[f"Questions asked: {questions_asked}"],
                confidence=0.7,
                actionable_recommendations=["Encourage questions", "Provide detailed explanations"]
            ))
        
        # Analyze topic preferences
        topics_discussed = conversation_data.get("topics", [])
        if topics_discussed:
            frequent_topics = [topic for topic in topics_discussed if topics_discussed.count(topic) > 1]
            if frequent_topics:
                insights.append(LearningInsight(
                    insight_text=f"User shows interest in: {', '.join(frequent_topics)}",
                    insight_type="topic_preference",
                    supporting_evidence=[f"Frequent topics: {frequent_topics}"],
                    confidence=0.8,
                    actionable_recommendations=[f"Proactively discuss {', '.join(frequent_topics)}", "Remember topic preferences"]
                ))
        
        return insights

    async def _learn_from_response_effectiveness(
        self,
        conversation_data: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> List[LearningInsight]:
        """Learn from the effectiveness of AI responses."""
        
        insights = []
        
        # Analyze follow-up patterns
        follow_ups = conversation_data.get("follow_up_questions", 0)
        clarifications = conversation_data.get("clarification_requests", 0)
        
        if clarifications > 2:
            insights.append(LearningInsight(
                insight_text="Responses may lack clarity",
                insight_type="clarity_issue",
                supporting_evidence=[f"Clarification requests: {clarifications}"],
                confidence=0.7,
                actionable_recommendations=["Improve response clarity", "Use simpler language", "Provide examples"]
            ))
        
        if follow_ups > 3:
            insights.append(LearningInsight(
                insight_text="User seeks deeper engagement",
                insight_type="engagement_depth",
                supporting_evidence=[f"Follow-up questions: {follow_ups}"],
                confidence=0.6,
                actionable_recommendations=["Provide more comprehensive initial responses", "Anticipate follow-ups"]
            ))
        
        # Analyze response timing effectiveness
        response_time = conversation_data.get("avg_response_time", 0)
        if response_time > 5:  # seconds
            insights.append(LearningInsight(
                insight_text="Response time may be too slow",
                insight_type="performance_issue",
                supporting_evidence=[f"Average response time: {response_time}s"],
                confidence=0.8,
                actionable_recommendations=["Optimize response generation", "Reduce processing time"]
            ))
        
        return insights

    async def _update_user_preferences(
        self,
        insights: List[LearningInsight],
        conversation_data: Dict[str, Any]
    ) -> None:
        """Update user preferences based on learning insights."""
        
        for insight in insights:
            # Map insights to preference updates
            if insight.insight_type == "length_preference":
                if "shorter" in insight.insight_text:
                    self._update_preference("response_length", "brief", insight.confidence)
                elif "detail" in insight.insight_text:
                    self._update_preference("response_length", "detailed", insight.confidence)
            
            elif insight.insight_type == "style_preference":
                if "casual" in insight.insight_text:
                    self._update_preference("communication_style", "casual", insight.confidence)
                elif "formal" in insight.insight_text:
                    self._update_preference("communication_style", "formal", insight.confidence)
            
            elif insight.insight_type == "engagement_pattern":
                if "long conversations" in insight.insight_text:
                    self._update_preference("proactivity_level", "proactive", insight.confidence)
                elif "brief interactions" in insight.insight_text:
                    self._update_preference("proactivity_level", "reactive", insight.confidence)

    def _update_preference(
        self,
        preference_type: str,
        preference_value: str,
        confidence: float
    ) -> None:
        """Update a specific user preference."""
        
        key = f"{preference_type}:{preference_value}"
        
        if key in self.user_preferences:
            # Update existing preference
            existing = self.user_preferences[key]
            
            # Weighted update of confidence
            new_evidence_count = existing.evidence_count + 1
            new_confidence = (
                existing.confidence * existing.evidence_count + confidence
            ) / new_evidence_count
            
            existing.confidence = new_confidence
            existing.evidence_count = new_evidence_count
            existing.last_updated = datetime.now()
            
            # Update stability score
            existing.stability_score = min(1.0, existing.stability_score + 0.1)
            
        else:
            # Create new preference
            self.user_preferences[key] = UserPreference(
                preference_type=preference_type,
                preference_value=preference_value,
                confidence=confidence,
                evidence_count=1,
                last_updated=datetime.now(),
                stability_score=0.5
            )

    async def _adapt_communication_style(
        self,
        response: str,
        context: Dict[str, Any],
        scope: AdaptationScope
    ) -> Dict[str, Any]:
        """Adapt communication style based on preferences."""
        
        style_prefs = [p for p in self.user_preferences.values() 
                      if p.preference_type == "communication_style" and p.confidence > 0.6]
        
        if not style_prefs:
            return {"changed": False, "response": response}
        
        # Get the most confident style preference
        preferred_style = max(style_prefs, key=lambda x: x.confidence)
        
        adapted_response = response
        
        if preferred_style.preference_value == "casual":
            # Make response more casual
            adapted_response = self._make_response_casual(response)
        elif preferred_style.preference_value == "formal":
            # Make response more formal
            adapted_response = self._make_response_formal(response)
        elif preferred_style.preference_value == "humorous":
            # Add appropriate humor
            adapted_response = self._add_appropriate_humor(response, context)
        
        return {
            "changed": adapted_response != response,
            "response": adapted_response,
            "style": preferred_style.preference_value
        }

    async def _adapt_response_length(
        self,
        response: str,
        context: Dict[str, Any],
        scope: AdaptationScope
    ) -> Dict[str, Any]:
        """Adapt response length based on preferences."""
        
        length_prefs = [p for p in self.user_preferences.values() 
                       if p.preference_type == "response_length" and p.confidence > 0.6]
        
        if not length_prefs:
            return {"changed": False, "response": response}
        
        preferred_length = max(length_prefs, key=lambda x: x.confidence)
        
        adapted_response = response
        
        if preferred_length.preference_value == "brief":
            adapted_response = self._make_response_brief(response)
        elif preferred_length.preference_value == "detailed":
            adapted_response = self._make_response_detailed(response, context)
        
        return {
            "changed": adapted_response != response,
            "response": adapted_response,
            "length": preferred_length.preference_value
        }

    async def _adapt_technical_depth(
        self,
        response: str,
        context: Dict[str, Any],
        scope: AdaptationScope
    ) -> Dict[str, Any]:
        """Adapt technical depth based on preferences."""
        
        depth_prefs = [p for p in self.user_preferences.values() 
                      if p.preference_type == "technical_depth" and p.confidence > 0.6]
        
        if not depth_prefs:
            return {"changed": False, "response": response}
        
        preferred_depth = max(depth_prefs, key=lambda x: x.confidence)
        
        adapted_response = response
        
        if preferred_depth.preference_value == "basic":
            adapted_response = self._simplify_technical_content(response)
        elif preferred_depth.preference_value == "advanced":
            adapted_response = self._add_technical_depth(response, context)
        
        return {
            "changed": adapted_response != response,
            "response": adapted_response,
            "depth": preferred_depth.preference_value
        }

    async def _adapt_emotional_support(
        self,
        response: str,
        context: Dict[str, Any],
        scope: AdaptationScope
    ) -> Dict[str, Any]:
        """Adapt emotional support level based on preferences."""
        
        support_prefs = [p for p in self.user_preferences.values() 
                        if p.preference_type == "emotional_support" and p.confidence > 0.6]
        
        if not support_prefs:
            return {"changed": False, "response": response}
        
        preferred_support = max(support_prefs, key=lambda x: x.confidence)
        
        adapted_response = response
        
        if preferred_support.preference_value == "high":
            adapted_response = self._add_emotional_support(response, context)
        elif preferred_support.preference_value == "minimal":
            adapted_response = self._reduce_emotional_language(response)
        
        return {
            "changed": adapted_response != response,
            "response": adapted_response,
            "level": preferred_support.preference_value
        }

    # Helper methods for response adaptation
    def _make_response_casual(self, response: str) -> str:
        """Make response more casual."""
        # Simple casual adaptations
        casual_response = response.replace("I would recommend", "I'd suggest")
        casual_response = casual_response.replace("It is important", "It's really important")
        casual_response = casual_response.replace("You should consider", "You might want to")
        return casual_response

    def _make_response_formal(self, response: str) -> str:
        """Make response more formal."""
        # Simple formal adaptations
        formal_response = response.replace("I'd", "I would")
        formal_response = formal_response.replace("You're", "You are")
        formal_response = formal_response.replace("It's", "It is")
        return formal_response

    def _add_appropriate_humor(self, response: str, context: Dict[str, Any]) -> str:
        """Add appropriate humor to response."""
        # Simple humor addition (would be more sophisticated in practice)
        if "problem" in response.lower():
            return response + " 😊"
        return response

    def _make_response_brief(self, response: str) -> str:
        """Make response more brief."""
        sentences = response.split('. ')
        if len(sentences) > 2:
            return '. '.join(sentences[:2]) + '.'
        return response

    def _make_response_detailed(self, response: str, context: Dict[str, Any]) -> str:
        """Make response more detailed."""
        return response + " Would you like me to elaborate on any particular aspect?"

    def _simplify_technical_content(self, response: str) -> str:
        """Simplify technical content."""
        # Simple simplification (would be more sophisticated in practice)
        simplified = response.replace("utilize", "use")
        simplified = simplified.replace("implement", "set up")
        return simplified

    def _add_technical_depth(self, response: str, context: Dict[str, Any]) -> str:
        """Add technical depth to response."""
        return response + " Let me know if you'd like me to go deeper into the technical details."

    def _add_emotional_support(self, response: str, context: Dict[str, Any]) -> str:
        """Add emotional support to response."""
        supportive_phrases = [
            "I understand this might be challenging, and ",
            "I'm here to help you through this, ",
            "It's completely normal to feel this way, "
        ]
        
        emotion = context.get("user_emotion", "neutral")
        if emotion in ["sad", "frustrated", "anxious"]:
            prefix = supportive_phrases[0]
            return prefix + response.lower()
        
        return response

    def _reduce_emotional_language(self, response: str) -> str:
        """Reduce emotional language in response."""
        # Remove emotional words/phrases
        neutral_response = response.replace("I feel", "I think")
        neutral_response = neutral_response.replace("amazing", "good")
        neutral_response = neutral_response.replace("wonderful", "effective")
        return neutral_response

    def _get_stable_preferences(self) -> Dict[str, UserPreference]:
        """Get preferences that are stable and confident."""
        stable_prefs = {}
        
        for key, pref in self.user_preferences.items():
            if (pref.confidence > self.confidence_threshold and 
                pref.evidence_count >= self.min_evidence_count and
                pref.stability_score > 0.7):
                stable_prefs[pref.preference_type] = pref
        
        return stable_prefs

    def _identify_learning_gaps(self) -> List[Dict[str, Any]]:
        """Identify areas where more learning is needed."""
        gaps = []
        
        for category in self.preference_categories:
            category_prefs = [p for p in self.user_preferences.values() 
                            if p.preference_type == category]
            
            if not category_prefs:
                gaps.append({
                    "category": category,
                    "action": f"Gather data about {category} preferences",
                    "potential_value": 0.8,
                    "reasoning": f"No data available for {category} preferences"
                })
            elif max(p.confidence for p in category_prefs) < 0.6:
                gaps.append({
                    "category": category,
                    "action": f"Strengthen {category} preference learning",
                    "potential_value": 0.6,
                    "reasoning": f"Low confidence in {category} preferences"
                })
        
        return gaps

    def _suggest_adaptation_experiments(
        self,
        context: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Suggest experiments to test adaptation effectiveness."""
        experiments = []
        
        # Suggest A/B testing different approaches
        if len(self.adaptation_history) > 5:
            experiments.append({
                "type": "adaptation_experiment",
                "category": "response_style",
                "recommendation": "Test different response styles to optimize user satisfaction",
                "confidence": 0.7,
                "reasoning": "Sufficient interaction history to test style variations"
            })
        
        return experiments

    def _calculate_learning_confidence(self, insights: List[LearningInsight]) -> float:
        """Calculate confidence in learning from insights."""
        if not insights:
            return 0.0
        
        avg_confidence = sum(insight.confidence for insight in insights) / len(insights)
        insight_diversity = len(set(insight.insight_type for insight in insights)) / len(insights)
        
        return min(1.0, avg_confidence * (1 + insight_diversity * 0.2))

    def _calculate_adaptation_confidence(self, changes_made: List[str]) -> float:
        """Calculate confidence in adaptation results."""
        if not changes_made:
            return 0.0
        
        # Higher confidence with more changes (up to a point)
        change_score = min(1.0, len(changes_made) / 3.0)
        
        # Factor in historical success
        recent_adaptations = self.adaptation_history[-10:]
        if recent_adaptations:
            # This would be based on user feedback in a real implementation
            historical_success = 0.7  # Placeholder
        else:
            historical_success = 0.5
        
        return change_score * 0.6 + historical_success * 0.4

    async def get_learning_summary(self) -> Dict[str, Any]:
        """Get a summary of learning progress and current state."""
        
        stable_prefs = self._get_stable_preferences()
        recent_events = list(self.learning_history)[-10:]
        
        return {
            "user_id": self.user_id,
            "stable_preferences": {
                pref_type: {
                    "value": pref.preference_value,
                    "confidence": pref.confidence,
                    "evidence_count": pref.evidence_count
                }
                for pref_type, pref in stable_prefs.items()
            },
            "recent_learning_events": len(recent_events),
            "total_adaptations": len(self.adaptation_history),
            "learning_areas": list(self.preference_categories.keys()),
            "learning_gaps": len(self._identify_learning_gaps()),
            "overall_learning_progress": self._calculate_overall_progress()
        }

    def _calculate_overall_progress(self) -> float:
        """Calculate overall learning progress."""
        total_categories = len(self.preference_categories)
        learned_categories = len(self._get_stable_preferences())
        
        if total_categories == 0:
            return 0.0
        
        return learned_categories / total_categories
