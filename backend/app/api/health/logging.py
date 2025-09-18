"""
Health logging API endpoints for fitness and nutrition data
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.fitness_log import fitness_log, nutrition_log, mood_log
from app.schemas.health.fitness_log import (
    FitnessLog, FitnessLogCreate, FitnessLogUpdate,
    NutritionLog, NutritionLogCreate, NutritionLogUpdate,
    MoodLog, MoodLogCreate, MoodLogUpdate
)
import logging

logger = logging.getLogger(__name__)

def get_user_timezone_range(date_obj: datetime, timezone_offset_hours: int = 0):
    """
    Get start and end of day in user's timezone, converted to UTC for database queries.
    
    Args:
        date_obj: The date to get range for
        timezone_offset_hours: User's timezone offset from UTC (e.g., +8 for Singapore, -5 for EST)
    
    Returns:
        tuple: (start_of_day_utc, end_of_day_utc)
    """
    # Create timezone-aware datetime for user's timezone
    user_tz = timezone(timedelta(hours=timezone_offset_hours))
    
    # Get start and end of day in user's timezone
    start_of_day_user = datetime.combine(date_obj.date(), datetime.min.time()).replace(tzinfo=user_tz)
    end_of_day_user = datetime.combine(date_obj.date(), datetime.max.time()).replace(tzinfo=user_tz)
    
    # Convert to UTC for database queries
    start_of_day_utc = start_of_day_user.astimezone(timezone.utc)
    end_of_day_utc = end_of_day_user.astimezone(timezone.utc)
    
    return start_of_day_utc, end_of_day_utc

router = APIRouter()


@router.get("/fitness/today")
async def get_fitness_today(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    timezone_offset: int = Query(0, description="Timezone offset in minutes from UTC")
):
    """Get today's fitness summary."""
    try:
        # Use user's timezone for date calculation
        if timezone_offset != 0:
            # Convert timezone offset from minutes to hours
            tz_offset_hours = timezone_offset / 60
            user_tz = timezone(timedelta(hours=tz_offset_hours))
            now_user = datetime.now(user_tz)
            today = now_user.date()
            start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=user_tz)
            end_of_day = datetime.combine(today, datetime.max.time()).replace(tzinfo=user_tz)
        else:
            # Fallback to local timezone
            now_local = datetime.now()
            today = now_local.date()
            start_of_day = datetime.combine(today, datetime.min.time())
            end_of_day = datetime.combine(today, datetime.max.time())
        
        # Get today's fitness logs
        logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        # Calculate summary
        total_workouts = len(logs)
        total_minutes = sum(log.duration_minutes or 0 for log in logs)
        total_calories = sum(log.calories_burned or 0 for log in logs)
        
        # Convert intensity strings to numbers for average calculation
        intensity_map = {'low': 3, 'medium': 6, 'high': 9}
        intensity_values = [intensity_map.get(log.intensity, 0) for log in logs if log.intensity]
        avg_intensity = sum(intensity_values) / len(intensity_values) if intensity_values else 0
        
        return {
            "workouts": total_workouts,
            "totalMinutes": total_minutes,
            "caloriesBurned": total_calories,
            "avgIntensity": round(avg_intensity, 1)
        }
    except Exception as e:
        logger.error(f"Error getting fitness today: {str(e)}")
        return {
            "workouts": 0,
            "totalMinutes": 0,
            "caloriesBurned": 0,
            "avgIntensity": 0
        }


@router.get("/fitness/weekly")
async def get_fitness_weekly(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    timezone_offset: int = Query(0, description="Timezone offset in minutes from UTC")
):
    """Get this week's fitness summary."""
    try:
        # Use user's timezone for date calculation
        if timezone_offset != 0:
            # Convert timezone offset from minutes to hours
            tz_offset_hours = timezone_offset / 60
            user_tz = timezone(timedelta(hours=tz_offset_hours))
            now_user = datetime.now(user_tz)
            today = now_user.date()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            start_of_week = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=user_tz)
            end_of_week = datetime.combine(week_end, datetime.max.time()).replace(tzinfo=user_tz)
        else:
            # Fallback to local timezone
            now_local = datetime.now()
            today = now_local.date()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            start_of_week = datetime.combine(week_start, datetime.min.time())
            end_of_week = datetime.combine(week_end, datetime.max.time())
        
        # Get this week's fitness logs
        logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        # Calculate summary
        total_workouts = len(logs)
        total_minutes = sum(log.duration_minutes or 0 for log in logs)
        avg_calories_per_workout = sum(log.calories_burned or 0 for log in logs) / len(logs) if logs else 0
        
        # Calculate streak (simplified - consecutive days with workouts)
        streak = 0
        current_date = today
        while current_date >= week_start:
            day_logs = [log for log in logs if log.activity_date.date() == current_date]
            if day_logs:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        return {
            "totalWorkouts": total_workouts,
            "totalMinutes": total_minutes,
            "avgCaloriesPerWorkout": round(avg_calories_per_workout, 0),
            "streak": streak
        }
    except Exception as e:
        logger.error(f"Error getting fitness weekly: {str(e)}")
        return {
            "totalWorkouts": 0,
            "totalMinutes": 0,
            "avgCaloriesPerWorkout": 0,
            "streak": 0
        }


