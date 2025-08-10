from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.core.config import settings
from app.schemas.user import User as UserSchema, UserCreate


router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
):
    """
    Public user registration.

    - Respects REGISTRATION_ENABLED setting
    - Ensures email uniqueness
    - Creates a standard (non-superuser) active user
    """
    if not settings.REGISTRATION_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently disabled.",
        )

    existing = crud.user.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    # Force safe defaults regardless of client input
    # (UserCreate includes is_superuser default False; ensure not elevated)
    user_to_create = UserCreate(
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        is_active=True,
        is_superuser=False,
    )

    user = crud.user.create(db, obj_in=user_to_create)
    return user


