"""
Health logging API endpoints for fitness and nutrition data
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
# UUID import removed - using integer IDs

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
        # Use user's stored timezone if available, otherwise use timezone_offset parameter
        user_timezone = current_user.timezone or "UTC"
        
        if user_timezone != "UTC":
            # Use user's stored timezone
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            user_tz = timezone(timedelta(hours=offset_hours))
            now_user = datetime.now(user_tz)
            today = now_user.date()
            start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=user_tz)
            end_of_day = datetime.combine(today, datetime.max.time()).replace(tzinfo=user_tz)
        elif timezone_offset != 0:
            # Fallback to timezone_offset parameter
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
        # Note: intensity field doesn't exist in current FitnessLog model
        intensity_map = {'low': 3, 'medium': 6, 'high': 9}
        intensity_values = [intensity_map.get(getattr(log, 'intensity', None), 0) for log in logs if hasattr(log, 'intensity') and getattr(log, 'intensity', None)]
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
        # Use user's stored timezone for date calculation
        user_timezone = current_user.timezone or "UTC"
        
        if user_timezone != "UTC":
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            user_tz = timezone(timedelta(hours=offset_hours))
            now_user = datetime.now(user_tz)
            today = now_user.date()
            start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=user_tz)
            end_of_day = datetime.combine(today, datetime.max.time()).replace(tzinfo=user_tz)
        else:
            # Fallback to UTC timezone
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
        total_calories = sum(log.total_calories or 0 for log in logs)
        total_protein = sum(log.protein_g or 0 for log in logs)
        total_carbs = sum(log.carbs_g or 0 for log in logs)
        total_fat = sum(log.fat_g or 0 for log in logs)
        total_water = 0  # water_intake field doesn't exist in current model
        total_meals = len(logs)

        return {
            "total_calories": total_calories,
            "protein_g": total_protein,
            "carbs_g": total_carbs,
            "fat_g": total_fat,
            "water_ml": total_water,
            "meals_count": total_meals
        }
    except Exception as e:
        logger.error(f"Error getting nutrition today: {str(e)}")
        return {
            "total_calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "water_ml": 0,
            "meals_count": 0
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
        total_calories = sum(log.total_calories or 0 for log in logs)
        total_protein = sum(log.protein_g or 0 for log in logs)
        total_water = 0  # water_intake field doesn't exist in current model
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
    logger.info(f"🏋️ [FITNESS LOGGING] Received request from user {current_user.id}")
    logger.info(f"🏋️ [FITNESS LOGGING] Request data: {fitness_log_in.model_dump()}")
    
    try:
        # Handle timezone conversion for activity_date
        if fitness_log_in.activity_date:
            # Get user's timezone
            user_timezone = current_user.timezone or "UTC"
            logger.info(f"🏋️ [FITNESS LOGGING] User timezone: {user_timezone}")
            
            # If activity_date is naive (no timezone info), assume it's in user's timezone
            if fitness_log_in.activity_date.tzinfo is None:
                from app.utils.timezone_service import TimezoneService
                user_tz = TimezoneService.get_user_timezone(user_timezone)
                # Localize the datetime to user's timezone
                localized_date = user_tz.localize(fitness_log_in.activity_date)
                # Convert to UTC for storage
                fitness_log_in.activity_date = localized_date.astimezone(timezone.utc)
                logger.info(f"🏋️ [FITNESS LOGGING] Converted activity_date to UTC: {fitness_log_in.activity_date}")
            else:
                # If already timezone-aware, convert to UTC
                fitness_log_in.activity_date = fitness_log_in.activity_date.astimezone(timezone.utc)
                logger.info(f"🏋️ [FITNESS LOGGING] Converted activity_date to UTC: {fitness_log_in.activity_date}")
        else:
            # Set default activity_date to current time in UTC if not provided
            fitness_log_in.activity_date = datetime.now(timezone.utc)
            logger.info(f"🏋️ [FITNESS LOGGING] Set default activity_date to UTC: {fitness_log_in.activity_date}")
        
        fitness_log_entry = fitness_log.create_with_user(
            db, obj_in=fitness_log_in, user_id=current_user.id
        )
        logger.info(f"🏋️ [FITNESS LOGGING] Successfully created fitness log with ID: {fitness_log_entry.id}")
        logger.info(f"🏋️ [FITNESS LOGGING] Exercises field type: {type(fitness_log_entry.exercises)}")
        logger.info(f"🏋️ [FITNESS LOGGING] Exercises field value: {fitness_log_entry.exercises}")
        return fitness_log_entry
    except Exception as e:
        logger.error(f"🏋️ [FITNESS LOGGING] Error creating fitness log: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create fitness log")

@router.get("/fitness", response_model=List[FitnessLog])
async def get_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get fitness logs for the current user."""
    try:
        # Parse string dates to datetime objects
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            from app.utils.timezone_handler import TimezoneHandler
            # Parse date in user's timezone, then convert to UTC
            start_date_obj = TimezoneHandler.parse_date_string_in_user_timezone(start_date, current_user.timezone)
        
        if end_date:
            from app.utils.timezone_handler import TimezoneHandler
            # Parse date in user's timezone, then convert to UTC
            end_date_obj = TimezoneHandler.parse_date_string_in_user_timezone(end_date, current_user.timezone)
            # Set end_date to end of day in user's timezone
            if end_date_obj:
                end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date_obj,
            end_date=end_date_obj
        )
        
        # Convert the logs to match the Pydantic schema
        converted_logs = []
        for log in logs:
            # Handle exercises field - convert array to JSON string if needed
            exercises_str = log.exercises
            if isinstance(log.exercises, list):
                # Convert array to JSON string
                import json
                exercises_str = json.dumps(log.exercises)
            elif isinstance(log.exercises, str):
                # Already a string, validate it's proper JSON
                try:
                    import json
                    exercises_data = json.loads(log.exercises)
                    exercises_str = json.dumps(exercises_data)  # Re-serialize to ensure proper format
                except (json.JSONDecodeError, TypeError):
                    exercises_str = log.exercises  # Keep as is if not valid JSON
            else:
                # Handle None or other types
                exercises_str = None
            
            converted_log = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "activity_type": log.activity_type,
                "activity_name": log.activity_name,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "notes": log.notes,
                "activity_date": log.activity_date,
                "exercises": exercises_str,
                "unit": log.unit,
                "created_at": log.created_at,
                "updated_at": log.updated_at
            }
            converted_logs.append(converted_log)
        
        return converted_logs
    except Exception as e:
        logger.error(f"Error getting fitness logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get fitness logs")

