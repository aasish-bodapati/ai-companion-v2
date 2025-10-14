"""
Nutrition Logging API endpoints - Focused on meal tracking and nutrition data.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.fitness_log import nutrition_log
from app.schemas.health.fitness_log import NutritionLog, NutritionLogCreate, NutritionLogUpdate
from app.utils.timezone_utils import TimezoneUtils
from app.utils.response_utils import ResponseUtils
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/nutrition/today")
async def get_nutrition_today(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's nutrition summary."""
    try:
        # Use existing timezone utilities
        user_timezone = current_user.timezone or "UTC"
        start_of_day, end_of_day = TimezoneUtils.get_user_timezone_range(
            datetime.now(), user_timezone=user_timezone
        )

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
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=6)

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
