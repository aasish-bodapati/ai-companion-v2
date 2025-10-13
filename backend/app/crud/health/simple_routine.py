"""
Simplified Routine CRUD operations - Only what we actually need
"""

from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from app.crud.base import CRUDBase
from app.models.health.simple_routine import SimpleRoutine
from app.schemas.health.simple_routine import (
    SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleUserRoutineProgressCreate, SimpleUserRoutineProgressUpdate
)

class CRUDSimpleRoutine(CRUDBase[SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate]):
    """CRUD operations for SimpleRoutine"""

    def get_templates(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get system template routines - for now, return all active routines as templates"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.is_active == True
        ).offset(skip).limit(limit).all()

    def get_user_routines(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get user-created routines"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.user_id == user_id,
            SimpleRoutine.is_active == True
        ).offset(skip).limit(limit).all()

    def get_all_routines(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get all active routines"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.is_active == True
        ).offset(skip).limit(limit).all()

    def create_with_user(self, db: Session, *, obj_in: SimpleRoutineCreate, user_id: int) -> SimpleRoutine:
        """Create a routine for a user"""
        db_obj = SimpleRoutine(
            **obj_in.model_dump(exclude_unset=True),
            user_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(self, db: Session, *, name: str) -> Optional[SimpleRoutine]:
        """Get routine by name"""
        return db.query(SimpleRoutine).filter(SimpleRoutine.name == name).first()

    def get_by_type(self, db: Session, *, routine_type: str, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get routines by type"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.routine_type == routine_type,
            SimpleRoutine.is_active == True
        ).offset(skip).limit(limit).all()

    def create_template(self, db: Session, *, obj_in: SimpleRoutineCreate) -> SimpleRoutine:
        """Create a system template routine"""
        db_obj = SimpleRoutine(
            **obj_in.model_dump(exclude_unset=True),
            user_id=0,  # System templates have user_id = 0
            is_template=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def deactivate(self, db: Session, *, routine_id: int) -> Optional[SimpleRoutine]:
        """Deactivate a routine"""
        routine = db.query(SimpleRoutine).filter(SimpleRoutine.id == routine_id).first()
        if routine:
            routine.is_active = False
            db.add(routine)
            db.commit()
            db.refresh(routine)
        return routine

    def activate(self, db: Session, *, routine_id: int) -> Optional[SimpleRoutine]:
        """Activate a routine"""
        routine = db.query(SimpleRoutine).filter(SimpleRoutine.id == routine_id).first()
        if routine:
            routine.is_active = True
            db.add(routine)
            db.commit()
            db.refresh(routine)
        return routine

# Create instances
simple_routine = CRUDSimpleRoutine(SimpleRoutine)