@router.get("/fitness/{id}", response_model=FitnessLog)
async def get_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Get a specific fitness log by ID."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(id))
        if not fitness_log_entry or fitness_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Fitness log not found")
        return fitness_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get fitness log")

@router.put("/fitness/{id}", response_model=FitnessLog)
async def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int,
    fitness_log_in: FitnessLogUpdate
):
    """Update a fitness log entry."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(id))
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

@router.delete("/fitness/{id}")
async def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Delete a fitness log entry."""
    try:
        fitness_log_entry = fitness_log.get(db, id=str(id))
        if not fitness_log_entry or fitness_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Fitness log not found")

        fitness_log.remove(db, id=str(id))
        return {"message": "Fitness log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting fitness log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete fitness log")

# ============================================================================
# NUTRITION LOGGING CRUD ENDPOINTS
# ============================================================================

@router.post("/nutrition/test")
async def create_nutrition_log_test(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    meal_data: dict
):
    """Create a new nutrition log entry (test endpoint without auth)."""
    try:
        from datetime import datetime, timezone
        
        # Create nutrition log directly using the database model
        from app.models.health.fitness_log import NutritionLog as NutritionLogModel
        
        # Handle meal_date with timezone awareness
        meal_date = None
        if meal_data.get('meal_date'):
            try:
                # Parse the ISO string with timezone info
                meal_date = datetime.fromisoformat(meal_data['meal_date'].replace('Z', '+00:00'))
                # Ensure it's timezone-aware
                if meal_date.tzinfo is None:
                    meal_date = meal_date.replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                # Fallback to current time if parsing fails
                meal_date = datetime.now(timezone.utc)
        else:
            meal_date = datetime.now(timezone.utc)
        
        nutrition_log_entry = NutritionLogModel(
            user_id=current_user.id,  # Use authenticated user ID
            meal_type=meal_data.get('meal_type', 'lunch'),
            meal_name=meal_data.get('meal_name'),
            total_calories=meal_data.get('total_calories', 0),
            protein_g=meal_data.get('protein_g'),
            carbs_g=meal_data.get('carbs_g'),
            fat_g=meal_data.get('fat_g'),
            notes=meal_data.get('notes'),
            food_items=meal_data.get('food_items'),
            meal_date=meal_date
        )
        
        db.add(nutrition_log_entry)
        db.commit()
        db.refresh(nutrition_log_entry)
        
        return {"status": "success", "id": nutrition_log_entry.id}
    except Exception as e:
        logger.error(f"Error creating nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create nutrition log: {str(e)}")

