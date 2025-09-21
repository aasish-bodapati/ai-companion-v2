from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
import uuid
import json
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.health.nutrition_routine import (
    NutritionRoutine,
    NutritionUserRoutineProgress
)
from app.schemas.health.nutrition_routine import (
    NutritionRoutineCreate,
    NutritionRoutineUpdate,
    NutritionUserRoutineProgressCreate
)

class CRUDNutritionRoutine(CRUDBase[NutritionRoutine, NutritionRoutineCreate, NutritionRoutineUpdate]):
    def create(self, db: Session, *, obj_in: NutritionRoutineCreate) -> NutritionRoutine:
        """Create a nutrition routine with proper tags handling."""
        obj_in_data = obj_in.dict()

        # Convert tags to JSON string for SQLite
        if "tags" in obj_in_data and obj_in_data["tags"] is not None:
            if isinstance(obj_in_data["tags"], list):
                obj_in_data["tags"] = json.dumps(obj_in_data["tags"])
            elif isinstance(obj_in_data["tags"], str):
                # Already a string, keep as is
                pass
            else:
                obj_in_data["tags"] = json.dumps([])
        else:
            obj_in_data["tags"] = json.dumps([])

        db_obj = NutritionRoutine(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: NutritionRoutine, obj_in: NutritionRoutineUpdate) -> NutritionRoutine:
        """Update a nutrition routine with proper tags handling."""
        update_data = obj_in.dict(exclude_unset=True)

        # Handle tags serialization
        if "tags" in update_data and update_data["tags"] is not None:
            if isinstance(update_data["tags"], list):
                update_data["tags"] = json.dumps(update_data["tags"])
            elif isinstance(update_data["tags"], str):
                # Already a string, keep as is
                pass
            else:
                update_data["tags"] = json.dumps([])

        # Ensure existing tags are serialized if they're lists
        if hasattr(db_obj, 'tags') and isinstance(db_obj.tags, list):
            db_obj.tags = json.dumps(db_obj.tags)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def _deserialize_tags(self, routine: NutritionRoutine) -> NutritionRoutine:
        """Deserialize tags from JSON string to list."""
        if routine.tags:
            if isinstance(routine.tags, str):
                try:
                    routine.tags = json.loads(routine.tags)
                except (json.JSONDecodeError, TypeError):
                    routine.tags = []
            elif isinstance(routine.tags, list):
                # Already deserialized, keep as is
                pass
            else:
                routine.tags = []
        else:
            routine.tags = []
        return routine

    def get(self, db: Session, id: Any) -> Optional[NutritionRoutine]:
        """Get a single routine by ID with deserialized tags."""
        routine = super().get(db, id)
        if routine:
            return self._deserialize_tags(routine)
        return routine

    def get_user_routines(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get routines created by a specific user."""
        routines = db.query(NutritionRoutine).filter(
            NutritionRoutine.created_by_user_id == user_id
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]

    def get_templates(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get template routines."""
        routines = db.query(NutritionRoutine).filter(
            NutritionRoutine.is_template == True
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]

    def get_user_created_only(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionRoutine]:
        """Get only user-created routines (no templates)."""
        routines = db.query(NutritionRoutine).filter(
            and_(
                NutritionRoutine.created_by_user_id == user_id,
                NutritionRoutine.is_template == False
            )
        ).offset(skip).limit(limit).all()
        return [self._deserialize_tags(routine) for routine in routines]

    def create_with_meal_plans(self, db: Session, *, routine_data: NutritionRoutineCreate,
                              meal_plans_data: List[Dict[str, Any]], user_id: str) -> NutritionRoutine:
        """Create a routine with meal plans stored as JSON."""
        # Create the routine
        routine_dict = routine_data.dict()
        routine_dict["created_by_user_id"] = user_id
        routine_dict["is_template"] = False
        routine_dict["meal_plans"] = meal_plans_data  # Store as JSON

        # Convert tags to JSON string for SQLite
        if "tags" in routine_dict and routine_dict["tags"] is not None:
            if isinstance(routine_dict["tags"], list):
                routine_dict["tags"] = json.dumps(routine_dict["tags"])
            elif isinstance(routine_dict["tags"], str):
                # Already a string, keep as is
                pass
            else:
                routine_dict["tags"] = json.dumps([])
        else:
            routine_dict["tags"] = json.dumps([])

        routine = NutritionRoutine(**routine_dict)
        db.add(routine)
        db.commit()
        db.refresh(routine)
        return self._deserialize_tags(routine)

class CRUDNutritionUserRoutineProgress(CRUDBase[NutritionUserRoutineProgress, NutritionUserRoutineProgressCreate, NutritionUserRoutineProgressCreate]):
    def get_user_active_routine(self, db: Session, *, user_id: str) -> Optional[NutritionUserRoutineProgress]:
        """Get user's currently active nutrition routine."""
        return db.query(NutritionUserRoutineProgress).filter(
            and_(
                NutritionUserRoutineProgress.user_id == user_id,
                NutritionUserRoutineProgress.is_active == True
            )
        ).first()

    def get_user_routines(self, db: Session, *, user_id: str, skip: int = 0, limit: int = 100) -> List[NutritionUserRoutineProgress]:
        """Get all nutrition routines for a user."""
        return db.query(NutritionUserRoutineProgress).filter(
            NutritionUserRoutineProgress.user_id == user_id
        ).offset(skip).limit(limit).all()

    def start_routine(self, db: Session, *, routine_id: str, user_id: str) -> NutritionUserRoutineProgress:
        """Start following a nutrition routine."""
        # Deactivate any current active routine
        current_progress = self.get_user_active_routine(db, user_id=user_id)
        if current_progress:
            current_progress.is_active = False

        # Fix any routines with deserialized tags before committing
        # This prevents SQLite errors when updating routines with list-type tags
        routines_in_session = [obj for obj in db.identity_map.values() if isinstance(obj, NutritionRoutine)]
        for routine in routines_in_session:
            if hasattr(routine, 'tags') and isinstance(routine.tags, list):
                routine.tags = json.dumps(routine.tags)

        # Create new progress entry
        progress_data = {
            "routine_id": routine_id,
            "user_id": user_id,
            "is_active": True,
            "started_at": datetime.utcnow()
        }

        progress = NutritionUserRoutineProgress(**progress_data)
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

    def stop_routine(self, db: Session, *, routine_id: str, user_id: str) -> bool:
        """Stop following a nutrition routine."""
        progress = self.get_user_active_routine(db, user_id=user_id)
        if progress and progress.routine_id == routine_id:
            progress.is_active = False
            db.commit()
            return True
        return False

# Create instances
nutrition_routine = CRUDNutritionRoutine(NutritionRoutine)
nutrition_user_routine_progress = CRUDNutritionUserRoutineProgress(NutritionUserRoutineProgress)
