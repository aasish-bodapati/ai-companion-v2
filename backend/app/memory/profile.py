from typing import Optional
import json

from app.models.onboarding import OnboardingProfile


def serialize_onboarding_profile(profile: OnboardingProfile) -> str:
    """
    Create a compact textual profile suitable for retrieval context.
    """
    parts = []
    
    # Identity
    if profile.name or profile.nickname:
        name = profile.name or profile.nickname
        parts.append(f"Name: {name}")
    if profile.pronouns:
        parts.append(f"Pronouns: {profile.pronouns}")
    if profile.location:
        parts.append(f"Location: {profile.location}")
    if profile.birthday:
        parts.append(f"Birthday: {profile.birthday}")
    
    # Interests
    if profile.topics_json:
        try:
            topics = json.loads(profile.topics_json)
            if topics:
                parts.append("Topics: " + ", ".join(topics))
        except:
            pass
    if profile.hobbies:
        parts.append(f"Hobbies: {profile.hobbies}")
    if profile.favorites:
        parts.append(f"Favorites: {profile.favorites}")
    
    # Communication
    if profile.response_style:
        parts.append(f"ResponseStyle: {profile.response_style}")
    if profile.tone_json:
        try:
            tone = json.loads(profile.tone_json)
            if tone:
                parts.append("Tone: " + ", ".join(tone))
        except:
            pass
    if profile.small_talk_level is not None:
        parts.append(f"SmallTalkLevel: {profile.small_talk_level}")
    
    # Goals
    if profile.primary_reason:
        parts.append(f"PrimaryReason: {profile.primary_reason}")
    if profile.personal_goals:
        parts.append(f"PersonalGoals: {profile.personal_goals}")
    if profile.checkins_enabled is not None:
        parts.append(f"CheckinsEnabled: {profile.checkins_enabled}")
    
    # Boundaries
    if profile.avoid_topics:
        parts.append(f"AvoidTopics: {profile.avoid_topics}")
    if profile.memory_policy:
        parts.append(f"MemoryPolicy: {profile.memory_policy}")
    if profile.recall_enabled is not None:
        parts.append(f"RecallEnabled: {profile.recall_enabled}")
    
    # Fun
    if profile.dream_trip:
        parts.append(f"DreamTrip: {profile.dream_trip}")
    if profile.random_fact:
        parts.append(f"RandomFact: {profile.random_fact}")
    if profile.ai_persona:
        parts.append(f"AIPersona: {profile.ai_persona}")
    
    return " | ".join(parts)


