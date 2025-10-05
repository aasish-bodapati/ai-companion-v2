from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models
from app.api import deps
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
# Auth cookies removed for Milestone 1 simplicity
from app.schemas.user import Token, User as UserSchema, UserCreate, UserUpdate

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    response: Response,
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not crud.user.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.id, expires_delta=access_token_expires)

    # Auth cookies removed for Milestone 1 simplicity

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/login/test-token", response_model=UserSchema)
def test_token(current_user: models.User = Depends(deps.get_current_user)):
    """
    Test access token
    """
    return current_user

@router.get("/me", response_model=UserSchema)
def get_current_user_profile(current_user: models.User = Depends(deps.get_current_user)):
    """
    Get current user profile
    """
    return current_user

@router.put("/me", response_model=UserSchema)
def update_current_user_profile(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    user_update: UserUpdate
):
    """
    Update current user profile
    """
    user = crud.user.update(db, db_obj=current_user, obj_in=user_update)
    return user

@router.post("/register", response_model=UserSchema)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> models.User:
    """
    Create new user.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = crud.user.create(db, obj_in=user_in)
    return user

@router.post("/logout")
def logout(response: Response, current_user: models.User = Depends(deps.get_current_active_user)):
    """
    Logout user (simplified for Milestone 1)
    """
    return {"message": "Successfully logged out"}

@router.delete("/me")
def delete_user_account(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """
    Delete user account and all associated data.
    This is a permanent action that cannot be undone.
    """
    try:
        # Delete all user-related data
        # Note: This is a simplified version - in production, you might want to:
        # 1. Soft delete (mark as inactive)
        # 2. Anonymize data instead of deleting
        # 3. Add a grace period before permanent deletion
        
        # Delete health profiles
        from app.models.health.user_goals import UserHealthProfile
        db.query(UserHealthProfile).filter(UserHealthProfile.user_id == current_user.id).delete()
        
        # Delete onboarding profiles
        from app.models.onboarding import OnboardingProfile
        db.query(OnboardingProfile).filter(OnboardingProfile.user_id == current_user.id).delete()
        
        # Delete fitness logs
        from app.models.health.fitness_log import FitnessLog
        db.query(FitnessLog).filter(FitnessLog.user_id == current_user.id).delete()
        
        # Delete nutrition logs
        from app.models.health.fitness_log import NutritionLog
        db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id).delete()
        
        # Delete mood logs
        from app.models.health.fitness_log import MoodLog
        db.query(MoodLog).filter(MoodLog.user_id == current_user.id).delete()
        
        # Delete water logs
        from app.models.health.water_log import WaterLog
        db.query(WaterLog).filter(WaterLog.user_id == current_user.id).delete()
        
        # Delete user goals
        from app.models.health.user_goal import UserGoal
        db.query(UserGoal).filter(UserGoal.user_id == current_user.id).delete()
        
        # Delete user body type goals
        from app.models.health.body_type_goals import BodyTypeGoal
        db.query(BodyTypeGoal).filter(BodyTypeGoal.created_by == current_user.id).delete()
        
        # Delete simple routines and progress
        from app.models.health.simple_routine import SimpleRoutine, SimpleUserRoutineProgress
        db.query(SimpleUserRoutineProgress).filter(SimpleUserRoutineProgress.user_id == current_user.id).delete()
        db.query(SimpleRoutine).filter(SimpleRoutine.created_by_user_id == current_user.id).delete()
        
        # Finally, delete the user
        db.delete(current_user)
        db.commit()
        
        return {"message": "Account and all associated data deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete account: {str(e)}"
        )