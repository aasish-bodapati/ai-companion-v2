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
        # Check if user has completed onboarding profile
        profile = onboarding_profile.get_by_user(db, user_id=current_user.id)
        completed = bool(profile and profile.completed)
        
        return {"completed": completed}
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
            profile = onboarding_profile.update_by_user(
                db, user_id=current_user.id, obj_in=OnboardingProfileUpdate(
                    **onboarding_data.model_dump(),
                    completed=True
                )
            )
        else:
            # Create new profile
            profile = onboarding_profile.create_with_user(
                db, obj_in=OnboardingProfileCreate(
                    **onboarding_data.model_dump(),
                    completed=True
                ), user_id=current_user.id
            )
        
        if not profile:
            raise HTTPException(status_code=500, detail="Failed to create onboarding data")
        
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