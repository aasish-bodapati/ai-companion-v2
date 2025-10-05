"""
Unified Dashboard API for optimized data loading and performance.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.fitness_log import FitnessLog, NutritionLog, MoodLog
from app.models.health.water_log import WaterLog
import logging
from app.models.health.simple_routine import SimpleRoutine, SimpleUserRoutineProgress
from app.models.health.nutrition_routine import NutritionRoutine, NutritionUserRoutineProgress
from app.crud.health import fitness_log, nutrition_log, mood_log
from app.core.config import settings
from app.utils.timezone_service import TimezoneService
from app.core.cache import cache_manager, CacheKey, CacheConfig, cache_invalidator

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get unified dashboard summary with all necessary data in single API call.
    Returns: today_stats, active_routines, quick_actions, smart_suggestions, weekly_progress
    """
    try:
        # Check cache first
        cache_key = CacheKey.user_dashboard(current_user.id)
        cached_result = await cache_manager.get(cache_key)
        if cached_result is not None:
            return cached_result
        # Get date ranges using user's timezone from profile
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        
        # Use user's timezone if available, otherwise default to UTC
        # Use TimezoneService for proper timezone handling
        user_timezone = current_user.timezone or "UTC"
        
        # Get today's date range in user's timezone
        start_of_day, end_of_day = TimezoneService.get_user_date_range(user_timezone)
        
        # Get week range in user's timezone
        start_of_week, end_of_week = TimezoneService.get_user_week_range(user_timezone)

        # Parallel data fetching for performance

        # 1. Today's activity logs
        today_fitness = db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == current_user.id,
                FitnessLog.activity_date >= start_of_day,
                FitnessLog.activity_date <= end_of_day
            )
        ).all()

        today_nutrition = db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == current_user.id,
                NutritionLog.meal_date >= start_of_day,
                NutritionLog.meal_date <= end_of_day
            )
        ).all()
        

        today_water = db.query(WaterLog).filter(
            and_(
                WaterLog.user_id == current_user.id,
                WaterLog.log_date >= start_of_day,
                WaterLog.log_date <= end_of_day
            )
        ).all()

        # 2. Week's activity logs for trends
        week_fitness = db.query(FitnessLog).filter(
            and_(
                FitnessLog.user_id == current_user.id,
                FitnessLog.activity_date >= start_of_week,
                FitnessLog.activity_date <= end_of_week
            )
        ).all()

        week_nutrition = db.query(NutritionLog).filter(
            and_(
                NutritionLog.user_id == current_user.id,
                NutritionLog.meal_date >= start_of_week,
                NutritionLog.meal_date <= end_of_week
            )
        ).all()

        # 3. Active routines
        active_fitness_routines = db.query(SimpleRoutine).join(
            SimpleUserRoutineProgress,
            SimpleRoutine.id == SimpleUserRoutineProgress.routine_id
        ).filter(
            and_(
                SimpleUserRoutineProgress.user_id == current_user.id,
                SimpleUserRoutineProgress.is_active == True
            )
        ).all()

        active_nutrition_routines = db.query(NutritionRoutine).join(
            NutritionUserRoutineProgress,
            NutritionRoutine.id == NutritionUserRoutineProgress.routine_id
        ).filter(
            and_(
                NutritionUserRoutineProgress.user_id == current_user.id,
                NutritionUserRoutineProgress.is_active == True
            )
        ).all()

        # Calculate today's stats
        today_stats = calculate_today_stats(today_fitness, today_nutrition, today_water)

        # Calculate weekly progress
        weekly_progress = calculate_weekly_progress(week_fitness, week_nutrition, today)

        # Generate smart suggestions
        smart_suggestions = generate_smart_suggestions(
            current_user.id, today_fitness, today_nutrition,
            active_fitness_routines, active_nutrition_routines, now_utc
        )

        # Format active routines
        active_routines = format_active_routines(
            active_fitness_routines, active_nutrition_routines
        )

        # Generate quick actions based on context
        quick_actions = generate_quick_actions(
            today_fitness, today_nutrition, active_routines, now_utc
        )

        # Calculate streak (simplified - could be more sophisticated)
        streak = calculate_user_streak(week_fitness, week_nutrition)

        result = {
            "today_stats": today_stats,
            "weekly_progress": weekly_progress,
            "active_routines": active_routines,
            "smart_suggestions": smart_suggestions,
            "quick_actions": quick_actions,
            "streak": streak,
            "last_updated": now_utc.isoformat(),
            "cache_duration": 300  # 5 minutes
        }

        # Cache the result
        await cache_manager.set(cache_key, result, CacheConfig.MEDIUM_TTL)

        return result

    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        # Return empty data structure on error
        return {
            "today_stats": {
                "workouts": 0,
                "meals": 0,
                "calories_burned": 0,
                "calories_consumed": 0,
                "total_minutes": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0
            },
            "weekly_progress": {
                "workouts_completed": 0,
                "workouts_target": 5,
                "meals_logged": 0,
                "meals_target": 21,
                "progress_percentage": 0
            },
            "active_routines": [],
            "smart_suggestions": [],
            "quick_actions": [],
            "streak": 0,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "cache_duration": 60
        }