@router.get("/nutrition/test")
async def get_nutrition_logs_test(
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("week", description="Filter by period: week, month, all"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size"),
    timezone_offset: int = Query(0, description="Timezone offset in minutes from UTC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get nutrition logs (test endpoint without auth)."""
    try:
        from datetime import datetime, timezone, timedelta
        from app.crud.health.fitness_log import nutrition_log
        
        print(f"🍽️ [BACKEND NUTRITION] Request received - start_date: {start_date}, end_date: {end_date}, timezone_offset: {timezone_offset}")
        
        # Create timezone-aware datetime objects
        user_tz = timezone(timedelta(minutes=timezone_offset))
        print(f"🍽️ [BACKEND NUTRITION] User timezone: {user_tz}")
        
        if start_date and end_date:
            # Parse dates - if they come with timezone info, use that; otherwise assume they're in user's timezone
            try:
                if 'T' in start_date:
                    # Parse ISO string and convert to user timezone
                    start_date_utc = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    start_date_local = start_date_utc.astimezone(user_tz)
                else:
                    start_date_local = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=user_tz)
            except ValueError:
                start_date_local = datetime.strptime(start_date.split('T')[0], "%Y-%m-%d").replace(tzinfo=user_tz)
                
            try:
                if 'T' in end_date:
                    # Parse ISO string and convert to user timezone
                    end_date_utc = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    end_date_local = end_date_utc.astimezone(user_tz)
                else:
                    end_date_local = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=user_tz)
            except ValueError:
                end_date_local = datetime.strptime(end_date.split('T')[0], "%Y-%m-%d").replace(tzinfo=user_tz)
            
            print(f"🍽️ [BACKEND NUTRITION] Local dates - start: {start_date_local}, end: {end_date_local}")
            
            # For database query, we need to find all logs that fall within the user's local date range
            # Convert start of day in user timezone to UTC
            start_date_obj = start_date_local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
            # Convert end of day in user timezone to UTC
            end_date_obj = end_date_local.replace(hour=23, minute=59, second=59, microsecond=999999).astimezone(timezone.utc)
            
            print(f"🍽️ [BACKEND NUTRITION] UTC dates - start: {start_date_obj}, end: {end_date_obj}")
        else:
            # Use period parameter with user's timezone
            now_local = datetime.now(user_tz)
            if period == "week":
                start_date_obj = (now_local - timedelta(days=7)).astimezone(timezone.utc)
                end_date_obj = now_local.astimezone(timezone.utc)
            elif period == "month":
                start_date_obj = (now_local - timedelta(days=30)).astimezone(timezone.utc)
                end_date_obj = now_local.astimezone(timezone.utc)
            else:  # "all"
                start_date_obj = (now_local - timedelta(days=365)).astimezone(timezone.utc)
                end_date_obj = now_local.astimezone(timezone.utc)
        
        # Get logs from database for the authenticated user
        print(f"🍽️ [BACKEND NUTRITION] Querying database for user_id={current_user.id}, start_date={start_date_obj}, end_date={end_date_obj}")
        
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,  # Use authenticated user ID
            start_date=start_date_obj,
            end_date=end_date_obj,
            skip=(page - 1) * size,
            limit=size
        )
        
        print(f"🍽️ [BACKEND NUTRITION] Found {len(logs)} logs from database")
        
        # Format logs for response
        logs_data = []
        for i, log in enumerate(logs):
            print(f"🍽️ [BACKEND NUTRITION] Log {i+1}: id={log.id}, meal_name={log.meal_name}, meal_date={log.meal_date}, created_at={log.created_at}")
            # Parse food_items if it's a JSON string
            food_items = log.food_items
            if isinstance(food_items, str):
                try:
                    import json
                    food_items = json.loads(food_items)
                except (json.JSONDecodeError, TypeError):
                    food_items = []
            elif food_items is None:
                food_items = []
            
            logs_data.append({
                "id": str(log.id),
                "user_id": str(log.user_id) if hasattr(log, 'user_id') else "13",
                "meal_type": log.meal_type,
                "meal_name": log.meal_name,
                "total_calories": log.total_calories,
                "protein_g": log.protein_g,
                "carbs_g": log.carbs_g,
                "fat_g": log.fat_g,
                "fiber_g": getattr(log, 'fiber_g', None),
                "sugar_g": getattr(log, 'sugar_g', None),
                "sodium_mg": getattr(log, 'sodium_mg', None),
                "notes": log.notes,
                "meal_date": log.meal_date.isoformat() if log.meal_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "updated_at": log.updated_at.isoformat() if hasattr(log, 'updated_at') and log.updated_at else None,
                "food_items": food_items
            })
        
        response_data = {
            "logs": logs_data,
            "count": len(logs_data),
            "page": page,
            "size": size
        }
        
        print(f"🍽️ [BACKEND NUTRITION] Returning response with {len(logs_data)} logs")
        print(f"🍽️ [BACKEND NUTRITION] Response data: {response_data}")
        
        return response_data
    except Exception as e:
        logger.error(f"Error getting nutrition logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition logs: {str(e)}")

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
        # IDs are now integers, no conversion needed
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
    end_date: Optional[datetime] = None,
    timezone_offset: int = Query(0, description="Timezone offset in minutes from UTC")
):
    """Get nutrition logs for the current user."""
    try:
        from datetime import timezone, timedelta
        
        # Handle timezone conversion if dates are provided
        if start_date and end_date:
            user_tz = timezone(timedelta(minutes=timezone_offset))
            # Convert dates to UTC for database query
            start_date_utc = start_date.astimezone(timezone.utc) if start_date.tzinfo else start_date.replace(tzinfo=user_tz).astimezone(timezone.utc)
            end_date_utc = end_date.astimezone(timezone.utc) if end_date.tzinfo else end_date.replace(tzinfo=user_tz).astimezone(timezone.utc)
        else:
            start_date_utc = start_date
            end_date_utc = end_date
            
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date_utc,
            end_date=end_date_utc
        )
        # Convert IDs to strings to match the schema
        for log in logs:
            log.id = str(log.id)
            log.user_id = str(log.user_id)
        return logs
    except Exception as e:
        logger.error(f"Error getting nutrition logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition logs")

