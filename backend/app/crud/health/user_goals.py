"""
CRUD operations for user health goals and information
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.health.user_goals import UserHealthProfile
from app.schemas.health.user_goals import UserHealthProfileCreate, UserHealthProfileUpdate

# OLD CRUD CLASS - DEPRECATED - Use new health goals CRUD instead
# class CRUDUserHealthGoals(CRUDBase[UserHealthGoals, UserHealthGoalsCreate, UserHealthGoalsUpdate]):
#     def get_by_user(self, db: Session, *, user_id: str) -> Optional[UserHealthGoals]:
#         """Get health goals for a specific user."""
#         return db.query(self.model).filter(UserHealthGoals.user_id == user_id).first()
#     
#     def create_with_user(self, db: Session, *, obj_in: UserHealthGoalsCreate, user_id: str) -> UserHealthGoals:
#         """Create health goals for a user."""
#         obj_in_data = obj_in.model_dump()
#         obj_in_data["user_id"] = user_id
#         db_obj = self.model(**obj_in_data)
#         db.add(db_obj)
#         db.commit()
#         db.refresh(db_obj)
#         return db_obj
#     
#     def update_by_user(self, db: Session, *, user_id: str, obj_in: UserHealthGoalsUpdate) -> Optional[UserHealthGoals]:
#         """Update health goals for a user."""
#         db_obj = self.get_by_user(db, user_id=user_id)
#         if not db_obj:
#             return None
#         return self.update(db, db_obj=db_obj, obj_in=obj_in)
#     
#     def get_active_goals(self, db: Session, *, user_id: str) -> Optional[UserHealthGoals]:
#         """Get active health goals for a user."""
#         return (
#             db.query(self.model)
#             .filter(and_(UserHealthGoals.user_id == user_id, UserHealthGoals.is_active == True))
#             .first()
#         )


class CRUDUserHealthProfile(CRUDBase[UserHealthProfile, UserHealthProfileCreate, UserHealthProfileUpdate]):
    def get_by_user(self, db: Session, *, user_id: str) -> Optional[UserHealthProfile]:
        """Get health profile for a specific user."""
        return db.query(self.model).filter(UserHealthProfile.user_id == user_id).first()
    
    def create_with_user(self, db: Session, *, obj_in: UserHealthProfileCreate, user_id: str) -> UserHealthProfile:
        """Create health profile for a user."""
        obj_in_data = obj_in.model_dump()
        obj_in_data["user_id"] = user_id
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update_by_user(self, db: Session, *, user_id: str, obj_in: UserHealthProfileUpdate) -> Optional[UserHealthProfile]:
        """Update health profile for a user."""
        db_obj = self.get_by_user(db, user_id=user_id)
        if not db_obj:
            return None
        return self.update(db, db_obj=db_obj, obj_in=obj_in)


# Create instances
# user_health_goals = CRUDUserHealthGoals(UserHealthGoals)  # DEPRECATED
user_health_profile = CRUDUserHealthProfile(UserHealthProfile)
