"""
Proactive Intelligence System
Makes the AI truly human-like by anticipating user needs and offering help before they ask.
This is what separates a human companion from a reactive chatbot.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ProactiveOpportunity:
    """Represents an opportunity for proactive assistance."""
    type: str  # "suggestion", "reminder", "check_in", "celebration", "support"
    confidence: float  # 0.0 to 1.0
    context: str
    suggested_action: str
    timing: str  # "immediate", "soon", "later"
    priority: str  # "high", "medium", "low"


@dataclass
class UserPattern:
    """Tracks user patterns for proactive intelligence."""
    pattern_type: str  # "schedule", "preference", "goal", "stress", "achievement"
    frequency: int
    last_occurrence: datetime
    context: Dict[str, Any]
    confidence: float


class ProactiveIntelligenceEngine:
    """
    Analyzes user patterns and conversation context to identify opportunities
    for proactive assistance. This makes the AI feel truly human and caring.
    """
    
    def __init__(self):
        self.stress_indicators = [
            "stressed", "overwhelmed", "tired", "exhausted", "frustrated", 
            "worried", "anxious", "burned out", "drained", "struggling"
        ]
        
        self.achievement_indicators = [
            "completed", "finished", "achieved", "accomplished", "succeeded",
            "done", "made progress", "reached", "hit", "met"
        ]
        
        self.goal_indicators = [
            "goal", "plan", "target", "objective", "aim", "aspiration",
            "dream", "ambition", "intention", "resolution"
        ]
        
        self.schedule_patterns = [
            "meeting", "appointment", "deadline", "due date", "event",
            "call", "presentation", "interview", "review"
        ]

    def analyze_proactive_opportunities(self,
                                      user_message: str,
                                      conversation_history: List[Dict],
                                      user_memories: List[Dict],
                                      current_time: datetime) -> List[ProactiveOpportunity]:
        """
        Analyzes the conversation and user context to identify opportunities
        for proactive assistance. This is the core of human-like AI behavior.
        """
        
        opportunities = []
        
        # Analyze for stress and offer support
        stress_opportunity = self._detect_stress_opportunity(user_message, conversation_history)
        if stress_opportunity:
            opportunities.append(stress_opportunity)
        
        # Analyze for achievements and celebrate
        celebration_opportunity = self._detect_achievement_opportunity(user_message, conversation_history)
        if celebration_opportunity:
            opportunities.append(celebration_opportunity)
        
        # Analyze for goals and offer help
        goal_opportunity = self._detect_goal_opportunity(user_message, user_memories)
        if goal_opportunity:
            opportunities.append(goal_opportunity)
        
        # Analyze for schedule conflicts
        schedule_opportunity = self._detect_schedule_opportunity(user_message, user_memories, current_time)
        if schedule_opportunity:
            opportunities.append(schedule_opportunity)
        
        # Analyze for check-in opportunities
        check_in_opportunity = self._detect_check_in_opportunity(conversation_history, current_time)
        if check_in_opportunity:
            opportunities.append(check_in_opportunity)
        
        # Sort by priority and confidence
        opportunities.sort(key=lambda x: (x.priority == "high", x.confidence), reverse=True)
        
        return opportunities

    def generate_proactive_response(self, 
                                  opportunities: List[ProactiveOpportunity],
                                  conversation_context: Dict[str, Any]) -> Optional[str]:
        """
        Generates a proactive response based on identified opportunities.
        This makes the AI feel genuinely caring and human.
        """
        
        if not opportunities:
            return None
        
        # Take the highest priority opportunity
        opportunity = opportunities[0]
        
        if opportunity.confidence < 0.6:  # Only act on high-confidence opportunities
            return None
        
        if opportunity.type == "support":
            return self._generate_support_response(opportunity, conversation_context)
        elif opportunity.type == "celebration":
            return self._generate_celebration_response(opportunity, conversation_context)
        elif opportunity.type == "suggestion":
            return self._generate_suggestion_response(opportunity, conversation_context)
        elif opportunity.type == "reminder":
            return self._generate_reminder_response(opportunity, conversation_context)
        elif opportunity.type == "check_in":
            return self._generate_check_in_response(opportunity, conversation_context)
        
        return None

    def _detect_stress_opportunity(self, user_message: str, conversation_history: List[Dict]) -> Optional[ProactiveOpportunity]:
        """Detects when user is stressed and offers support."""
        message_lower = user_message.lower()
        
        # Check for stress indicators
        stress_count = sum(1 for indicator in self.stress_indicators if indicator in message_lower)
        
        if stress_count >= 1:
            # Check conversation history for context
            recent_context = " ".join([msg.get("content", "") for msg in conversation_history[-3:]])
            
            return ProactiveOpportunity(
                type="support",
                confidence=min(0.8, 0.4 + stress_count * 0.2),
                context=f"User appears stressed: {user_message}",
                suggested_action="Offer emotional support and practical help",
                timing="immediate",
                priority="high"
            )
        
        return None

    def _detect_achievement_opportunity(self, user_message: str, conversation_history: List[Dict]) -> Optional[ProactiveOpportunity]:
        """Detects achievements and celebrates them."""
        message_lower = user_message.lower()
        
        # Check for achievement indicators
        achievement_count = sum(1 for indicator in self.achievement_indicators if indicator in message_lower)
        
        if achievement_count >= 1:
            return ProactiveOpportunity(
                type="celebration",
                confidence=min(0.9, 0.5 + achievement_count * 0.2),
                context=f"User achieved something: {user_message}",
                suggested_action="Celebrate their achievement and show genuine excitement",
                timing="immediate",
                priority="high"
            )
        
        return None

    def _detect_goal_opportunity(self, user_message: str, user_memories: List[Dict]) -> Optional[ProactiveOpportunity]:
        """Detects goal-related conversations and offers help."""
        message_lower = user_message.lower()
        
        # Check for goal indicators
        goal_count = sum(1 for indicator in self.goal_indicators if indicator in message_lower)
        
        if goal_count >= 1:
            # Check if user has related goals in memories
            related_goals = []
            for memory in user_memories:
                if "goal" in memory.get("content", "").lower():
                    related_goals.append(memory["content"])
            
            return ProactiveOpportunity(
                type="suggestion",
                confidence=min(0.7, 0.3 + goal_count * 0.2),
                context=f"User discussing goals: {user_message}",
                suggested_action="Offer specific help and connect to existing goals",
                timing="immediate",
                priority="medium"
            )
        
        return None

    def _detect_schedule_opportunity(self, user_message: str, user_memories: List[Dict], current_time: datetime) -> Optional[ProactiveOpportunity]:
        """Detects schedule-related issues and offers help."""
        message_lower = user_message.lower()
        
        # Check for schedule patterns
        schedule_count = sum(1 for pattern in self.schedule_patterns if pattern in message_lower)
        
        if schedule_count >= 1:
            return ProactiveOpportunity(
                type="reminder",
                confidence=min(0.6, 0.3 + schedule_count * 0.15),
                context=f"User discussing schedule: {user_message}",
                suggested_action="Offer scheduling help and conflict detection",
                timing="immediate",
                priority="medium"
            )
        
        return None

    def _detect_check_in_opportunity(self, conversation_history: List[Dict], current_time: datetime) -> Optional[ProactiveOpportunity]:
        """Detects opportunities for check-ins based on conversation patterns."""
        
        # Check if it's been a while since last meaningful conversation
        if len(conversation_history) >= 2:
            last_message_time = conversation_history[-1].get("timestamp", current_time)
            if isinstance(last_message_time, str):
                try:
                    last_message_time = datetime.fromisoformat(last_message_time.replace('Z', '+00:00'))
                except:
                    last_message_time = current_time
            
            time_diff = current_time - last_message_time
            
            # If it's been more than 24 hours, suggest a check-in
            if time_diff > timedelta(hours=24):
                return ProactiveOpportunity(
                    type="check_in",
                    confidence=0.5,
                    context="It's been a while since we talked",
                    suggested_action="Check in on their wellbeing and recent activities",
                    timing="soon",
                    priority="low"
                )
        
        return None

    def _generate_support_response(self, opportunity: ProactiveOpportunity, context: Dict[str, Any]) -> str:
        """Generates a supportive response for stressed users."""
        responses = [
            "I can tell you're going through a lot right now. I'm here for you - what would be most helpful?",
            "That sounds really challenging. Would you like to talk through it, or would you prefer some practical suggestions?",
            "I hear how stressed you are. Let's figure out what would help you feel better right now.",
            "You're not alone in this. What can I do to support you today?",
        ]
        
        return responses[0]  # For now, use first response - could be randomized

    def _generate_celebration_response(self, opportunity: ProactiveOpportunity, context: Dict[str, Any]) -> str:
        """Generates a celebratory response for achievements."""
        responses = [
            "That's fantastic! I'm so excited for you - you've worked hard for this!",
            "Wow, congratulations! You should be really proud of yourself.",
            "Amazing work! This is a big deal and you totally deserve to celebrate.",
            "I'm thrilled for you! This is exactly the kind of progress that shows your dedication.",
        ]
        
        return responses[0]

    def _generate_suggestion_response(self, opportunity: ProactiveOpportunity, context: Dict[str, Any]) -> str:
        """Generates a helpful suggestion for goals."""
        responses = [
            "I'd love to help you with that! What specific aspect would you like to focus on first?",
            "That's a great goal! I have some ideas that might help - would you like to explore them?",
            "I'm excited to help you work toward this! What's your biggest challenge right now?",
            "This is exactly the kind of thing I can help with! Let's break it down into manageable steps.",
        ]
        
        return responses[0]

    def _generate_reminder_response(self, opportunity: ProactiveOpportunity, context: Dict[str, Any]) -> str:
        """Generates a helpful reminder for schedule-related items."""
        responses = [
            "I can help you stay on top of that! Would you like me to set up some reminders?",
            "That sounds important! I can help you organize your schedule around it.",
            "Let me help you make sure nothing falls through the cracks with this.",
            "I'm here to help you manage your time effectively for this.",
        ]
        
        return responses[0]

    def _generate_check_in_response(self, opportunity: ProactiveOpportunity, context: Dict[str, Any]) -> str:
        """Generates a check-in response."""
        responses = [
            "How have things been going since we last talked?",
            "I've been thinking about you! How are you doing?",
            "It's been a while - I'd love to catch up on how you're doing.",
            "How are you feeling today? I'm here if you want to chat.",
        ]
        
        return responses[0]


# Global instance
proactive_intelligence = ProactiveIntelligenceEngine()
