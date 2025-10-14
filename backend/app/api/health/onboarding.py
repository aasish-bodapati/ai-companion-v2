"""
Health onboarding endpoints - Updated to use onboarding_profiles table
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import (
    OnboardingProfile as OnboardingProfileSchema, 
    OnboardingProfileCreate, 
    OnboardingProfileUpdate,
    SimpleOnboardingData, 
    OnboardingResponse
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
    print(f"🔍 [ONBOARDING STATUS] API called by user: {current_user.email} (ID: {current_user.id})")
    try:
        # Check onboarding_profiles table
        onboarding_profile = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        # Check JSON fields as fallback
        has_health_profile = current_user.health_profile is not None and current_user.health_profile != {}
        has_onboarding_data = current_user.onboarding_data is not None and current_user.onboarding_data != {}
        
        # User is considered onboarded if they have onboarding profile OR health profile data
        has_completed = (onboarding_profile and onboarding_profile.completed) or has_health_profile

        # Debug logging for specific user
        if current_user.email == "iphonenew@example.com":
            print(f"🔍 [ONBOARDING STATUS] Debug for {current_user.email}:")
            print(f"  - User ID: {current_user.id}")
            print(f"  - OnboardingProfile exists: {onboarding_profile is not None}")
            print(f"  - OnboardingProfile completed: {onboarding_profile.completed if onboarding_profile else 'N/A'}")
            print(f"  - Health profile exists: {has_health_profile}")
            print(f"  - Health profile data: {current_user.health_profile}")
            print(f"  - Onboarding data exists: {has_onboarding_data}")
            print(f"  - Onboarding data: {current_user.onboarding_data}")
            print(f"  - Final completed status: {has_completed}")

        return {
            "completed": has_completed,
            "has_onboarding_profile": onboarding_profile is not None,
            "has_health_profile": has_health_profile,
            "has_onboarding_data": has_onboarding_data,
            "onboarding_completed": onboarding_profile.completed if onboarding_profile else False
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
    """Complete onboarding and create onboarding profile."""
    try:
        # Check if onboarding profile already exists
        existing_profile = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        if existing_profile:
            # Update existing profile with all data
            existing_profile.completed = True
            existing_profile.age = onboarding_data.age
            existing_profile.gender = onboarding_data.gender
            existing_profile.height_cm = onboarding_data.height_cm
            existing_profile.current_weight_kg = onboarding_data.current_weight_kg
            existing_profile.activity_level = onboarding_data.activity_level
            existing_profile.smm = onboarding_data.smm
            existing_profile.body_fat_percentage = onboarding_data.body_fat_percentage
            existing_profile.ffm = onboarding_data.ffm
            existing_profile.workout_days_per_week = onboarding_data.workout_days
            existing_profile.body_type_goal = onboarding_data.bodyTypeGoal
            existing_profile.edited_body_type_goal = json.dumps(onboarding_data.editedBodyTypeGoal) if onboarding_data.editedBodyTypeGoal else None
            existing_profile.timezone = onboarding_data.timezone or 'UTC'
            existing_profile.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_profile)
            profile = existing_profile
        else:
            # Create new onboarding profile with all data
            profile = OnboardingProfile(
                user_id=current_user.id,
                completed=True,
                age=onboarding_data.age,
                gender=onboarding_data.gender,
                height_cm=onboarding_data.height_cm,
                current_weight_kg=onboarding_data.current_weight_kg,
                activity_level=onboarding_data.activity_level,
                smm=onboarding_data.smm,
                body_fat_percentage=onboarding_data.body_fat_percentage,
                ffm=onboarding_data.ffm,
                workout_days_per_week=onboarding_data.workout_days,
                body_type_goal=onboarding_data.bodyTypeGoal,
                edited_body_type_goal=json.dumps(onboarding_data.editedBodyTypeGoal) if onboarding_data.editedBodyTypeGoal else None,
                timezone=onboarding_data.timezone or 'UTC',
                updated_at=datetime.utcnow()
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Also update health profile in JSON fields for backward compatibility
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

        # Create onboarding data in JSON format for backward compatibility
        onboarding_profile_data = {
            "completed": True,
            "body_type_goal": onboarding_data.bodyTypeGoal,
            "timezone": "UTC",
            "edited_body_type_goal": onboarding_data.editedBodyTypeGoal
        }

        # Update user with JSON data for backward compatibility
        current_user.health_profile = health_profile_data
        current_user.onboarding_data = onboarding_profile_data
        
        # Note: goals column doesn't exist in users table, so we skip this
        # The body type goal is already stored in the onboarding_profiles table

        db.commit()
        logger.info(f"Onboarding completed for user {current_user.id} with profile ID {profile.id}")

        return OnboardingResponse(
            message="Onboarding completed successfully",
            completed=True
        )

    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.get("/profile")
async def get_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's onboarding profile from onboarding_profiles table."""
    try:
        # Get onboarding profile from table
        onboarding_profile = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        # Fallback to JSON fields if no table record
        if not onboarding_profile:
            return {
                "onboarding_profile": None,
                "health_profile": current_user.health_profile,
                "onboarding_data": current_user.onboarding_data,
                "goals": current_user.goals,
                "source": "json_fields"
            }
        
        return {
            "onboarding_profile": {
                "id": onboarding_profile.id,
                "user_id": onboarding_profile.user_id,
                "completed": onboarding_profile.completed,
                "body_type_goal": onboarding_profile.body_type_goal,
                "updated_at": onboarding_profile.updated_at
            },
            "health_profile": current_user.health_profile,
            "onboarding_data": current_user.onboarding_data,
            "goals": current_user.goals,
            "source": "onboarding_profiles_table"
        }
    except Exception as e:
        logger.error(f"Error getting onboarding profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get onboarding profile")

