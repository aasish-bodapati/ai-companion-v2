"""
CRUD operations for RoutineExercise
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.health.simple_routine import RoutineExercise

class CRUDRoutineExercise(CRUDBase[RoutineExercise, None, None]):
    """CRUD operations for RoutineExercise"""

    def get_by_workout_day(self, db: Session, *, workout_day_id: int) -> List[RoutineExercise]:
        """Get all exercises for a specific workout day"""
        return db.query(RoutineExercise).filter(
            RoutineExercise.workout_day_id == workout_day_id
        ).order_by(RoutineExercise.order_index).all()

    def get_by_routine(self, db: Session, *, routine_id: int) -> List[RoutineExercise]:
        """Get all exercises for a specific routine (across all workout days)"""
        from app.models.health.simple_routine import RoutineWorkoutDay
        return db.query(RoutineExercise).join(
            RoutineWorkoutDay, RoutineExercise.workout_day_id == RoutineWorkoutDay.id
        ).filter(
            RoutineWorkoutDay.routine_id == routine_id
        ).order_by(RoutineExercise.order_index).all()

routine_exercise = CRUDRoutineExercise(RoutineExercise)
