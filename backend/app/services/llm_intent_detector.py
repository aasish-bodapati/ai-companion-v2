"""
LLM-Powered Intent Detection Service for AI Companion Chat
Uses the LLM to intelligently detect user intents from natural language.
"""

import json
import logging
from typing import Optional, Dict, Any, List
from app.core.llm import llm_client
from app.actions.registry import registry

logger = logging.getLogger(__name__)

class LLMIntentDetector:
    """Uses LLM to detect action intents from natural language."""
    
    def __init__(self):
        self.available_actions = self._get_available_actions()
        self.system_prompt = self._build_system_prompt()
    
    def _get_available_actions(self) -> List[Dict[str, Any]]:
        """Get list of available actions from registry."""
        actions = []
        for action_name, action_info in registry.actions.items():
            actions.append({
                "name": action_name,
                "description": action_info.get("description", ""),
                "parameters": action_info.get("parameters", {}),
                "examples": action_info.get("examples", [])
            })
        return actions
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for intent detection."""
        actions_json = json.dumps(self.available_actions, indent=2)
        
        return f"""You are an intelligent intent detection system for an AI Companion.

Your job is to analyze user messages and determine if they want to perform any actions.

AVAILABLE ACTIONS:
{actions_json}

INSTRUCTIONS:
1. Analyze the user's message for action intent
2. If an action is detected, return a JSON response with:
   - action: the action name (must match exactly from available actions)
   - confidence: confidence level 0.0-1.0
   - parameters: any parameters mentioned (extract what you can)
   - reasoning: brief explanation of why you chose this action

3. If no action is detected, return:
   - action: null
   - confidence: 0.0
   - parameters: {{}}
   - reasoning: "No action intent detected"

4. Be intelligent about context and natural language variations
5. Handle ambiguous cases by asking for clarification if needed

EXAMPLES:
User: "I just finished a 45-minute workout"
Response: {{
  "action": "fitness.log_workout",
  "confidence": 0.95,
  "parameters": {{"duration_min": 45}},
  "reasoning": "User is reporting completion of a workout with duration"
}}

User: "What's the weather like?"
Response: {{
  "action": null,
  "confidence": 0.0,
  "parameters": {{}},
  "reasoning": "No action intent detected - just asking for information"
}}

User: "Can you schedule my workout for tomorrow at 6 AM?"
Response: {{
  "action": "calendar.create_event",
  "confidence": 0.98,
  "parameters": {{"title": "Workout", "day": "tomorrow", "time": "6 AM"}},
  "reasoning": "User wants to schedule a recurring workout event"
}}

RESPONSE FORMAT:
Return ONLY valid JSON, no other text."""
    
    async def detect_intent(self, user_message: str, conversation_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Use LLM to detect action intent from user message."""
        try:
            # Build the user prompt
            user_prompt = f"User message: {user_message}"
            
            if conversation_context:
                user_prompt += f"\n\nConversation context: {json.dumps(conversation_context, indent=2)}"
            
            # Get LLM response
            response = await llm_client.chat_completion(
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,  # Low temperature for consistent intent detection
                max_tokens=500
            )
            
            # Parse the response
            try:
                intent_data = json.loads(response.content)
                
                # Validate the response
                if not self._validate_intent_response(intent_data):
                    logger.warning(f"Invalid LLM intent response: {intent_data}")
                    return self._get_fallback_response()
                
                return intent_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.error(f"Raw response: {response.content}")
                return self._get_fallback_response()
                
        except Exception as e:
            logger.error(f"Error in LLM intent detection: {str(e)}")
            return self._get_fallback_response()
    
    def _validate_intent_response(self, intent_data: Dict[str, Any]) -> bool:
        """Validate the LLM intent response."""
        required_fields = ["action", "confidence", "parameters", "reasoning"]
        
        # Check required fields
        if not all(field in intent_data for field in required_fields):
            return False
        
        # Validate confidence
        confidence = intent_data.get("confidence", 0)
        if not isinstance(confidence, (int, float)) or not (0 <= confidence <= 1):
            return False
        
        # Validate action
        action = intent_data.get("action")
        if action is not None:
            # Check if action exists in registry
            if action not in registry.actions:
                return False
        
        # Validate parameters
        parameters = intent_data.get("parameters", {})
        if not isinstance(parameters, dict):
            return False
        
        return True
    
    def _get_fallback_response(self) -> Dict[str, Any]:
        """Get fallback response when LLM detection fails."""
        return {
            "action": None,
            "confidence": 0.0,
            "parameters": {},
            "reasoning": "LLM intent detection failed, falling back to pattern matching"
        }
    
    def get_action_suggestions(self, user_message: str) -> List[str]:
        """Get suggested actions based on user message (for UI hints)."""
        # This could use embeddings or simple keyword matching
        suggestions = []
        
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ["workout", "exercise", "gym", "run", "train"]):
            suggestions.append("fitness.log_workout")
        
        if any(word in message_lower for word in ["eat", "meal", "food", "breakfast", "lunch", "dinner"]):
            suggestions.append("nutrition.log_meal")
        
        if any(word in message_lower for word in ["schedule", "calendar", "appointment", "meeting", "reminder"]):
            suggestions.append("calendar.create_event")
        
        if any(word in message_lower for word in ["goal", "target", "achieve", "improve"]):
            suggestions.append("coaching.create_goal")
        
        if any(word in message_lower for word in ["remember", "journal", "feel", "mood", "reflection"]):
            suggestions.append("journal.add_entry")
        
        return suggestions


# Global instance
llm_intent_detector = LLMIntentDetector()

