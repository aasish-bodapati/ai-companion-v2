"""
Contextual Logging API - Smart logging with routine integration and context awareness.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.fitness_log import FitnessLog, NutritionLog
from app.models.health.simple_routine import SimpleRoutine
from app.models.health.nutrition_routine import NutritionRoutine, NutritionUserRoutineProgress
from app.models.health.exercise_database import Exercise, UserExerciseHistory
from app.models.health.food_database import Food, UserFoodHistory
from app.crud.health import fitness_log, nutrition_log, exercise_database, food_database
from app.schemas.health.contextual_logging import (
    ContextualWorkoutSuggestion, ContextualMealSuggestion,
    SmartWorkoutLog, SmartMealLog, LoggingContext,
    RoutineProgressUpdate, LoggingInsights, QuickLogResponse
)
from app.core.cache import cache_manager, CacheKey, CacheConfig, cache_invalidator
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/context", response_model=LoggingContext)
async def get_logging_context(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive logging context for smart suggestions."""
    try:
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        current_hour = now_utc.hour

        # Get active routines
        # active_fitness_routines = db.query(SimpleRoutine).join(
        #     SimpleUserRoutineProgress
        # ).filter(
        #     and_(
        #         SimpleUserRoutineProgress.user_id == current_user.id,
        #         SimpleUserRoutineProgress.is_active == True
        #     )
        # ).all()
        active_fitness_routines = []  # Temporarily disabled

        active_nutrition_routines = db.query(NutritionRoutine).join(
            NutritionUserRoutineProgress
        ).filter(
            and_(
                NutritionUserRoutineProgress.user_id == current_user.id,
                NutritionUserRoutineProgress.is_active == True
            )
        ).all()

        # Get today's logs
        today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        today_end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)

        today_fitness = db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == current_user.id,
                FitnessLog.activity_date >= today_start,
                FitnessLog.activity_date <= today_end
            )
        ).all()

        today_nutrition = db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == current_user.id,
                NutritionLog.meal_date >= today_start,
                NutritionLog.meal_date <= today_end
            )
        ).all()

        # Determine current context
        context_type = determine_context_type(current_hour, today_fitness, today_nutrition)

        # Get workout suggestions if relevant
        workout_suggestions = []
        if context_type in ["morning_workout", "evening_workout", "routine_scheduled"]:
            workout_suggestions = await generate_workout_suggestions(
                db, current_user.id, active_fitness_routines, today_fitness, now_utc
            )

        # Get meal suggestions if relevant
        meal_suggestions = []
        if context_type in ["meal_time", "nutrition_tracking"]:
            meal_suggestions = await generate_meal_suggestions(
                db, current_user.id, active_nutrition_routines, today_nutrition, now_utc
            )

        # Calculate progress metrics
        progress_metrics = calculate_progress_metrics(
            active_fitness_routines, active_nutrition_routines, today_fitness, today_nutrition
        )

        return LoggingContext(
            context_type=context_type,
            current_time=now_utc,
            time_of_day=get_time_of_day(current_hour),
            workout_suggestions=workout_suggestions,
            meal_suggestions=meal_suggestions,
            active_routines_count=len(active_fitness_routines) + len(active_nutrition_routines),
            today_logs_count=len(today_fitness) + len(today_nutrition),
            progress_metrics=progress_metrics,
            smart_reminders=generate_smart_reminders(
                current_hour, today_fitness, today_nutrition, active_fitness_routines, active_nutrition_routines
            )
        )

    except Exception as e:
        logger.error(f"Error getting logging context: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get logging context")

