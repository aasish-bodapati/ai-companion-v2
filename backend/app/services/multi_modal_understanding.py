"""
Multi-Modal Understanding Engine

This service provides advanced cognitive capabilities for understanding complex,
multi-faceted user inputs including contextual ambiguity resolution, implicit
meaning detection, and non-verbal cue interpretation from text patterns.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class AmbiguityType(Enum):
    """Types of ambiguity that can be resolved."""
    PRONOUN_REFERENCE = "pronoun_reference"
    CONTEXT_DEPENDENT = "context_dependent"
    CULTURAL_NUANCE = "cultural_nuance"
    EMOTIONAL_SUBTEXT = "emotional_subtext"
    INTENT_UNCLEAR = "intent_unclear"
    TIMING_AMBIGUITY = "timing_ambiguity"


class ImplicitMeaningType(Enum):
    """Types of implicit meanings that can be detected."""
    EMOTIONAL_STATE = "emotional_state"
    URGENCY_LEVEL = "urgency_level"
    CONFIDENCE_LEVEL = "confidence_level"
    HESITATION = "hesitation"
    SATISFACTION = "satisfaction"
    FRUSTRATION = "frustration"
    EXCITEMENT = "excitement"
    UNCERTAINTY = "uncertainty"


@dataclass
class AmbiguityContext:
    """Context for resolving ambiguity."""
    ambiguity_type: AmbiguityType
    confidence: float
    possible_interpretations: List[str]
    context_clues: List[str]
    resolution_strategy: str


@dataclass
class ImplicitMeaning:
    """Detected implicit meaning from text."""
    meaning_type: ImplicitMeaningType
    confidence: float
    intensity: float
    context_clues: List[str]
    interpretation: str


@dataclass
class NonVerbalCues:
    """Non-verbal cues detected from text patterns."""
    urgency_level: float
    confidence_level: float
    hesitation_indicators: List[str]
    emotional_subtext: str
    timing_implications: List[str]
    cultural_context: Optional[str] = None


@dataclass
class MultiModalUnderstanding:
    """Complete multi-modal understanding of a user input."""
    resolved_meaning: str
    ambiguity_resolutions: List[AmbiguityContext]
    implicit_meanings: List[ImplicitMeaning]
    non_verbal_cues: NonVerbalCues
    confidence_score: float
    context_used: List[str]


class MultiModalUnderstandingEngine:
    """
    Advanced engine for understanding complex, multi-faceted user inputs.
    
    This engine goes beyond literal text interpretation to understand:
    - Contextual ambiguity and disambiguation
    - Implicit meanings and emotional subtext
    - Non-verbal cues from text patterns
    - Cultural and contextual nuances
    """
    
    def __init__(self):
        # Ambiguity detection patterns
        self.ambiguity_patterns = {
            AmbiguityType.PRONOUN_REFERENCE: [
                r'\b(it|this|that|they|them|those)\b',
                r'\b(he|she|they)\b',
                r'\b(here|there)\b'
            ],
            AmbiguityType.CONTEXT_DEPENDENT: [
                r'\b(good|bad|better|worse)\b',
                r'\b(soon|later|recently)\b',
                r'\b(here|there|somewhere)\b'
            ],
            AmbiguityType.EMOTIONAL_SUBTEXT: [
                r'\b(fine|okay|whatever)\b',
                r'\b(guess|maybe|probably)\b',
                r'\b(not sure|don\'t know)\b'
            ]
        }
        
        # Implicit meaning indicators
        self.implicit_indicators = {
            ImplicitMeaningType.URGENCY_LEVEL: {
                "high": ["asap", "urgent", "emergency", "now", "immediately", "quickly"],
                "medium": ["soon", "when you can", "at some point", "eventually"],
                "low": ["sometime", "when convenient", "no rush", "take your time"]
            },
            ImplicitMeaningType.CONFIDENCE_LEVEL: {
                "high": ["definitely", "certainly", "absolutely", "for sure"],
                "medium": ["probably", "likely", "think so", "believe"],
                "low": ["maybe", "not sure", "don't know", "guess"]
            },
            ImplicitMeaningType.HESITATION: [
                "um", "uh", "well", "you know", "like", "sort of", "kind of",
                "I guess", "maybe", "not sure", "don't know"
            ],
            ImplicitMeaningType.FRUSTRATION: [
                "again", "still", "yet", "always", "never", "constantly",
                "frustrated", "annoyed", "tired of", "sick of"
            ]
        }
        
        # Non-verbal cue patterns
        self.non_verbal_patterns = {
            "urgency": {
                "high": [r'\b(asap|urgent|emergency|now|immediately)\b'],
                "medium": [r'\b(soon|quickly|fast|hurry)\b'],
                "low": [r'\b(whenever|no rush|take time|slowly)\b']
            },
            "confidence": {
                "high": [r'\b(definitely|certainly|absolutely|for sure)\b'],
                "medium": [r'\b(probably|likely|think|believe)\b'],
                "low": [r'\b(maybe|not sure|don\'t know|guess)\b']
            },
            "hesitation": [
                r'\b(um|uh|well|you know|like)\b',
                r'\b(sort of|kind of|I guess|maybe)\b',
                r'\b(not sure|don\'t know)\b'
            ]
        }
        
        # Cultural context patterns
        self.cultural_patterns = {
            "formality": {
                "formal": [r'\b(please|thank you|appreciate|grateful)\b'],
                "casual": [r'\b(hey|cool|awesome|thanks)\b']
            },
            "directness": {
                "direct": [r'\b(want|need|must|should)\b'],
                "indirect": [r'\b(would be nice|could you|if possible)\b']
            }
        }

    async def understand_input(
        self,
        user_message: str,
        conversation_history: List[Dict],
        user_memories: List[Dict],
        user_id: str = None
    ) -> MultiModalUnderstanding:
        """
        Comprehensive understanding of user input including ambiguity resolution,
        implicit meaning detection, and non-verbal cue interpretation.
        """
        
        # Step 1: Detect and resolve ambiguities
        ambiguity_resolutions = self._detect_and_resolve_ambiguities(
            user_message, conversation_history, user_memories
        )
        
        # Step 2: Detect implicit meanings
        implicit_meanings = self._detect_implicit_meanings(
            user_message, conversation_history
        )
        
        # Step 3: Analyze non-verbal cues
        non_verbal_cues = self._analyze_non_verbal_cues(
            user_message, conversation_history
        )
        
        # Step 4: Resolve the final meaning
        resolved_meaning = self._resolve_final_meaning(
            user_message, ambiguity_resolutions, implicit_meanings, non_verbal_cues
        )
        
        # Step 5: Calculate confidence score
        confidence_score = self._calculate_confidence_score(
            ambiguity_resolutions, implicit_meanings, non_verbal_cues
        )
        
        # Step 6: Collect context used
        context_used = self._collect_context_used(
            conversation_history, user_memories, ambiguity_resolutions
        )
        
        return MultiModalUnderstanding(
            resolved_meaning=resolved_meaning,
            ambiguity_resolutions=ambiguity_resolutions,
            implicit_meanings=implicit_meanings,
            non_verbal_cues=non_verbal_cues,
            confidence_score=confidence_score,
            context_used=context_used
        )

    def _detect_and_resolve_ambiguities(
        self,
        user_message: str,
        conversation_history: List[Dict],
        user_memories: List[Dict]
    ) -> List[AmbiguityContext]:
        """Detect and resolve various types of ambiguity in the user message."""
        
        ambiguities = []
        
        # Check for pronoun reference ambiguity
        pronoun_ambiguities = self._detect_pronoun_ambiguity(
            user_message, conversation_history
        )
        ambiguities.extend(pronoun_ambiguities)
        
        # Check for context-dependent ambiguity
        context_ambiguities = self._detect_context_ambiguity(
            user_message, conversation_history, user_memories
        )
        ambiguities.extend(context_ambiguities)
        
        # Check for emotional subtext ambiguity
        emotional_ambiguities = self._detect_emotional_ambiguity(
            user_message, conversation_history
        )
        ambiguities.extend(emotional_ambiguities)
        
        return ambiguities

    def _detect_pronoun_ambiguity(
        self,
        user_message: str,
        conversation_history: List[Dict]
    ) -> List[AmbiguityContext]:
        """Detect and resolve pronoun reference ambiguity."""
        
        ambiguities = []
        message_lower = user_message.lower()
        
        # Check for ambiguous pronouns
        for pronoun in ["it", "this", "that", "they", "them", "those"]:
            if pronoun in message_lower:
                # Look for potential referents in recent conversation
                potential_referents = self._find_potential_referents(
                    pronoun, conversation_history
                )
                
                if len(potential_referents) > 1:
                    ambiguities.append(AmbiguityContext(
                        ambiguity_type=AmbiguityType.PRONOUN_REFERENCE,
                        confidence=0.7,
                        possible_interpretations=potential_referents,
                        context_clues=[f"Found {len(potential_referents)} possible referents for '{pronoun}'"],
                        resolution_strategy="context_analysis"
                    ))
        
        return ambiguities

    def _detect_context_ambiguity(
        self,
        user_message: str,
        conversation_history: List[Dict],
        user_memories: List[Dict]
    ) -> List[AmbiguityContext]:
        """Detect context-dependent ambiguity."""
        
        ambiguities = []
        message_lower = user_message.lower()
        
        # Check for relative terms that need context
        relative_terms = {
            "good": "quality assessment",
            "bad": "quality assessment", 
            "better": "comparison",
            "worse": "comparison",
            "soon": "timing",
            "later": "timing",
            "recently": "timing"
        }
        
        for term, context_type in relative_terms.items():
            if term in message_lower:
                # Check if we have enough context to understand the term
                context_available = self._check_context_availability(
                    term, context_type, conversation_history, user_memories
                )
                
                if not context_available:
                    ambiguities.append(AmbiguityContext(
                        ambiguity_type=AmbiguityType.CONTEXT_DEPENDENT,
                        confidence=0.8,
                        possible_interpretations=[f"Need context for '{term}'"],
                        context_clues=[f"Term '{term}' requires {context_type} context"],
                        resolution_strategy="context_request"
                    ))
        
        return ambiguities

    def _detect_emotional_ambiguity(
        self,
        user_message: str,
        conversation_history: List[Dict]
    ) -> List[AmbiguityContext]:
        """Detect emotional subtext ambiguity."""
        
        ambiguities = []
        message_lower = user_message.lower()
        
        # Check for potentially ambiguous emotional expressions
        ambiguous_emotional_terms = [
            "fine", "okay", "whatever", "guess", "maybe", "probably",
            "not sure", "don't know"
        ]
        
        for term in ambiguous_emotional_terms:
            if term in message_lower:
                # Analyze emotional context
                emotional_context = self._analyze_emotional_context(
                    term, conversation_history
                )
                
                if emotional_context["ambiguous"]:
                    ambiguities.append(AmbiguityContext(
                        ambiguity_type=AmbiguityType.EMOTIONAL_SUBTEXT,
                        confidence=0.6,
                        possible_interpretations=emotional_context["interpretations"],
                        context_clues=emotional_context["clues"],
                        resolution_strategy="emotional_probe"
                    ))
        
        return ambiguities

    def _detect_implicit_meanings(
        self,
        user_message: str,
        conversation_history: List[Dict]
    ) -> List[ImplicitMeaning]:
        """Detect implicit meanings beyond the literal text."""
        
        implicit_meanings = []
        message_lower = user_message.lower()
        
        # Detect urgency level
        urgency_meaning = self._detect_urgency_level(message_lower)
        if urgency_meaning:
            implicit_meanings.append(urgency_meaning)
        
        # Detect confidence level
        confidence_meaning = self._detect_confidence_level(message_lower)
        if confidence_meaning:
            implicit_meanings.append(confidence_meaning)
        
        # Detect hesitation
        hesitation_meaning = self._detect_hesitation(message_lower)
        if hesitation_meaning:
            implicit_meanings.append(hesitation_meaning)
        
        # Detect frustration
        frustration_meaning = self._detect_frustration(message_lower, conversation_history)
        if frustration_meaning:
            implicit_meanings.append(frustration_meaning)
        
        return implicit_meanings

    def _detect_urgency_level(self, message_lower: str) -> Optional[ImplicitMeaning]:
        """Detect urgency level from message."""
        
        for level, indicators in self.implicit_indicators[ImplicitMeaningType.URGENCY_LEVEL].items():
            matches = [indicator for indicator in indicators if indicator in message_lower]
            if matches:
                intensity = 0.9 if level == "high" else 0.6 if level == "medium" else 0.3
                return ImplicitMeaning(
                    meaning_type=ImplicitMeaningType.URGENCY_LEVEL,
                    confidence=0.8,
                    intensity=intensity,
                    context_clues=matches,
                    interpretation=f"User expresses {level} urgency"
                )
        
        return None

    def _detect_confidence_level(self, message_lower: str) -> Optional[ImplicitMeaning]:
        """Detect confidence level from message."""
        
        for level, indicators in self.implicit_indicators[ImplicitMeaningType.CONFIDENCE_LEVEL].items():
            matches = [indicator for indicator in indicators if indicator in message_lower]
            if matches:
                intensity = 0.9 if level == "high" else 0.6 if level == "medium" else 0.3
                return ImplicitMeaning(
                    meaning_type=ImplicitMeaningType.CONFIDENCE_LEVEL,
                    confidence=0.8,
                    intensity=intensity,
                    context_clues=matches,
                    interpretation=f"User shows {level} confidence"
                )
        
        return None

    def _detect_hesitation(self, message_lower: str) -> Optional[ImplicitMeaning]:
        """Detect hesitation indicators."""
        
        hesitation_indicators = self.implicit_indicators[ImplicitMeaningType.HESITATION]
        matches = [indicator for indicator in hesitation_indicators if indicator in message_lower]
        
        if matches:
            return ImplicitMeaning(
                meaning_type=ImplicitMeaningType.HESITATION,
                confidence=0.7,
                intensity=len(matches) / len(hesitation_indicators),
                context_clues=matches,
                interpretation="User shows hesitation or uncertainty"
            )
        
        return None

    def _detect_frustration(
        self,
        message_lower: str,
        conversation_history: List[Dict]
    ) -> Optional[ImplicitMeaning]:
        """Detect frustration indicators."""
        
        frustration_indicators = self.implicit_indicators[ImplicitMeaningType.FRUSTRATION]
        matches = [indicator for indicator in frustration_indicators if indicator in message_lower]
        
        if matches:
            # Check for repeated patterns in conversation history
            repetition_count = self._count_repetition_patterns(
                message_lower, conversation_history
            )
            
            intensity = min(0.9, 0.5 + (repetition_count * 0.1))
            
            return ImplicitMeaning(
                meaning_type=ImplicitMeaningType.FRUSTRATION,
                confidence=0.8,
                intensity=intensity,
                context_clues=matches,
                interpretation="User shows signs of frustration"
            )
        
        return None

    def _analyze_non_verbal_cues(
        self,
        user_message: str,
        conversation_history: List[Dict]
    ) -> NonVerbalCues:
        """Analyze non-verbal cues from text patterns."""
        
        message_lower = user_message.lower()
        
        # Analyze urgency level
        urgency_level = self._analyze_urgency_patterns(message_lower)
        
        # Analyze confidence level
        confidence_level = self._analyze_confidence_patterns(message_lower)
        
        # Analyze hesitation indicators
        hesitation_indicators = self._analyze_hesitation_patterns(message_lower)
        
        # Analyze emotional subtext
        emotional_subtext = self._analyze_emotional_subtext(
            message_lower, conversation_history
        )
        
        # Analyze timing implications
        timing_implications = self._analyze_timing_implications(
            message_lower, conversation_history
        )
        
        # Analyze cultural context
        cultural_context = self._analyze_cultural_context(message_lower)
        
        return NonVerbalCues(
            urgency_level=urgency_level,
            confidence_level=confidence_level,
            hesitation_indicators=hesitation_indicators,
            emotional_subtext=emotional_subtext,
            timing_implications=timing_implications,
            cultural_context=cultural_context
        )

    def _analyze_urgency_patterns(self, message_lower: str) -> float:
        """Analyze urgency patterns in the message."""
        
        urgency_score = 0.0
        
        for level, patterns in self.non_verbal_patterns["urgency"].items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    if level == "high":
                        urgency_score = max(urgency_score, 0.9)
                    elif level == "medium":
                        urgency_score = max(urgency_score, 0.6)
                    elif level == "low":
                        urgency_score = max(urgency_score, 0.3)
        
        return urgency_score

    def _analyze_confidence_patterns(self, message_lower: str) -> float:
        """Analyze confidence patterns in the message."""
        
        confidence_score = 0.5  # Default neutral confidence
        
        for level, patterns in self.non_verbal_patterns["confidence"].items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    if level == "high":
                        confidence_score = max(confidence_score, 0.9)
                    elif level == "medium":
                        confidence_score = max(confidence_score, 0.6)
                    elif level == "low":
                        confidence_score = min(confidence_score, 0.3)
        
        return confidence_score

    def _analyze_hesitation_patterns(self, message_lower: str) -> List[str]:
        """Analyze hesitation patterns in the message."""
        
        hesitation_indicators = []
        
        for pattern in self.non_verbal_patterns["hesitation"]:
            if re.search(pattern, message_lower):
                hesitation_indicators.append(pattern)
        
        return hesitation_indicators

    def _analyze_emotional_subtext(
        self,
        message_lower: str,
        conversation_history: List[Dict]
    ) -> str:
        """Analyze emotional subtext from the message and conversation history."""
        
        # Simple emotional subtext analysis
        if any(word in message_lower for word in ["frustrated", "annoyed", "tired"]):
            return "frustration"
        elif any(word in message_lower for word in ["excited", "happy", "great"]):
            return "positive"
        elif any(word in message_lower for word in ["worried", "concerned", "anxious"]):
            return "anxiety"
        elif any(word in message_lower for word in ["fine", "okay", "whatever"]):
            return "neutral_ambiguous"
        else:
            return "neutral"

    def _analyze_timing_implications(
        self,
        message_lower: str,
        conversation_history: List[Dict]
    ) -> List[str]:
        """Analyze timing implications from the message."""
        
        timing_implications = []
        
        if "now" in message_lower or "immediately" in message_lower:
            timing_implications.append("immediate_action_required")
        
        if "soon" in message_lower or "quickly" in message_lower:
            timing_implications.append("short_term_action")
        
        if "later" in message_lower or "eventually" in message_lower:
            timing_implications.append("long_term_action")
        
        return timing_implications

    def _analyze_cultural_context(self, message_lower: str) -> Optional[str]:
        """Analyze cultural context from the message."""
        
        # Check formality level
        formal_indicators = self.cultural_patterns["formality"]["formal"]
        casual_indicators = self.cultural_patterns["formality"]["casual"]
        
        if any(re.search(pattern, message_lower) for pattern in formal_indicators):
            return "formal"
        elif any(re.search(pattern, message_lower) for pattern in casual_indicators):
            return "casual"
        
        return None

    def _resolve_final_meaning(
        self,
        user_message: str,
        ambiguity_resolutions: List[AmbiguityContext],
        implicit_meanings: List[ImplicitMeaning],
        non_verbal_cues: NonVerbalCues
    ) -> str:
        """Resolve the final meaning considering all analysis."""
        
        # Start with the original message
        resolved_meaning = user_message
        
        # Apply ambiguity resolutions
        for ambiguity in ambiguity_resolutions:
            if ambiguity.resolution_strategy == "context_analysis":
                # Use the most likely interpretation
                if ambiguity.possible_interpretations:
                    resolved_meaning = resolved_meaning.replace(
                        ambiguity.context_clues[0].split("'")[1],
                        ambiguity.possible_interpretations[0]
                    )
        
        # Add implicit meaning context
        implicit_context = []
        for meaning in implicit_meanings:
            if meaning.confidence > 0.7:
                implicit_context.append(meaning.interpretation)
        
        if implicit_context:
            resolved_meaning += f" [Context: {'; '.join(implicit_context)}]"
        
        return resolved_meaning

    def _calculate_confidence_score(
        self,
        ambiguity_resolutions: List[AmbiguityContext],
        implicit_meanings: List[ImplicitMeaning],
        non_verbal_cues: NonVerbalCues
    ) -> float:
        """Calculate overall confidence score for the understanding."""
        
        # Base confidence
        confidence = 0.8
        
        # Reduce confidence for ambiguities
        for ambiguity in ambiguity_resolutions:
            confidence -= 0.1
        
        # Increase confidence for high-confidence implicit meanings
        for meaning in implicit_meanings:
            if meaning.confidence > 0.8:
                confidence += 0.05
        
        # Adjust based on non-verbal cues clarity
        if non_verbal_cues.hesitation_indicators:
            confidence -= 0.1
        
        return max(0.0, min(1.0, confidence))

    def _collect_context_used(
        self,
        conversation_history: List[Dict],
        user_memories: List[Dict],
        ambiguity_resolutions: List[AmbiguityContext]
    ) -> List[str]:
        """Collect information about what context was used for understanding."""
        
        context_used = []
        
        if conversation_history:
            context_used.append(f"Used {len(conversation_history)} conversation turns")
        
        if user_memories:
            context_used.append(f"Used {len(user_memories)} user memories")
        
        for ambiguity in ambiguity_resolutions:
            context_used.append(f"Resolved {ambiguity.ambiguity_type.value}")
        
        return context_used

    def _find_potential_referents(
        self,
        pronoun: str,
        conversation_history: List[Dict]
    ) -> List[str]:
        """Find potential referents for a pronoun in conversation history."""
        
        referents = []
        
        # Look in recent conversation history for potential referents
        for message in reversed(conversation_history[-5:]):  # Last 5 messages
            content = message.get("content", "")
            # Simple noun phrase extraction (in a real implementation, this would be more sophisticated)
            words = content.split()
            for i, word in enumerate(words):
                if word.lower() in ["the", "a", "an"] and i + 1 < len(words):
                    referents.append(f"{word} {words[i + 1]}")
        
        return referents[:3]  # Return top 3 potential referents

    def _check_context_availability(
        self,
        term: str,
        context_type: str,
        conversation_history: List[Dict],
        user_memories: List[Dict]
    ) -> bool:
        """Check if sufficient context is available for a term."""
        
        # Simple context availability check
        if context_type == "timing":
            # Check for time-related context
            time_indicators = ["yesterday", "today", "tomorrow", "week", "month", "year"]
            for message in conversation_history:
                if any(indicator in message.get("content", "").lower() for indicator in time_indicators):
                    return True
        
        elif context_type == "quality assessment":
            # Check for quality-related context
            quality_indicators = ["good", "bad", "better", "worse", "quality", "performance"]
            for message in conversation_history:
                if any(indicator in message.get("content", "").lower() for indicator in quality_indicators):
                    return True
        
        return False

    def _analyze_emotional_context(
        self,
        term: str,
        conversation_history: List[Dict]
    ) -> Dict[str, Any]:
        """Analyze emotional context for a term."""
        
        # Simple emotional context analysis
        if term in ["fine", "okay", "whatever"]:
            return {
                "ambiguous": True,
                "interpretations": ["genuine satisfaction", "resigned acceptance", "dismissive attitude"],
                "clues": [f"Term '{term}' can have multiple emotional meanings"]
            }
        
        return {
            "ambiguous": False,
            "interpretations": [],
            "clues": []
        }

    def _count_repetition_patterns(
        self,
        message_lower: str,
        conversation_history: List[Dict]
    ) -> int:
        """Count repetition patterns that might indicate frustration."""
        
        repetition_count = 0
        
        # Check for repeated themes or issues
        for message in conversation_history[-10:]:  # Last 10 messages
            content = message.get("content", "").lower()
            # Simple repetition detection
            if any(word in content for word in ["again", "still", "yet", "always"]):
                repetition_count += 1
        
        return repetition_count
