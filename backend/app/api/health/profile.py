"""
Health Profile API endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.health.user_goals import UserHealthProfile
from app.schemas.health_profile import (
    HealthProfile, HealthProfileCreate, HealthProfileUpdate, HealthProfileResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=Optional[HealthProfile])
async def get_health_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's health profile."""
    try:
        profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()

        if not profile:
            return None

        return HealthProfile(
            id=profile.id,
            user_id=profile.user_id,
            age=profile.age,
            gender=profile.gender,
            height_cm=profile.height_cm,
            current_weight_kg=profile.current_weight_kg,
            activity_level=profile.activity_level,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
    except Exception as e:
        logger.error(f"Error getting health profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get health profile")

@router.post("/", response_model=HealthProfileResponse)
async def create_health_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_data: HealthProfileCreate
):
    """Create user's health profile."""
    try:
        # Check if profile already exists
        existing_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()

        if existing_profile:
            raise HTTPException(status_code=400, detail="Health profile already exists")

        # Create new profile
        profile = UserHealthProfile(
            user_id=current_user.id,
            age=profile_data.age,
            gender=profile_data.gender,
            height_cm=profile_data.height_cm,
            current_weight_kg=profile_data.current_weight_kg,
            activity_level=profile_data.activity_level
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        logger.info(f"Health profile created for user {current_user.id}")

        return HealthProfileResponse(
            message="Health profile created successfully",
            profile=HealthProfile(
                id=profile.id,
                user_id=profile.user_id,
                age=profile.age,
                gender=profile.gender,
                height_cm=profile.height_cm,
                current_weight_kg=profile.current_weight_kg,
                activity_level=profile.activity_level,
                created_at=profile.created_at,
                updated_at=profile.updated_at
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating health profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create health profile")

@router.put("/", response_model=HealthProfileResponse)
async def update_health_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    profile_data: HealthProfileUpdate
):
    """Update user's health profile."""
    try:
        profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()

        if not profile:
            raise HTTPException(status_code=404, detail="Health profile not found")

        # Update fields
        update_data = profile_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        db.commit()
        db.refresh(profile)

        logger.info(f"Health profile updated for user {current_user.id}")

        return HealthProfileResponse(
            message="Health profile updated successfully",
            profile=HealthProfile(
                id=profile.id,
                user_id=profile.user_id,
                age=profile.age,
                gender=profile.gender,
                height_cm=profile.height_cm,
                current_weight_kg=profile.current_weight_kg,
                activity_level=profile.activity_level,
                created_at=profile.created_at,
                updated_at=profile.updated_at
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating health profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update health profile")

@router.delete("/")
async def delete_health_profile(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user's health profile."""
    try:
        profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == current_user.id
        ).first()

        if not profile:
            raise HTTPException(status_code=404, detail="Health profile not found")

        db.delete(profile)
        db.commit()

        logger.info(f"Health profile deleted for user {current_user.id}")

        return {"message": "Health profile deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting health profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete health profile")
