"""
Health onboarding API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud.health.user_goals import user_health_profile

router = APIRouter()


@router.get("/status")
def get_onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has completed health onboarding.
    """
    try:
        # Check if user has completed onboarding by checking health profile
        health_profile = user_health_profile.get_by_user(db=db, user_id=current_user.id)
        has_completed = health_profile is not None
        
        return {
            "completed": has_completed,
            "has_health_profile": has_completed
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check onboarding status: {str(e)}")