def calculate_today_stats(fitness_logs: List[FitnessLog], nutrition_logs: List[NutritionLog], water_logs: List[WaterLog] = None) -> Dict[str, Any]:
    """Calculate today's comprehensive stats."""
    water_logs = water_logs or []
    return {
        "workouts": len(fitness_logs),
        "meals": len(nutrition_logs),
        "water_ml": sum(log.amount_ml or 0 for log in water_logs),
        "calories_burned": sum(log.calories_burned or 0 for log in fitness_logs),
        "calories_consumed": sum(log.total_calories or 0 for log in nutrition_logs),
        "total_minutes": sum(log.duration_minutes or 0 for log in fitness_logs),
        "protein_g": round(sum(log.protein_g or 0 for log in nutrition_logs), 1),
        "carbs_g": round(sum(log.carbs_g or 0 for log in nutrition_logs), 1),
        "fat_g": round(sum(log.fat_g or 0 for log in nutrition_logs), 1),
        "net_calories": sum(log.total_calories or 0 for log in nutrition_logs) - sum(log.calories_burned or 0 for log in fitness_logs)
    }

def calculate_weekly_progress(fitness_logs: List[FitnessLog], nutrition_logs: List[NutritionLog], today) -> Dict[str, Any]:
    """Calculate weekly progress towards goals."""
    days_in_week = today.weekday() + 1  # Monday = 0, so +1 for actual days passed

    workouts_this_week = len(fitness_logs)
    meals_this_week = len(nutrition_logs)

    # Dynamic targets based on days passed
    expected_workouts = min(5, days_in_week)  # Max 5 workouts per week
    expected_meals = min(21, days_in_week * 3)  # 3 meals per day

    workout_progress = min(100, (workouts_this_week / expected_workouts * 100)) if expected_workouts > 0 else 0
    meal_progress = min(100, (meals_this_week / expected_meals * 100)) if expected_meals > 0 else 0

    return {
        "workouts_completed": workouts_this_week,
        "workouts_target": expected_workouts,
        "workout_progress": round(workout_progress, 1),
        "meals_logged": meals_this_week,
        "meals_target": expected_meals,
        "meal_progress": round(meal_progress, 1),
        "overall_progress": round((workout_progress + meal_progress) / 2, 1),
        "days_in_week": days_in_week,
        "total_minutes_this_week": sum(log.duration_minutes or 0 for log in fitness_logs),
        "avg_calories_per_day": round(sum(log.total_calories or 0 for log in nutrition_logs) / max(days_in_week, 1), 0)
    }

def generate_smart_suggestions(
    user_id: str,
    today_fitness: List[FitnessLog],
    today_nutrition: List[NutritionLog],
    active_fitness_routines: List[SimpleRoutine],
    active_nutrition_routines: List[NutritionRoutine],
    current_time: datetime
) -> List[Dict[str, Any]]:
    """Generate contextual smart suggestions."""
    suggestions = []
    hour = current_time.hour

    # Time-based suggestions
    if 6 <= hour < 11 and len(today_nutrition) == 0:
        suggestions.append({
            "type": "nutrition",
            "priority": "high",
            "title": "Log Your Breakfast",
            "message": "Start your day right! Log your breakfast to track your nutrition goals.",
            "action": "log_meal",
            "action_data": {"meal_type": "breakfast"},
            "icon": "cafe-outline"
        })

    if 11 <= hour < 15 and len([n for n in today_nutrition if "lunch" in (n.meal_type or "").lower()]) == 0:
        suggestions.append({
            "type": "nutrition",
            "priority": "medium",
            "title": "Time for Lunch",
            "message": "Don't skip lunch! Your body needs fuel for the afternoon.",
            "action": "log_meal",
            "action_data": {"meal_type": "lunch"},
            "icon": "restaurant-outline"
        })

    # Workout suggestions based on routines
    if active_fitness_routines and len(today_fitness) == 0:
        routine = active_fitness_routines[0]  # Get first active routine
        suggestions.append({
            "type": "fitness",
            "priority": "high",
            "title": f"Today's {routine.name} Workout",
            "message": f"You have a {routine.difficulty} workout planned. Ready to crush it?",
            "action": "log_workout",
            "action_data": {"routine_id": routine.id},
            "icon": "barbell-outline"
        })

    # Achievement-based suggestions
    if len(today_fitness) > 0 and len(today_nutrition) > 0:
        suggestions.append({
            "type": "achievement",
            "priority": "low",
            "title": "Great Progress Today!",
            "message": f"You've logged {len(today_fitness)} workout(s) and {len(today_nutrition)} meal(s). Keep it up!",
            "action": "view_progress",
            "action_data": {},
            "icon": "trophy-outline"
        })

    return suggestions[:3]  # Return top 3 suggestions

