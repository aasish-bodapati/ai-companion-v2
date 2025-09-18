"""
Action-aware prompt utilities for HealthLog AI.
"""

from typing import Optional


def get_action_aware_prompt(base_prompt: str, action_mode: Optional[str] = None) -> str:
    """
    Get an action-aware version of the base prompt.
    
    Args:
        base_prompt: The base system prompt
        action_mode: Optional action mode (e.g., "conversation", "action", "coaching")
        
    Returns:
        The action-aware prompt
    """
    if action_mode == "action":
        return f"""{base_prompt}

You are currently in ACTION MODE. In this mode, you can:
- Help users log fitness activities, nutrition, and mood
- Provide step-by-step health guidance
- Create personalized workout or meal plans
- Set up health tracking reminders
- Analyze their health data patterns

Be proactive and action-oriented while maintaining a supportive health coach tone."""
    
    elif action_mode == "coaching":
        return f"""{base_prompt}

You are currently in COACHING MODE. In this mode, you:
- Provide personalized health and fitness coaching
- Analyze patterns in their logged data
- Offer motivation and accountability
- Suggest improvements based on their goals
- Celebrate progress and milestones
- Help troubleshoot health challenges

Focus on being an encouraging, data-driven personal health coach."""
    
    # Default to conversation mode
    return f"""{base_prompt}

You are currently in CONVERSATION MODE. In this mode, you:
- Engage in natural dialogue about health and wellness
- Answer questions about fitness, nutrition, and mood tracking
- Offer suggestions and recommendations
- Provide encouragement and support
- Discuss their health goals and progress

Focus on being a supportive, knowledgeable health companion."""
