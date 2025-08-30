"""
Behavioral Analysis Service

This service analyzes user behavior patterns to provide deeper insights for
predictive intelligence and personalized interactions.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, Counter
import json
import re

logger = logging.getLogger(__name__)


class BehaviorType(Enum):
    """Types of user behaviors that can be analyzed."""
    COMMUNICATION_STYLE = "communication_style"
    DECISION_MAKING = "decision_making"
    PROBLEM_SOLVING = "problem_solving"
    SOCIAL_INTERACTION = "social_interaction"
    LEARNING_PREFERENCE = "learning_preference"


class BehaviorIntensity(Enum):
    """Intensity levels for behaviors."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class BehaviorPattern:
    """Represents a detected behavior pattern."""
    behavior_type: BehaviorType
    intensity: BehaviorIntensity
    frequency: int
    context: Dict[str, Any]
    first_observed: datetime
    last_observed: datetime
    confidence: float
    triggers: List[str]
    impact: str  # positive, negative, neutral


@dataclass
class BehavioralInsight:
    """Represents an insight about user behavior."""
    insight_type: str
    description: str
    confidence: float
    evidence: List[str]
    recommendations: List[str]
    context: Dict[str, Any]


@dataclass
class PersonalityTrait:
    """Represents a personality trait derived from behavior analysis."""
    trait_name: str
    score: float  # 0.0 to 1.0
    confidence: float
    evidence: List[str]
    description: str