@router.get("/nutrition/today")
async def get_nutrition_today(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's nutrition summary."""
    try:
        # Use UTC timezone for consistent date calculation
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        end_of_day = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
        
        # Get today's nutrition logs
        logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        # Calculate summary
        total_calories = sum(log.calories or 0 for log in logs)
        total_protein = sum(log.protein or 0 for log in logs)
        total_carbs = sum(log.carbohydrates or 0 for log in logs)
        total_fat = sum(log.fat or 0 for log in logs)
        total_water = sum(log.water_intake or 0 for log in logs)
        total_meals = len(logs)
        
        return {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fat": total_fat,
            "water": total_water,
            "meals": total_meals
        }
    except Exception as e:
        logger.error(f"Error getting nutrition today: {str(e)}")
        return {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "water": 0,
            "meals": 0
        }


@router.get("/nutrition/weekly")
async def get_nutrition_weekly(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get this week's nutrition summary."""
    try:
        # Use UTC timezone for consistent date calculation
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        start_of_week = datetime.combine(week_start, datetime.min.time(), tzinfo=timezone.utc)
        end_of_week = datetime.combine(week_end, datetime.max.time(), tzinfo=timezone.utc)
        
        # Get this week's nutrition logs
        logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        # Calculate summary
        total_calories = sum(log.calories or 0 for log in logs)
        total_protein = sum(log.protein or 0 for log in logs)
        total_water = sum(log.water_intake or 0 for log in logs)
        total_meals = len(logs)
        
        # Calculate averages
        days_in_week = 7
        avg_calories = total_calories / days_in_week
        avg_protein = total_protein / days_in_week
        avg_water = total_water / days_in_week
        
        return {
            "avgCalories": round(avg_calories, 0),
            "avgProtein": round(avg_protein, 0),
            "avgWater": round(avg_water, 0),
            "totalMeals": total_meals
        }
    except Exception as e:
        logger.error(f"Error getting nutrition weekly: {str(e)}")
        return {
            "avgCalories": 0,
            "avgProtein": 0,
            "avgWater": 0,
            "totalMeals": 0
        }


@router.get("/nutrition/recent")
async def get_recent_meals(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """Get recent meals for the user."""
    try:
        # Get recent nutrition logs
        logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            limit=limit
        )
        
        # Format the response
        meals = []
        for log in logs:
            meals.append({
                "id": log.id,
                "meal_type": log.meal_type,
                "meal_name": log.meal_name,
                "total_calories": log.total_calories,
                "protein_g": log.protein_g,
                "carbs_g": log.carbs_g,
                "fat_g": log.fat_g,
                "meal_date": log.meal_date.isoformat() if log.meal_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            })
        
        return {"meals": meals}
    except Exception as e:
        logger.error(f"Failed to get recent meals: {e}")
        return {"meals": []}


# ============================================================================
# FITNESS LOGGING CRUD ENDPOINTS
# ============================================================================

@router.post("/fitness", response_model=FitnessLog)
async def create_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    fitness_log_in: FitnessLogCreate
):
    """Create a new fitness log entry."""
    try:
        fitness_log_entry = fitness_log.create_with_user(
            db, obj_in=fitness_log_in, user_id=current_user.id
        )
        return fitness_log_entry
    except Exception as e:
        logger.error(f"Error creating fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create fitness log")


@router.get("/fitness", response_model=List[FitnessLog])
async def get_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get fitness logs for the current user."""
    try:
        logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return logs
    except Exception as e:
        logger.error(f"Error getting fitness logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get fitness logs")


@router.get("/fitness/{fitness_log_id}", response_model=FitnessLog)
async def get_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    fitness_log_id: UUID
):
    """Get a specific fitness log by ID."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(fitness_log_id))
        if not fitness_log_entry or fitness_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        return fitness_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get fitness log")


@router.put("/fitness/{fitness_log_id}", response_model=FitnessLog)
async def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    fitness_log_id: UUID,
    fitness_log_in: FitnessLogUpdate
):
    """Update a fitness log entry."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(fitness_log_id))
        if not fitness_log_entry or fitness_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        
        updated_log = fitness_log.update(
            db, db_obj=fitness_log_entry, obj_in=fitness_log_in
        )
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update fitness log")


@router.delete("/fitness/{fitness_log_id}")
async def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    fitness_log_id: UUID
):
    """Delete a fitness log entry."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(fitness_log_id))
        if not fitness_log_entry or fitness_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        
        fitness_log.remove(db, id=str(fitness_log_id))
        return {"message": "Fitness log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete fitness log")


