"""
Hybrid Intent Detection Service for AI Companion Chat
Combines LLM intelligence with regex fallback for robust intent detection.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from app.services.llm_intent_detector import llm_intent_detector
from app.services.action_detector import action_detector

logger = logging.getLogger(__name__)

class HybridIntentDetector:
    """Combines LLM and regex-based intent detection for maximum accuracy."""
    
    def __init__(self):
        self.llm_detector = llm_intent_detector
        self.regex_detector = action_detector
        self.confidence_threshold = 0.7  # Minimum confidence for LLM detection
    
    async def detect_intent(self, user_message: str, conversation_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Detect intent using hybrid approach: LLM first, regex fallback."""
        try:
            # Try LLM detection first
            llm_result = await self.llm_detector.detect_intent(user_message, conversation_context)
            
            # If LLM detected an action with high confidence, use it
            if (llm_result.get("action") and 
                llm_result.get("confidence", 0) >= self.confidence_threshold):
                
                logger.info(f"LLM detected intent: {llm_result['action']} (confidence: {llm_result['confidence']})")
                return self._format_llm_result(llm_result)
            
            # Fall back to regex detection
            regex_result = self.regex_detector.detect_action_intent(user_message)
            
            if regex_result:
                logger.info(f"Regex fallback detected intent: {regex_result['action']}")
                return self._format_regex_result(regex_result)
            
            # No intent detected by either method
            return {
                "action": None,
                "confidence": 0.0,
                "parameters": {},
                "reasoning": "No action intent detected by LLM or pattern matching",
                "method": "none"
            }
            
        except Exception as e:
            logger.error(f"Error in hybrid intent detection: {str(e)}")
            # Fall back to regex only
            try:
                regex_result = self.regex_detector.detect_action_intent(user_message)
                if regex_result:
                    return self._format_regex_result(regex_result)
            except Exception as regex_error:
                logger.error(f"Regex fallback also failed: {str(regex_error)}")
            
            return {
                "action": None,
                "confidence": 0.0,
                "parameters": {},
                "reasoning": "Intent detection failed, system error",
                "method": "error"
            }
    
    def _format_llm_result(self, llm_result: Dict[str, Any]) -> Dict[str, Any]:
        """Format LLM detection result for consistency."""
        return {
            "action": llm_result["action"],
            "confidence": llm_result["confidence"],
            "parameters": llm_result.get("parameters", {}),
            "reasoning": llm_result.get("reasoning", "LLM detected intent"),
            "method": "llm",
            "raw_llm_response": llm_result
        }
    
    def _format_regex_result(self, regex_result: Dict[str, Any]) -> Dict[str, Any]:
        """Format regex detection result for consistency."""
        return {
            "action": regex_result["action"],
            "confidence": regex_result["confidence"],
            "parameters": {},  # Will be extracted separately
            "reasoning": f"Pattern matched: {regex_result.get('detected_pattern', 'unknown')}",
            "method": "regex",
            "raw_regex_response": regex_result
        }
    
    def extract_parameters(self, user_message: str, intent_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters using the appropriate method."""
        if intent_result.get("method") == "llm":
            # Use LLM-extracted parameters
            return intent_result.get("parameters", {})
        elif intent_result.get("method") == "regex":
            # Use regex parameter extraction
            return self.regex_detector.extract_action_params(user_message, intent_result["raw_regex_response"])
        else:
            return {}
    
    def get_detection_stats(self) -> Dict[str, Any]:
        """Get statistics about detection method usage."""
        # This could track method usage over time
        return {
            "total_detections": 0,
            "llm_detections": 0,
            "regex_detections": 0,
            "failed_detections": 0,
            "average_llm_confidence": 0.0
        }
    
    async def test_detection_methods(self, user_message: str) -> Dict[str, Any]:
        """Test both detection methods on the same message for comparison."""
        try:
            # Test LLM detection
            llm_result = await self.llm_detector.detect_intent(user_message)
            
            # Test regex detection
            regex_result = self.regex_detector.detect_action_intent(user_message)
            
            return {
                "user_message": user_message,
                "llm_result": llm_result,
                "regex_result": regex_result,
                "comparison": {
                    "llm_detected": llm_result.get("action") is not None,
                    "regex_detected": regex_result is not None,
                    "same_action": (llm_result.get("action") == regex_result.get("action") if regex_result else False),
                    "llm_confidence": llm_result.get("confidence", 0.0),
                    "regex_confidence": regex_result.get("confidence", 0.0) if regex_result else 0.0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in detection method comparison: {str(e)}")
            return {
                "user_message": user_message,
                "error": str(e),
                "llm_result": None,
                "regex_result": None
            }


# Global instance
hybrid_intent_detector = HybridIntentDetector()

