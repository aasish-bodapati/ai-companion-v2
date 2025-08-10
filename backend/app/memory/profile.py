from typing import Optional

from app.schemas.onboarding import OnboardingProfileOut


def serialize_onboarding_profile(profile: OnboardingProfileOut) -> str:
    """
    Create a compact textual profile suitable for retrieval context.
    """
    parts = []
    if profile.identity:
        name = profile.identity.name or profile.identity.nickname
        if name:
            parts.append(f"Name: {name}")
        if profile.identity.pronouns:
            parts.append(f"Pronouns: {profile.identity.pronouns}")
        if profile.identity.location:
            parts.append(f"Location: {profile.identity.location}")
        if profile.identity.birthday:
            parts.append(f"Birthday: {profile.identity.birthday}")
    if profile.interests:
        if profile.interests.topics:
            parts.append("Topics: " + ", ".join(profile.interests.topics))
        if profile.interests.hobbies:
            parts.append(f"Hobbies: {profile.interests.hobbies}")
        if profile.interests.favorites:
            parts.append(f"Favorites: {profile.interests.favorites}")
    if profile.communication:
        if profile.communication.responseStyle:
            parts.append(f"ResponseStyle: {profile.communication.responseStyle}")
        if profile.communication.tone:
            parts.append("Tone: " + ", ".join(profile.communication.tone))
        if profile.communication.smallTalkLevel is not None:
            parts.append(f"SmallTalkLevel: {profile.communication.smallTalkLevel}")
    if profile.goals:
        if profile.goals.primaryReason:
            parts.append(f"PrimaryReason: {profile.goals.primaryReason}")
        if profile.goals.personalGoals:
            parts.append(f"PersonalGoals: {profile.goals.personalGoals}")
        if profile.goals.checkinsEnabled is not None:
            parts.append(f"CheckinsEnabled: {profile.goals.checkinsEnabled}")
    if profile.boundaries:
        if profile.boundaries.avoidTopics:
            parts.append(f"AvoidTopics: {profile.boundaries.avoidTopics}")
        if profile.boundaries.memoryPolicy:
            parts.append(f"MemoryPolicy: {profile.boundaries.memoryPolicy}")
        if profile.boundaries.recallEnabled is not None:
            parts.append(f"RecallEnabled: {profile.boundaries.recallEnabled}")
    if profile.fun:
        if profile.fun.dreamTrip:
            parts.append(f"DreamTrip: {profile.fun.dreamTrip}")
        if profile.fun.randomFact:
            parts.append(f"RandomFact: {profile.fun.randomFact}")
        if profile.fun.aiPersona:
            parts.append(f"AIPersona: {profile.fun.aiPersona}")
    return " | ".join(parts)