# ============================================================================
# NUTRITION LOGGING CRUD ENDPOINTS
# ============================================================================

@router.post("/nutrition", response_model=NutritionLog)
async def create_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    nutrition_log_in: NutritionLogCreate
):
    """Create a new nutrition log entry."""
    try:
        nutrition_log_entry = nutrition_log.create_with_user(
            db, obj_in=nutrition_log_in, user_id=current_user.id
        )
        return nutrition_log_entry
    except Exception as e:
        logger.error(f"Error creating nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create nutrition log")


@router.get("/nutrition", response_model=List[NutritionLog])
async def get_nutrition_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get nutrition logs for the current user."""
    try:
        logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return logs
    except Exception as e:
        logger.error(f"Error getting nutrition logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition logs")


@router.get("/nutrition/{nutrition_log_id}", response_model=NutritionLog)
async def get_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    nutrition_log_id: UUID
):
    """Get a specific nutrition log by ID."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=str(nutrition_log_id))
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        return nutrition_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition log")


@router.put("/nutrition/{nutrition_log_id}", response_model=NutritionLog)
async def update_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    nutrition_log_id: UUID,
    nutrition_log_in: NutritionLogUpdate
):
    """Update a nutrition log entry."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=str(nutrition_log_id))
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        updated_log = nutrition_log.update(
            db, db_obj=nutrition_log_entry, obj_in=nutrition_log_in
        )
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update nutrition log")


@router.delete("/nutrition/{nutrition_log_id}")
async def delete_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    nutrition_log_id: UUID
):
    """Delete a nutrition log entry."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=str(nutrition_log_id))
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        
        nutrition_log.remove(db, id=str(nutrition_log_id))
        return {"message": "Nutrition log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete nutrition log")


# ============================================================================
# MOOD LOGGING CRUD ENDPOINTS
# ============================================================================

@router.post("/mood", response_model=MoodLog)
async def create_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_in: MoodLogCreate
):
    """Create a new mood log entry."""
    try:
        mood_log_entry = mood_log.create_with_user(
            db, obj_in=mood_log_in, user_id=current_user.id
        )
        return mood_log_entry
    except Exception as e:
        logger.error(f"Error creating mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create mood log")


@router.get("/mood", response_model=List[MoodLog])
async def get_mood_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get mood logs for the current user."""
    try:
        logs = mood_log.get_user_logs(
            db, 
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        return logs
    except Exception as e:
        logger.error(f"Error getting mood logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood logs")


@router.get("/mood/{mood_log_id}", response_model=MoodLog)
async def get_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_id: UUID
):
    """Get a specific mood log by ID."""
    try:
        mood_log_entry = mood_log.get(db, id=str(mood_log_id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")
        return mood_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood log")


@router.put("/mood/{mood_log_id}", response_model=MoodLog)
async def update_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_id: UUID,
    mood_log_in: MoodLogUpdate
):
    """Update a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(mood_log_id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")
        
        updated_log = mood_log.update(
            db, db_obj=mood_log_entry, obj_in=mood_log_in
        )
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update mood log")


@router.delete("/mood/{mood_log_id}")
async def delete_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mood_log_id: UUID
):
    """Delete a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(mood_log_id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")
        
        mood_log.remove(db, id=str(mood_log_id))
        return {"message": "Mood log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete mood log")


# Daily summary endpoint (alias for analytics/daily)
@router.get("/daily-summary")
async def get_daily_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's daily summary (alias for analytics/daily)."""
    return await get_daily_analytics(db=db, current_user=current_user)