@router.post("/workout/smart", response_model=QuickLogResponse)
async def smart_workout_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    workout_data: SmartWorkoutLog
):
    """Log workout with smart defaults and context awareness."""
    logger.info(f"🏋️ SMART WORKOUT LOG: Received request from user {current_user.email}")
    logger.info(f"🏋️ SMART WORKOUT LOG: Workout data type: {type(workout_data)}")
    logger.info(f"🏋️ SMART WORKOUT LOG: Workout data: {workout_data}")
    logger.info(f"🏋️ SMART WORKOUT LOG: Workout data dict: {workout_data.__dict__ if hasattr(workout_data, '__dict__') else 'No __dict__'}")
    try:
        # Get exercise details if exercise_id provided
        exercise = None
        if workout_data.exercise_id:
            exercise = exercise_database.exercise.get(db, id=workout_data.exercise_id)
            if not exercise:
                logger.warning(f"Exercise not found with ID: {workout_data.exercise_id}, continuing without exercise details")
                # Don't throw an error, just continue without exercise details

        # Apply smart defaults based on context
        enhanced_data = await apply_workout_smart_defaults(
            db, current_user.id, workout_data, exercise
        )

        # Validate and fix intensity value
        intensity = enhanced_data.get("intensity", workout_data.intensity)
        if intensity == "moderate":
            intensity = "medium"
            enhanced_data["intensity"] = intensity

        # Create fitness log entry
        log_entry = FitnessLog(
            user_id=current_user.id,
            activity_type=enhanced_data.get("activity_type", workout_data.activity_type),
            activity_name=enhanced_data.get("activity_name", workout_data.activity_name),
            duration_minutes=enhanced_data.get("duration_minutes", workout_data.duration_minutes),
            intensity=enhanced_data.get("intensity", workout_data.intensity),
            calories_burned=enhanced_data.get("calories_burned", workout_data.calories_burned),
            weight_kg=workout_data.weight_kg,
            reps=workout_data.reps,
            sets=workout_data.sets,
            distance_km=workout_data.distance_km,
            notes=workout_data.notes,
            activity_date=workout_data.activity_date or datetime.now(timezone.utc)
        )

        db.add(log_entry)

        # Update exercise history if exercise provided
        if exercise:
            exercise_database.user_exercise_history.update_exercise_history(
                db,
                user_id=current_user.id,
                exercise_id=exercise.id,
                duration_minutes=log_entry.duration_minutes,
                calories_burned=log_entry.calories_burned,
                weight_kg=log_entry.weight_kg,
                reps=log_entry.reps
            )

            # Increment exercise usage
            exercise_database.exercise.increment_usage(db, exercise.id)

        # Update routine progress if applicable
        routine_updates = []
        if workout_data.routine_id:
            routine_update = await update_routine_progress(
                db, current_user.id, workout_data.routine_id, "fitness", log_entry
            )
            if routine_update:
                routine_updates.append(routine_update)

        db.commit()
        db.refresh(log_entry)

        # Invalidate user caches after successful logging
        logger.info(f"🏋️ SMART WORKOUT LOG: Invalidating caches for user {current_user.id}")
        try:
            await cache_invalidator.on_user_activity_logged(current_user.id, "fitness")
            if exercise:
                await cache_invalidator.on_exercise_usage_updated(exercise.id)
            logger.info(f"🏋️ SMART WORKOUT LOG: Cache invalidation completed")
        except Exception as e:
            logger.warning(f"🏋️ SMART WORKOUT LOG: Cache invalidation failed: {e}")

        # Generate insights
        logger.info(f"🏋️ SMART WORKOUT LOG: Generating insights for user {current_user.id}")
        try:
            insights = await generate_workout_insights(db, current_user.id, log_entry, exercise)
            logger.info(f"🏋️ SMART WORKOUT LOG: Insights generated successfully")
        except Exception as e:
            logger.warning(f"🏋️ SMART WORKOUT LOG: Insights generation failed: {e}")
            insights = LoggingInsights(
                insights=[],
                achievements=[],
                progress_summary="Workout logged successfully",
                next_goals=[]
            )

        logger.info(f"🏋️ SMART WORKOUT LOG: About to return response for log_id: {log_entry.id}")

        logger.info(f"🏋️ SMART WORKOUT LOG: Getting next suggestions for user {current_user.id}")
        try:
            next_suggestions = await get_next_workout_suggestions(db, current_user.id, log_entry)
            logger.info(f"🏋️ SMART WORKOUT LOG: Next suggestions generated: {next_suggestions}")
        except Exception as e:
            logger.warning(f"🏋️ SMART WORKOUT LOG: Next suggestions generation failed: {e}")
            next_suggestions = []

        response = QuickLogResponse(
            success=True,
            log_id=log_entry.id,
            applied_defaults=enhanced_data.get("applied_defaults", []),
            routine_updates=routine_updates,
            insights=insights,
            next_suggestions=next_suggestions
        )

        logger.info(f"🏋️ SMART WORKOUT LOG: Response created successfully: {response}")
        return response

    except HTTPException as e:
        logger.error(f"HTTPException in smart workout log: {str(e)}")
        logger.error(f"HTTPException status_code: {e.status_code}")
        logger.error(f"HTTPException detail: {e.detail}")
        logger.error(f"HTTPException headers: {e.headers}")
        raise
    except Exception as e:
        logger.error(f"Error logging smart workout: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log workout")