@router.put("/profile")
async def update_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_in: dict
):
    """Update user's onboarding profile in onboarding_profiles table."""
    try:
        # Get or create onboarding profile
        onboarding_profile = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        if not onboarding_profile:
            # Create new profile if it doesn't exist
            onboarding_profile = OnboardingProfile(
                user_id=current_user.id,
                completed=False,
                updated_at=datetime.utcnow()
            )
            db.add(onboarding_profile)
        
        # Update onboarding profile fields
        if "onboarding_profile" in profile_in:
            profile_data = profile_in["onboarding_profile"]
            if "completed" in profile_data:
                onboarding_profile.completed = profile_data["completed"]
            if "body_type_goal" in profile_data:
                onboarding_profile.body_type_goal = profile_data["body_type_goal"]
            onboarding_profile.updated_at = datetime.utcnow()
        
        # Update JSON fields for backward compatibility
        if "health_profile" in profile_in:
            current_user.health_profile = profile_in["health_profile"]
        if "onboarding_data" in profile_in:
            current_user.onboarding_data = profile_in["onboarding_data"]
        if "goals" in profile_in:
            current_user.goals = profile_in["goals"]
        
        db.commit()
        db.refresh(onboarding_profile)
        
        return {
            "onboarding_profile": {
                "id": onboarding_profile.id,
                "user_id": onboarding_profile.user_id,
                "completed": onboarding_profile.completed,
                "body_type_goal": onboarding_profile.body_type_goal,
                "updated_at": onboarding_profile.updated_at
            },
            "health_profile": current_user.health_profile,
            "onboarding_data": current_user.onboarding_data,
            "goals": current_user.goals
        }
    except Exception as e:
        logger.error(f"Error updating onboarding profile: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.get("/profiles", response_model=list[OnboardingProfileSchema])
async def get_all_onboarding_profiles(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get all onboarding profiles (admin only)."""
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        profiles = db.query(OnboardingProfile).offset(skip).limit(limit).all()
        return profiles
    except Exception as e:
        logger.error(f"Error getting all onboarding profiles: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get profiles")

@router.delete("/profile")
async def delete_onboarding_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user's onboarding profile."""
    try:
        onboarding_profile = db.query(OnboardingProfile).filter(
            OnboardingProfile.user_id == current_user.id
        ).first()
        
        if not onboarding_profile:
            raise HTTPException(status_code=404, detail="Onboarding profile not found")
        
        db.delete(onboarding_profile)
        db.commit()
        
        return {"message": "Onboarding profile deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting onboarding profile: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete profile")