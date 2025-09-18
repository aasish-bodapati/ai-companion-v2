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
    # For now, just return the current user
    # TODO: Implement user update functionality
    return current_user
