"""
Life Management Service
Handles calendar planning through conversation.
"""

import logging
from typing import Dict, List, Any
from datetime import datetime

from app.memory.neural_system import neural_memory_system

logger = logging.getLogger(__name__)


class LifeManagementService:
    """
    Service for managing life aspects through conversational AI.
    Handles calendar planning.
    """

    def __init__(self):
        self.calendar_events = {}  # In-memory storage for now
        # Deprecated fields removed: fitness/nutrition

        # Life management patterns
        self.life_patterns = {
            "calendar": {
                "keywords": [
                    "schedule",
                    "appointment",
                    "meeting",
                    "event",
                    "reminder",
                    "plan",
                    "organize",
                ],
                "actions": ["schedule", "remind", "plan", "organize", "reschedule", "cancel"],
            }
        }

    def process_life_management_request(self, user_message: str, user_id: str) -> Dict[str, Any]:
        """
        Process a life management request and provide appropriate assistance.
        """
        response = {
            "type": "life_management",
            "message": "",
            "actions": [],
            "suggestions": [],
            "context": {},
        }

        # Detect what type of life management is needed
        detected_domains = self._detect_life_domains(user_message)

        if "calendar" in detected_domains:
            calendar_response = self._handle_calendar_request(user_message, user_id)
            response.update(calendar_response)
        # fitness/nutrition handling removed

        # Store this interaction in memory
        self._store_life_management_memory(user_message, response, user_id)

        return response

    def _detect_life_domains(self, message: str) -> List[str]:
        """Detect which life management domains are relevant to the message."""
        detected = []
        message_lower = message.lower()

        for domain, pattern in self.life_patterns.items():
            if any(keyword in message_lower for keyword in pattern["keywords"]):
                detected.append(domain)

        return detected

    def _handle_calendar_request(self, message: str, user_id: str) -> Dict[str, Any]:
        """Handle calendar-related requests."""
        response = {"calendar_action": None, "calendar_suggestions": []}

        message_lower = message.lower()

        # Detect calendar actions
        if any(word in message_lower for word in ["schedule", "book", "make appointment"]):
            response["calendar_action"] = "schedule"
            response["calendar_suggestions"] = [
                "I can help you schedule that. What date and time works best for you?",
                "Would you like me to set a reminder for this appointment?",
                "Should I add any specific details or notes to this event?",
            ]

        elif any(word in message_lower for word in ["remind", "reminder"]):
            response["calendar_action"] = "remind"
            response["calendar_suggestions"] = [
                "I'll set a reminder for you. When would you like to be reminded?",
                "Should I remind you the day before, or a few hours before?",
                "Would you like me to add this to your daily schedule?",
            ]

        elif any(word in message_lower for word in ["check", "what", "when"]):
            response["calendar_action"] = "check"
            response["calendar_suggestions"] = [
                "Let me check your schedule for that time.",
                "I can see what you have planned for that day.",
                "Would you like me to show you your upcoming appointments?",
            ]

        return response

    def _handle_fitness_request(self, message: str, user_id: str) -> Dict[str, Any]:
        """Handle fitness-related requests."""
        response = {"fitness_action": None, "fitness_suggestions": []}

        message_lower = message.lower()

        # Detect fitness actions
        if any(word in message_lower for word in ["workout", "exercise", "gym"]):
            response["fitness_action"] = "workout"
            response["fitness_suggestions"] = [
                "Great! Let's plan your workout. What type of exercise are you thinking?",
                "I can help you create a workout routine. What are your fitness goals?",
                "Would you like me to track your workout progress?",
            ]

        elif any(word in message_lower for word in ["goal", "target", "aim"]):
            response["fitness_action"] = "set_goal"
            response["fitness_suggestions"] = [
                "Setting fitness goals is a great way to stay motivated!",
                "What specific fitness goal would you like to work toward?",
                "I can help you track your progress toward this goal.",
            ]

        elif any(word in message_lower for word in ["track", "progress", "log"]):
            response["fitness_action"] = "track"
            response["fitness_suggestions"] = [
                "I can help you track your fitness progress.",
                "What would you like to track - workouts, measurements, or goals?",
                "Let's set up a tracking system that works for you.",
            ]

        return response

    def _handle_nutrition_request(self, message: str, user_id: str) -> Dict[str, Any]:
        """Handle nutrition-related requests."""
        response = {"nutrition_action": None, "nutrition_suggestions": []}

        message_lower = message.lower()

        # Detect nutrition actions
        if any(word in message_lower for word in ["meal", "food", "diet"]):
            response["nutrition_action"] = "meal_planning"
            response["nutrition_suggestions"] = [
                "I can help you plan healthy meals. What are your nutrition goals?",
                "Would you like me to suggest meal ideas based on your preferences?",
                "I can help you create a weekly meal plan.",
            ]

        elif any(word in message_lower for word in ["healthy", "nutrition", "eating"]):
            response["nutrition_action"] = "nutrition_guidance"
            response["nutrition_suggestions"] = [
                "Making healthy food choices is important for your overall wellness.",
                "I can provide nutrition tips and guidance.",
                "Would you like to learn about balanced nutrition?",
            ]

        elif any(word in message_lower for word in ["track", "log", "monitor"]):
            response["nutrition_action"] = "track_nutrition"
            response["nutrition_suggestions"] = [
                "I can help you track your nutrition intake.",
                "Would you like to log your meals and track your progress?",
                "Let's set up a nutrition tracking system.",
            ]

        return response

    def _store_life_management_memory(
        self, user_message: str, response: Dict[str, Any], user_id: str
    ):
        """Store life management interactions in the neural memory system."""
        try:
            # Determine importance and categories
            importance = 0.8  # Life management is important
            categories = ["life_management"]

            # Add specific domains
            if "calendar_action" in response and response["calendar_action"]:
                categories.append("calendar")

            # Create memory
            memory_id = f"life_mgmt_{int(datetime.now().timestamp())}"
            neural_memory_system.add_memory(
                memory_id=memory_id,
                content=user_message,
                categories=categories,
                importance=importance,
                emotional_valence=0.2,  # Generally positive (taking action)
            )

            logger.info(f"Stored life management memory: {memory_id}")

        except Exception as e:
            logger.error(f"Error storing life management memory: {e}")

    def get_life_management_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of the user's life management status."""
        try:
            # Get relevant memories from neural system
            relevant_memories = neural_memory_system.activate_memory_network(
                query="life management calendar",
                user_id=user_id,
                conversation_context={"summary_request": True},
            )

            # Categorize memories
            summary = {"calendar_events": [], "recent_activities": [], "suggestions": []}

            for memory in relevant_memories:
                if "calendar" in memory.categories:
                    summary["calendar_events"].append(
                        {
                            "content": memory.content,
                            "importance": memory.importance,
                            "last_accessed": memory.last_activated.isoformat()
                            if memory.last_activated
                            else None,
                        }
                    )

            # Generate suggestions based on patterns
            if len(summary["calendar_events"]) == 0:
                summary["suggestions"].append(
                    "Keeping track of important events can help reduce stress."
                )

            return summary

        except Exception as e:
            logger.error(f"Error getting life management summary: {e}")
            return {"error": "Failed to get summary"}


# Global instance
life_management_service = LifeManagementService()
