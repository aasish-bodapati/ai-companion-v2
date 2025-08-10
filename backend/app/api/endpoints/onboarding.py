from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.crud import onboarding as onboarding_crud
from app.models.user import User
from app.schemas.onboarding import OnboardingProfileIn, OnboardingProfileOut
from app.core.config import settings
from app.memory import memory_enabled
from app.memory.embeddings import embed_texts
from app.memory.faiss_store import add as faiss_add
from app.memory.profile import serialize_onboarding_profile
from app.memory.service import memory_service

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
    out = onboarding_crud.upsert_for_user(db, user_id=current_user.id, data=data)
    try:
        if memory_enabled():
            text = serialize_onboarding_profile(out)
            if text:
                memory_service.store_memory(
                    db=db,
                    content=text,
                    content_type="onboarding",
                    user_id=str(current_user.id),
                    metadata={"profile_id": str(out.id), "completed": False}
                )
    except Exception as e:
        # Log error but don't fail the request
        pass
    return out

@router.post("/me/onboarding/complete", response_model=OnboardingProfileOut)
def complete_my_onboarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    out = onboarding_crud.mark_completed(db, user_id=current_user.id)
    try:
        if memory_enabled():
            text = serialize_onboarding_profile(out)
            if text:
                memory_service.store_memory(
                    db=db,
                    content=text,
                    content_type="onboarding",
                    user_id=str(current_user.id),
                    metadata={"profile_id": str(out.id), "completed": True}
                )
    except Exception as e:
        # Log error but don't fail the request
        pass
    return out
