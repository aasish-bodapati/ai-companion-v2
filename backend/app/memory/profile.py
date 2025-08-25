import json

from app.models.onboarding import OnboardingProfile


def serialize_onboarding_profile(profile: OnboardingProfile) -> str:
    """
    Create a compact textual profile suitable for retrieval context.
    """
    parts = []

    # Step 1 – Daily Schedule
    if profile.daily_schedule:
        parts.append(f"DailySchedule: {profile.daily_schedule}")
    if profile.schedule_preferences:
        parts.append(f"SchedulePreferences: {profile.schedule_preferences}")

    # Step 2 – Fitness & Nutrition Goals
    if profile.fitness_goals:
        parts.append(f"FitnessGoals: {profile.fitness_goals}")
    if profile.nutrition_goals:
        parts.append(f"NutritionGoals: {profile.nutrition_goals}")
    if profile.dietary_preferences:
        parts.append(f"DietaryPreferences: {profile.dietary_preferences}")

    # Step 3 – Communication Style
    if profile.communication_style:
        parts.append(f"CommunicationStyle: {profile.communication_style}")
    if profile.additional_preferences:
        parts.append(f"AdditionalPreferences: {profile.additional_preferences}")

    return " | ".join(parts)
