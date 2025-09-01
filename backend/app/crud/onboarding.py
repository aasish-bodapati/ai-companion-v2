from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import OnboardingProfileCreate, OnboardingProfileUpdate


class CRUDOnboardingProfile(CRUDBase[OnboardingProfile, OnboardingProfileCreate, OnboardingProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: str) -> Optional[OnboardingProfile]:
        """Get onboarding profile by user ID."""
        return db.query(OnboardingProfile).filter(OnboardingProfile.user_id == user_id).first()

    def create_for_user(self, db: Session, *, user_id: str, **kwargs) -> OnboardingProfile:
        """Create an onboarding profile for a user."""
        db_obj = OnboardingProfile(user_id=user_id, **kwargs)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_or_create_for_user(self, db: Session, *, user_id: str, **kwargs) -> OnboardingProfile:
        """Get existing profile or create one for a user."""
        profile = self.get_by_user_id(db, user_id=user_id)
        if not profile:
            profile = self.create_for_user(db, user_id=user_id, **kwargs)
        return profile


onboarding_profile = CRUDOnboardingProfile(OnboardingProfile)

# Export the function that the memory service needs
get_by_user_id = onboarding_profile.get_by_user_id