# Analytics endpoints
@router.get("/analytics/daily")
async def get_daily_analytics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's comprehensive analytics summary."""
    try:
        # Use UTC timezone for consistent date calculation
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        end_of_day = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
        
        # Get today's logs
        fitness_logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        nutrition_logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        mood_logs = mood_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        # Calculate fitness metrics
        total_calories_burned = sum(log.calories_burned or 0 for log in fitness_logs)
        fitness_activities = len(fitness_logs)
        
        # Calculate nutrition metrics
        total_calories_consumed = sum(log.calories or 0 for log in nutrition_logs)
        total_protein_g = sum(log.protein_g or 0 for log in nutrition_logs)
        total_carbs_g = sum(log.carbs_g or 0 for log in nutrition_logs)
        total_fat_g = sum(log.fat_g or 0 for log in nutrition_logs)
        water_intake_ml = sum(log.water_ml or 0 for log in nutrition_logs)
        meals_logged = len(nutrition_logs)
        
        # Calculate mood metrics
        avg_mood = sum(log.mood_score or 0 for log in mood_logs) / len(mood_logs) if mood_logs else 0
        avg_energy = sum(log.energy_level or 0 for log in mood_logs) / len(mood_logs) if mood_logs else 0
        
        # Calculate net calories
        net_calories = total_calories_consumed - total_calories_burned
        
        # Mock data for missing fields (these would come from other sources in a real app)
        total_steps = 8500  # Would come from fitness tracker
        total_sleep_hours = 7.5  # Would come from sleep tracker
        
        return {
            "date": today.isoformat(),
            "total_calories_burned": total_calories_burned,
            "total_calories_consumed": total_calories_consumed,
            "net_calories": net_calories,
            "total_protein_g": total_protein_g,
            "total_carbs_g": total_carbs_g,
            "total_fat_g": total_fat_g,
            "average_mood": round(avg_mood, 1),
            "average_energy": round(avg_energy, 1),
            "total_sleep_hours": total_sleep_hours,
            "total_steps": total_steps,
            "water_intake_ml": water_intake_ml,
            "fitness_activities": fitness_activities,
            "meals_logged": meals_logged
        }
    except Exception as e:
        logger.error(f"Error getting daily analytics: {str(e)}")
        return {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "total_calories_burned": 0,
            "total_calories_consumed": 0,
            "net_calories": 0,
            "total_protein_g": 0,
            "total_carbs_g": 0,
            "total_fat_g": 0,
            "average_mood": 0,
            "average_energy": 0,
            "total_sleep_hours": 0,
            "total_steps": 0,
            "water_intake_ml": 0,
            "fitness_activities": 0,
            "meals_logged": 0
        }


@router.get("/analytics/weekly")
async def get_weekly_analytics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get this week's comprehensive analytics summary."""
    try:
        # Use UTC timezone for consistent date calculation
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        start_of_week = datetime.combine(week_start, datetime.min.time(), tzinfo=timezone.utc)
        end_of_week = datetime.combine(week_end, datetime.max.time(), tzinfo=timezone.utc)
        
        # Get this week's logs
        fitness_logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        nutrition_logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        mood_logs = mood_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        # Calculate fitness metrics
        total_workouts = len(fitness_logs)
        total_calories_burned = sum(log.calories_burned or 0 for log in fitness_logs)
        total_workout_minutes = sum(log.duration_minutes or 0 for log in fitness_logs)
        avg_calories_per_workout = total_calories_burned / total_workouts if total_workouts > 0 else 0
        
        # Calculate nutrition metrics
        total_calories_consumed = sum(log.calories or 0 for log in nutrition_logs)
        total_protein_g = sum(log.protein_g or 0 for log in nutrition_logs)
        total_carbs_g = sum(log.carbs_g or 0 for log in nutrition_logs)
        total_fat_g = sum(log.fat_g or 0 for log in nutrition_logs)
        total_water_ml = sum(log.water_ml or 0 for log in nutrition_logs)
        total_meals = len(nutrition_logs)
        
        # Calculate mood metrics
        avg_mood = sum(log.mood_score or 0 for log in mood_logs) / len(mood_logs) if mood_logs else 0
        avg_energy = sum(log.energy_level or 0 for log in mood_logs) / len(mood_logs) if mood_logs else 0
        avg_stress = sum(log.stress_level or 0 for log in mood_logs) / len(mood_logs) if mood_logs else 0
        
        # Calculate net calories
        net_calories = total_calories_consumed - total_calories_burned
        
        # Mock data for missing fields
        total_steps = 59500  # Would come from fitness tracker
        avg_sleep_hours = 7.2  # Would come from sleep tracker
        average_water_intake_ml = total_water_ml / 7  # Average per day
        
        return {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "total_workouts": total_workouts,
            "total_calories_burned": total_calories_burned,
            "total_calories_consumed": total_calories_consumed,
            "net_calories": net_calories,
            "total_protein_g": total_protein_g,
            "total_carbs_g": total_carbs_g,
            "total_fat_g": total_fat_g,
            "average_mood": round(avg_mood, 1),
            "average_energy": round(avg_energy, 1),
            "average_stress": round(avg_stress, 1),
            "total_workout_minutes": total_workout_minutes,
            "avg_calories_per_workout": round(avg_calories_per_workout, 1),
            "total_steps": total_steps,
            "avg_sleep_hours": avg_sleep_hours,
            "total_water_ml": total_water_ml,
            "average_water_intake_ml": round(average_water_intake_ml, 1),
            "total_meals": total_meals
        }
    except Exception as e:
        logger.error(f"Error getting weekly analytics: {str(e)}")
        return {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "total_workouts": 0,
            "total_calories_burned": 0,
            "total_calories_consumed": 0,
            "net_calories": 0,
            "total_protein_g": 0,
            "total_carbs_g": 0,
            "total_fat_g": 0,
            "average_mood": 0,
            "average_energy": 0,
            "average_stress": 0,
            "total_workout_minutes": 0,
            "avg_calories_per_workout": 0,
            "total_steps": 0,
            "avg_sleep_hours": 0,
            "total_water_ml": 0,
            "average_water_intake_ml": 0,
            "total_meals": 0
        }


