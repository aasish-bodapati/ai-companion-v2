import json

from app.models.onboarding import OnboardingProfile
from datetime import date


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
        # Only include full Birthday if today matches month/day.
        # Otherwise, include BirthYear (if parsable) to avoid triggering birthday wishes.
        bday_str = profile.birthday.strip()
        added_birthday = False
        # Attempt ISO date parse (YYYY-MM-DD)
        try:
            # fromisoformat raises if not full date
            bday_date = date.fromisoformat(bday_str)
            today = date.today()
            if (bday_date.month, bday_date.day) == (today.month, today.day):
                parts.append(f"Birthday: {bday_str}")
                added_birthday = True
        except Exception:
            # Not a full ISO date; fall through to try extracting year only
            pass

        if not added_birthday:
            # Try to extract a 4-digit year prefix safely
            year = None
            try:
                if len(bday_str) >= 4 and bday_str[:4].isdigit():
                    year = bday_str[:4]
            except Exception:
                year = None
            if year:
                parts.append(f"BirthYear: {year}")

    # Interests
    if profile.topics_json:
        try:
            topics = json.loads(profile.topics_json)
            if topics:
                parts.append("Topics: " + ", ".join(topics))
        except Exception:
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
        except Exception:
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
