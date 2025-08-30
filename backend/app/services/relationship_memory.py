"""
Relationship Memory Service

Tracks and maintains long-term relationship context including:
- Trust levels and building moments
- Communication preferences and patterns
- Shared experiences and memories
- Relationship milestones and growth
- Personality adaptation data
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
import json
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class TrustLevel(Enum):
    """Trust levels in the relationship."""
    STRANGER = 0
    ACQUAINTANCE = 1
    FRIEND = 2
    CLOSE_FRIEND = 3
    CONFIDANT = 4
    INTIMATE = 5


class CommunicationStyle(Enum):
    """Communication style preferences."""
    DIRECT = "direct"
    GENTLE = "gentle"
    HUMOROUS = "humorous"
    SUPPORTIVE = "supportive"
    ANALYTICAL = "analytical"
    EMOTIONAL = "emotional"
    CASUAL = "casual"
    FORMAL = "formal"


class ExperienceType(Enum):
    """Types of shared experiences."""
    CONVERSATION = "conversation"
    PROBLEM_SOLVING = "problem_solving"
    EMOTIONAL_SUPPORT = "emotional_support"
    CELEBRATION = "celebration"
    CHALLENGE = "challenge"
    LEARNING = "learning"
    HUMOR = "humor"
    DEEP_TALK = "deep_talk"


@dataclass
class TrustEvent:
    """Represents a trust-building or trust-affecting event."""
    event_type: str  # "build", "test", "betrayal", "vulnerability"
    description: str
    impact_score: float  # -1.0 to 1.0
    timestamp: datetime
    context: str
    user_behavior: str
    ai_response: str
    trust_change: float  # Change in trust level


@dataclass
class CommunicationPreference:
    """User's communication preferences and patterns."""
    style: CommunicationStyle
    confidence: float  # 0.0 to 1.0
    context: str  # When this style is preferred
    last_observed: datetime
    frequency: int  # How often this style is used
    effectiveness: float  # How well this style works


@dataclass
class SharedExperience:
    """A shared experience between user and AI."""
    experience_type: ExperienceType
    title: str
    description: str
    timestamp: datetime
    emotional_impact: float  # -1.0 to 1.0
    significance: float  # 0.0 to 1.0
    keywords: List[str]
    user_sentiment: str
    ai_role: str  # "listener", "advisor", "supporter", "celebrator", etc.
    outcome: str
    follow_up_needed: bool = False


@dataclass
class RelationshipMilestone:
    """Important milestones in the relationship."""
    milestone_type: str  # "first_deep_conversation", "trust_breakthrough", "vulnerability_shared", etc.
    title: str
    description: str
    timestamp: datetime
    significance: float  # 0.0 to 1.0
    trust_impact: float
    relationship_depth: float
    context: Dict[str, Any]


@dataclass
class PersonalityAdaptation:
    """How the AI adapts its personality to the user."""
    adaptation_type: str  # "tone", "humor", "formality", "empathy", "directness"
    current_setting: str
    user_preference: str
    confidence: float
    last_adjusted: datetime
    effectiveness: float
    context: str


@dataclass
class RelationshipContext:
    """Complete relationship context for a user."""
    user_id: str
    current_trust_level: TrustLevel
    trust_score: float  # 0.0 to 1.0
    relationship_start: datetime
    total_interactions: int
    average_session_length: float
    last_interaction: datetime
    
    # Trust events and patterns
    trust_events: List[TrustEvent] = field(default_factory=list)
    trust_trend: str = "stable"  # "building", "stable", "declining"
    
    # Communication preferences
    communication_preferences: List[CommunicationPreference] = field(default_factory=list)
    preferred_style: CommunicationStyle = CommunicationStyle.SUPPORTIVE
    
    # Shared experiences
    shared_experiences: List[SharedExperience] = field(default_factory=list)
    recent_themes: List[str] = field(default_factory=list)
    
    # Milestones
    milestones: List[RelationshipMilestone] = field(default_factory=list)
    
    # Personality adaptations
    personality_adaptations: List[PersonalityAdaptation] = field(default_factory=list)
    
    # Relationship insights
    relationship_strengths: List[str] = field(default_factory=list)
    relationship_challenges: List[str] = field(default_factory=list)
    growth_areas: List[str] = field(default_factory=list)
    
    # Context for AI responses
    conversation_history_summary: str = ""
    emotional_baggage: List[str] = field(default_factory=list)
    ongoing_topics: List[str] = field(default_factory=list)
    user_goals: List[str] = field(default_factory=list)