@router.post("/meal/smart", response_model=QuickLogResponse)
async def smart_meal_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    meal_data: SmartMealLog
):
    """Log meal with smart defaults and context awareness."""
    try:
        # Apply smart defaults based on context
        enhanced_data = await apply_meal_smart_defaults(
            db, current_user.id, meal_data
        )

        # Create nutrition log entry
        log_entry = NutritionLog(
            user_id=current_user.id,
            meal_type=enhanced_data.get("meal_type", meal_data.meal_type),
            meal_name=meal_data.meal_name,
            total_calories=enhanced_data.get("total_calories", meal_data.total_calories),
            protein_g=enhanced_data.get("protein_g", meal_data.protein_g),
            carbs_g=enhanced_data.get("carbs_g", meal_data.carbs_g),
            fat_g=enhanced_data.get("fat_g", meal_data.fat_g),
            fiber_g=enhanced_data.get("fiber_g", meal_data.fiber_g),
            sugar_g=enhanced_data.get("sugar_g", meal_data.sugar_g),
            sodium_mg=enhanced_data.get("sodium_mg", meal_data.sodium_mg),
            food_items=meal_data.food_items,
            notes=meal_data.notes,
            mood_before=meal_data.mood_before,
            mood_after=meal_data.mood_after,
            meal_date=meal_data.meal_date or datetime.now(timezone.utc)
        )

        db.add(log_entry)

        # Update food history for each food item
        if meal_data.food_ids:
            for food_id in meal_data.food_ids:
                food_database.user_food_history.update_food_history(
                    db,
                    user_id=current_user.id,
                    food_id=food_id,
                    meal_type=log_entry.meal_type
                )

                # Increment food usage
                food_database.food.increment_usage(db, food_id)

        # Update routine progress if applicable
        routine_updates = []
        if meal_data.routine_id:
            routine_update = await update_routine_progress(
                db, current_user.id, meal_data.routine_id, "nutrition", log_entry
            )
            if routine_update:
                routine_updates.append(routine_update)

        db.commit()
        db.refresh(log_entry)

        # Invalidate user caches after successful logging
        await cache_invalidator.on_user_activity_logged(current_user.id, "nutrition")
        for food_id in meal_data.food_ids or []:
            await cache_invalidator.on_food_usage_updated(food_id)

        # Generate insights
        insights = await generate_meal_insights(db, current_user.id, log_entry)

        return QuickLogResponse(
            success=True,
            log_id=log_entry.id,
            applied_defaults=enhanced_data.get("applied_defaults", []),
            routine_updates=routine_updates,
            insights=insights,
            next_suggestions=await get_next_meal_suggestions(db, current_user.id, log_entry)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging smart meal: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log meal")

# Helper functions

def determine_context_type(hour: int, fitness_logs: List[FitnessLog], nutrition_logs: List[NutritionLog]) -> str:
    """Determine the current logging context based on time and activity."""

    # Morning workout time
    if 6 <= hour < 10 and len(fitness_logs) == 0:
        return "morning_workout"

    # Meal times
    if 7 <= hour < 10 and len([n for n in nutrition_logs if "breakfast" in (n.meal_type or "").lower()]) == 0:
        return "meal_time"
    elif 12 <= hour < 14 and len([n for n in nutrition_logs if "lunch" in (n.meal_type or "").lower()]) == 0:
        return "meal_time"
    elif 18 <= hour < 21 and len([n for n in nutrition_logs if "dinner" in (n.meal_type or "").lower()]) == 0:
        return "meal_time"

    # Evening workout time
    if 17 <= hour < 20 and len(fitness_logs) < 2:
        return "evening_workout"

    # General tracking
    if len(fitness_logs) == 0 and len(nutrition_logs) == 0:
        return "getting_started"
    elif len(fitness_logs) > 0 and len(nutrition_logs) == 0:
        return "nutrition_tracking"
    elif len(fitness_logs) == 0 and len(nutrition_logs) > 0:
        return "fitness_tracking"

    return "general_logging"

def get_time_of_day(hour: int) -> str:
    """Get time of day category."""
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"

async def generate_workout_suggestions(
    db: Session,
    user_id: str,
    active_routines: List[SimpleRoutine],
    today_logs: List[FitnessLog],
    current_time: datetime
) -> List[ContextualWorkoutSuggestion]:
    """Generate contextual workout suggestions."""

    suggestions = []

    # Routine-based suggestions
    for routine in active_routines:
        # Get today's planned workout (simplified)
        current_day = current_time.strftime("%A").lower()

        suggestion = ContextualWorkoutSuggestion(
            routine_id=routine.id,
            routine_name=routine.name,
            suggested_exercises=[],  # Would be populated from routine data
            estimated_duration=45,  # Default
            difficulty=routine.difficulty,
            reason=f"Today's {routine.name} workout",
            confidence_score=0.9,
            time_sensitive=True
        )
        suggestions.append(suggestion)

    # If no routine-based suggestions, add general ones
    if not suggestions:
        # Get user's favorite exercises
        user_history = exercise_database.user_exercise_history.get_user_favorites(
            db, user_id=user_id, limit=3
        )

        for history in user_history:
            if history.exercise:
                suggestion = ContextualWorkoutSuggestion(
                    exercise_id=history.exercise.id,
                    exercise_name=history.exercise.name,
                    suggested_duration=history.avg_duration_minutes or 30,
                    suggested_intensity="medium",
                    reason=f"You often do {history.exercise.name}",
                    confidence_score=0.7,
                    time_sensitive=False
                )
                suggestions.append(suggestion)

    return suggestions[:3]  # Return top 3

async def generate_meal_suggestions(
    db: Session,
    user_id: str,
    active_routines: List[NutritionRoutine],
    today_logs: List[NutritionLog],
    current_time: datetime
) -> List[ContextualMealSuggestion]:
    """Generate contextual meal suggestions."""

    suggestions = []
    current_hour = current_time.hour

    # Determine meal type based on time
    meal_type = "breakfast"
    if 11 <= current_hour < 15:
        meal_type = "lunch"
    elif 17 <= current_hour < 22:
        meal_type = "dinner"
    elif current_hour >= 22 or current_hour < 6:
        meal_type = "snack"

    # Get user's favorite foods for this meal type
    user_favorites = food_database.user_food_history.get_user_favorites(
        db, user_id=user_id, limit=5
    )

    meal_favorites = [f for f in user_favorites if f.most_common_meal_type == meal_type]

    for favorite in meal_favorites[:3]:
        if favorite.food:
            suggestion = ContextualMealSuggestion(
                meal_type=meal_type,
                food_id=favorite.food.id,
                food_name=favorite.food.name,
                suggested_serving_grams=favorite.avg_serving_grams or 100,
                estimated_calories=favorite.food.calories_per_100g * (favorite.avg_serving_grams or 100) / 100,
                reason=f"Your usual {meal_type} choice",
                confidence_score=0.8,
                time_sensitive=True
            )
            suggestions.append(suggestion)

    return suggestions

def calculate_progress_metrics(
    fitness_routines: List[SimpleRoutine],
    nutrition_routines: List[NutritionRoutine],
    today_fitness: List[FitnessLog],
    today_nutrition: List[NutritionLog]
) -> Dict[str, Any]:
    """Calculate progress metrics for context."""

    return {
        "active_routines": len(fitness_routines) + len(nutrition_routines),
        "today_workouts": len(today_fitness),
        "today_meals": len(today_nutrition),
        "completion_rate": min(100, (len(today_fitness) + len(today_nutrition)) / max(1, len(fitness_routines) + len(nutrition_routines)) * 100)
    }

def generate_smart_reminders(
    hour: int,
    fitness_logs: List[FitnessLog],
    nutrition_logs: List[NutritionLog],
    fitness_routines: List[SimpleRoutine],
    nutrition_routines: List[NutritionRoutine]
) -> List[str]:
    """Generate smart reminders based on context."""

    reminders = []

    # Workout reminders
    if fitness_routines and len(fitness_logs) == 0:
        if 6 <= hour < 10:
            reminders.append("Great time for a morning workout!")
        elif 17 <= hour < 20:
            reminders.append("Perfect time for an evening workout session")

    # Meal reminders
    breakfast_logged = any("breakfast" in (log.meal_type or "").lower() for log in nutrition_logs)
    lunch_logged = any("lunch" in (log.meal_type or "").lower() for log in nutrition_logs)
    dinner_logged = any("dinner" in (log.meal_type or "").lower() for log in nutrition_logs)

    if 7 <= hour < 11 and not breakfast_logged:
        reminders.append("Don't forget to log your breakfast!")
    elif 12 <= hour < 15 and not lunch_logged:
        reminders.append("Time to log your lunch")
    elif 18 <= hour < 22 and not dinner_logged:
        reminders.append("Remember to log your dinner")

    return reminders

async def apply_workout_smart_defaults(
    db: Session,
    user_id: str,
    workout_data: SmartWorkoutLog,
    exercise: Optional[Exercise]
) -> Dict[str, Any]:
    """Apply smart defaults to workout data."""

    enhanced_data = {}
    applied_defaults = []

    # Get user history for similar exercises
    if exercise:
        user_history = db.query(UserExerciseHistory).filter(
            and_(
                UserExerciseHistory.user_id == user_id,
                UserExerciseHistory.exercise_id == exercise.id
            )
        ).first()

        if user_history and not workout_data.duration_minutes:
            enhanced_data["duration_minutes"] = user_history.avg_duration_minutes or 30
            applied_defaults.append(f"Duration set to {enhanced_data['duration_minutes']} minutes based on your history")

        if not workout_data.calories_burned and exercise.calories_per_minute:
            duration = workout_data.duration_minutes or enhanced_data.get("duration_minutes", 30)
            enhanced_data["calories_burned"] = int(exercise.calories_per_minute * duration)
            applied_defaults.append(f"Calories estimated at {enhanced_data['calories_burned']} based on exercise data")

    enhanced_data["applied_defaults"] = applied_defaults
    return enhanced_data

async def apply_meal_smart_defaults(
    db: Session,
    user_id: str,
    meal_data: SmartMealLog
) -> Dict[str, Any]:
    """Apply smart defaults to meal data."""

    enhanced_data = {}
    applied_defaults = []

    # Auto-detect meal type based on time if not provided
    if not meal_data.meal_type:
        current_hour = datetime.now(timezone.utc).hour
        if 6 <= current_hour < 11:
            enhanced_data["meal_type"] = "breakfast"
        elif 11 <= current_hour < 16:
            enhanced_data["meal_type"] = "lunch"
        elif 16 <= current_hour < 22:
            enhanced_data["meal_type"] = "dinner"
        else:
            enhanced_data["meal_type"] = "snack"

        applied_defaults.append(f"Meal type set to {enhanced_data['meal_type']} based on current time")

    enhanced_data["applied_defaults"] = applied_defaults
    return enhanced_data

async def update_routine_progress(
    db: Session,
    user_id: str,
    routine_id: str,
    routine_type: str,
    log_entry: Union[FitnessLog, NutritionLog]
) -> Optional[RoutineProgressUpdate]:
    """Update routine progress based on logged activity."""

    if routine_type == "fitness":
        # progress = db.query(SimpleUserRoutineProgress).filter(
        #     and_(
        #         SimpleUserRoutineProgress.user_id == user_id,
        #         SimpleUserRoutineProgress.routine_id == routine_id
        #     )
        # ).first()
        progress = None  # Temporarily disabled

        if progress:
            progress.workouts_completed = (progress.workouts_completed or 0) + 1
            progress.last_workout_date = log_entry.activity_date
            db.commit()

            return RoutineProgressUpdate(
                routine_id=routine_id,
                routine_type="fitness",
                workouts_completed=progress.workouts_completed,
                achievement_unlocked=progress.workouts_completed % 5 == 0  # Achievement every 5 workouts
            )

    return None

async def generate_workout_insights(
    db: Session,
    user_id: str,
    log_entry: FitnessLog,
    exercise: Optional[Exercise]
) -> LoggingInsights:
    """Generate insights after workout logging."""

    insights = []
    achievements = []

    # Compare with previous workouts
    recent_workouts = db.query(FitnessLog).filter(
        and_(
            FitnessLog.user_id == user_id,
            FitnessLog.activity_type == log_entry.activity_type
        )
    ).order_by(FitnessLog.activity_date.desc()).limit(5).all()

    if len(recent_workouts) > 1:
        prev_workout = recent_workouts[1]  # Second most recent

        if log_entry.duration_minutes and prev_workout.duration_minutes:
            if log_entry.duration_minutes > prev_workout.duration_minutes:
                insights.append(f"Great job! You worked out {log_entry.duration_minutes - prev_workout.duration_minutes} minutes longer than last time")

        if log_entry.calories_burned and prev_workout.calories_burned:
            if log_entry.calories_burned > prev_workout.calories_burned:
                insights.append(f"You burned {log_entry.calories_burned - prev_workout.calories_burned} more calories than your previous session")

    # Check for achievements
    total_workouts = db.query(func.count(FitnessLog.id)).filter(
        FitnessLog.user_id == user_id
    ).scalar()

    if total_workouts == 1:
        achievements.append("First Workout Logged! 🎉")
    elif total_workouts % 10 == 0:
        achievements.append(f"{total_workouts} Workouts Milestone! 🏆")

    return LoggingInsights(
        insights=insights,
        achievements=achievements,
        progress_summary=f"Workout #{total_workouts} completed",
        next_goals=["Try increasing duration by 5 minutes next time"] if log_entry.duration_minutes and log_entry.duration_minutes < 45 else []
    )

async def generate_meal_insights(
    db: Session,
    user_id: str,
    log_entry: NutritionLog
) -> LoggingInsights:
    """Generate insights after meal logging."""

    insights = []
    achievements = []

    # Calculate today's nutrition totals
    today = log_entry.meal_date.date()
    today_start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    today_end = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)

    today_nutrition = db.query(NutritionLog).filter(
        and_(
            NutritionLog.user_id == user_id,
            NutritionLog.meal_date >= today_start,
            NutritionLog.meal_date <= today_end
        )
    ).all()

    total_calories = sum(log.total_calories for log in today_nutrition)
    total_protein = sum(log.protein_g or 0 for log in today_nutrition)

    insights.append(f"Today's total: {total_calories} calories, {total_protein:.1f}g protein")

    # Protein goal check
    if total_protein >= 100:
        insights.append("Excellent! You've hit your protein goal for today 💪")
    elif total_protein >= 75:
        insights.append("You're close to your protein goal - keep it up!")

    # Check for achievements
    total_meals = db.query(func.count(NutritionLog.id)).filter(
        NutritionLog.user_id == user_id
    ).scalar()

    if total_meals == 1:
        achievements.append("First Meal Logged! 🍽️")
    elif total_meals % 20 == 0:
        achievements.append(f"{total_meals} Meals Milestone! 🌟")

    return LoggingInsights(
        insights=insights,
        achievements=achievements,
        progress_summary=f"Meal #{total_meals} logged",
        next_goals=["Try adding more vegetables to your next meal"] if log_entry.meal_type != "snack" else []
    )

async def get_next_workout_suggestions(
    db: Session,
    user_id: str,
    last_workout: FitnessLog
) -> List[str]:
    """Get suggestions for next workout."""

    suggestions = []

    # Suggest rest day if high intensity
    if last_workout.intensity == "high":
        suggestions.append("Consider a light recovery workout or rest day tomorrow")

    # Suggest different muscle groups
    if last_workout.activity_type == "strength":
        suggestions.append("Try some cardio for your next session")
    elif last_workout.activity_type == "cardio":
        suggestions.append("Consider adding some strength training")

    return suggestions

async def get_next_meal_suggestions(
    db: Session,
    user_id: str,
    last_meal: NutritionLog
) -> List[str]:
    """Get suggestions for next meal."""

    suggestions = []

    # Suggest based on macros
    if (last_meal.protein_g or 0) < 20 and last_meal.meal_type != "snack":
        suggestions.append("Consider adding more protein to your next meal")

    if last_meal.meal_type == "breakfast":
        suggestions.append("Don't forget to stay hydrated throughout the day")

    return suggestions
