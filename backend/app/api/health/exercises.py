"""
Exercise Database API endpoints.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.crud.health import exercise_database
from app.schemas.health.exercise_database import (
    Exercise, ExerciseWithStats, ExerciseSearchRequest, ExerciseSearchResponse,
    SmartSuggestion, SmartSuggestionsResponse, ExerciseTemplate,
    QuickExerciseLog, ExerciseLogWithDefaults, UserExerciseHistory
)
from app.models.health.fitness_log import FitnessLog
from app.core.cache import cache_manager, CacheKey, CacheConfig, cache_key_for_search
from sqlalchemy import and_
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search", response_model=ExerciseSearchResponse)
async def search_exercises(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    query: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    equipment: Optional[List[str]] = Query(None, description="Filter by equipment"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    muscle_groups: Optional[List[str]] = Query(None, description="Filter by muscle groups"),
    limit: int = Query(20, ge=1, le=100, description="Result limit"),
    offset: int = Query(0, ge=0, description="Result offset")
):
    """Search exercises with advanced filtering."""
    try:
        # Search exercises
        exercises = exercise_database.exercise.search_exercises(
            db,
            query=query,
            category=category,
            equipment=equipment,
            difficulty=difficulty,
            muscle_groups=muscle_groups,
            limit=limit,
            offset=offset
        )
        
        # Get user exercise history for personalization
        user_history = exercise_database.user_exercise_history.get_user_history(
            db, user_id=current_user.id
        )
        history_dict = {h.exercise_id: h for h in user_history}
        
        # Enrich exercises with user stats
        exercises_with_stats = []
        for exercise in exercises:
            user_stats = history_dict.get(exercise.id)
            exercise_dict = exercise.__dict__.copy()
            
            if user_stats:
                exercise_dict.update({
                    "user_times_performed": user_stats.times_performed,
                    "user_last_performed": user_stats.last_performed,
                    "user_avg_duration": user_stats.avg_duration_minutes,
                    "user_personal_records": {
                        "max_weight_kg": user_stats.max_weight_kg,
                        "max_reps": user_stats.max_reps,
                        "max_distance_km": user_stats.max_distance_km,
                        "best_time_seconds": user_stats.best_time_seconds
                    }
                })
            else:
                exercise_dict.update({
                    "user_times_performed": 0,
                    "user_last_performed": None,
                    "user_avg_duration": None,
                    "user_personal_records": None
                })
            
            exercises_with_stats.append(ExerciseWithStats(**exercise_dict))
        
        # Get total count (simplified - in production, use a separate count query)
        total_count = len(exercises_with_stats)
        has_more = len(exercises) == limit
        
        return ExerciseSearchResponse(
            exercises=exercises_with_stats,
            total_count=total_count,
            has_more=has_more,
            filters_applied={
                "query": query,
                "category": category,
                "equipment": equipment,
                "difficulty": difficulty,
                "muscle_groups": muscle_groups
            }
        )
        
    except Exception as e:
        logger.error(f"Error searching exercises: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search exercises")


@router.get("/popular", response_model=List[ExerciseWithStats])
async def get_popular_exercises(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=1, le=50, description="Result limit")
):
    """Get popular exercises."""
    try:
        # Check cache first
        cache_key = CacheKey.popular_exercises(category)
        cached_result = await cache_manager.get(cache_key)
        if cached_result is not None:
            return cached_result
        exercises = exercise_database.exercise.get_popular_exercises(
            db, category=category, limit=limit
        )
        
        # Get user history for personalization
        user_history = exercise_database.user_exercise_history.get_user_history(
            db, user_id=current_user.id
        )
        history_dict = {h.exercise_id: h for h in user_history}
        
        # Add user stats
        exercises_with_stats = []
        for exercise in exercises:
            user_stats = history_dict.get(exercise.id)
            exercise_dict = exercise.__dict__.copy()
            
            if user_stats:
                exercise_dict.update({
                    "user_times_performed": user_stats.times_performed,
                    "user_last_performed": user_stats.last_performed,
                    "user_avg_duration": user_stats.avg_duration_minutes,
                    "user_personal_records": {
                        "max_weight_kg": user_stats.max_weight_kg,
                        "max_reps": user_stats.max_reps,
                        "max_distance_km": user_stats.max_distance_km,
                        "best_time_seconds": user_stats.best_time_seconds
                    }
                })
            else:
                exercise_dict.update({
                    "user_times_performed": 0,
                    "user_last_performed": None,
                    "user_avg_duration": None,
                    "user_personal_records": None
                })
            
            exercises_with_stats.append(ExerciseWithStats(**exercise_dict))
        
        # Cache the result
        await cache_manager.set(cache_key, exercises_with_stats, CacheConfig.LONG_TTL)
        
        return exercises_with_stats
        
    except Exception as e:
        logger.error(f"Error getting popular exercises: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get popular exercises")


@router.get("/suggestions", response_model=SmartSuggestionsResponse)
async def get_smart_suggestions(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(5, ge=1, le=20, description="Number of suggestions")
):
    """Get smart exercise suggestions based on user history."""
    try:
        suggestions_exercises = exercise_database.exercise.get_smart_suggestions(
            db, user_id=current_user.id, category=category, limit=limit
        )
        
        # Get user preferences from history
        user_history = exercise_database.user_exercise_history.get_user_favorites(
            db, user_id=current_user.id, limit=10
        )
        
        # Build user preferences profile
        preferred_categories = {}
        preferred_muscle_groups = {}
        preferred_equipment = {}
        
        for history in user_history:
            if history.exercise:
                # Count categories
                cat = history.exercise.category
                preferred_categories[cat] = preferred_categories.get(cat, 0) + history.times_performed
                
                # Count muscle groups
                if history.exercise.muscle_groups:
                    for muscle in history.exercise.muscle_groups:
                        preferred_muscle_groups[muscle] = preferred_muscle_groups.get(muscle, 0) + history.times_performed
                
                # Count equipment
                if history.exercise.equipment_needed:
                    for eq in history.exercise.equipment_needed:
                        preferred_equipment[eq] = preferred_equipment.get(eq, 0) + history.times_performed
        
        user_preferences = {
            "preferred_categories": preferred_categories,
            "preferred_muscle_groups": preferred_muscle_groups,
            "preferred_equipment": preferred_equipment,
            "total_exercises_performed": len(user_history),
            "most_frequent_exercise": user_history[0].exercise.name if user_history else None
        }
        
        # Generate suggestions with reasoning
        suggestions = []
        for exercise in suggestions_exercises:
            reason = "Popular exercise in this category"
            confidence = 0.7
            similar_exercises = []
            
            # Personalize reasoning based on user history
            if exercise.muscle_groups:
                matching_muscles = set(exercise.muscle_groups) & set(preferred_muscle_groups.keys())
                if matching_muscles:
                    reason = f"Targets {', '.join(matching_muscles)} - muscles you often train"
                    confidence = 0.9
                    
                    # Find similar exercises user has done
                    for history in user_history[:3]:
                        if (history.exercise and history.exercise.muscle_groups and 
                            set(history.exercise.muscle_groups) & set(exercise.muscle_groups)):
                            similar_exercises.append(history.exercise.name)
            
            if exercise.category in preferred_categories:
                reason = f"Great {exercise.category} exercise - matches your preferences"
                confidence = min(0.95, confidence + 0.1)
            
            suggestions.append(SmartSuggestion(
                exercise=Exercise.from_orm(exercise),
                reason=reason,
                confidence_score=confidence,
                similar_to=similar_exercises[:2]  # Top 2 similar exercises
            ))
        
        return SmartSuggestionsResponse(
            suggestions=suggestions,
            user_preferences=user_preferences,
            generated_at=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"Error getting smart suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get exercise suggestions")


@router.get("/categories")
async def get_exercise_categories(
    *,
    db: Session = Depends(get_db)
):
    """Get all available exercise categories."""
    try:
        # In production, this would be a proper database query
        categories = [
            {
                "name": "cardio",
                "display_name": "Cardio",
                "description": "Cardiovascular exercises for heart health and endurance",
                "icon": "heart"
            },
            {
                "name": "strength",
                "display_name": "Strength Training",
                "description": "Weight lifting and resistance exercises",
                "icon": "dumbbell"
            },
            {
                "name": "flexibility",
                "display_name": "Flexibility & Stretching",
                "description": "Stretching and mobility exercises",
                "icon": "expand"
            },
            {
                "name": "sports",
                "display_name": "Sports & Recreation",
                "description": "Sports activities and recreational exercises",
                "icon": "basketball"
            },
            {
                "name": "functional",
                "display_name": "Functional Training",
                "description": "Exercises that mimic everyday movements",
                "icon": "activity"
            }
        ]
        
        return categories
        
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get categories")


@router.get("/quick-log/{exercise_id}", response_model=ExerciseLogWithDefaults)
async def get_exercise_with_defaults(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    exercise_id: str
):
    """Get exercise with smart defaults for quick logging."""
    try:
        # Get exercise
        exercise = exercise_database.exercise.get(db, id=exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        # Get user history for this exercise
        user_history = db.query(exercise_database.UserExerciseHistory).filter(
            and_(
                exercise_database.UserExerciseHistory.user_id == current_user.id,
                exercise_database.UserExerciseHistory.exercise_id == exercise_id
            )
        ).first()
        
        # Get user's recent logs for this exercise type
        recent_logs = db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == current_user.id,
                FitnessLog.activity_type == exercise.category
            )
        ).order_by(FitnessLog.activity_date.desc()).limit(5).all()
        
        # Calculate smart defaults
        suggested_duration = None
        suggested_intensity = "medium"
        suggested_weight = None
        suggested_reps = None
        suggested_sets = None
        
        if user_history:
            suggested_duration = user_history.avg_duration_minutes
            suggested_weight = user_history.max_weight_kg
            suggested_reps = user_history.max_reps
            suggested_sets = 3  # Default sets
        elif recent_logs:
            # Use averages from recent similar exercises
            suggested_duration = sum(log.duration_minutes for log in recent_logs) / len(recent_logs)
            avg_weight = sum(log.weight_kg for log in recent_logs if log.weight_kg) / len([log for log in recent_logs if log.weight_kg])
            suggested_weight = avg_weight if avg_weight else None
        else:
            # Use exercise defaults
            if exercise.category == "cardio":
                suggested_duration = 30
                suggested_intensity = "medium"
            elif exercise.category == "strength":
                suggested_duration = 45
                suggested_reps = 12
                suggested_sets = 3
                suggested_intensity = "high"
            elif exercise.category == "flexibility":
                suggested_duration = 15
                suggested_intensity = "low"
        
        # Personal records
        personal_records = None
        if user_history:
            personal_records = {
                "max_weight_kg": user_history.max_weight_kg,
                "max_reps": user_history.max_reps,
                "max_distance_km": user_history.max_distance_km,
                "best_time_seconds": user_history.best_time_seconds
            }
        
        # Generate improvement suggestions
        improvement_suggestions = []
        if user_history and user_history.times_performed > 3:
            if user_history.max_weight_kg:
                improvement_suggestions.append(f"Try increasing weight to {user_history.max_weight_kg + 2.5}kg")
            if user_history.avg_duration_minutes and user_history.avg_duration_minutes < 45:
                improvement_suggestions.append(f"Consider extending duration to {user_history.avg_duration_minutes + 5} minutes")
        
        return ExerciseLogWithDefaults(
            exercise=Exercise.from_orm(exercise),
            suggested_duration=suggested_duration,
            suggested_intensity=suggested_intensity,
            suggested_weight=suggested_weight,
            suggested_reps=suggested_reps,
            suggested_sets=suggested_sets,
            personal_records=personal_records,
            last_performed=user_history.last_performed if user_history else None,
            improvement_suggestions=improvement_suggestions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exercise defaults: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get exercise defaults")


@router.get("/templates", response_model=List[ExerciseTemplate])
async def get_exercise_templates(
    *,
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    max_duration: Optional[int] = Query(None, description="Maximum duration in minutes"),
    limit: int = Query(20, ge=1, le=50, description="Result limit")
):
    """Get exercise templates for quick workouts."""
    try:
        templates = exercise_database.exercise_template.search_templates(
            db,
            category=category,
            difficulty=difficulty,
            max_duration=max_duration,
            limit=limit
        )
        
        return [ExerciseTemplate.from_orm(template) for template in templates]
        
    except Exception as e:
        logger.error(f"Error getting exercise templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get exercise templates")


@router.get("/history", response_model=List[UserExerciseHistory])
async def get_user_exercise_history(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Result limit")
):
    """Get user's exercise history."""
    try:
        history = exercise_database.user_exercise_history.get_user_history(
            db, user_id=current_user.id, limit=limit
        )
        
        return [UserExerciseHistory.from_orm(h) for h in history]
        
    except Exception as e:
        logger.error(f"Error getting user exercise history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get exercise history")


@router.get("/favorites", response_model=List[UserExerciseHistory])
async def get_user_favorite_exercises(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=20, description="Result limit")
):
    """Get user's most frequently performed exercises."""
    try:
        favorites = exercise_database.user_exercise_history.get_user_favorites(
            db, user_id=current_user.id, limit=limit
        )
        
        return [UserExerciseHistory.from_orm(fav) for fav in favorites]
        
    except Exception as e:
        logger.error(f"Error getting favorite exercises: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get favorite exercises")
