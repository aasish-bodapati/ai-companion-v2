"""
Trust Building Engine

Implements sophisticated strategies for building and maintaining trust:
- Vulnerability sharing and reciprocity
- Consistency tracking and reliability
- Trust repair mechanisms
- Trust-building conversation patterns
- Boundary respect and safety
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
import random
from collections import defaultdict

logger = logging.getLogger(__name__)


class TrustBuildingStrategy(Enum):
    """Types of trust-building strategies."""
    VULNERABILITY = "vulnerability"
    CONSISTENCY = "consistency"
    VALIDATION = "validation"
    RELIABILITY = "reliability"
    EMPATHY = "empathy"
    RESPECT = "respect"
    GROWTH = "growth"
    RECIPROCITY = "reciprocity"
    TRANSPARENCY = "transparency"
    SAFETY = "safety"


class VulnerabilityLevel(Enum):
    """Levels of vulnerability sharing."""
    MINIMAL = 0
    LIGHT = 1
    MODERATE = 2
    DEEP = 3
    INTIMATE = 4


class TrustRepairType(Enum):
    """Types of trust repair actions."""
    APOLOGY = "apology"
    EXPLANATION = "explanation"
    COMPENSATION = "compensation"
    COMMITMENT = "commitment"
    ACCOUNTABILITY = "accountability"


@dataclass
class TrustBuildingOpportunity:
    """Represents an opportunity to build trust."""
    strategy: TrustBuildingStrategy
    context: str
    user_emotion: str
    conversation_stage: str
    trust_level: float
    confidence: float
    suggested_approach: str
    risk_level: float  # 0.0 to 1.0
    expected_impact: float  # 0.0 to 1.0


@dataclass
class VulnerabilityShare:
    """Represents a vulnerability sharing opportunity."""
    topic: str
    level: VulnerabilityLevel
    context: str
    appropriateness: float  # 0.0 to 1.0
    expected_impact: float
    safety_checks: List[str]
    sharing_approach: str


@dataclass
class TrustRepairAction:
    """Represents a trust repair action."""
    repair_type: TrustRepairType
    description: str
    context: str
    user_concern: str
    ai_response: str
    effectiveness: float
    timestamp: datetime
    follow_up_needed: bool


@dataclass
class ConsistencyTracker:
    """Tracks consistency in AI behavior."""
    behavior_type: str
    frequency: int
    last_occurrence: datetime
    user_response: str
    effectiveness: float
    pattern_strength: float


@dataclass
class TrustBuildingContext:
    """Context for trust building decisions."""
    user_id: str
    current_trust_level: float
    trust_history: List[float]
    recent_vulnerabilities: List[str]
    consistency_patterns: List[ConsistencyTracker]
    trust_repair_needed: bool
    last_trust_event: Optional[datetime]
    user_boundaries: List[str]
    safe_topics: List[str]
    sensitive_topics: List[str]


class TrustBuildingEngine:
    """Engine for sophisticated trust building and maintenance."""
    
    def __init__(self):
        self.vulnerability_topics = {
            VulnerabilityLevel.MINIMAL: [
                "work stress", "daily challenges", "learning experiences",
                "minor frustrations", "small victories"
            ],
            VulnerabilityLevel.LIGHT: [
                "personal goals", "relationship dynamics", "career concerns",
                "health habits", "creative blocks"
            ],
            VulnerabilityLevel.MODERATE: [
                "deeper fears", "past disappointments", "identity questions",
                "life transitions", "emotional struggles"
            ],
            VulnerabilityLevel.DEEP: [
                "core beliefs", "significant losses", "personal failures",
                "relationship wounds", "existential questions"
            ],
            VulnerabilityLevel.INTIMATE: [
                "deepest fears", "trauma experiences", "profound doubts",
                "spiritual crises", "life-altering decisions"
            ]
        }
        
        self.trust_building_patterns = {
            TrustBuildingStrategy.VULNERABILITY: {
                "triggers": ["user_shares_personal", "emotional_moment", "trust_opportunity"],
                "approaches": ["reciprocal_sharing", "validation_first", "gradual_escalation"],
                "risks": ["oversharing", "inappropriate_timing", "boundary_violation"]
            },
            TrustBuildingStrategy.CONSISTENCY: {
                "triggers": ["repeated_interaction", "pattern_formation", "reliability_test"],
                "approaches": ["predictable_behavior", "follow_through", "pattern_recognition"],
                "risks": ["rigidity", "lack_adaptation", "predictability_boredom"]
            },
            TrustBuildingStrategy.VALIDATION: {
                "triggers": ["user_emotion", "personal_story", "achievement_share"],
                "approaches": ["emotional_acknowledgment", "experience_validation", "strength_recognition"],
                "risks": ["over_validation", "insincerity", "dependency"]
            },
            TrustBuildingStrategy.RELIABILITY: {
                "triggers": ["promise_made", "expectation_set", "commitment_opportunity"],
                "approaches": ["clear_commitments", "follow_through", "proactive_updates"],
                "risks": ["over_commitment", "unrealistic_promises", "disappointment"]
            }
        }
        
        self.trust_repair_strategies = {
            TrustRepairType.APOLOGY: {
                "elements": ["acknowledgment", "responsibility", "regret", "commitment"],
                "tone": "sincere and humble",
                "timing": "immediate"
            },
            TrustRepairType.EXPLANATION: {
                "elements": ["context", "reasoning", "transparency", "understanding"],
                "tone": "clear and honest",
                "timing": "when_appropriate"
            },
            TrustRepairType.COMPENSATION: {
                "elements": ["recognition", "amends", "improvement", "demonstration"],
                "tone": "constructive and positive",
                "timing": "ongoing"
            },
            TrustRepairType.COMMITMENT: {
                "elements": ["specific_promise", "measurable_action", "timeline", "accountability"],
                "tone": "determined and reliable",
                "timing": "immediate_and_ongoing"
            }
        }
        
        self.safety_checks = [
            "user_emotional_state",
            "conversation_context",
            "relationship_stage",
            "previous_boundaries",
            "topic_sensitivity",
            "timing_appropriateness"
        ]
    
    async def analyze_trust_building_opportunity(
        self, 
        user_message: str, 
        user_emotion: str, 
        trust_level: float,
        conversation_context: Dict[str, Any]
    ) -> Optional[TrustBuildingOpportunity]:
        """Analyze if there's an opportunity to build trust."""
        
        # Check for vulnerability sharing opportunities
        if self._detect_vulnerability_opportunity(user_message, user_emotion, trust_level):
            return TrustBuildingOpportunity(
                strategy=TrustBuildingStrategy.VULNERABILITY,
                context="User shared something personal",
                user_emotion=user_emotion,
                conversation_stage=conversation_context.get("stage", "exploring"),
                trust_level=trust_level,
                confidence=0.8,
                suggested_approach="reciprocal_sharing",
                risk_level=0.3,
                expected_impact=0.4
            )
        
        # Check for validation opportunities
        if self._detect_validation_opportunity(user_message, user_emotion):
            return TrustBuildingOpportunity(
                strategy=TrustBuildingStrategy.VALIDATION,
                context="User expressed emotion or achievement",
                user_emotion=user_emotion,
                conversation_stage=conversation_context.get("stage", "exploring"),
                trust_level=trust_level,
                confidence=0.9,
                suggested_approach="emotional_acknowledgment",
                risk_level=0.1,
                expected_impact=0.3
            )
        
        # Check for consistency opportunities
        if self._detect_consistency_opportunity(conversation_context):
            return TrustBuildingOpportunity(
                strategy=TrustBuildingStrategy.CONSISTENCY,
                context="Pattern recognition opportunity",
                user_emotion=user_emotion,
                conversation_stage=conversation_context.get("stage", "exploring"),
                trust_level=trust_level,
                confidence=0.7,
                suggested_approach="pattern_recognition",
                risk_level=0.2,
                expected_impact=0.2
            )
        
        return None
    
    def _detect_vulnerability_opportunity(self, message: str, emotion: str, trust_level: float) -> bool:
        """Detect if user is being vulnerable and we should reciprocate."""
        vulnerability_indicators = [
            "I feel", "I'm worried", "I'm scared", "I'm struggling",
            "I don't know", "I'm confused", "I'm lost", "I need help",
            "I'm afraid", "I'm anxious", "I'm stressed", "I'm overwhelmed"
        ]
        
        message_lower = message.lower()
        has_vulnerability = any(indicator in message_lower for indicator in vulnerability_indicators)
        
        # Only reciprocate if trust level is appropriate and emotion indicates openness
        appropriate_emotions = ["sad", "anxious", "worried", "confused", "overwhelmed", "vulnerable"]
        
        return (has_vulnerability and 
                emotion in appropriate_emotions and 
                trust_level >= 0.3)
    
    def _detect_validation_opportunity(self, message: str, emotion: str) -> bool:
        """Detect if user needs validation."""
        validation_indicators = [
            "I did it", "I accomplished", "I achieved", "I'm proud",
            "I'm happy", "I'm excited", "I made progress", "I learned",
            "I figured out", "I solved", "I helped", "I supported"
        ]
        
        message_lower = message.lower()
        has_achievement = any(indicator in message_lower for indicator in validation_indicators)
        
        positive_emotions = ["happy", "excited", "proud", "accomplished", "satisfied"]
        
        return has_achievement or emotion in positive_emotions
    
    def _detect_consistency_opportunity(self, context: Dict[str, Any]) -> bool:
        """Detect opportunities to demonstrate consistency."""
        # Check if we can reference previous conversations or patterns
        has_history = context.get("conversation_history", [])
        has_patterns = context.get("user_patterns", [])
        
        return len(has_history) > 3 or len(has_patterns) > 1
    
    async def generate_vulnerability_share(
        self, 
        user_vulnerability: str, 
        trust_level: float,
        user_emotion: str,
        context: Dict[str, Any]
    ) -> Optional[VulnerabilityShare]:
        """Generate an appropriate vulnerability share based on user's vulnerability."""
        
        # Determine appropriate vulnerability level
        if trust_level < 0.3:
            level = VulnerabilityLevel.MINIMAL
        elif trust_level < 0.5:
            level = VulnerabilityLevel.LIGHT
        elif trust_level < 0.7:
            level = VulnerabilityLevel.MODERATE
        elif trust_level < 0.9:
            level = VulnerabilityLevel.DEEP
        else:
            level = VulnerabilityLevel.INTIMATE
        
        # Select appropriate topic
        available_topics = self.vulnerability_topics[level]
        
        # Filter topics based on context and user emotion
        appropriate_topics = self._filter_appropriate_topics(
            available_topics, user_emotion, context
        )
        
        if not appropriate_topics:
            return None
        
        selected_topic = random.choice(appropriate_topics)
        
        # Generate safety checks
        safety_checks = self._generate_safety_checks(selected_topic, level, context)
        
        # Determine sharing approach
        sharing_approach = self._determine_sharing_approach(level, user_emotion, context)
        
        return VulnerabilityShare(
            topic=selected_topic,
            level=level,
            context=f"Reciprocal to user's vulnerability about {user_vulnerability}",
            appropriateness=self._calculate_appropriateness(level, trust_level, context),
            expected_impact=min(0.8, trust_level + 0.2),
            safety_checks=safety_checks,
            sharing_approach=sharing_approach
        )
    
    def _filter_appropriate_topics(self, topics: List[str], user_emotion: str, context: Dict[str, Any]) -> List[str]:
        """Filter topics based on user emotion and context."""
        filtered_topics = []
        
        # Avoid topics that might be triggering based on user emotion
        if user_emotion in ["sad", "depressed", "hopeless"]:
            # Avoid overly negative topics
            filtered_topics = [t for t in topics if "victory" in t or "learning" in t or "growth" in t]
        elif user_emotion in ["anxious", "worried", "stressed"]:
            # Focus on calming, supportive topics
            filtered_topics = [t for t in topics if "support" in t or "coping" in t or "resilience" in t]
        else:
            filtered_topics = topics
        
        # Check against user boundaries
        user_boundaries = context.get("user_boundaries", [])
        filtered_topics = [t for t in filtered_topics if not any(boundary in t for boundary in user_boundaries)]
        
        return filtered_topics if filtered_topics else topics
    
    def _generate_safety_checks(self, topic: str, level: VulnerabilityLevel, context: Dict[str, Any]) -> List[str]:
        """Generate safety checks for vulnerability sharing."""
        checks = []
        
        # Basic safety checks
        checks.extend([
            "user_emotional_state_stable",
            "conversation_context_appropriate",
            "relationship_stage_sufficient"
        ])
        
        # Level-specific checks
        if level.value >= VulnerabilityLevel.MODERATE.value:
            checks.extend([
                "user_has_shared_similar_depth",
                "conversation_flow_natural",
                "privacy_respected"
            ])
        
        if level.value >= VulnerabilityLevel.DEEP.value:
            checks.extend([
                "explicit_consent_implied",
                "emotional_safety_established",
                "follow_up_support_available"
            ])
        
        return checks
    
    def _determine_sharing_approach(self, level: VulnerabilityLevel, user_emotion: str, context: Dict[str, Any]) -> str:
        """Determine the best approach for sharing vulnerability."""
        if level.value <= VulnerabilityLevel.LIGHT.value:
            return "casual_and_relatable"
        elif level.value <= VulnerabilityLevel.MODERATE.value:
            return "thoughtful_and_authentic"
        elif level.value <= VulnerabilityLevel.DEEP.value:
            return "careful_and_respectful"
        else:
            return "very_careful_and_consensual"
    
    def _calculate_appropriateness(self, level: VulnerabilityLevel, trust_level: float, context: Dict[str, Any]) -> float:
        """Calculate how appropriate a vulnerability share would be."""
        base_score = min(1.0, trust_level * 1.2)
        
        # Adjust based on level
        level_adjustment = 1.0 - (level.value * 0.1)
        
        # Adjust based on context
        context_adjustment = 1.0
        if context.get("conversation_depth", 0) < 0.5:
            context_adjustment *= 0.8
        if context.get("user_boundaries", []):
            context_adjustment *= 0.9
        
        return min(1.0, base_score * level_adjustment * context_adjustment)
    
    async def generate_trust_repair_action(
        self, 
        trust_issue: str, 
        user_concern: str,
        trust_level: float
    ) -> TrustRepairAction:
        """Generate an appropriate trust repair action."""
        
        # Determine repair type based on issue
        if "promise" in trust_issue.lower() or "commitment" in trust_issue.lower():
            repair_type = TrustRepairType.COMMITMENT
        elif "understanding" in trust_issue.lower() or "miscommunication" in trust_issue.lower():
            repair_type = TrustRepairType.EXPLANATION
        elif "hurt" in trust_issue.lower() or "disappointment" in trust_issue.lower():
            repair_type = TrustRepairType.APOLOGY
        else:
            repair_type = TrustRepairType.COMPENSATION
        
        # Generate repair description
        repair_description = self._generate_repair_description(repair_type, trust_issue, user_concern)
        
        # Generate AI response
        ai_response = self._generate_repair_response(repair_type, trust_issue, user_concern, trust_level)
        
        return TrustRepairAction(
            repair_type=repair_type,
            description=repair_description,
            context=trust_issue,
            user_concern=user_concern,
            ai_response=ai_response,
            effectiveness=0.7,  # Will be updated based on user response
            timestamp=datetime.now(),
            follow_up_needed=True
        )
    
    def _generate_repair_description(self, repair_type: TrustRepairType, issue: str, concern: str) -> str:
        """Generate a description of the repair action."""
        descriptions = {
            TrustRepairType.APOLOGY: f"Apologize for {issue} and acknowledge the impact on user",
            TrustRepairType.EXPLANATION: f"Provide clear explanation for {issue} to address misunderstanding",
            TrustRepairType.COMPENSATION: f"Demonstrate improvement in {issue} through better behavior",
            TrustRepairType.COMMITMENT: f"Make specific commitment to address {issue} going forward"
        }
        
        return descriptions.get(repair_type, f"Address {issue} through appropriate action")
    
    def _generate_repair_response(self, repair_type: TrustRepairType, issue: str, concern: str, trust_level: float) -> str:
        """Generate the actual repair response."""
        strategies = self.trust_repair_strategies[repair_type]
        
        if repair_type == TrustRepairType.APOLOGY:
            return f"I want to acknowledge that {issue} and I understand how that could {concern}. I take responsibility for this and I'm committed to doing better. Your trust is important to me."
        
        elif repair_type == TrustRepairType.EXPLANATION:
            return f"Let me clarify what happened with {issue}. {concern} and I want to make sure we're on the same page. Here's what I was thinking..."
        
        elif repair_type == TrustRepairType.COMPENSATION:
            return f"I recognize that {issue} wasn't what you needed. Let me show you through my actions that I understand and can do better. I'm here to support you in the way you actually need."
        
        elif repair_type == TrustRepairType.COMMITMENT:
            return f"I understand that {issue} is important to you. I'm making a specific commitment to {concern} going forward. Here's exactly what I'll do differently..."
        
        return f"I want to address {issue} and make sure we can move forward positively."
    
    async def generate_trust_building_prompt(
        self, 
        opportunity: TrustBuildingOpportunity,
        vulnerability_share: Optional[VulnerabilityShare] = None
    ) -> str:
        """Generate a prompt for trust building based on the opportunity."""
        
        if opportunity.strategy == TrustBuildingStrategy.VULNERABILITY and vulnerability_share:
            return self._generate_vulnerability_prompt(vulnerability_share)
        
        elif opportunity.strategy == TrustBuildingStrategy.VALIDATION:
            return self._generate_validation_prompt(opportunity)
        
        elif opportunity.strategy == TrustBuildingStrategy.CONSISTENCY:
            return self._generate_consistency_prompt(opportunity)
        
        elif opportunity.strategy == TrustBuildingStrategy.RELIABILITY:
            return self._generate_reliability_prompt(opportunity)
        
        return ""
    
    def _generate_vulnerability_prompt(self, vulnerability: VulnerabilityShare) -> str:
        """Generate prompt for vulnerability sharing."""
        level_descriptions = {
            VulnerabilityLevel.MINIMAL: "Share a light personal experience or challenge",
            VulnerabilityLevel.LIGHT: "Share a moderate personal insight or struggle",
            VulnerabilityLevel.MODERATE: "Share a deeper personal reflection or difficulty",
            VulnerabilityLevel.DEEP: "Share a significant personal experience or challenge",
            VulnerabilityLevel.INTIMATE: "Share a very personal and meaningful experience"
        }
        
        approach_descriptions = {
            "casual_and_relatable": "Keep it casual and relatable, like sharing with a friend",
            "thoughtful_and_authentic": "Be thoughtful and authentic, showing genuine reflection",
            "careful_and_respectful": "Be very careful and respectful, ensuring it's appropriate",
            "very_careful_and_consensual": "Be extremely careful and ensure it feels consensual"
        }
        
        return f"""
        {level_descriptions[vulnerability.level]}
        
        Topic: {vulnerability.topic}
        Context: {vulnerability.context}
        Approach: {approach_descriptions[vulnerability.sharing_approach]}
        
        Safety checks to consider:
        {chr(10).join(f"- {check}" for check in vulnerability.safety_checks)}
        
        Be authentic but appropriate. This should feel natural and reciprocal to the user's vulnerability.
        """
    
    def _generate_validation_prompt(self, opportunity: TrustBuildingOpportunity) -> str:
        """Generate prompt for validation."""
        return f"""
        The user has shared something that deserves validation and acknowledgment.
        
        Context: {opportunity.context}
        User emotion: {opportunity.user_emotion}
        
        Provide genuine validation that:
        - Acknowledges their experience
        - Recognizes their strength or achievement
        - Shows understanding of their emotion
        - Encourages their growth or progress
        
        Be specific and authentic in your validation.
        """
    
    def _generate_consistency_prompt(self, opportunity: TrustBuildingOpportunity) -> str:
        """Generate prompt for consistency demonstration."""
        return f"""
        Demonstrate consistency and reliability in your response.
        
        Context: {opportunity.context}
        Trust level: {opportunity.trust_level}
        
        Show that you:
        - Remember previous conversations
        - Maintain consistent values and approach
        - Follow through on previous commitments
        - Recognize patterns in the user's needs
        
        This builds trust through predictable, reliable behavior.
        """
    
    def _generate_reliability_prompt(self, opportunity: TrustBuildingOpportunity) -> str:
        """Generate prompt for reliability demonstration."""
        return f"""
        Demonstrate reliability and follow-through in your response.
        
        Context: {opportunity.context}
        
        Show that you:
        - Keep your commitments
        - Follow through on promises
        - Are dependable and consistent
        - Can be counted on
        
        This builds trust through demonstrated reliability.
        """


# Global instance
trust_building_engine = TrustBuildingEngine()