class BehavioralAnalysisEngine:
    """
    Engine for analyzing user behavior patterns and generating insights.
    """
    
    def __init__(self):
        self.behavior_patterns: Dict[str, List[BehaviorPattern]] = defaultdict(list)
        self.personality_traits: Dict[str, List[PersonalityTrait]] = defaultdict(list)
        self.behavioral_insights: Dict[str, List[BehavioralInsight]] = defaultdict(list)
        
        # Analysis thresholds
        self.min_behavior_frequency = 2
        self.min_confidence_threshold = 0.6
        self.insight_decay_days = 60
        
        # Communication style indicators
        self.communication_indicators = {
            "direct": ["direct", "straightforward", "clear", "explicit"],
            "indirect": ["suggest", "maybe", "perhaps", "consider", "think about"],
            "analytical": ["analyze", "examine", "evaluate", "assess", "consider"],
            "emotional": ["feel", "emotion", "heart", "passion", "excited"],
            "collaborative": ["we", "us", "together", "collaborate", "team"],
            "independent": ["I", "me", "myself", "alone", "independent"]
        }
        
        logger.info("BehavioralAnalysisEngine initialized")
    
    async def analyze_user_behavior(self, user_id: str, conversation_data: Dict[str, Any]) -> List[BehaviorPattern]:
        """
        Analyze conversation data to detect behavior patterns.
        
        Args:
            user_id: The user identifier
            conversation_data: Recent conversation data including messages, interactions
            
        Returns:
            List of detected behavior patterns
        """
        try:
            patterns = []
            
            # Analyze communication style
            comm_patterns = self._analyze_communication_style(user_id, conversation_data)
            patterns.extend(comm_patterns)
            
            # Store and update patterns
            self._update_behavior_patterns(user_id, patterns)
            
            logger.info(f"Detected {len(patterns)} behavior patterns for user {user_id}")
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing behavior for user {user_id}: {e}")
            return []
    
    def _analyze_communication_style(self, user_id: str, data: Dict[str, Any]) -> List[BehaviorPattern]:
        """Analyze communication style patterns."""
        patterns = []
        
        try:
            messages = data.get("messages", [])
            if len(messages) < 2:
                return patterns
            
            # Extract user messages
            user_messages = []
            for msg in messages:
                if msg.get("role") == "user" and "content" in msg:
                    user_messages.append(msg["content"].lower())
            
            if not user_messages:
                return patterns
            
            # Analyze communication indicators
            style_scores = defaultdict(int)
            total_words = 0
            
            for message in user_messages:
                words = message.split()
                total_words += len(words)
                
                for style, indicators in self.communication_indicators.items():
                    for indicator in indicators:
                        if indicator in message:
                            style_scores[style] += 1
            
            # Calculate style frequencies
            for style, count in style_scores.items():
                if count >= self.min_behavior_frequency:
                    frequency_ratio = count / len(user_messages)
                    confidence = min(0.9, frequency_ratio * 2)  # Scale confidence
                    
                    if confidence >= self.min_confidence_threshold:
                        intensity = self._get_behavior_intensity(frequency_ratio)
                        
                        pattern = BehaviorPattern(
                            behavior_type=BehaviorType.COMMUNICATION_STYLE,
                            intensity=intensity,
                            frequency=count,
                            context={
                                "style": style,
                                "frequency_ratio": frequency_ratio,
                                "total_messages": len(user_messages)
                            },
                            first_observed=datetime.now(),
                            last_observed=datetime.now(),
                            confidence=confidence,
                            triggers=["conversation_start", "topic_discussion"],
                            impact="neutral"
                        )
                        patterns.append(pattern)
                        
        except Exception as e:
            logger.error(f"Error analyzing communication style: {e}")
        
        return patterns
    
    def _get_behavior_intensity(self, frequency_ratio: float) -> BehaviorIntensity:
        """Convert frequency ratio to behavior intensity."""
        if frequency_ratio >= 0.8:
            return BehaviorIntensity.VERY_HIGH
        elif frequency_ratio >= 0.6:
            return BehaviorIntensity.HIGH
        elif frequency_ratio >= 0.4:
            return BehaviorIntensity.MODERATE
        else:
            return BehaviorIntensity.LOW
    
    def _update_behavior_patterns(self, user_id: str, new_patterns: List[BehaviorPattern]):
        """Update stored behavior patterns for a user."""
        try:
            existing_patterns = self.behavior_patterns[user_id]
            
            for new_pattern in new_patterns:
                # Check if similar pattern already exists
                similar_pattern = None
                for existing in existing_patterns:
                    if (existing.behavior_type == new_pattern.behavior_type and
                        self._behaviors_similar(existing, new_pattern)):
                        similar_pattern = existing
                        break
                
                if similar_pattern:
                    # Update existing pattern
                    similar_pattern.frequency += new_pattern.frequency
                    similar_pattern.last_observed = new_pattern.last_observed
                    similar_pattern.confidence = max(similar_pattern.confidence, new_pattern.confidence)
                else:
                    # Add new pattern
                    existing_patterns.append(new_pattern)
            
            # Remove old patterns (decay)
            current_time = datetime.now()
            self.behavior_patterns[user_id] = [
                p for p in existing_patterns
                if (current_time - p.last_observed).days < self.insight_decay_days
            ]
            
        except Exception as e:
            logger.error(f"Error updating behavior patterns for user {user_id}: {e}")
    
    def _behaviors_similar(self, pattern1: BehaviorPattern, pattern2: BehaviorPattern) -> bool:
        """Check if two behavior patterns are similar enough to be considered the same."""
        if pattern1.behavior_type != pattern2.behavior_type:
            return False
        
        # Compare context based on behavior type
        if pattern1.behavior_type == BehaviorType.COMMUNICATION_STYLE:
            return pattern1.context.get("style") == pattern2.context.get("style")
        else:
            return True
    
    async def generate_behavioral_insights(self, user_id: str) -> List[BehavioralInsight]:
        """
        Generate behavioral insights based on detected patterns.
        
        Args:
            user_id: The user identifier
            
        Returns:
            List of behavioral insights
        """
        try:
            insights = []
            patterns = self.behavior_patterns.get(user_id, [])
            
            if not patterns:
                return insights
            
            # Generate insights for communication style
            comm_patterns = [p for p in patterns if p.behavior_type == BehaviorType.COMMUNICATION_STYLE]
            if comm_patterns:
                dominant_style = max(comm_patterns, key=lambda p: p.frequency)
                
                insight = BehavioralInsight(
                    insight_type="communication_style",
                    description=f"You tend to communicate in a {dominant_style.context.get('style', 'balanced')} manner",
                    confidence=dominant_style.confidence,
                    evidence=[f"Used {dominant_style.context.get('style', '')} style {dominant_style.frequency} times"],
                    recommendations=[
                        "Consider adapting your communication style based on your audience",
                        "Be aware of how your communication style affects others"
                    ],
                    context={"dominant_style": dominant_style.context.get("style")}
                )
                insights.append(insight)
            
            # Store insights
            self.behavioral_insights[user_id].extend(insights)
            
            logger.info(f"Generated {len(insights)} behavioral insights for user {user_id}")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating behavioral insights for user {user_id}: {e}")
            return []
    
    async def derive_personality_traits(self, user_id: str) -> List[PersonalityTrait]:
        """
        Derive personality traits from behavior patterns.
        
        Args:
            user_id: The user identifier
            
        Returns:
            List of derived personality traits
        """
        try:
            traits = []
            patterns = self.behavior_patterns.get(user_id, [])
            
            if not patterns:
                return traits
            
            # Analyze communication patterns for personality traits
            comm_patterns = [p for p in patterns if p.behavior_type == BehaviorType.COMMUNICATION_STYLE]
            if comm_patterns:
                for pattern in comm_patterns:
                    style = pattern.context.get("style", "")
                    
                    if style == "direct":
                        trait = PersonalityTrait(
                            trait_name="Directness",
                            score=pattern.confidence,
                            confidence=pattern.confidence,
                            evidence=[f"Uses direct communication {pattern.frequency} times"],
                            description="You prefer clear, straightforward communication"
                        )
                        traits.append(trait)
                    
                    elif style == "analytical":
                        trait = PersonalityTrait(
                            trait_name="Analytical Thinking",
                            score=pattern.confidence,
                            confidence=pattern.confidence,
                            evidence=[f"Uses analytical language {pattern.frequency} times"],
                            description="You tend to think and communicate in a logical, analytical manner"
                        )
                        traits.append(trait)
                    
                    elif style == "emotional":
                        trait = PersonalityTrait(
                            trait_name="Emotional Expression",
                            score=pattern.confidence,
                            confidence=pattern.confidence,
                            evidence=[f"Uses emotional language {pattern.frequency} times"],
                            description="You are comfortable expressing and discussing emotions"
                        )
                        traits.append(trait)
            
            # Store traits
            self.personality_traits[user_id].extend(traits)
            
            logger.info(f"Derived {len(traits)} personality traits for user {user_id}")
            return traits
            
        except Exception as e:
            logger.error(f"Error deriving personality traits for user {user_id}: {e}")
            return []
    
    def get_behavioral_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a comprehensive behavioral summary for a user."""
        try:
            patterns = self.behavior_patterns.get(user_id, [])
            insights = self.behavioral_insights.get(user_id, [])
            traits = self.personality_traits.get(user_id, [])
            
            summary = {
                "total_patterns": len(patterns),
                "pattern_types": Counter([p.behavior_type.value for p in patterns]),
                "total_insights": len(insights),
                "total_traits": len(traits),
                "strongest_patterns": sorted(patterns, key=lambda p: p.confidence, reverse=True)[:3],
                "recent_insights": insights[-3:] if insights else [],
                "dominant_traits": sorted(traits, key=lambda t: t.score, reverse=True)[:3] if traits else []
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting behavioral summary: {e}")
            return {}


# Global instance
behavioral_analysis_engine = BehavioralAnalysisEngine()