def format_active_routines(fitness_routines: List[SimpleRoutine], nutrition_routines: List[NutritionRoutine]) -> List[Dict[str, Any]]:
    """Format active routines for dashboard display."""
    formatted = []

    for routine in fitness_routines:
        formatted.append({
            "id": routine.id,
            "name": routine.name,
            "type": "fitness",
            "difficulty": routine.difficulty,
            "duration_weeks": routine.duration_weeks,
            "description": routine.description,
            "icon": "barbell-outline"
        })

    for routine in nutrition_routines:
        formatted.append({
            "id": routine.id,
            "name": routine.name,
            "type": "nutrition",
            "difficulty": routine.difficulty,
            "duration_weeks": routine.duration_weeks,
            "description": routine.description,
            "icon": "apple-outline"
        })

    return formatted

def generate_quick_actions(
    today_fitness: List[FitnessLog],
    today_nutrition: List[NutritionLog],
    active_routines: List[Dict[str, Any]],
    current_time: datetime
) -> List[Dict[str, Any]]:
    """Generate contextual quick actions."""
    actions = []
    hour = current_time.hour

    # Always available actions
    actions.append({
        "id": "log_workout",
        "title": "Log Workout",
        "subtitle": f"{len(today_fitness)} logged today",
        "icon": "add-circle-outline",
        "color": "orange",
        "action": "navigate",
        "target": "/fitness?tab=log"
    })

    actions.append({
        "id": "log_meal",
        "title": "Log Meal",
        "subtitle": f"{len(today_nutrition)} logged today",
        "icon": "add-circle-outline",
        "color": "green",
        "action": "navigate",
        "target": "/nutrition?tab=log"
    })

    # Contextual actions
    if len(active_routines) > 0:
        actions.append({
            "id": "view_routines",
            "title": "Active Routines",
            "subtitle": f"{len(active_routines)} active",
            "icon": "calendar-outline",
            "color": "blue",
            "action": "navigate",
            "target": "/fitness?tab=routines"
        })

    # Progress action
    if len(today_fitness) > 0 or len(today_nutrition) > 0:
        actions.append({
            "id": "view_progress",
            "title": "View Progress",
            "subtitle": "See your stats",
            "icon": "bar-chart-outline",
            "color": "purple",
            "action": "navigate",
            "target": "/profile"
        })

    return actions[:4]  # Return top 4 actions

def calculate_user_streak(fitness_logs: List[FitnessLog], nutrition_logs: List[NutritionLog]) -> int:
    """Calculate user's current activity streak (simplified)."""
    # Group logs by date
    activity_dates = set()

    for log in fitness_logs:
        activity_dates.add(log.activity_date.date())

    for log in nutrition_logs:
        activity_dates.add(log.meal_date.date())

    if not activity_dates:
        return 0

    # Simple streak calculation - days with any activity
    today = datetime.now(timezone.utc).date()
    streak = 0
    current_date = today

    while current_date in activity_dates:
        streak += 1
        current_date -= timedelta(days=1)
        if streak > 30:  # Cap at 30 days for performance
            break

    return streak

@router.get("/quick-stats")
async def get_quick_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get minimal stats for quick updates (used for real-time updates)."""
    try:
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        end_of_day = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)

        # Quick counts only
        fitness_count = db.query(func.count(FitnessLog.id)).filter(
            and_(
                FitnessLog.user_id == current_user.id,
                FitnessLog.activity_date >= start_of_day,
                FitnessLog.activity_date <= end_of_day
            )
        ).scalar()

        nutrition_count = db.query(func.count(NutritionLog.id)).filter(
            and_(
                NutritionLog.user_id == current_user.id,
                NutritionLog.meal_date >= start_of_day,
                NutritionLog.meal_date <= end_of_day
            )
        ).scalar()

        return {
            "workouts_today": fitness_count or 0,
            "meals_today": nutrition_count or 0,
            "last_updated": now_utc.isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting quick stats: {str(e)}")
        return {
            "workouts_today": 0,
            "meals_today": 0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