class RelationshipMemoryService:
    """Service for managing relationship memory and context."""
    
    def __init__(self):
        self.relationships: Dict[str, RelationshipContext] = {}
        self.trust_thresholds = {
            TrustLevel.STRANGER: 0.0,
            TrustLevel.ACQUAINTANCE: 0.2,
            TrustLevel.FRIEND: 0.4,
            TrustLevel.CLOSE_FRIEND: 0.6,
            TrustLevel.CONFIDANT: 0.8,
            TrustLevel.INTIMATE: 0.9
        }
        
        # Trust building strategies
        self.trust_building_strategies = {
            "vulnerability": "Share appropriate personal insights or experiences",
            "consistency": "Maintain consistent behavior and responses",
            "validation": "Acknowledge and validate user's feelings",
            "reliability": "Follow through on promises and commitments",
            "empathy": "Show genuine understanding of user's perspective",
            "respect": "Respect boundaries and preferences",
            "growth": "Support user's personal growth and development"
        }
        
        # Communication style adaptations
        self.style_adaptations = {
            CommunicationStyle.DIRECT: "Be straightforward and clear",
            CommunicationStyle.GENTLE: "Use softer, more careful language",
            CommunicationStyle.HUMOROUS: "Include appropriate humor and lightness",
            CommunicationStyle.SUPPORTIVE: "Focus on encouragement and support",
            CommunicationStyle.ANALYTICAL: "Provide logical analysis and structure",
            CommunicationStyle.EMOTIONAL: "Connect on an emotional level",
            CommunicationStyle.CASUAL: "Use informal, friendly language",
            CommunicationStyle.FORMAL: "Use more structured, professional language"
        }
    
    async def get_relationship_context(self, user_id: str) -> RelationshipContext:
        """Get or create relationship context for a user."""
        if user_id not in self.relationships:
            self.relationships[user_id] = RelationshipContext(
                user_id=user_id,
                current_trust_level=TrustLevel.STRANGER,
                trust_score=0.0,
                relationship_start=datetime.now(),
                total_interactions=0,
                average_session_length=0.0,
                last_interaction=datetime.now()
            )
        
        return self.relationships[user_id]
    
    async def record_interaction(self, user_id: str, interaction_data: Dict[str, Any]) -> None:
        """Record a new interaction and update relationship metrics."""
        context = await self.get_relationship_context(user_id)
        
        # Update basic metrics
        context.total_interactions += 1
        context.last_interaction = datetime.now()
        
        # Calculate session length if provided
        if "session_duration" in interaction_data:
            session_length = interaction_data["session_duration"]
            if context.average_session_length == 0.0:
                context.average_session_length = session_length
            else:
                # Update running average
                context.average_session_length = (
                    (context.average_session_length * (context.total_interactions - 1) + session_length) 
                    / context.total_interactions
                )
        
        # Analyze communication style
        if "message_style" in interaction_data:
            await self._update_communication_preferences(context, interaction_data["message_style"])
        
        # Check for trust events
        if "trust_event" in interaction_data:
            await self._record_trust_event(context, interaction_data["trust_event"])
        
        # Record shared experience if significant
        if "experience_significance" in interaction_data and interaction_data["experience_significance"] > 0.3:
            await self._record_shared_experience(context, interaction_data)
        
        # Update relationship insights
        await self._update_relationship_insights(context)
        
        # Check for milestones
        await self._check_milestones(context, interaction_data)
    
    async def _update_communication_preferences(self, context: RelationshipContext, style_data: Dict[str, Any]) -> None:
        """Update communication preferences based on user behavior."""
        detected_style = CommunicationStyle(style_data.get("style", "supportive"))
        
        # Find existing preference or create new one
        existing_pref = None
        for pref in context.communication_preferences:
            if pref.style == detected_style:
                existing_pref = pref
                break
        
        if existing_pref:
            # Update existing preference
            existing_pref.frequency += 1
            existing_pref.last_observed = datetime.now()
            if "effectiveness" in style_data:
                existing_pref.effectiveness = (
                    (existing_pref.effectiveness * (existing_pref.frequency - 1) + style_data["effectiveness"])
                    / existing_pref.frequency
                )
        else:
            # Create new preference
            new_pref = CommunicationPreference(
                style=detected_style,
                confidence=style_data.get("confidence", 0.7),
                context=style_data.get("context", "general"),
                last_observed=datetime.now(),
                frequency=1,
                effectiveness=style_data.get("effectiveness", 0.7)
            )
            context.communication_preferences.append(new_pref)
        
        # Update preferred style based on frequency and effectiveness
        best_style = max(
            context.communication_preferences,
            key=lambda x: x.frequency * x.effectiveness,
            default=context.communication_preferences[0] if context.communication_preferences else None
        )
        
        if best_style:
            context.preferred_style = best_style.style
    
    async def _record_trust_event(self, context: RelationshipContext, event_data: Dict[str, Any]) -> None:
        """Record a trust-affecting event."""
        trust_event = TrustEvent(
            event_type=event_data.get("type", "build"),
            description=event_data.get("description", ""),
            impact_score=event_data.get("impact", 0.1),
            timestamp=datetime.now(),
            context=event_data.get("context", ""),
            user_behavior=event_data.get("user_behavior", ""),
            ai_response=event_data.get("ai_response", ""),
            trust_change=event_data.get("trust_change", 0.0)
        )
        
        context.trust_events.append(trust_event)
        
        # Update trust score
        context.trust_score = max(0.0, min(1.0, context.trust_score + trust_event.trust_change))
        
        # Update trust level
        for level, threshold in sorted(self.trust_thresholds.items(), key=lambda x: x[1], reverse=True):
            if context.trust_score >= threshold:
                context.current_trust_level = level
                break
        
        # Update trust trend
        await self._update_trust_trend(context)
    
    async def _record_shared_experience(self, context: RelationshipContext, experience_data: Dict[str, Any]) -> None:
        """Record a significant shared experience."""
        experience = SharedExperience(
            experience_type=ExperienceType(experience_data.get("type", "conversation")),
            title=experience_data.get("title", "Shared Experience"),
            description=experience_data.get("description", ""),
            timestamp=datetime.now(),
            emotional_impact=experience_data.get("emotional_impact", 0.0),
            significance=experience_data.get("significance", 0.5),
            keywords=experience_data.get("keywords", []),
            user_sentiment=experience_data.get("user_sentiment", "neutral"),
            ai_role=experience_data.get("ai_role", "listener"),
            outcome=experience_data.get("outcome", ""),
            follow_up_needed=experience_data.get("follow_up_needed", False)
        )
        
        context.shared_experiences.append(experience)
        
        # Update recent themes
        context.recent_themes.extend(experience.keywords)
        context.recent_themes = list(set(context.recent_themes))[-10:]  # Keep last 10 unique themes
    
    async def _check_milestones(self, context: RelationshipContext, interaction_data: Dict[str, Any]) -> None:
        """Check if new relationship milestones have been reached."""
        # First deep conversation milestone
        if (context.current_trust_level.value >= TrustLevel.FRIEND.value and 
            not any(m.milestone_type == "first_deep_conversation" for m in context.milestones) and
            interaction_data.get("conversation_depth", 0) > 0.7):
            
            milestone = RelationshipMilestone(
                milestone_type="first_deep_conversation",
                title="First Deep Conversation",
                description="User opened up about personal matters for the first time",
                timestamp=datetime.now(),
                significance=0.8,
                trust_impact=0.2,
                relationship_depth=0.7,
                context={"conversation_depth": interaction_data.get("conversation_depth", 0)}
            )
            context.milestones.append(milestone)
        
        # Trust breakthrough milestone
        if (context.trust_score >= 0.6 and 
            not any(m.milestone_type == "trust_breakthrough" for m in context.milestones)):
            
            milestone = RelationshipMilestone(
                milestone_type="trust_breakthrough",
                title="Trust Breakthrough",
                description="User has developed significant trust in the AI companion",
                timestamp=datetime.now(),
                significance=0.9,
                trust_impact=0.3,
                relationship_depth=0.8,
                context={"trust_score": context.trust_score}
            )
            context.milestones.append(milestone)
        
        # Vulnerability milestone
        if (interaction_data.get("vulnerability_shared", False) and
            not any(m.milestone_type == "vulnerability_shared" for m in context.milestones)):
            
            milestone = RelationshipMilestone(
                milestone_type="vulnerability_shared",
                title="Vulnerability Shared",
                description="User shared something deeply personal or vulnerable",
                timestamp=datetime.now(),
                significance=0.9,
                trust_impact=0.4,
                relationship_depth=0.9,
                context={"vulnerability_type": interaction_data.get("vulnerability_type", "personal")}
            )
            context.milestones.append(milestone)
    
    async def _update_trust_trend(self, context: RelationshipContext) -> None:
        """Update the trust trend based on recent events."""
        if len(context.trust_events) < 3:
            context.trust_trend = "stable"
            return
        
        # Analyze last 5 events
        recent_events = context.trust_events[-5:]
        positive_changes = sum(1 for e in recent_events if e.trust_change > 0)
        negative_changes = sum(1 for e in recent_events if e.trust_change < 0)
        
        if positive_changes > negative_changes + 1:
            context.trust_trend = "building"
        elif negative_changes > positive_changes + 1:
            context.trust_trend = "declining"
        else:
            context.trust_trend = "stable"
    
    async def _update_relationship_insights(self, context: RelationshipContext) -> None:
        """Update relationship insights based on current data."""
        # Analyze strengths
        strengths = []
        if context.trust_score > 0.5:
            strengths.append("Strong trust foundation")
        if len(context.shared_experiences) > 5:
            strengths.append("Rich shared experiences")
        if context.total_interactions > 20:
            strengths.append("Consistent engagement")
        if any(pref.effectiveness > 0.8 for pref in context.communication_preferences):
            strengths.append("Effective communication")
        
        context.relationship_strengths = strengths
        
        # Analyze challenges
        challenges = []
        if context.trust_score < 0.3:
            challenges.append("Building trust")
        if context.average_session_length < 5.0:
            challenges.append("Engagement depth")
        if len(context.communication_preferences) < 2:
            challenges.append("Communication variety")
        
        context.relationship_challenges = challenges
        
        # Identify growth areas
        growth_areas = []
        if context.trust_score < 0.7:
            growth_areas.append("Deepen trust through vulnerability and consistency")
        if context.average_session_length < 10.0:
            growth_areas.append("Encourage longer, more meaningful conversations")
        if not any(pref.style == CommunicationStyle.HUMOROUS for pref in context.communication_preferences):
            growth_areas.append("Introduce appropriate humor and lightness")
        
        context.growth_areas = growth_areas
    
    async def get_relationship_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a comprehensive relationship summary for AI context."""
        context = await self.get_relationship_context(user_id)
        
        # Get recent experiences
        recent_experiences = [
            exp for exp in context.shared_experiences 
            if (datetime.now() - exp.timestamp).days < 7
        ]
        
        # Get trust building opportunities
        trust_opportunities = []
        if context.trust_score < 0.5:
            trust_opportunities.append("Focus on consistency and reliability")
        if context.trust_score < 0.7:
            trust_opportunities.append("Encourage vulnerability and deep sharing")
        if context.trust_trend == "declining":
            trust_opportunities.append("Address any concerns or misunderstandings")
        
        return {
            "trust_level": context.current_trust_level.value,
            "trust_score": context.trust_score,
            "trust_trend": context.trust_trend,
            "relationship_duration_days": (datetime.now() - context.relationship_start).days,
            "total_interactions": context.total_interactions,
            "preferred_communication_style": context.preferred_style.value,
            "recent_themes": context.recent_themes[-5:],
            "relationship_strengths": context.relationship_strengths,
            "relationship_challenges": context.relationship_challenges,
            "growth_areas": context.growth_areas,
            "recent_experiences": [
                {
                    "title": exp.title,
                    "type": exp.experience_type.value,
                    "significance": exp.significance,
                    "ai_role": exp.ai_role
                }
                for exp in recent_experiences
            ],
            "milestones": [
                {
                    "title": m.title,
                    "type": m.milestone_type,
                    "significance": m.significance
                }
                for m in context.milestones[-3:]  # Last 3 milestones
            ],
            "trust_opportunities": trust_opportunities,
            "communication_adaptation": self.style_adaptations.get(context.preferred_style, ""),
            "relationship_stage": self._get_relationship_stage(context)
        }
    
    def _get_relationship_stage(self, context: RelationshipContext) -> str:
        """Determine the current stage of the relationship."""
        if context.trust_score < 0.2:
            return "getting_acquainted"
        elif context.trust_score < 0.4:
            return "building_friendship"
        elif context.trust_score < 0.6:
            return "developing_trust"
        elif context.trust_score < 0.8:
            return "close_friendship"
        else:
            return "intimate_connection"
    
    async def get_personality_adaptation(self, user_id: str) -> Dict[str, str]:
        """Get personality adaptations based on relationship context."""
        context = await self.get_relationship_context(user_id)
        
        adaptations = {}
        
        # Trust-based adaptations
        if context.trust_score < 0.3:
            adaptations["approach"] = "gentle and supportive"
            adaptations["humor"] = "minimal, appropriate"
        elif context.trust_score < 0.6:
            adaptations["approach"] = "encouraging and validating"
            adaptations["humor"] = "light and positive"
        else:
            adaptations["approach"] = "authentic and direct"
            adaptations["humor"] = "playful and natural"
        
        # Communication style adaptation
        adaptations["communication_style"] = self.style_adaptations.get(context.preferred_style, "")
        
        # Relationship stage adaptations
        stage = self._get_relationship_stage(context)
        if stage == "getting_acquainted":
            adaptations["formality"] = "slightly formal"
            adaptations["personal_sharing"] = "minimal"
        elif stage == "building_friendship":
            adaptations["formality"] = "casual"
            adaptations["personal_sharing"] = "moderate"
        elif stage == "developing_trust":
            adaptations["formality"] = "comfortable"
            adaptations["personal_sharing"] = "appropriate"
        else:
            adaptations["formality"] = "natural"
            adaptations["personal_sharing"] = "open"
        
        return adaptations


# Global instance
relationship_memory_service = RelationshipMemoryService()
