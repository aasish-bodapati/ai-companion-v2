from typing import Optional
from sqlalchemy.orm import Session

from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import OnboardingProfileCreate, OnboardingProfileUpdate, OnboardingProfile as OnboardingProfileSchema


def _to_out(model: OnboardingProfile) -> OnboardingProfileSchema:
    if not model:
        return OnboardingProfileSchema()

    return OnboardingProfileSchema(
        id=model.id,
        user_id=model.user_id,
        # Step 1 – Daily Schedule
        daily_schedule=model.daily_schedule,
        schedule_preferences=model.schedule_preferences,
        # Step 2 – Fitness & Nutrition Goals
        fitness_goals=model.fitness_goals,
        nutrition_goals=model.nutrition_goals,
        dietary_preferences=model.dietary_preferences,
        # Step 3 – Communication Style
        communication_style=model.communication_style,
        additional_preferences=model.additional_preferences,
        completed=model.completed or False,
    )


def get_by_user_id(db: Session, user_id: str) -> Optional[OnboardingProfile]:
    return db.query(OnboardingProfile).filter(OnboardingProfile.user_id == user_id).first()


def upsert_for_user(db: Session, user_id: str, data: OnboardingProfileCreate) -> OnboardingProfileSchema:
    model = get_by_user_id(db, user_id)
    if not model:
        model = OnboardingProfile(user_id=user_id)
        db.add(model)

    # Step 1 – Daily Schedule
    if data.daily_schedule is not None:
        model.daily_schedule = data.daily_schedule
    if data.schedule_preferences is not None:
        model.schedule_preferences = data.schedule_preferences

    # Step 2 – Fitness & Nutrition Goals
    if data.fitness_goals is not None:
        model.fitness_goals = data.fitness_goals
    if data.nutrition_goals is not None:
        model.nutrition_goals = data.nutrition_goals
    if data.dietary_preferences is not None:
        model.dietary_preferences = data.dietary_preferences

    # Step 3 – Communication Style
    if data.communication_style is not None:
        model.communication_style = data.communication_style
    if data.additional_preferences is not None:
        model.additional_preferences = data.additional_preferences

    db.commit()
    db.refresh(model)
    return _to_out(model)


def mark_completed(db: Session, user_id: str) -> OnboardingProfileSchema:
    model = get_by_user_id(db, user_id)
    if not model:
        model = OnboardingProfile(user_id=user_id, completed=True)
        db.add(model)
    else:
        model.completed = True
    db.commit()
    db.refresh(model)
    return _to_out(model)
