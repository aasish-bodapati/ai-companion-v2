"""
CRUD operations for Exercise Database.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from app.crud.base import CRUDBase
from app.models.health.exercise_database import Exercise, UserExerciseHistory, ExerciseTemplate
from app.schemas.health.exercise_database import (
    ExerciseCreate, ExerciseUpdate, 
    UserExerciseHistoryCreate, UserExerciseHistoryUpdate,
    ExerciseTemplateCreate, ExerciseTemplateUpdate
)
import json


class CRUDExercise(CRUDBase[Exercise, ExerciseCreate, ExerciseUpdate]):
    """CRUD operations for Exercise."""
    
    def search_exercises(
        self, 
        db: Session, 
        *,
        query: Optional[str] = None,
        category: Optional[str] = None,
        equipment: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        muscle_groups: Optional[List[str]] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Exercise]:
        """Search exercises with multiple filters."""
        
        q = db.query(Exercise)
        
        # Text search
        if query:
            q = q.filter(
                or_(
                    Exercise.name.ilike(f"%{query}%"),
                    Exercise.description.ilike(f"%{query}%")
                )
            )
        
        # Category filter
        if category:
            q = q.filter(Exercise.category == category)
        
        # Difficulty filter
        if difficulty:
            q = q.filter(Exercise.difficulty_level == difficulty)
        
        # Equipment filter (JSON array contains)
        if equipment:
            for eq in equipment:
                q = q.filter(Exercise.equipment_needed.contains([eq]))
        
        # Muscle groups filter (JSON array contains)
        if muscle_groups:
            for muscle in muscle_groups:
                q = q.filter(Exercise.muscle_groups.contains([muscle]))
        
        # Order by popularity and usage
        q = q.order_by(desc(Exercise.is_popular), desc(Exercise.usage_count), Exercise.name)
        
        return q.offset(offset).limit(limit).all()
    
    def get_popular_exercises(self, db: Session, category: Optional[str] = None, limit: int = 10) -> List[Exercise]:
        """Get most popular exercises."""
        q = db.query(Exercise).filter(Exercise.is_popular == True)
        
        if category:
            q = q.filter(Exercise.category == category)
        
        return q.order_by(desc(Exercise.usage_count)).limit(limit).all()
    
    def get_exercises_by_category(self, db: Session, category: str, limit: int = 50) -> List[Exercise]:
        """Get exercises by category."""
        return db.query(Exercise).filter(
            Exercise.category == category
        ).order_by(desc(Exercise.is_popular), Exercise.name).limit(limit).all()
    
    def increment_usage(self, db: Session, exercise_id: str) -> Exercise:
        """Increment usage count for an exercise."""
        exercise = self.get(db, id=exercise_id)
        if exercise:
            exercise.usage_count = (exercise.usage_count or 0) + 1
            db.commit()
            db.refresh(exercise)
        return exercise
    
    def get_smart_suggestions(
        self, 
        db: Session, 
        user_id: str, 
        category: Optional[str] = None,
        limit: int = 5
    ) -> List[Exercise]:
        """Get smart exercise suggestions based on user history."""
        
        # Get user's exercise history
        user_history = db.query(UserExerciseHistory).filter(
            UserExerciseHistory.user_id == user_id
        ).all()
        
        if not user_history:
            # New user - return popular exercises
            return self.get_popular_exercises(db, category=category, limit=limit)
        
        # Get exercises user has done before
        performed_exercise_ids = [h.exercise_id for h in user_history]
        
        # Find similar exercises (same muscle groups, different exercises)
        muscle_groups = set()
        for history in user_history:
            if history.exercise and history.exercise.muscle_groups:
                muscle_groups.update(history.exercise.muscle_groups)
        
        q = db.query(Exercise).filter(
            ~Exercise.id.in_(performed_exercise_ids)  # Exclude already performed
        )
        
        if category:
            q = q.filter(Exercise.category == category)
        
        # Filter by similar muscle groups
        if muscle_groups:
            for muscle in list(muscle_groups)[:3]:  # Top 3 muscle groups
                q = q.filter(Exercise.muscle_groups.contains([muscle]))
        
        return q.order_by(desc(Exercise.is_popular), desc(Exercise.usage_count)).limit(limit).all()


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
        limit: int = 10
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
        calories_burned: Optional[float] = None,
        weight_kg: Optional[float] = None,
        reps: Optional[int] = None,
        distance_km: Optional[float] = None,
        time_seconds: Optional[float] = None
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
            # Update existing
            history.times_performed += 1
            history.last_performed = func.now()
            
            # Update averages
            if duration_minutes:
                if history.avg_duration_minutes:
                    history.avg_duration_minutes = (history.avg_duration_minutes + duration_minutes) / 2
                else:
                    history.avg_duration_minutes = duration_minutes
            
            if calories_burned:
                if history.avg_calories_burned:
                    history.avg_calories_burned = (history.avg_calories_burned + calories_burned) / 2
                else:
                    history.avg_calories_burned = calories_burned
            
            # Update personal records
            if weight_kg and (not history.max_weight_kg or weight_kg > history.max_weight_kg):
                history.max_weight_kg = weight_kg
            
            if reps and (not history.max_reps or reps > history.max_reps):
                history.max_reps = reps
            
            if distance_km and (not history.max_distance_km or distance_km > history.max_distance_km):
                history.max_distance_km = distance_km
            
            if time_seconds and (not history.best_time_seconds or time_seconds < history.best_time_seconds):
                history.best_time_seconds = time_seconds
        
        else:
            # Create new
            history = UserExerciseHistory(
                user_id=user_id,
                exercise_id=exercise_id,
                times_performed=1,
                last_performed=func.now(),
                avg_duration_minutes=duration_minutes,
                avg_calories_burned=calories_burned,
                max_weight_kg=weight_kg,
                max_reps=reps,
                max_distance_km=distance_km,
                best_time_seconds=time_seconds
            )
            db.add(history)
        
        db.commit()
        db.refresh(history)
        return history


class CRUDExerciseTemplate(CRUDBase[ExerciseTemplate, ExerciseTemplateCreate, ExerciseTemplateUpdate]):
    """CRUD operations for ExerciseTemplate."""
    
    def get_popular_templates(self, db: Session, category: Optional[str] = None, limit: int = 10) -> List[ExerciseTemplate]:
        """Get popular exercise templates."""
        q = db.query(ExerciseTemplate).filter(ExerciseTemplate.is_popular == True)
        
        if category:
            q = q.filter(ExerciseTemplate.category == category)
        
        return q.order_by(desc(ExerciseTemplate.usage_count)).limit(limit).all()
    
    def search_templates(
        self,
        db: Session,
        query: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        max_duration: Optional[int] = None,
        limit: int = 20
    ) -> List[ExerciseTemplate]:
        """Search exercise templates."""
        
        q = db.query(ExerciseTemplate)
        
        if query:
            q = q.filter(
                or_(
                    ExerciseTemplate.name.ilike(f"%{query}%"),
                    ExerciseTemplate.description.ilike(f"%{query}%")
                )
            )
        
        if category:
            q = q.filter(ExerciseTemplate.category == category)
        
        if difficulty:
            q = q.filter(ExerciseTemplate.difficulty_level == difficulty)
        
        if max_duration:
            q = q.filter(ExerciseTemplate.estimated_duration_minutes <= max_duration)
        
        return q.order_by(desc(ExerciseTemplate.is_popular), desc(ExerciseTemplate.usage_count)).limit(limit).all()


# Create instances
exercise = CRUDExercise(Exercise)
user_exercise_history = CRUDUserExerciseHistory(UserExerciseHistory)
exercise_template = CRUDExerciseTemplate(ExerciseTemplate)
