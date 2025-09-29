"""
Body Type Goals CRUD operations
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from ..base import CRUDBase
from ...models.health.body_type_goals import BodyTypeGoal
from ...schemas.health.body_type_goals import BodyTypeGoalCreate, BodyTypeGoalUpdate


class CRUDBodyTypeGoal(CRUDBase[BodyTypeGoal, BodyTypeGoalCreate, BodyTypeGoalUpdate]):
    def get_by_id(self, db: Session, *, id: str) -> Optional[BodyTypeGoal]:
        return db.query(BodyTypeGoal).filter(BodyTypeGoal.id == id).first()
    
    def get_active_goals(self, db: Session) -> List[BodyTypeGoal]:
        return (
            db.query(BodyTypeGoal)
            .filter(BodyTypeGoal.is_active == True)
            .order_by(BodyTypeGoal.sort_order, BodyTypeGoal.name)
            .all()
        )
    
    def get_by_category(self, db: Session, *, category: str) -> List[BodyTypeGoal]:
        return (
            db.query(BodyTypeGoal)
            .filter(BodyTypeGoal.category == category, BodyTypeGoal.is_active == True)
            .order_by(BodyTypeGoal.sort_order, BodyTypeGoal.name)
            .all()
        )
    
    def get_by_created_by(self, db: Session, *, created_by: str) -> List[BodyTypeGoal]:
        return (
            db.query(BodyTypeGoal)
            .filter(BodyTypeGoal.created_by == created_by, BodyTypeGoal.is_active == True)
            .order_by(BodyTypeGoal.sort_order, BodyTypeGoal.name)
            .all()
        )
    
    def get_system_goals(self, db: Session) -> List[BodyTypeGoal]:
        return self.get_by_created_by(db, created_by="system")
    
    def get_user_goals(self, db: Session) -> List[BodyTypeGoal]:
        return self.get_by_created_by(db, created_by="user")


body_type_goal = CRUDBodyTypeGoal(BodyTypeGoal)
