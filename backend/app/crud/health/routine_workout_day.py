"""
CRUD operations for RoutineWorkoutDay
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.health.simple_routine import RoutineWorkoutDay

class CRUDRoutineWorkoutDay(CRUDBase[RoutineWorkoutDay, None, None]):
    """CRUD operations for RoutineWorkoutDay"""

    def get_by_routine(self, db: Session, *, routine_id: int) -> List[RoutineWorkoutDay]:
        """Get all workout days for a specific routine"""
        return db.query(RoutineWorkoutDay).filter(RoutineWorkoutDay.routine_id == routine_id).order_by(RoutineWorkoutDay.day_order).all()

    def get_by_day_name(self, db: Session, *, routine_id: int, day_name: str) -> Optional[RoutineWorkoutDay]:
        """Get workout day by routine and day name"""
        return db.query(RoutineWorkoutDay).filter(
            RoutineWorkoutDay.routine_id == routine_id,
            RoutineWorkoutDay.day_name == day_name
        ).first()

routine_workout_day = CRUDRoutineWorkoutDay(RoutineWorkoutDay)
