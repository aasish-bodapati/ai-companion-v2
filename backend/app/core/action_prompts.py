"""
Action-aware prompt utilities for the AI Companion.
"""

from typing import Optional


def get_action_aware_prompt(base_prompt: str, action_mode: Optional[str] = None) -> str:
    """
    Get an action-aware version of the base prompt.
    
    Args:
        base_prompt: The base system prompt
        action_mode: Optional action mode (e.g., "conversation", "action")
        
    Returns:
        The action-aware prompt
    """
    if action_mode == "action":
        return f"""{base_prompt}

You are currently in ACTION MODE. In this mode, you can:
- Execute specific tasks and actions
- Provide step-by-step guidance
- Help with planning and organization
- Take initiative in problem-solving

Be proactive and action-oriented while maintaining helpfulness."""
    
    # Default to conversation mode
    return f"""{base_prompt}

You are currently in CONVERSATION MODE. In this mode, you:
- Engage in natural dialogue
- Answer questions and provide information
- Offer suggestions and recommendations
- Maintain a conversational, friendly tone

Focus on being helpful and engaging in natural conversation."""
