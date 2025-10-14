"""
Fitness Logging API endpoints - Focused on fitness activities and workouts.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.fitness_log import fitness_log
from app.schemas.health.fitness_log import FitnessLog, FitnessLogCreate, FitnessLogUpdate
from app.utils.timezone_utils import TimezoneUtils
from app.utils.response_utils import ResponseUtils
import logging

logger = logging.getLogger(__name__)

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
        # Use existing timezone utilities
        user_timezone = current_user.timezone or "UTC"
        if timezone_offset != 0:
            # Use timezone_offset parameter
            start_of_day, end_of_day = TimezoneUtils.get_user_timezone_range(
                datetime.now(), user_offset_minutes=timezone_offset
            )
        else:
            # Use user's stored timezone
            start_of_day, end_of_day = TimezoneUtils.get_user_timezone_range(
                datetime.now(), user_timezone=user_timezone
            )

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
        # Use existing timezone utilities for week range
        if timezone_offset != 0:
            # Use timezone_offset parameter
            start_of_week, end_of_week = TimezoneUtils.get_week_range(
                datetime.now(), user_offset_minutes=timezone_offset
            )
        else:
            # Use user's stored timezone
            user_timezone = current_user.timezone or "UTC"
            start_of_week, end_of_week = TimezoneUtils.get_week_range(
                datetime.now(), user_timezone=user_timezone
            )

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
        current_date = datetime.now().date()
        week_start = current_date - datetime.timedelta(days=current_date.weekday())
        while current_date >= week_start:
            day_logs = [log for log in logs if log.activity_date.date() == current_date]
            if day_logs:
                streak += 1
                current_date -= datetime.timedelta(days=1)
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
            # Set end_date to end of day by adding 24 hours to start of day
            if end_date_obj:
                end_date_obj = end_date_obj + datetime.timedelta(days=1) - datetime.timedelta(microseconds=1)
        
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            start_date=start_date_obj,
            end_date=end_date_obj
        )
        
        # Use response utilities for consistent formatting
        return ResponseUtils.convert_logs_to_response(logs, "fitness")
    except Exception as e:
        raise ResponseUtils.handle_database_error(e, "get fitness logs")

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
        raise ResponseUtils.handle_database_error(e, "get fitness log")

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
        raise ResponseUtils.handle_database_error(e, "update fitness log")

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
        raise ResponseUtils.handle_database_error(e, "delete fitness log")
