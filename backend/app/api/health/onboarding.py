"""
Simplified health onboarding endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingProfile, OnboardingProfileCreate, OnboardingProfileUpdate,
    SimpleOnboardingData, OnboardingResponse
)
from app.crud.onboarding import onboarding_profile
from app.crud.health.user_goals import user_health_profile
from app.models.health.user_goals import UserHealthProfile
from app.schemas.health_profile import HealthProfileCreate
from app.crud.health.body_type_goals import body_type_goal
from app.schemas.health.body_type_goals import BodyTypeGoalCreate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/status")
async def get_onboarding_status(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if user has completed onboarding."""
    try:
        # Check if user has completed onboarding by checking health profile
        # This is the actual data that matters for onboarding completion
        health_profile = user_health_profile.get_by_user(db=db, user_id=current_user.id)
        has_completed = health_profile is not None

        return {
            "completed": has_completed,
            "has_health_profile": has_completed
        }
    except Exception as e:
        logger.error(f"Error checking onboarding status: {str(e)}")
        return {"completed": False}

@router.post("/complete", response_model=OnboardingResponse)
async def complete_onboarding(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    onboarding_data: SimpleOnboardingData
):
    """Complete simplified health onboarding."""
    try:
        # Create or update onboarding profile
        existing_profile = onboarding_profile.get_by_user(db, user_id=current_user.id)

        if existing_profile:
            # Update existing profile
            profile_data = onboarding_data.model_dump()
            # Handle bodyTypeGoal separately since it's not in the base schema
            body_type_goal = profile_data.pop('bodyTypeGoal', None)
            profile = onboarding_profile.update_by_user(
                db, user_id=current_user.id, obj_in=OnboardingProfileUpdate(
                    **profile_data,
                    completed=True
                )
            )
            # Update body_type_goal directly on the model
            if body_type_goal and profile:
                print(f"🔍 Onboarding Debug - Updating existing profile for user {current_user.id}:")
                print(f"  - body_type_goal: {body_type_goal}")
                profile.body_type_goal = body_type_goal
                db.commit()
                print(f"  - Updated profile.body_type_goal: {profile.body_type_goal}")
        else:
            # Create new profile
            profile_data = onboarding_data.model_dump()
            # Handle bodyTypeGoal separately since it's not in the base schema
            body_type_goal = profile_data.pop('bodyTypeGoal', None)
            profile = onboarding_profile.create_with_user(
                db, obj_in=OnboardingProfileCreate(
                    **profile_data,
                    completed=True
                ), user_id=current_user.id
            )
            # Set body_type_goal directly on the model
            if body_type_goal and profile:
                print(f"🔍 Onboarding Debug - Creating new profile for user {current_user.id}:")
                print(f"  - body_type_goal: {body_type_goal}")
                profile.body_type_goal = body_type_goal
                db.commit()
                print(f"  - Set profile.body_type_goal: {profile.body_type_goal}")

        if not profile:
            raise HTTPException(status_code=500, detail="Failed to create onboarding data")

        # Also create a health profile with the onboarding data
        try:
            # Check if health profile already exists
            existing_health_profile = db.query(UserHealthProfile).filter(
                UserHealthProfile.user_id == current_user.id
            ).first()

            if not existing_health_profile:
                # Create health profile from onboarding data
                health_profile = UserHealthProfile(
                    user_id=current_user.id,
                    age=onboarding_data.age,
                    gender=onboarding_data.gender,
                    height_cm=onboarding_data.height_cm,
                    current_weight_kg=onboarding_data.current_weight_kg,
                    activity_level=onboarding_data.activity_level,
                    smm_kg=onboarding_data.smm,
                    body_fat_percentage=onboarding_data.body_fat_percentage,
                    ffm_kg=onboarding_data.ffm,
                    workout_days_per_week=onboarding_data.workout_days
                )
                db.add(health_profile)
                db.commit()
                logger.info(f"Health profile created for user {current_user.id}")
            else:
                # Update existing health profile
                existing_health_profile.age = onboarding_data.age
                existing_health_profile.gender = onboarding_data.gender
                existing_health_profile.height_cm = onboarding_data.height_cm
                existing_health_profile.current_weight_kg = onboarding_data.current_weight_kg
                existing_health_profile.activity_level = onboarding_data.activity_level
                existing_health_profile.smm_kg = onboarding_data.smm
                existing_health_profile.body_fat_percentage = onboarding_data.body_fat_percentage
                existing_health_profile.ffm_kg = onboarding_data.ffm
                existing_health_profile.workout_days_per_week = onboarding_data.workout_days
                db.commit()
                logger.info(f"Health profile updated for user {current_user.id}")
        except Exception as e:
            logger.warning(f"Failed to create/update health profile: {str(e)}")
            # Don't fail the onboarding if health profile creation fails

        # Create user body type goal if edited goal is provided
        if onboarding_data.editedBodyTypeGoal:
            try:
                edited_goal = onboarding_data.editedBodyTypeGoal
                
                # Create user body type goal from edited data
                user_goal_data = BodyTypeGoalCreate(
                    name=edited_goal.get('name', 'Custom Goal'),
                    description=edited_goal.get('description', 'Custom body type goal'),
                    category='body_type',
                    icon=edited_goal.get('icon', 'body-outline'),
                    color=edited_goal.get('color', '#3b82f6'),
                    target_bmi=edited_goal.get('targetBMI', 22.0),
                    target_body_fat=edited_goal.get('targetBodyFat'),
                    target_attributes={
                        'target_weight': edited_goal.get('targetAttributes', {}).get('targetWeight', 70),
                        'weight_change': edited_goal.get('targetAttributes', {}).get('weightChange', 0),
                        'water_goal': edited_goal.get('targetAttributes', {}).get('waterGoal', 2500),
                        'calorie_target': edited_goal.get('targetAttributes', {}).get('calorieTarget', 2000),
                        'protein_target': edited_goal.get('targetAttributes', {}).get('proteinTarget', 120),
                        'workout_frequency': edited_goal.get('targetAttributes', {}).get('workoutFrequency', 3),
                        'cardio_minutes': edited_goal.get('targetAttributes', {}).get('cardioMinutes', 150),
                        'timeline': edited_goal.get('targetAttributes', {}).get('timeline', 20),
                        'waist_to_height_ratio': edited_goal.get('waistToHeightRatio'),
                        'fat_free_mass_index': edited_goal.get('fatFreeMassIndex'),
                    },
                    created_by=current_user.id,
                    is_active=True,
                    sort_order=999  # User goals at the end
                )
                
                user_goal = body_type_goal.create(db, obj_in=user_goal_data)
                logger.info(f"User body type goal created for user {current_user.id}: {user_goal.id}")
                
            except Exception as e:
                logger.warning(f"Failed to create user body type goal: {str(e)}")
                # Don't fail the onboarding if user goal creation fails

        logger.info(f"Onboarding completed for user {current_user.id}")

        return OnboardingResponse(
            message="Onboarding completed successfully",
            completed=True
        )

    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.get("/profile", response_model=Optional[OnboardingProfile])
async def get_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's onboarding profile."""
    return onboarding_profile.get_by_user(db, user_id=current_user.id)

@router.put("/profile", response_model=OnboardingProfile)
async def update_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_in: OnboardingProfileUpdate
):
    """Update user's onboarding profile."""
    profile = onboarding_profile.update_by_user(
        db, user_id=current_user.id, obj_in=profile_in
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Onboarding profile not found")
    return profile
