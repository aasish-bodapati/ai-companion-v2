from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models
from app.api import deps
from app.schemas.user import User, UserCreate, UserUpdate
from app.schemas.onboarding import OnboardingProfile, OnboardingProfileUpdate

router = APIRouter()


@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    """
    Retrieve users (admin only).
    """
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    """
    Create new user (admin only).
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.user.create(db, obj_in=user_in)
    return user


@router.get("/me", response_model=User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get current user.
    """
    return current_user


@router.get("/me/onboarding", response_model=Optional[OnboardingProfile])
def read_user_onboarding(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get current user's onboarding profile. Returns null if no profile exists.
    """
    profile = crud.onboarding_profile.get_by_user_id(db, user_id=current_user.id)
    return profile


@router.put("/me/onboarding", response_model=OnboardingProfile)
def update_user_onboarding(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: OnboardingProfileUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Update current user's onboarding profile.
    """
    profile = crud.onboarding_profile.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        # Create profile if it doesn't exist
        profile = crud.onboarding_profile.create_for_user(
            db, user_id=current_user.id, **profile_in.model_dump(exclude_unset=True)
        )
    else:
        # Update existing profile
        profile = crud.onboarding_profile.update(db, db_obj=profile, obj_in=profile_in)
    return profile


@router.post("/me/onboarding/complete")
def complete_user_onboarding(
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """
    Mark current user's onboarding as complete.
    """
    profile = crud.onboarding_profile.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Onboarding profile not found")
    
    profile.completed = True
    profile.updated_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return {"message": "Onboarding completed successfully"}


@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get a specific user by id (admin only).
    """
    user = crud.user.get(db, id=user_id)
    if user == current_user:
        return user
    if not crud.user.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: UUID,
    user_in: UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Update a user.
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        user = crud.user.update(db, db_obj=user, obj_in=user_in)
        return user
    if not crud.user.is_superuser(current_user):
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    user = crud.user.update(db, db_obj=user, obj_in=user_in)
    return user


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class AccountDeletionRequest(BaseModel):
    password: str

@router.put("/me/password")
def change_password(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    password_data: PasswordChangeRequest,
):
    """
    Change current user's password.
    """
    # Verify current password
    if not crud.user.authenticate(db, email=current_user.email, password=password_data.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    crud.user.update(db, db_obj=current_user, obj_in={"password": password_data.new_password})
    return {"message": "Password updated successfully"}


@router.delete("/me")
def delete_account(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    deletion_data: AccountDeletionRequest,
):
    """
    Delete current user's account.
    """
    # Verify password before deletion
    if not crud.user.authenticate(db, email=current_user.email, password=deletion_data.password):
        raise HTTPException(status_code=400, detail="Password is incorrect")
    
    # Delete user (this will cascade to related data due to foreign key constraints)
    crud.user.remove(db, id=current_user.id)
    return {"message": "Account deleted successfully"}
