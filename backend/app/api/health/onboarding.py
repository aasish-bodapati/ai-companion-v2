"""
Simplified health onboarding endpoints - Updated for JSON-based user model
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingProfile, OnboardingProfileCreate, OnboardingProfileUpdate,
    SimpleOnboardingData, OnboardingResponse
)
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
        # Check if user has completed onboarding by checking JSON fields
        has_health_profile = current_user.health_profile is not None and current_user.health_profile != {}
        has_onboarding_data = current_user.onboarding_data is not None and current_user.onboarding_data != {}
        
        # User is considered onboarded if they have health profile data
        has_completed = has_health_profile

        return {
            "completed": has_completed,
            "has_health_profile": has_health_profile,
            "has_onboarding_data": has_onboarding_data
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
    """Complete simplified health onboarding using JSON fields."""
    try:
        # Create health profile data in JSON format
        health_profile_data = {
            "age": onboarding_data.age,
            "gender": onboarding_data.gender,
            "height_cm": onboarding_data.height_cm,
            "current_weight_kg": onboarding_data.current_weight_kg,
            "activity_level": onboarding_data.activity_level,
            "smm_kg": onboarding_data.smm,
            "body_fat_percentage": onboarding_data.body_fat_percentage,
            "ffm_kg": onboarding_data.ffm,
            "workout_days_per_week": onboarding_data.workout_days or 3
        }

        # Create onboarding data in JSON format
        onboarding_profile_data = {
            "completed": True,
            "body_type_goal": onboarding_data.bodyTypeGoal,
            "timezone": "UTC",
            "edited_body_type_goal": onboarding_data.editedBodyTypeGoal
        }

        # Update user with JSON data
        current_user.health_profile = health_profile_data
        current_user.onboarding_data = onboarding_profile_data
        
        # Add body type goal to goals if provided
        if onboarding_data.bodyTypeGoal:
            goals_data = current_user.goals or {"goals": []}
            if "goals" not in goals_data:
                goals_data["goals"] = []
            
            # Add body type goal to goals
            body_type_goal_entry = {
                "id": onboarding_data.bodyTypeGoal,
                "type": "body_type_goal",
                "title": "Body Type Goal",
                "description": f"Selected body type goal: {onboarding_data.bodyTypeGoal}",
                "created_at": "2024-01-01T00:00:00Z"
            }
            goals_data["goals"].append(body_type_goal_entry)
            current_user.goals = goals_data

        db.commit()
        logger.info(f"Onboarding completed for user {current_user.id} with JSON data")

        return OnboardingResponse(
            message="Onboarding completed successfully",
            completed=True
        )

    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.get("/profile")
async def get_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's onboarding profile from JSON fields."""
    return {
        "health_profile": current_user.health_profile,
        "onboarding_data": current_user.onboarding_data,
        "goals": current_user.goals
    }

@router.put("/profile")
async def update_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_in: dict
):
    """Update user's onboarding profile in JSON fields."""
    try:
        if "health_profile" in profile_in:
            current_user.health_profile = profile_in["health_profile"]
        if "onboarding_data" in profile_in:
            current_user.onboarding_data = profile_in["onboarding_data"]
        if "goals" in profile_in:
            current_user.goals = profile_in["goals"]
        
        db.commit()
        return {
            "health_profile": current_user.health_profile,
            "onboarding_data": current_user.onboarding_data,
            "goals": current_user.goals
        }
    except Exception as e:
        logger.error(f"Error updating onboarding profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
