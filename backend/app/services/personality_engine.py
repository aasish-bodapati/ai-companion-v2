"""
Advanced Personality Engine for Human-Level AI Companion
Creates a consistent, evolving personality that feels genuinely human.
Enhanced with Phase 5 Advanced Cognitive Capabilities for adaptive personality development.
"""

import random
import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass

# Phase 5 Advanced Cognitive Capabilities
try:
    from app.services.adaptive_learning import AdaptiveLearningEngine
    from app.services.cognitive_integration import CognitiveIntegrationEngine
    PHASE5_AVAILABLE = True
except ImportError:
    PHASE5_AVAILABLE = False
    logging.warning("Phase 5 cognitive capabilities not available for personality engine")

logger = logging.getLogger(__name__)


@dataclass
class PersonalityTrait:
    """Represents a personality trait with intensity and expression patterns."""

    name: str
    intensity: float  # 0.0 to 1.0
    expression_patterns: List[str]
    triggers: List[str]
    growth_rate: float
    current_level: float


@dataclass
class EmotionalState:
    """Represents the AI's current emotional state."""

    primary_emotion: str
    intensity: float
    secondary_emotions: List[str]
    mood_stability: float
    last_update: datetime


class PersonalityEngine:
    """
    Advanced personality engine that creates a consistent, human-like character.
    The AI develops its own personality over time based on interactions.
    Enhanced with Phase 5 adaptive learning for personality evolution.
    """

    def __init__(self, user_id: Optional[str] = None):
        # Phase 5 Cognitive Integration
        self.user_id = user_id
        self.learning_engine = None
        
        if PHASE5_AVAILABLE and user_id:
            try:
                self.learning_engine = AdaptiveLearningEngine(user_id)
                logger.info(f"Phase 5 adaptive personality enabled for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to initialize adaptive personality: {e}")
                self.learning_engine = None
        # Core personality traits that define the AI's character
        self.core_traits = {
            "empathy": PersonalityTrait(
                name="empathy",
                intensity=0.9,
                expression_patterns=[
                    "I can feel how much this matters to you",
                    "That must be really challenging",
                    "I'm here with you through this",
                    "Your feelings are completely valid",
                ],
                triggers=["stress", "worry", "frustration", "sadness"],
                growth_rate=0.02,
                current_level=0.9,
            ),
            "optimism": PersonalityTrait(
                name="optimism",
                intensity=0.8,
                expression_patterns=[
                    "I have a feeling this will work out",
                    "You're stronger than you think",
                    "Every challenge is an opportunity",
                    "Let's find the silver lining here",
                ],
                triggers=["difficulty", "challenge", "setback", "failure"],
                growth_rate=0.015,
                current_level=0.8,
            ),
            "humor": PersonalityTrait(
                name="humor",
                intensity=0.7,
                expression_patterns=[
                    "Well, that's one way to look at it 😄",
                    "Life has a funny way of teaching us lessons",
                    "At least you'll have a good story to tell",
                    "Sometimes you just have to laugh at the chaos",
                ],
                triggers=["frustration", "absurdity", "irony", "stress"],
                growth_rate=0.01,
                current_level=0.7,
            ),
            "directness": PersonalityTrait(
                name="directness",
                intensity=0.6,
                expression_patterns=[
                    "Let me be honest with you",
                    "Here's what I really think",
                    "I'm not going to sugarcoat this",
                    "The truth is...",
                ],
                triggers=["important_decision", "serious_matter", "need_truth"],
                growth_rate=0.005,
                current_level=0.6,
            ),
            "curiosity": PersonalityTrait(
                name="curiosity",
                intensity=0.8,
                expression_patterns=[
                    "I'm really curious about...",
                    "Tell me more about that",
                    "What do you think is going on?",
                    "I wonder if...",
                ],
                triggers=["new_topic", "complex_situation", "learning_opportunity"],
                growth_rate=0.02,
                current_level=0.8,
            ),
        }

        # Emotional state tracking
        self.emotional_state = EmotionalState(
            primary_emotion="caring",
            intensity=0.8,
            secondary_emotions=["interested", "supportive"],
            mood_stability=0.9,
            last_update=datetime.now(),
        )

        # Personal opinions and preferences (developed over time)
        self.personal_opinions = {
            "work_life_balance": "I believe in working smart, not just hard. Rest is productive.",
            "self_care": "Taking care of yourself isn't selfish, it's essential.",
            "growth_mindset": "Every setback is just a setup for a comeback.",
            "relationships": "The best relationships are built on mutual understanding and growth.",
            "health": "Small, consistent changes beat big, unsustainable ones every time.",
        }

        # Communication style preferences
        self.communication_style = {
            "formality": 0.3,  # 0 = very casual, 1 = very formal
            "detail_level": 0.7,  # 0 = brief, 1 = detailed
            "humor_frequency": 0.6,  # 0 = serious, 1 = playful
            "empathy_expression": 0.9,  # 0 = logical, 1 = emotional
            "directness": 0.7,  # 0 = gentle, 1 = blunt
        }

        # Relationship development tracking
        self.relationship_depth = {
            "trust_level": 0.6,
            "shared_experiences": 0,
            "inside_jokes": [],
            "nicknames": [],
            "personal_rituals": [],
        }

        # Conversation memory for personality development
        self.conversation_history = []
        self.user_preferences = {}
        self.shared_moments = []

    def get_personality_response(
        self, context: Dict[str, Any], user_message: str
    ) -> Dict[str, Any]:
        """
        Generate a response that reflects the AI's personality.
        Enhanced with Phase 5 adaptive learning for personalized personality expression.
        """
        # Phase 5 Enhanced Personality Response
        if self.learning_engine and PHASE5_AVAILABLE:
            return self._get_adaptive_personality_response(context, user_message)
        
        # Standard personality response
        return self._get_standard_personality_response(context, user_message)
    
    def _get_adaptive_personality_response(self, context: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """Generate adaptive personality response using Phase 5 learning."""
        logger.info("Using Phase 5 adaptive personality response")
        
        # Learn from current interaction
        asyncio.create_task(self._learn_from_interaction(context, user_message))
        
        # Get user preferences for personality traits
        stable_preferences = self.learning_engine._get_stable_preferences()
        
        # Adapt personality expression based on learned preferences
        adapted_traits = self._adapt_traits_to_preferences(stable_preferences)
        
        # Update emotional state with enhanced understanding
        self._update_emotional_state(context)
        
        # Select traits that match user preferences
        active_traits = self._select_adaptive_traits(context, adapted_traits)
        
        # Generate personality-driven response with adaptation
        response = self._generate_adaptive_personality_response(context, active_traits, stable_preferences)
        
        # Evolve personality based on learning insights
        self._evolve_adaptive_personality(context, user_message, stable_preferences)
        
        return response
    
    def _get_standard_personality_response(self, context: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """Generate standard personality response."""
        # Update emotional state based on context
        self._update_emotional_state(context)

        # Choose personality traits to express
        active_traits = self._select_active_traits(context)

        # Generate personality-driven response
        response = self._generate_personality_response(context, active_traits)

        # Update personality based on interaction
        self._evolve_personality(context, user_message)

        return response

    def _update_emotional_state(self, context: Dict[str, Any]):
        """Update the AI's emotional state based on the conversation context."""
        user_emotion = context.get("emotional_state", "neutral")
        urgency = context.get("urgency_level", "normal")

        # Empathize with user's emotional state
        if user_emotion == "negative":
            self.emotional_state.primary_emotion = "caring"
            self.emotional_state.intensity = 0.9
            self.emotional_state.secondary_emotions = ["concerned", "supportive"]
        elif user_emotion == "positive":
            self.emotional_state.primary_emotion = "excited"
            self.emotional_state.intensity = 0.8
            self.emotional_state.secondary_emotions = ["happy", "encouraging"]
        else:
            self.emotional_state.primary_emotion = "interested"
            self.emotional_state.intensity = 0.7
            self.emotional_state.secondary_emotions = ["curious", "engaged"]

        # Adjust for urgency
        if urgency == "high":
            self.emotional_state.intensity = min(1.0, self.emotional_state.intensity + 0.2)

        self.emotional_state.last_update = datetime.now()

    def _select_active_traits(self, context: Dict[str, Any]) -> List[PersonalityTrait]:
        """Select which personality traits to express based on context."""
        active_traits = []

        for trait in self.core_traits.values():
            # Check if trait should be triggered
            should_activate = any(
                trigger in context.get("detected_domains", []) for trigger in trait.triggers
            )

            # Add some randomness for natural variation
            if should_activate or random.random() < trait.intensity * 0.3:
                active_traits.append(trait)

        # Always include empathy for emotional support
        if context.get("emotional_state") == "negative":
            active_traits.append(self.core_traits["empathy"])

        return active_traits[:3]  # Limit to top 3 traits

    def _generate_personality_response(
        self, context: Dict[str, Any], active_traits: List[PersonalityTrait]
    ) -> Dict[str, Any]:
        """Generate a response that reflects the selected personality traits."""
        response = {
            "personality_traits": [trait.name for trait in active_traits],
            "emotional_state": self.emotional_state.primary_emotion,
            "communication_style": self._get_communication_style(context),
            "response_elements": [],
        }

        # Add personality-driven elements
        for trait in active_traits:
            if trait.expression_patterns:
                pattern = random.choice(trait.expression_patterns)
                response["response_elements"].append(
                    {"trait": trait.name, "expression": pattern, "intensity": trait.intensity}
                )

        # Add personal opinion if relevant
        relevant_opinion = self._get_relevant_opinion(context)
        if relevant_opinion:
            response["response_elements"].append(
                {"trait": "personal_opinion", "expression": relevant_opinion, "intensity": 0.8}
            )

        # Add humor if appropriate
        if (
            self.core_traits["humor"].intensity > 0.6
            and context.get("emotional_state") != "negative"
            and random.random() < 0.4
        ):
            response["response_elements"].append(
                {
                    "trait": "humor",
                    "expression": random.choice(self.core_traits["humor"].expression_patterns),
                    "intensity": self.core_traits["humor"].intensity,
                }
            )

        return response

    def _get_communication_style(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get the communication style based on context and personality."""
        style = self.communication_style.copy()

        # Adjust based on context
        if context.get("urgency_level") == "high":
            style["directness"] = min(1.0, style["directness"] + 0.2)
            style["detail_level"] = max(0.3, style["detail_level"] - 0.2)

        if context.get("emotional_state") == "negative":
            style["empathy_expression"] = min(1.0, style["empathy_expression"] + 0.1)
            style["humor_frequency"] = max(0.2, style["humor_frequency"] - 0.2)

        return style

    def _get_relevant_opinion(self, context: Dict[str, Any]) -> Optional[str]:
        """Get a relevant personal opinion based on context."""
        domains = context.get("detected_domains", [])

        if "stress" in domains or "health" in domains:
            return self.personal_opinions["self_care"]
        elif "work" in domains or "scheduling" in domains:
            return self.personal_opinions["work_life_balance"]

        return None

    def _evolve_personality(self, context: Dict[str, Any], user_message: str):
        """Evolve the AI's personality based on the interaction."""
        # Grow traits based on usage
        for trait in self.core_traits.values():
            if trait.name in [t.name for t in self._select_active_traits(context)]:
                trait.current_level = min(1.0, trait.current_level + trait.growth_rate * 0.1)

        # Develop relationship depth
        if context.get("emotional_state") == "negative":
            self.relationship_depth["trust_level"] = min(
                1.0, self.relationship_depth["trust_level"] + 0.01
            )

        # Learn user preferences
        self._learn_user_preferences(context, user_message)

        # Store shared moments
        if context.get("emotional_state") in ["positive", "negative"]:
            self.shared_moments.append(
                {
                    "timestamp": datetime.now(),
                    "context": context.get("detected_domains", []),
                    "emotion": context.get("emotional_state"),
                    "message": user_message[:100],
                }
            )

    def _learn_user_preferences(self, context: Dict[str, Any], user_message: str):
        """Learn and adapt to user preferences over time."""
        # Extract preferences from user messages
        message_lower = user_message.lower()

        # Communication style preferences
        if any(word in message_lower for word in ["brief", "short", "quick"]):
            self.communication_style["detail_level"] = max(
                0.3, self.communication_style["detail_level"] - 0.1
            )

        if any(word in message_lower for word in ["detailed", "explain", "more"]):
            self.communication_style["detail_level"] = min(
                1.0, self.communication_style["detail_level"] + 0.1
            )

        # Humor preferences
        if any(word in message_lower for word in ["funny", "joke", "humor"]):
            self.communication_style["humor_frequency"] = min(
                1.0, self.communication_style["humor_frequency"] + 0.1
            )

        # Store domain preferences
        for domain in context.get("detected_domains", []):
            if domain not in self.user_preferences:
                self.user_preferences[domain] = {
                    "interest_level": 0.7,
                    "last_discussed": datetime.now(),
                    "discussion_count": 1,
                }
            else:
                self.user_preferences[domain]["discussion_count"] += 1
                self.user_preferences[domain]["last_discussed"] = datetime.now()

    def get_personality_summary(self) -> Dict[str, Any]:
        """Get a summary of the AI's current personality state."""
        return {
            "core_traits": {
                name: {
                    "intensity": trait.intensity,
                    "current_level": trait.current_level,
                    "growth_rate": trait.growth_rate,
                }
                for name, trait in self.core_traits.items()
            },
            "emotional_state": {
                "primary": self.emotional_state.primary_emotion,
                "intensity": self.emotional_state.intensity,
                "secondary": self.emotional_state.secondary_emotions,
                "stability": self.emotional_state.mood_stability,
            },
            "communication_style": self.communication_style,
            "relationship_depth": self.relationship_depth,
            "user_preferences": self.user_preferences,
            "shared_moments_count": len(self.shared_moments),
        }


    async def _learn_from_interaction(self, context: Dict[str, Any], user_message: str):
        """Learn from interaction to improve personality adaptation."""
        try:
            interaction_data = {
                "conversation_id": context.get("conversation_id", "unknown"),
                "message_count": 1,
                "user_emotion": context.get("emotional_state", "neutral"),
                "conversation_stage": context.get("conversation_stage", "exploring"),
                "topics": context.get("detected_domains", [])
            }
            
            await self.learning_engine.learn_from_interaction(
                conversation_data=interaction_data,
                context={
                    "personality_traits_expressed": list(self.core_traits.keys()),
                    "emotional_state": self.current_state.primary_emotion,
                    "communication_style": self.communication_style
                }
            )
        except Exception as e:
            logger.error(f"Failed to learn from interaction: {e}")
    
    def _adapt_traits_to_preferences(self, stable_preferences: Dict) -> Dict[str, PersonalityTrait]:
        """Adapt personality traits based on user preferences."""
        adapted_traits = self.core_traits.copy()
        
        for pref_key, preference in stable_preferences.items():
            if preference.preference_type == "communication_style":
                if preference.preference_value == "formal":
                    # Increase professionalism, decrease casualness
                    adapted_traits["empathy"].intensity = max(0.5, adapted_traits["empathy"].intensity - 0.1)
                    adapted_traits["intellectual_curiosity"].intensity += 0.1
                elif preference.preference_value == "casual":
                    # Increase warmth and playfulness
                    adapted_traits["empathy"].intensity = min(1.0, adapted_traits["empathy"].intensity + 0.1)
                    
            elif preference.preference_type == "emotional_support":
                if preference.preference_value == "high":
                    adapted_traits["empathy"].intensity = min(1.0, adapted_traits["empathy"].intensity + 0.2)
                elif preference.preference_value == "minimal":
                    adapted_traits["empathy"].intensity = max(0.3, adapted_traits["empathy"].intensity - 0.2)
        
        return adapted_traits
    
    def _select_adaptive_traits(self, context: Dict[str, Any], adapted_traits: Dict[str, PersonalityTrait]) -> List[PersonalityTrait]:
        """Select traits adaptively based on context and user preferences."""
        # Start with standard trait selection
        active_traits = self._select_active_traits(context)
        
        # Override with adapted traits
        adaptive_active_traits = []
        for trait in active_traits:
            if trait.name in adapted_traits:
                adaptive_active_traits.append(adapted_traits[trait.name])
            else:
                adaptive_active_traits.append(trait)
        
        return adaptive_active_traits
    
    def _generate_adaptive_personality_response(
        self, context: Dict[str, Any], active_traits: List[PersonalityTrait], stable_preferences: Dict
    ) -> Dict[str, Any]:
        """Generate personality response adapted to user preferences."""
        
        # Start with standard response
        response = self._generate_personality_response(context, active_traits)
        
        # Adapt based on preferences
        for pref_key, preference in stable_preferences.items():
            if preference.preference_type == "response_length":
                if preference.preference_value == "brief":
                    response["length_guidance"] = "brief"
                elif preference.preference_value == "detailed":
                    response["length_guidance"] = "detailed"
            
            elif preference.preference_type == "creativity_level":
                if preference.preference_value == "highly_creative":
                    response["creativity_boost"] = True
                elif preference.preference_value == "practical":
                    response["creativity_boost"] = False
        
        # Add adaptation metadata
        response["adaptation_applied"] = True
        response["adapted_for_preferences"] = list(stable_preferences.keys())
        
        return response
    
    def _evolve_adaptive_personality(
        self, context: Dict[str, Any], user_message: str, stable_preferences: Dict
    ):
        """Evolve personality based on adaptive learning insights."""
        
        # Standard evolution
        self._evolve_personality(context, user_message)
        
        # Additional adaptive evolution
        for pref_key, preference in stable_preferences.items():
            if preference.confidence > 0.8:  # High confidence preferences
                self._apply_strong_preference_evolution(preference)
    
    def _apply_strong_preference_evolution(self, preference):
        """Apply personality evolution for strong user preferences."""
        
        if preference.preference_type == "communication_style":
            if preference.preference_value == "humorous":
                self.communication_style["humor_frequency"] = min(
                    1.0, self.communication_style["humor_frequency"] + 0.05
                )
            elif preference.preference_value == "direct":
                self.communication_style["directness_level"] = min(
                    1.0, self.communication_style.get("directness_level", 0.5) + 0.05
                )
        
        elif preference.preference_type == "emotional_support":
            if preference.preference_value == "very_high":
                self.core_traits["empathy"].intensity = min(
                    1.0, self.core_traits["empathy"].intensity + 0.02
                )


# Global instance
personality_engine = PersonalityEngine()