@router.get("/nutrition/{id}", response_model=NutritionLog)
async def get_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Get a specific nutrition log by ID."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=id)
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")
        # IDs are now integers, no conversion needed
        return nutrition_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get nutrition log")

@router.put("/nutrition/{id}", response_model=NutritionLog)
async def update_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int,
    nutrition_log_in: NutritionLogUpdate
):
    """Update a nutrition log entry."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=id)
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")

        updated_log = nutrition_log.update(
            db, db_obj=nutrition_log_entry, obj_in=nutrition_log_in
        )
        # Convert IDs to strings to match the schema
        updated_log.id = str(updated_log.id)
        updated_log.user_id = str(updated_log.user_id)
        return updated_log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating nutrition log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update nutrition log")

@router.delete("/nutrition/{id}")
async def delete_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Delete a nutrition log entry."""
    try:
        nutrition_log_entry = nutrition_log.get(db, id=id)
        if not nutrition_log_entry or nutrition_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Nutrition log not found")

        nutrition_log.remove(db, id=str(id))
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

@router.get("/mood/{id}", response_model=MoodLog)
async def get_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Get a specific mood log by ID."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")
        return mood_log_entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mood log")

@router.put("/mood/{id}", response_model=MoodLog)
async def update_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int,
    mood_log_in: MoodLogUpdate
):
    """Update a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
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

@router.delete("/mood/{id}")
async def delete_mood_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Delete a mood log entry."""
    try:
        mood_log_entry = mood_log.get(db, id=str(id))
        if not mood_log_entry or mood_log_entry.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Mood log not found")

        mood_log.remove(db, id=str(id))
        return {"message": "Mood log deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mood log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete mood log")

# Daily summary endpoint (alias for analytics/daily)
@router.get("/analytics/daily-summary")
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
        # TODO: Integrate with actual fitness tracker API (Google Fit, Apple Health, etc.)
        total_steps = 0  # Would come from fitness tracker - currently no integration
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
