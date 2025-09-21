"""
CRUD operations for Exercise Database.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.crud.base import CRUDBase
from app.models.health.exercise_database import Exercise, UserExerciseHistory
from app.schemas.health.exercise_database import (
    ExerciseCreate, ExerciseUpdate,
    UserExerciseHistoryCreate, UserExerciseHistoryUpdate
)
import json

class CRUDExercise(CRUDBase[Exercise, ExerciseCreate, ExerciseUpdate]):
    """CRUD operations for Exercise."""

    def search_exercises(
        self,
        db: Session,
        query: str,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20
    ) -> List[Exercise]:
        """Search exercises by name."""
        q = db.query(Exercise).filter(
            Exercise.name.ilike(f"%{query}%")
        )
        
        if category:
            q = q.filter(Exercise.category == category)
        if difficulty:
            q = q.filter(Exercise.difficulty_level == difficulty)
            
        return q.limit(limit).all()

    def get_by_category(
        self,
        db: Session,
        category: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Exercise]:
        """Get exercises by category."""
        return db.query(Exercise).filter(
            Exercise.category == category
        ).offset(skip).limit(limit).all()

    def get_by_difficulty(
        self,
        db: Session,
        difficulty: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Exercise]:
        """Get exercises by difficulty level."""
        return db.query(Exercise).filter(
            Exercise.difficulty_level == difficulty
        ).offset(skip).limit(limit).all()

    def get_popular_exercises(
        self,
        db: Session,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Exercise]:
        """Get popular exercises."""
        q = db.query(Exercise)
        
        if category:
            q = q.filter(Exercise.category == category)
            
        return q.order_by(desc(Exercise.usage_count)).limit(limit).all()

class CRUDUserExerciseHistory(CRUDBase[UserExerciseHistory, UserExerciseHistoryCreate, UserExerciseHistoryUpdate]):
    """CRUD operations for UserExerciseHistory."""

    def get_user_history(
        self,
        db: Session,
        user_id: str,
        limit: int = 50
    ) -> List[UserExerciseHistory]:
        """Get user's exercise history."""
        return db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user_id
        ).order_by(desc(UserExerciseHistory.last_performed)).limit(limit).all()

    def get_user_favorites(
        self,
        db: Session,
        user_id: str,
        limit: int = 20
    ) -> List[UserExerciseHistory]:
        """Get user's most frequently performed exercises."""
        return db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user_id
        ).order_by(desc(UserExerciseHistory.times_performed)).limit(limit).all()

    def update_exercise_history(
        self,
        db: Session,
        user_id: str,
        exercise_id: str,
        duration_minutes: Optional[float] = None,
        calories_burned: Optional[float] = None
    ) -> UserExerciseHistory:
        """Update or create user exercise history."""

        # Try to find existing history
        history = db.query(UserExerciseHistory).filter(
            and_(
                UserExerciseHistory.user_id == user_id,
                UserExerciseHistory.exercise_id == exercise_id
            )
        ).first()

        if history:
            # Update existing history
            history.times_performed += 1
            history.last_performed = datetime.now(timezone.utc)
            if duration_minutes:
                # Update average duration
                if history.avg_duration_minutes:
                    history.avg_duration_minutes = (history.avg_duration_minutes + duration_minutes) / 2
                else:
                    history.avg_duration_minutes = duration_minutes
            if calories_burned:
                # Update average calories
                if history.avg_calories_burned:
                    history.avg_calories_burned = (history.avg_calories_burned + calories_burned) / 2
                else:
                    history.avg_calories_burned = calories_burned
        else:
            # Create new history
            history_data = {
                "user_id": user_id,
                "exercise_id": exercise_id,
                "times_performed": 1,
                "last_performed": datetime.now(timezone.utc),
                "avg_duration_minutes": duration_minutes,
                "avg_calories_burned": calories_burned
            }
            history = UserExerciseHistory(**history_data)
            db.add(history)

        db.commit()
        db.refresh(history)
        return history

# Create instances
exercise = CRUDExercise(Exercise)
user_exercise_history = CRUDUserExerciseHistory(UserExerciseHistory)