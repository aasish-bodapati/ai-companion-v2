from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app import crud, models
from app.api import deps
from app.core.config import settings
from app.schemas.onboarding import OnboardingProfile, OnboardingProfileCreate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=OnboardingProfile)
def get_my_onboarding(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve current user's onboarding profile.
    """
    try:
        profile = crud.onboarding.get_by_user_id(db, user_id=current_user.id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Onboarding profile not found",
            )
        return profile
    except Exception as e:
        # If there's an error (likely due to old profile structure), 
        # return a basic incomplete profile to allow login to continue
        logger.warning(f"Error retrieving onboarding profile for user {current_user.id}: {e}")
        
        # Create a basic incomplete profile
        from app.schemas.onboarding import OnboardingProfileCreate
        basic_profile = OnboardingProfileCreate(
            daily_schedule="",
            schedule_preferences="",
            fitness_goals="",
            nutrition_goals="",
            dietary_preferences="",
            communication_style="",
            additional_preferences=""
        )
        
        # Return a minimal profile that won't break the frontend
        return OnboardingProfile(
            id="temp",
            user_id=current_user.id,
            completed=False,
            **basic_profile.model_dump()
        )


@router.put("/", response_model=OnboardingProfile)
def upsert_my_onboarding(
    *,
    db: Session = Depends(deps.get_db),
    data: OnboardingProfileCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create or update current user's onboarding profile.
    """
    profile = crud.onboarding.upsert_for_user(db, user_id=current_user.id, data=data)
    return profile


@router.post("/complete", response_model=OnboardingProfile)
def complete_my_onboarding(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark current user's onboarding as completed.
    """
    profile = crud.onboarding.mark_completed(db, user_id=current_user.id)
    return profile


@router.post("/migrate", response_model=OnboardingProfile)
def migrate_my_onboarding(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Migrate user's onboarding profile to new format.
    This is useful for users who completed old onboarding but need to re-complete with new fields.
    """
    # Get current profile
    profile = crud.onboarding.get_by_user_id(db, user_id=current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding profile not found",
        )
    
    # Mark as incomplete so user can re-complete
    profile.completed = False
    db.commit()
    db.refresh(profile)
    
    return profile
