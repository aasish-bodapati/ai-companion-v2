"""
Memory profile utilities for user onboarding and profile management.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.onboarding import OnboardingProfile


def serialize_onboarding_profile(profile: OnboardingProfile) -> str:
    """
    Serialize an onboarding profile into a text representation for memory storage.
    
    Args:
        profile: The onboarding profile to serialize
        
    Returns:
        A text representation of the profile
    """
    if not profile:
        return ""
    
    profile_text = f"User Profile:\n"
    
    if profile.name:
        profile_text += f"Name: {profile.name}\n"
    
    if profile.age:
        profile_text += f"Age: {profile.age}\n"
    
    if profile.location:
        profile_text += f"Location: {profile.location}\n"
    
    if profile.occupation:
        profile_text += f"Occupation: {profile.occupation}\n"
    
    if profile.interests:
        profile_text += f"Interests: {', '.join(profile.interests)}\n"
    
    if profile.goals:
        profile_text += f"Goals: {', '.join(profile.goals)}\n"
    
    if profile.personality_traits:
        profile_text += f"Personality: {', '.join(profile.personality_traits)}\n"
    
    if profile.communication_style:
        profile_text += f"Communication Style: {profile.communication_style}\n"
    
    if profile.learning_preferences:
        profile_text += f"Learning Preferences: {', '.join(profile.learning_preferences)}\n"
    
    return profile_text.strip()


def get_user_profile_summary(db: Session, user_id: str) -> Optional[str]:
    """
    Get a summary of the user's profile for memory context.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Profile summary text or None if no profile exists
    """
    profile = db.query(OnboardingProfile).filter(
        OnboardingProfile.user_id == user_id
    ).first()
    
    if not profile:
        return None
    
    return serialize_onboarding_profile(profile)
