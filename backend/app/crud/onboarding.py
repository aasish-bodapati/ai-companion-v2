"""
CRUD operations for onboarding profiles
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import OnboardingProfileCreate, OnboardingProfileUpdate

class CRUDOnboardingProfile(CRUDBase[OnboardingProfile, OnboardingProfileCreate, OnboardingProfileUpdate]):
    """CRUD operations for OnboardingProfile"""

    def get_by_user(self, db: Session, *, user_id: int) -> Optional[OnboardingProfile]:
        """Get onboarding profile by user ID"""
        return db.query(OnboardingProfile).filter(OnboardingProfile.user_id == user_id).first()

    def create_with_user(self, db: Session, *, obj_in: OnboardingProfileCreate, user_id: int) -> OnboardingProfile:
        """Create onboarding profile for a user"""
        db_obj = OnboardingProfile(
            user_id=user_id,
            **obj_in.model_dump(exclude_unset=True)
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_by_user(self, db: Session, *, user_id: int, obj_in: OnboardingProfileUpdate) -> Optional[OnboardingProfile]:
        """Update onboarding profile by user ID"""
        db_obj = self.get_by_user(db, user_id=user_id)
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def mark_completed(self, db: Session, *, user_id: int) -> Optional[OnboardingProfile]:
        """Mark onboarding as completed for a user"""
        db_obj = self.get_by_user(db, user_id=user_id)
        if db_obj:
            db_obj.completed = True
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

onboarding_profile = CRUDOnboardingProfile(OnboardingProfile)
