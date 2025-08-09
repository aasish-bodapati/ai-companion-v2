from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.crud import onboarding as onboarding_crud
from app.models.user import User
from app.schemas.onboarding import OnboardingProfileIn, OnboardingProfileOut

router = APIRouter()

@router.get("/me/onboarding", response_model=OnboardingProfileOut)
def get_my_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    profile = onboarding_crud.get_by_user_id(db, user_id=current_user.id)
    return onboarding_crud._to_out(profile)

@router.put("/me/onboarding", response_model=OnboardingProfileOut)
def upsert_my_onboarding(
    data: OnboardingProfileIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return onboarding_crud.upsert_for_user(db, user_id=current_user.id, data=data)

@router.post("/me/onboarding/complete", response_model=OnboardingProfileOut)
def complete_my_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return onboarding_crud.mark_completed(db, user_id=current_user.id)
