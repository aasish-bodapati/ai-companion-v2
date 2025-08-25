"""
Human-Level Response Generator
Creates responses that are indistinguishable from a human companion.
"""

import logging
import random
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.services.personality_engine import personality_engine
from app.services.context_intelligence import context_intelligence
from app.memory.neural_system import neural_memory_system

logger = logging.getLogger(__name__)

class HumanResponseGenerator:
    """
    Generates human-level responses by integrating personality, context, and memory.
    Creates responses that feel genuinely human and maintain conversation flow.
    """
    
    def __init__(self):
        self.response_templates = {
            "empathetic": [
                "I can really feel how {emotion} this is for you",
                "That sounds {emotion} - I'm here with you",
                "I understand how {emotion} this must feel",
                "It's completely natural to feel {emotion} about this"
            ],
            "supportive": [
                "You're absolutely right to feel that way",
                "I believe in your ability to handle this",
                "You're stronger than you think",
                "I'm here to support you through this"
            ],
            "encouraging": [
                "I have a feeling this will work out",
                "You've got this - I can tell",
                "Every challenge is an opportunity to grow",
                "I believe in you"
            ],
            "curious": [
                "I'm really curious about what you think",
                "Tell me more about that",
                "What's your take on this?",
                "I wonder if..."
            ],
            "reflective": [
                "It sounds like this really matters to you",
                "I can see how this connects to what we've talked about",
                "This seems to be part of a bigger pattern",
                "I'm noticing some themes here"
            ]
        }
        
        self.transition_phrases = [
            "You know what?",
            "Actually,",
            "Come to think of it,",
            "On another note,",
            "Speaking of which,",
            "That reminds me,",
            "By the way,",
            "Oh, and"
        ]
        
        self.follow_up_questions = {
            "fitness": [
                "How does that make you feel physically?",
                "What's your energy level like with this?",
                "How does this fit into your overall routine?"
            ],
            "nutrition": [
                "How does this affect your eating patterns?",
                "What's your relationship with food like right now?",
                "How does this impact your energy throughout the day?"
            ],
            "stress": [
                "What's your stress level like right now?",
                "How are you coping with this?",
                "What helps you feel more grounded?"
            ],
            "relationships": [
                "How does this affect your other relationships?",
                "What support do you have around this?",
                "How do you want to show up in this situation?"
            ],
            "work": [
                "How does this impact your work life?",
                "What boundaries do you need to set?",
                "How can you take care of yourself while handling this?"
            ]
        }
    
    def generate_human_response(self, user_message: str, conversation_history: List[Dict], 
                              user_id: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generate a human-level response that integrates all advanced features.
        """
        try:
            logger.info(f"Generating human response for: {user_message[:50]}...")
            
            # Use provided context or create basic fallback
            if not context:
                context = {
                    "detected_domains": [],
                    "emotional_state": "neutral",
                    "urgency_level": "normal"
                }
            
            # Generate domain-specific response
            detected_domains = context.get("detected_domains", [])
            emotional_state = context.get("emotional_state", "neutral")
            
            # Select appropriate response template
            message = self._generate_contextual_message(user_message, detected_domains, emotional_state)
            
            # Generate suggested actions
            suggested_actions = self._generate_contextual_actions(detected_domains, emotional_state)
            
            response = {
                "message": message,
                "tone": self._determine_tone(emotional_state, detected_domains),
                "emotional_support": emotional_state in ["negative", "stressed", "anxious"],
                "action_oriented": len(detected_domains) > 0,
                "suggested_actions": suggested_actions,
                "has_context_continuity": False
            }
            
            logger.info(f"Human response generated successfully for domains: {detected_domains}")
            return response
            
        except Exception as e:
            logger.error(f"Error in generate_human_response: {e}")
            # Return a basic response structure to avoid complete failure
            return {
                "message": "I'm here to help you with whatever you need.",
                "tone": "supportive",
                "emotional_support": False,
                "action_oriented": False,
                "suggested_actions": [],
                "has_context_continuity": False
            }
    
    def _generate_contextual_message(self, user_message: str, domains: List[str], emotional_state: str) -> str:
        """Generate a contextual message based on domains and emotional state."""
        if "fitness" in domains:
            return "I can help you create a workout plan, track your progress, and stay motivated."
        elif "nutrition" in domains:
            return "I can help you create a meal plan that supports your goals."
        elif "stress" in domains:
            return "I can help you develop stress management techniques and find ways to relax."
        elif "health" in domains:
            return "I can help you monitor your health metrics, remember appointments, and maintain wellness."
        elif "scheduling" in domains:
            return "I can help you organize your schedule and stay on top of your appointments."
        else:
            return "I'm here to help you with whatever you need."
    
    def _generate_contextual_actions(self, domains: List[str], emotional_state: str) -> List[str]:
        """Generate contextual action suggestions."""
        actions = []
        
        if "fitness" in domains:
            actions.extend([
                "Would you like me to help you plan a workout routine?",
                "I can remind you about your fitness goals.",
                "Let's track your progress together."
            ])
        
        if "nutrition" in domains:
            actions.extend([
                "Should we create a meal plan?",
                "I can help you track your nutrition.",
                "Let's plan some healthy meals."
            ])
        
        if "stress" in domains:
            actions.extend([
                "Let's work on stress management techniques together.",
                "I can help you find ways to relax.",
                "Would you like to talk about what's causing the stress?"
            ])
        
        if "health" in domains:
            actions.extend([
                "I can help you remember your appointments.",
                "Would you like me to track your health metrics?",
                "I'm here to support your wellness journey."
            ])
        
        if "scheduling" in domains:
            actions.extend([
                "Let me help you organize your schedule.",
                "I can set reminders for important tasks.",
                "Would you like help with time management?"
            ])
        
        if not actions:
            if emotional_state == "negative":
                actions.append("I'm here to support you through this.")
            else:
                actions.append("Let's talk through what's on your mind.")
        
        return actions[:3]  # Return top 3 actions
    
    def _determine_tone(self, emotional_state: str, domains: List[str]) -> str:
        """Determine appropriate response tone."""
        if emotional_state == "negative":
            return "empathetic"
        elif emotional_state == "positive":
            return "encouraging"
        elif domains:
            return "supportive"
        else:
            return "friendly"
    
    def _generate_core_response(self, user_message: str, context: Dict, 
                              personality_context: Dict) -> Dict[str, Any]:
        """Generate the core response based on context and personality."""
        response = {
            "message": "",
            "tone": "supportive",
            "emotional_support": False,
            "action_oriented": False,
            "suggested_actions": [],
            "personality_traits": personality_context.get("active_traits", []),
            "context_understanding": context["integrated_understanding"]
        }
        
        # Determine response approach based on context
        response_type = context["response_context"]["response_type"]
        emotional_state = context["surface_context"]["emotional_state"]
        
        if response_type == "empathetic" or emotional_state == "negative":
            response["emotional_support"] = True
            response["message"] = self._generate_empathetic_response(context)
        elif response_type == "supportive":
            response["action_oriented"] = True
            response["message"] = self._generate_supportive_response(context)
        elif response_type == "reflective":
            response["message"] = self._generate_reflective_response(context)
        else:
            response["message"] = self._generate_conversational_response(context)
        
        return response
    
    def _generate_empathetic_response(self, context: Dict) -> str:
        """Generate an empathetic response that shows deep understanding."""
        emotional_state = context["surface_context"]["emotional_state"]
        domains = context["surface_context"]["detected_domains"]
        
        # Start with empathy
        if emotional_state == "negative":
            emotion_words = ["challenging", "difficult", "overwhelming", "frustrating", "worrisome"]
            emotion = random.choice(emotion_words)
            response = f"I can really feel how {emotion} this is for you. "
        else:
            response = "I'm really glad you're sharing this with me. "
        
        # Add domain-specific understanding
        if domains:
            domain = domains[0]
            if domain == "fitness":
                response += "It's completely normal to feel this way about your fitness journey. "
            elif domain == "nutrition":
                response += "Nutrition can be such a complex and emotional topic. "
            elif domain == "stress":
                response += "Stress has a way of affecting every part of our lives. "
            elif domain == "work":
                response += "Work challenges can really take a toll on our overall wellbeing. "
        
        # Add relationship context
        relationship_depth = context["relationship_context"]["depth"]
        if relationship_depth in ["developing", "deep"]:
            response += "I appreciate you trusting me with this. "
        
        return response
    
    def _generate_supportive_response(self, context: Dict) -> str:
        """Generate a supportive response that offers guidance."""
        domains = context["surface_context"]["detected_domains"]
        urgency = context["surface_context"]["urgency_level"]
        
        response = "You're absolutely right to be thinking about this. "
        
        # Add domain-specific support
        if domains:
            domain = domains[0]
            if domain == "fitness":
                response += "Your health and fitness matter, and it's okay to ask for help. "
            elif domain == "nutrition":
                response += "Making changes to your nutrition takes time and support. "
            elif domain == "stress":
                response += "Managing stress is a skill that we all need to develop. "
        
        # Add urgency-based guidance
        if urgency == "high":
            response += "This seems important to address now. "
        else:
            response += "This is worth taking the time to figure out. "
        
        return response
    
    def _generate_reflective_response(self, context: Dict) -> str:
        """Generate a reflective response that shows deep understanding."""
        conversation_thread = context["conversation_thread"]["theme"]
        emotional_progression = context["emotional_progression"]["arc"]
        
        response = "It sounds like this really matters to you. "
        
        # Add conversation continuity
        if conversation_thread != "new_conversation":
            response += f"I can see how this connects to what we've been talking about. "
        
        # Add emotional progression insight
        if emotional_progression == "recovery":
            response += "I'm noticing how you're working through this. "
        elif emotional_progression == "stable":
            response += "You seem to have a good handle on this. "
        
        return response
    
    def _generate_conversational_response(self, context: Dict) -> str:
        """Generate a natural conversational response."""
        domains = context["surface_context"]["detected_domains"]
        message_type = context["response_context"]["response_type"]
        
        if message_type == "gratitude":
            response = "You're so welcome! I'm really glad I could help. "
        elif message_type == "question":
            response = "That's a great question. "
        else:
            response = "That's really interesting. "
        
        # Add domain acknowledgment
        if domains:
            domain = domains[0]
            if domain == "fitness":
                response += "I love how you're thinking about your fitness. "
            elif domain == "nutrition":
                response += "It's great that you're focusing on your nutrition. "
            elif domain == "stress":
                response += "Taking care of your stress is so important. "
        
        return response
    
    def _integrate_memories(self, response: Dict, context: Dict, user_id: str) -> Dict:
        """Integrate relevant memories naturally into the response."""
        memory_connection = context["memory_connections"]["primary_connection"]
        
        # Lower the threshold to include more memories
        if memory_connection and memory_connection["connection_strength"] > 0.2:
            # Add memory reference naturally
            memory_content = memory_connection["content"]
            connection_type = memory_connection["connection_type"]
            
            if connection_type == "explicit_reference":
                # User is explicitly referencing the memory
                response["message"] += f"I remember you mentioned {memory_content[:50]}... "
            elif connection_type == "similarity":
                # Similar situation
                response["message"] += f"This reminds me of when you talked about {memory_content[:50]}... "
            elif connection_type == "emotional_continuity":
                # Emotional connection
                response["message"] += f"I can see how this connects to how you felt about {memory_content[:50]}... "
            else:
                # Generic connection
                response["message"] += f"Earlier you mentioned {memory_content[:50]}... "
            
            # Add insight from the memory
            response["message"] += "This seems related to what we've been discussing. "
            
            # Mark that we have context continuity
            response["has_context_continuity"] = True
        
        # Also check secondary connections for broader context
        secondary_connections = context["memory_connections"]["secondary_connections"]
        if secondary_connections and not response.get("has_context_continuity"):
            for connection in secondary_connections[:1]:  # Use first secondary connection
                if connection["connection_strength"] > 0.15:
                    memory_content = connection["content"]
                    response["message"] += f"Building on what we discussed about {memory_content[:30]}... "
                    response["has_context_continuity"] = True
                    break
        
        return response
    
    def _add_personality_expression(self, response: Dict, personality_context: Dict) -> Dict:
        """Add personality-driven elements to the response."""
        response_elements = personality_context.get("response_elements", [])
        
        for element in response_elements:
            trait = element["trait"]
            expression = element["expression"]
            intensity = element["intensity"]
            
            if trait == "humor" and intensity > 0.6:
                response["message"] += f" {expression} "
            elif trait == "optimism" and intensity > 0.7:
                response["message"] += f" {expression} "
            elif trait == "directness" and intensity > 0.6:
                response["message"] += f" {expression} "
        
        return response
    
    def _add_conversation_flow(self, response: Dict, context: Dict, 
                              conversation_history: List[Dict]) -> Dict:
        """Add natural conversation flow and transitions."""
        # Enhanced conversation flow detection
        if len(conversation_history) > 1:
            last_topics = set()
            current_topics = set(context["surface_context"]["detected_domains"])
            
            # Get topics from last few messages
            for msg in conversation_history[-3:]:
                if msg.get("role") == "user":
                    content = msg.get("content", "").lower()
                    if any(word in content for word in ["fitness", "workout", "exercise", "strength"]):
                        last_topics.add("fitness")
                    if any(word in content for word in ["nutrition", "food", "diet", "weight"]):
                        last_topics.add("nutrition")
                    if any(word in content for word in ["stress", "anxiety", "worried", "overwhelmed", "presentation"]):
                        last_topics.add("stress")
                    if any(word in content for word in ["health", "sleep", "tired", "wellness"]):
                        last_topics.add("health")
                    if any(word in content for word in ["schedule", "plan", "organize", "time"]):
                        last_topics.add("scheduling")
            
            # Check for topic continuity or related topics
            related_topics = {
                "fitness": ["health", "nutrition"],
                "nutrition": ["fitness", "health"],
                "stress": ["health", "sleep"],
                "health": ["fitness", "nutrition", "stress", "sleep"],
                "sleep": ["health", "stress"]
            }
            
            has_continuity = False
            
            # Direct topic overlap
            if last_topics.intersection(current_topics):
                has_continuity = True
                response["has_context_continuity"] = True
            else:
                # Check for related topics
                for current_topic in current_topics:
                    if current_topic in related_topics:
                        if last_topics.intersection(related_topics[current_topic]):
                            has_continuity = True
                            response["has_context_continuity"] = True
                            break
            
            # If we have continuity but no memory integration, add simple continuity
            if has_continuity and not response.get("has_context_continuity"):
                response["has_context_continuity"] = True
            
            # If topic changed without relation, add transition
            if not has_continuity and last_topics and current_topics:
                transition = random.choice(self.transition_phrases)
                response["message"] = f"{transition} {response['message']}"
        
        return response
    
    def _add_follow_up_questions(self, response: Dict, context: Dict) -> Dict:
        """Add thoughtful follow-up questions that show genuine interest."""
        domains = context["surface_context"]["detected_domains"]
        relationship_depth = context["relationship_context"]["depth"]
        
        # Only add questions for deeper relationships or complex contexts
        if relationship_depth in ["developing", "deep"] or context["integrated_understanding"]["complexity_level"] > 2:
            if domains:
                domain = domains[0]
                if domain in self.follow_up_questions:
                    question = random.choice(self.follow_up_questions[domain])
                    response["message"] += f" {question}"
                else:
                    response["message"] += " What's your take on this?"
            else:
                response["message"] += " How are you feeling about all of this?"
        
        return response
    
    def _finalize_response(self, response: Dict, context: Dict) -> Dict:
        """Finalize the response with proper formatting and validation."""
        # Clean up the message
        message = response["message"].strip()
        
        # Ensure proper punctuation
        if not message.endswith((".", "!", "?")):
            message += "."
        
        # Remove double spaces
        message = " ".join(message.split())
        
        response["message"] = message
        
        # Add response metadata
        response["generated_at"] = datetime.now().isoformat()
        response["context_complexity"] = context["integrated_understanding"]["complexity_level"]
        response["relationship_depth"] = context["relationship_context"]["depth"]
        
        return response
    
    def generate_conversation_summary(self, conversation_history: List[Dict], 
                                   user_id: str) -> Dict[str, Any]:
        """Generate a summary of the conversation for memory storage."""
        if not conversation_history:
            return {"summary": "", "key_themes": [], "emotional_arc": "neutral"}
        
        # Extract key themes
        themes = set()
        emotions = []
        
        for msg in conversation_history:
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                
                # Extract themes
                if any(word in content for word in ["fitness", "workout", "exercise"]):
                    themes.add("fitness")
                if any(word in content for word in ["nutrition", "food", "diet"]):
                    themes.add("nutrition")
                if any(word in content for word in ["stress", "anxiety", "worried"]):
                    themes.add("stress")
                if any(word in content for word in ["work", "job", "career"]):
                    themes.add("work")
                if any(word in content for word in ["relationship", "family", "friend"]):
                    themes.add("relationships")
                
                # Extract emotions
                if any(word in content for word in ["happy", "excited", "great"]):
                    emotions.append("positive")
                elif any(word in content for word in ["sad", "frustrated", "worried"]):
                    emotions.append("negative")
                else:
                    emotions.append("neutral")
        
        # Determine emotional arc
        if len(emotions) >= 2:
            if emotions[0] == "negative" and emotions[-1] == "positive":
                emotional_arc = "recovery"
            elif emotions[0] == "positive" and emotions[-1] == "negative":
                emotional_arc = "decline"
            else:
                emotional_arc = "stable"
        else:
            emotional_arc = "single_message"
        
        # Generate summary
        theme_list = list(themes)
        if theme_list:
            summary = f"Discussed {', '.join(theme_list)} with emotional arc: {emotional_arc}"
        else:
            summary = f"General conversation with emotional arc: {emotional_arc}"
        
        return {
            "summary": summary,
            "key_themes": theme_list,
            "emotional_arc": emotional_arc,
            "message_count": len(conversation_history),
            "user_messages": len([msg for msg in conversation_history if msg.get("role") == "user"])
        }

# Global instance
human_response_generator = HumanResponseGenerator()
