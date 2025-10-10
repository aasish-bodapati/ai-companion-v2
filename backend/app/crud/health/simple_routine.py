"""
Simplified Routine CRUD operations - Only what we actually need
"""

from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from app.crud.base import CRUDBase
from app.models.health.simple_routine import SimpleRoutine, SimpleUserRoutineProgress, RoutineWorkoutDay, RoutineExercise
from app.schemas.health.simple_routine import (
    SimpleRoutineCreate, SimpleRoutineUpdate,
    SimpleUserRoutineProgressCreate, SimpleUserRoutineProgressUpdate
)

class CRUDSimpleRoutine(CRUDBase[SimpleRoutine, SimpleRoutineCreate, SimpleRoutineUpdate]):
    """CRUD operations for SimpleRoutine"""

    def get_templates(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get system template routines"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.is_template == True,
            SimpleRoutine.is_active == True
        ).offset(skip).limit(limit).all()

    def get_user_routines(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[SimpleRoutine]:
        """Get user-created routines"""
        return db.query(SimpleRoutine).filter(
            SimpleRoutine.created_by_user_id == user_id,
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
            created_by_user_id=user_id,
            is_template=False
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_with_workout_plan(self, db: Session, *, routine_data: SimpleRoutineCreate, workout_days: List[dict], user_id: int) -> SimpleRoutine:
        """Create a routine with detailed workout plan"""

        # Create the routine
        routine = SimpleRoutine(
            **routine_data.model_dump(exclude_unset=True),
            created_by_user_id=user_id,
            is_template=False
        )
        db.add(routine)
        db.flush()  # Get the routine ID

        # Create workout days and exercises (only if workout_days is not empty)
        if workout_days and len(workout_days) > 0:
            for day_data in workout_days:
                workout_day = RoutineWorkoutDay(
                    routine_id=routine.id,
                    day_name=day_data['day'],
                    day_order=day_data.get('day_order', 0),
                    workout_name=day_data.get('workout_name', f"{day_data['day']} Workout"),
                    description=day_data.get('description')
                )
                db.add(workout_day)
                db.flush()  # Get the workout day ID

                # Create exercises for this day
                for i, exercise_data in enumerate(day_data.get('workouts', [])):
                    exercise_name = exercise_data.get('activity_name', 'Exercise')
                    
                    # Lookup category from exercises table
                    from app.models.health.exercise_database import Exercise
                    exercise_lookup = db.query(Exercise).filter(Exercise.name == exercise_name).first()
                    logging_category = exercise_lookup.logging_category if exercise_lookup else 'weighted'  # Default fallback
                    
                    exercise = RoutineExercise(
                        workout_day_id=workout_day.id,
                        exercise_name=exercise_name,
                        logging_category=logging_category,
                        sets=0,  # Default sets for routine planning
                        order_index=i
                    )
                    db.add(exercise)
        else:
            pass  # No exercises to add

        db.commit()
        db.refresh(routine)
        return routine

class CRUDSimpleUserRoutineProgress(CRUDBase[SimpleUserRoutineProgress, SimpleUserRoutineProgressCreate, SimpleUserRoutineProgressUpdate]):
    """CRUD operations for SimpleUserRoutineProgress"""

    def get_user_active_routine(self, db: Session, *, user_id: int) -> Optional[SimpleUserRoutineProgress]:
        """Get user's currently active routine"""
        return db.query(SimpleUserRoutineProgress).filter(
            SimpleUserRoutineProgress.user_id == user_id,
            SimpleUserRoutineProgress.is_active == True
        ).first()

    def get_by_user_and_routine(self, db: Session, *, user_id: int, routine_id: int) -> Optional[SimpleUserRoutineProgress]:
        """Get user's progress for a specific routine"""
        return db.query(SimpleUserRoutineProgress).filter(
            SimpleUserRoutineProgress.user_id == user_id,
            SimpleUserRoutineProgress.routine_id == routine_id
        ).first()

    def start_routine(self, db: Session, *, user_id: int, routine_id: int) -> SimpleUserRoutineProgress:
        """Start following a routine"""
        # Deactivate any currently active routine
        active_routine = self.get_user_active_routine(db, user_id=user_id)
        if active_routine:
            active_routine.is_active = False
            db.add(active_routine)

        # Create new progress record
        from datetime import datetime
        db_obj = SimpleUserRoutineProgress(
            user_id=user_id,
            routine_id=routine_id,
            is_active=True,
            started_at=datetime.utcnow()
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def stop_routine(self, db: Session, *, user_id: int, routine_id: int) -> Optional[SimpleUserRoutineProgress]:
        """Stop following a routine"""
        progress = db.query(SimpleUserRoutineProgress).filter(
            SimpleUserRoutineProgress.user_id == user_id,
            SimpleUserRoutineProgress.routine_id == routine_id,
            SimpleUserRoutineProgress.is_active == True
        ).first()

        if progress:
            from datetime import datetime
            progress.is_active = False
            progress.completed_at = datetime.utcnow()
            db.add(progress)
            db.commit()
            db.refresh(progress)

        return progress

    def log_workout(self, db: Session, *, user_id: int, routine_id: int) -> Optional[SimpleUserRoutineProgress]:
        """Log a workout completion for a routine"""
        progress = db.query(SimpleUserRoutineProgress).filter(
            SimpleUserRoutineProgress.user_id == user_id,
            SimpleUserRoutineProgress.routine_id == routine_id,
            SimpleUserRoutineProgress.is_active == True
        ).first()

        if progress:
            from datetime import datetime
            progress.workouts_completed += 1
            progress.last_workout_date = datetime.utcnow()
            db.add(progress)
            db.commit()
            db.refresh(progress)

        return progress

# Create instances
simple_routine = CRUDSimpleRoutine(SimpleRoutine)
simple_user_routine_progress = CRUDSimpleUserRoutineProgress(SimpleUserRoutineProgress)
