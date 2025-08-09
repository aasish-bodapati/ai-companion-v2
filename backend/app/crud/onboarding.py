from typing import Optional
import json
from sqlalchemy.orm import Session

from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import OnboardingProfileIn, OnboardingProfileOut


def _to_out(model: OnboardingProfile) -> OnboardingProfileOut:
    if not model:
        return OnboardingProfileOut()
    def loads(s: Optional[str]):
        try:
            return json.loads(s) if s else None
        except Exception:
            return None
    return OnboardingProfileOut(
        identity={
            "name": model.name,
            "nickname": model.nickname,
            "pronouns": model.pronouns,
            "birthday": model.birthday,
            "location": model.location,
        },
        interests={
            "topics": loads(model.topics_json) or None,
            "hobbies": model.hobbies,
            "favorites": model.favorites,
        },
        communication={
            "responseStyle": model.response_style,
            "tone": loads(model.tone_json) or None,
            "smallTalkLevel": model.small_talk_level,
        },
        goals={
            "primaryReason": model.primary_reason,
            "personalGoals": model.personal_goals,
            "checkinsEnabled": model.checkins_enabled,
        },
        boundaries={
            "avoidTopics": model.avoid_topics,
            "memoryPolicy": model.memory_policy,
            "recallEnabled": model.recall_enabled,
        },
        fun={
            "dreamTrip": model.dream_trip,
            "randomFact": model.random_fact,
            "aiPersona": model.ai_persona,
        },
        completed=model.completed or False,
    )


def get_by_user_id(db: Session, user_id: str) -> Optional[OnboardingProfile]:
    return db.query(OnboardingProfile).filter(OnboardingProfile.user_id == user_id).first()


def upsert_for_user(db: Session, user_id: str, data: OnboardingProfileIn) -> OnboardingProfileOut:
    model = get_by_user_id(db, user_id)
    if not model:
        model = OnboardingProfile(user_id=user_id)
        db.add(model)

    # Identity
    if data.identity:
        model.name = data.identity.name or model.name
        model.nickname = data.identity.nickname or model.nickname
        model.pronouns = data.identity.pronouns or model.pronouns
        model.birthday = data.identity.birthday or model.birthday
        model.location = data.identity.location or model.location

    # Interests
    if data.interests:
        if data.interests.topics is not None:
            model.topics_json = json.dumps(data.interests.topics)
        if data.interests.hobbies is not None:
            model.hobbies = data.interests.hobbies
        if data.interests.favorites is not None:
            model.favorites = data.interests.favorites

    # Communication
    if data.communication:
        if data.communication.responseStyle is not None:
            model.response_style = data.communication.responseStyle
        if data.communication.tone is not None:
            model.tone_json = json.dumps(data.communication.tone)
        if data.communication.smallTalkLevel is not None:
            model.small_talk_level = data.communication.smallTalkLevel

    # Goals
    if data.goals:
        if data.goals.primaryReason is not None:
            model.primary_reason = data.goals.primaryReason
        if data.goals.personalGoals is not None:
            model.personal_goals = data.goals.personalGoals
        if data.goals.checkinsEnabled is not None:
            model.checkins_enabled = data.goals.checkinsEnabled

    # Boundaries
    if data.boundaries:
        if data.boundaries.avoidTopics is not None:
            model.avoid_topics = data.boundaries.avoidTopics
        if data.boundaries.memoryPolicy is not None:
            model.memory_policy = data.boundaries.memoryPolicy
        if data.boundaries.recallEnabled is not None:
            model.recall_enabled = data.boundaries.recallEnabled

    # Fun
    if data.fun:
        if data.fun.dreamTrip is not None:
            model.dream_trip = data.fun.dreamTrip
        if data.fun.randomFact is not None:
            model.random_fact = data.fun.randomFact
        if data.fun.aiPersona is not None:
            model.ai_persona = data.fun.aiPersona

    db.commit()
    db.refresh(model)
    return _to_out(model)


def mark_completed(db: Session, user_id: str) -> OnboardingProfileOut:
    model = get_by_user_id(db, user_id)
    if not model:
        model = OnboardingProfile(user_id=user_id, completed=True)
        db.add(model)
    else:
        model.completed = True
    db.commit()
    db.refresh(model)
    return _to_out(model)