@router.get("/insights")
async def get_insights(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-generated insights based on user's health data."""
    try:
        # This would typically call an AI service to generate insights
        # For now, we'll return some mock insights based on recent data
        
        # Get recent data for insights
        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        week_start = today - timedelta(days=7)
        
        start_of_week = datetime.combine(week_start, datetime.min.time(), tzinfo=timezone.utc)
        end_of_week = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
        
        # Get recent logs
        fitness_logs = fitness_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        nutrition_logs = nutrition_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        mood_logs = mood_log.get_user_logs(
            db, 
            user_id=current_user.id,
            start_date=start_of_week,
            end_date=end_of_week
        )
        
        # Generate basic insights
        insights = []
        
        # Fitness insights
        if len(fitness_logs) > 0:
            avg_workout_duration = sum(log.duration_minutes or 0 for log in fitness_logs) / len(fitness_logs)
            if avg_workout_duration > 45:
                insights.append({
                    "type": "fitness",
                    "title": "Great Workout Consistency!",
                    "message": f"You've been averaging {avg_workout_duration:.0f} minutes per workout this week. Keep up the excellent work!",
                    "priority": "positive"
                })
            elif len(fitness_logs) < 3:
                insights.append({
                    "type": "fitness",
                    "title": "Time to Get Moving!",
                    "message": "You've only logged " + str(len(fitness_logs)) + " workouts this week. Try to aim for at least 3-4 sessions.",
                    "priority": "warning"
                })
        
        # Nutrition insights
        if len(nutrition_logs) > 0:
            avg_calories = sum(log.calories or 0 for log in nutrition_logs) / len(nutrition_logs)
            if avg_calories > 2000:
                insights.append({
                    "type": "nutrition",
                    "title": "Balanced Nutrition",
                    "message": f"Your average daily calorie intake of {avg_calories:.0f} calories looks well-balanced.",
                    "priority": "positive"
                })
        
        # Mood insights
        if len(mood_logs) > 0:
            avg_mood = sum(log.mood_score or 0 for log in mood_logs) / len(mood_logs)
            if avg_mood < 5:
                insights.append({
                    "type": "mood",
                    "title": "How Are You Feeling?",
                    "message": "Your mood scores have been lower recently. Consider some self-care activities or reach out to someone you trust.",
                    "priority": "concern"
                })
            elif avg_mood > 7:
                insights.append({
                    "type": "mood",
                    "title": "Great Mood!",
                    "message": "Your mood scores have been excellent lately. Whatever you're doing, keep it up!",
                    "priority": "positive"
                })
        
        # Default insight if no data
        if not insights:
            insights.append({
                "type": "general",
                "title": "Welcome to Health Tracking!",
                "message": "Start logging your fitness activities, meals, and mood to get personalized insights.",
                "priority": "info"
            })
        
        return insights
        
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return [{
            "type": "error",
            "title": "Unable to Load Insights",
            "message": "There was an error loading your insights. Please try again later.",
            "priority": "error"
        }]