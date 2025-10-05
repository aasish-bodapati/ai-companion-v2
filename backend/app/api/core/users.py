"""
User management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/users/me", response_model=UserSchema)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> models.User:
    """
    Get current user.
    """
    return current_user

@router.put("/users/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: dict,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> models.User:
    """
    Update own user.
    """
    # Update user fields
    if "full_name" in user_in and user_in["full_name"] is not None:
        current_user.full_name = user_in["full_name"]
    if "timezone" in user_in and user_in["timezone"] is not None:
        current_user.timezone = user_in["timezone"]
    if "active_routine_id" in user_in and user_in["active_routine_id"] is not None:
        current_user.active_routine_id = user_in["active_routine_id"]
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
