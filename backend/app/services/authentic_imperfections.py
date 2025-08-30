"""
Authentic Imperfections Engine

This service adds realistic human imperfections to responses including memory lapses,
natural corrections, hesitations, and other authentic human characteristics.
"""

import logging
import random
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ImperfectionType(Enum):
    """Types of authentic imperfections."""
    MEMORY_LAPSE = "memory_lapse"
    SELF_CORRECTION = "self_correction"
    HESITATION = "hesitation"
    TANGENT = "tangent"
    PARTIAL_RECALL = "partial_recall"
    UNCERTAINTY = "uncertainty"
    HUMAN_ERROR = "human_error"


@dataclass
class Imperfection:
    """Represents an authentic imperfection to apply."""
    imperfection_type: ImperfectionType
    trigger_phrase: str
    replacement_phrase: str
    confidence: float
    context: Dict[str, Any]


class AuthenticImperfectionsEngine:
    """
    Engine for generating and applying authentic human imperfections to responses.
    """
    
    def __init__(self):
        self.imperfection_frequency: Dict[str, Dict[str, int]] = {}
        self.user_imperfection_patterns: Dict[str, Dict[str, float]] = {}
        
        # Initialize imperfection patterns
        self.memory_lapses = [
            ("what was I saying", "Oh right, what was I saying... "),
            ("where was I", "Hmm, where was I... oh yes, "),
            ("I forgot what I was", "Wait, I forgot what I was going to say... "),
            ("remind me", "Actually, remind me - "),
        ]
        
        self.self_corrections = [
            ("I mean", "Actually, I mean "),
            ("or rather", "Or rather, "),
            ("let me rephrase", "Let me rephrase that - "),
            ("what I meant was", "What I meant was "),
            ("to clarify", "Just to clarify - "),
        ]
        
        self.hesitations = [
            ("um", "Um, "),
            ("uh", "Uh, "),
            ("let me think", "Let me think about that... "),
            ("hmm", "Hmm, "),
            ("well", "Well, "),
            ("you know", "You know, "),
        ]
        
        self.uncertainty_markers = [
            ("I think", "I think "),
            ("I believe", "I believe "),
            ("if I remember correctly", "If I remember correctly, "),
            ("I'm pretty sure", "I'm pretty sure "),
            ("it seems like", "It seems like "),
            ("I could be wrong but", "I could be wrong, but "),
        ]
        
        self.tangent_starters = [
            ("that reminds me", "That reminds me of "),
            ("speaking of which", "Speaking of which, "),
            ("funny you mention that", "Funny you mention that - "),
            ("on a related note", "On a related note, "),
        ]

    async def analyze_for_imperfections(
        self,
        response: str,
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        emotional_context: Dict[str, Any],
        user_id: str
    ) -> List[Imperfection]:
        """
        Analyze response for opportunities to add authentic imperfections.
        """
        try:
            imperfections = []
            
            # Get user's imperfection patterns
            user_patterns = self.user_imperfection_patterns.get(user_id, {})
            
            # Check for memory lapse opportunities
            if self._should_add_memory_lapse(response, conversation_history, user_patterns):
                memory_lapse = self._generate_memory_lapse(response)
                if memory_lapse:
                    imperfections.append(memory_lapse)
            
            # Check for self-correction opportunities
            if self._should_add_self_correction(response, emotional_context, user_patterns):
                correction = self._generate_self_correction(response)
                if correction:
                    imperfections.append(correction)
            
            # Check for hesitation opportunities
            if self._should_add_hesitation(response, user_message, user_patterns):
                hesitation = self._generate_hesitation(response)
                if hesitation:
                    imperfections.append(hesitation)
            
            # Check for uncertainty markers
            if self._should_add_uncertainty(response, emotional_context, user_patterns):
                uncertainty = self._generate_uncertainty(response)
                if uncertainty:
                    imperfections.append(uncertainty)
            
            # Check for tangent opportunities
            if self._should_add_tangent(response, conversation_history, user_patterns):
                tangent = self._generate_tangent(response, conversation_history)
                if tangent:
                    imperfections.append(tangent)
            
            return imperfections
            
        except Exception as e:
            logger.error(f"Error analyzing for imperfections: {e}")
            return []

    def _should_add_memory_lapse(
        self,
        response: str,
        conversation_history: List[Dict[str, Any]],
        user_patterns: Dict[str, float]
    ) -> bool:
        """Determine if a memory lapse should be added."""
        try:
            # More likely in longer conversations
            conversation_length = len(conversation_history)
            base_probability = min(0.1, conversation_length * 0.01)
            
            # User pattern adjustment
            pattern_multiplier = user_patterns.get("memory_lapse", 1.0)
            
            # Complex topics increase probability
            complexity_words = ["complex", "complicated", "detailed", "technical", "specific"]
            if any(word in response.lower() for word in complexity_words):
                base_probability *= 1.5
            
            return random.random() < (base_probability * pattern_multiplier)
            
        except Exception as e:
            logger.error(f"Error determining memory lapse: {e}")
            return False

    def _should_add_self_correction(
        self,
        response: str,
        emotional_context: Dict[str, Any],
        user_patterns: Dict[str, float]
    ) -> bool:
        """Determine if a self-correction should be added."""
        try:
            base_probability = 0.05
            
            # More likely when discussing complex topics
            if len(response.split()) > 50:  # Longer responses
                base_probability *= 1.3
            
            # Emotional state affects likelihood
            emotion = emotional_context.get("primary_emotion", "neutral")
            if emotion in ["anxious", "uncertain", "confused"]:
                base_probability *= 1.5
            
            pattern_multiplier = user_patterns.get("self_correction", 1.0)
            
            return random.random() < (base_probability * pattern_multiplier)
            
        except Exception as e:
            logger.error(f"Error determining self-correction: {e}")
            return False

    def _should_add_hesitation(
        self,
        response: str,
        user_message: str,
        user_patterns: Dict[str, float]
    ) -> bool:
        """Determine if hesitation should be added."""
        try:
            base_probability = 0.08
            
            # More likely for difficult questions
            question_words = ["why", "how", "what if", "complex", "difficult"]
            if any(word in user_message.lower() for word in question_words):
                base_probability *= 1.4
            
            # Less likely for simple, confident responses
            if len(response.split()) < 20:
                base_probability *= 0.7
            
            pattern_multiplier = user_patterns.get("hesitation", 1.0)
            
            return random.random() < (base_probability * pattern_multiplier)
            
        except Exception as e:
            logger.error(f"Error determining hesitation: {e}")
            return False

    def _should_add_uncertainty(
        self,
        response: str,
        emotional_context: Dict[str, Any],
        user_patterns: Dict[str, float]
    ) -> bool:
        """Determine if uncertainty markers should be added."""
        try:
            base_probability = 0.06
            
            # More likely when already uncertain
            if any(word in response.lower() for word in ["maybe", "perhaps", "possibly"]):
                base_probability *= 1.5
            
            # Emotional context
            emotion = emotional_context.get("primary_emotion", "neutral")
            if emotion in ["uncertain", "confused", "doubtful"]:
                base_probability *= 1.3
            
            pattern_multiplier = user_patterns.get("uncertainty", 1.0)
            
            return random.random() < (base_probability * pattern_multiplier)
            
        except Exception as e:
            logger.error(f"Error determining uncertainty: {e}")
            return False

    def _should_add_tangent(
        self,
        response: str,
        conversation_history: List[Dict[str, Any]],
        user_patterns: Dict[str, float]
    ) -> bool:
        """Determine if a tangent should be added."""
        try:
            base_probability = 0.03
            
            # More likely in casual, longer conversations
            if len(conversation_history) > 10:
                base_probability *= 1.2
            
            # Topic similarity increases likelihood
            if len(response.split()) > 40:  # Substantial response
                base_probability *= 1.1
            
            pattern_multiplier = user_patterns.get("tangent", 1.0)
            
            return random.random() < (base_probability * pattern_multiplier)
            
        except Exception as e:
            logger.error(f"Error determining tangent: {e}")
            return False

    def _generate_memory_lapse(self, response: str) -> Optional[Imperfection]:
        """Generate a memory lapse imperfection."""
        try:
            trigger, replacement = random.choice(self.memory_lapses)
            
            # Find a good insertion point (beginning of sentence)
            sentences = response.split('. ')
            if len(sentences) > 1:
                insert_position = random.randint(1, min(3, len(sentences) - 1))
                
                return Imperfection(
                    imperfection_type=ImperfectionType.MEMORY_LAPSE,
                    trigger_phrase=f"sentence_{insert_position}",
                    replacement_phrase=replacement,
                    confidence=0.8,
                    context={"position": insert_position}
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating memory lapse: {e}")
            return None

    def _generate_self_correction(self, response: str) -> Optional[Imperfection]:
        """Generate a self-correction imperfection."""
        try:
            trigger, replacement = random.choice(self.self_corrections)
            
            # Look for absolute statements to soften
            absolute_words = ["always", "never", "definitely", "certainly", "absolutely"]
            for word in absolute_words:
                if word in response.lower():
                    return Imperfection(
                        imperfection_type=ImperfectionType.SELF_CORRECTION,
                        trigger_phrase=word,
                        replacement_phrase=f"{replacement}{word}",
                        confidence=0.7,
                        context={"original_word": word}
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating self-correction: {e}")
            return None

    def _generate_hesitation(self, response: str) -> Optional[Imperfection]:
        """Generate a hesitation imperfection."""
        try:
            trigger, replacement = random.choice(self.hesitations)
            
            # Add at the beginning of response
            return Imperfection(
                imperfection_type=ImperfectionType.HESITATION,
                trigger_phrase="start",
                replacement_phrase=replacement,
                confidence=0.6,
                context={"position": "beginning"}
            )
            
        except Exception as e:
            logger.error(f"Error generating hesitation: {e}")
            return None

    def _generate_uncertainty(self, response: str) -> Optional[Imperfection]:
        """Generate an uncertainty marker imperfection."""
        try:
            trigger, replacement = random.choice(self.uncertainty_markers)
            
            # Look for definitive statements to soften
            definitive_starters = ["This is", "That is", "It is", "You should", "The answer is"]
            for starter in definitive_starters:
                if starter in response:
                    return Imperfection(
                        imperfection_type=ImperfectionType.UNCERTAINTY,
                        trigger_phrase=starter,
                        replacement_phrase=f"{replacement}{starter.lower()}",
                        confidence=0.7,
                        context={"softened_statement": starter}
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating uncertainty: {e}")
            return None

    def _generate_tangent(
        self,
        response: str,
        conversation_history: List[Dict[str, Any]]
    ) -> Optional[Imperfection]:
        """Generate a tangent imperfection."""
        try:
            trigger, replacement = random.choice(self.tangent_starters)
            
            # Only add tangents to longer responses
            if len(response.split()) > 30:
                return Imperfection(
                    imperfection_type=ImperfectionType.TANGENT,
                    trigger_phrase="end",
                    replacement_phrase=f" {replacement}something similar...",
                    confidence=0.5,
                    context={"position": "end"}
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating tangent: {e}")
            return None

    async def apply_imperfections(
        self,
        response: str,
        imperfections: List[Imperfection],
        user_id: str
    ) -> str:
        """
        Apply authentic imperfections to the response.
        """
        try:
            modified_response = response
            
            for imperfection in imperfections:
                if imperfection.confidence > 0.5:  # Only apply high-confidence imperfections
                    if imperfection.imperfection_type == ImperfectionType.HESITATION:
                        if imperfection.trigger_phrase == "start":
                            modified_response = f"{imperfection.replacement_phrase}{modified_response}"
                    
                    elif imperfection.imperfection_type == ImperfectionType.MEMORY_LAPSE:
                        sentences = modified_response.split('. ')
                        position = imperfection.context.get("position", 1)
                        if position < len(sentences):
                            sentences[position] = f"{imperfection.replacement_phrase}{sentences[position]}"
                            modified_response = '. '.join(sentences)
                    
                    elif imperfection.imperfection_type in [ImperfectionType.SELF_CORRECTION, ImperfectionType.UNCERTAINTY]:
                        modified_response = modified_response.replace(
                            imperfection.trigger_phrase,
                            imperfection.replacement_phrase,
                            1  # Only replace first occurrence
                        )
                    
                    elif imperfection.imperfection_type == ImperfectionType.TANGENT:
                        if imperfection.trigger_phrase == "end":
                            modified_response = f"{modified_response}{imperfection.replacement_phrase}"
                    
                    # Track usage
                    self._track_imperfection_usage(user_id, imperfection.imperfection_type.value)
            
            return modified_response
            
        except Exception as e:
            logger.error(f"Error applying imperfections: {e}")
            return response

    def _track_imperfection_usage(self, user_id: str, imperfection_type: str):
        """Track imperfection usage for user patterns."""
        try:
            if user_id not in self.imperfection_frequency:
                self.imperfection_frequency[user_id] = {}
            
            self.imperfection_frequency[user_id][imperfection_type] = (
                self.imperfection_frequency[user_id].get(imperfection_type, 0) + 1
            )
            
        except Exception as e:
            logger.error(f"Error tracking imperfection usage: {e}")

    def update_user_patterns(self, user_id: str, feedback: Dict[str, float]):
        """Update user-specific imperfection patterns based on feedback."""
        try:
            if user_id not in self.user_imperfection_patterns:
                self.user_imperfection_patterns[user_id] = {}
            
            for imperfection_type, multiplier in feedback.items():
                self.user_imperfection_patterns[user_id][imperfection_type] = multiplier
            
            logger.debug(f"Updated imperfection patterns for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error updating user patterns: {e}")

    def get_imperfection_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of imperfections used for a user."""
        try:
            frequency = self.imperfection_frequency.get(user_id, {})
            patterns = self.user_imperfection_patterns.get(user_id, {})
            
            return {
                "total_imperfections": sum(frequency.values()),
                "frequency_by_type": frequency,
                "user_patterns": patterns,
                "most_used": max(frequency.items(), key=lambda x: x[1]) if frequency else None
            }
            
        except Exception as e:
            logger.error(f"Error getting imperfection summary: {e}")
            return {}


# Global instance
authentic_imperfections_engine = AuthenticImperfectionsEngine()


