"""
Refactored nutrition logs endpoint using stable fitness patterns.
This applies the same utility classes and patterns that make the fitness backend stable.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import json
import pytz

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.health.fitness_log import NutritionLog
from app.schemas.health.fitness_log import NutritionLog as NutritionLogSchema, NutritionLogCreate, NutritionLogUpdate
from app.crud.health.fitness_log import nutrition_log

# Import our stable utilities (same as fitness)
from app.utils.date_helpers import DateRangeCalculator, DateValidator
from app.api.common.response_formatters import LoggingResponseFormatter
from app.services.common.statistics import HealthStatisticsCalculator

router = APIRouter()

@router.get("/", response_model=dict)
def get_nutrition_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size"),
    routine_id: Optional[str] = Query(None, description="Filter by routine ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type")
):
    """Get nutrition logs with optional filtering and pagination."""
    
    try:
        # Get user timezone
        user_timezone = current_user.timezone or "UTC"
        
        # Use stable date utilities (same as fitness)
        custom_start = None
        custom_end = None
        
        if start_date:
            custom_start = DateValidator.parse_date_string(start_date)
            if not custom_start:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
            # Convert to timezone-aware datetime in user's timezone
            from app.utils.timezone_service import TimezoneService
            user_tz = TimezoneService.get_user_timezone(user_timezone)
            custom_start = user_tz.localize(custom_start)
        
        if end_date:
            custom_end = DateValidator.parse_date_string(end_date)
            if not custom_end:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
            # Convert to timezone-aware datetime in user's timezone
            from app.utils.timezone_service import TimezoneService
            user_tz = TimezoneService.get_user_timezone(user_timezone)
            custom_end = user_tz.localize(custom_end)
        
        # If both start_date and end_date are provided, treat as custom period
        if custom_start and custom_end:
            period = "custom"
            # For single-day queries, set end_date to end of day
            if custom_start.date() == custom_end.date():
                custom_end = custom_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Convert to UTC for database queries
            custom_start = custom_start.astimezone(pytz.UTC)
            custom_end = custom_end.astimezone(pytz.UTC)
        
        print(f"🔍 [NUTRITION LOGS] Date filtering - period: {period}, custom_start: {custom_start}, custom_end: {custom_end}")
        
        start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(
            period, custom_start, custom_end
        )
        
        print(f"🔍 [NUTRITION LOGS] Date range - start: {start_date_obj}, end: {end_date_obj}")

        # Get logs from database
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            skip=(page - 1) * size,
            limit=size
        )
        

        # Calculate statistics using stable utilities (same as fitness)
        all_logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )

        # Apply meal type filter if specified
        if meal_type and meal_type != 'all':
            all_logs = [log for log in all_logs if log.meal_type == meal_type]
            logs = [log for log in logs if log.meal_type == meal_type]

        # Use stable statistics calculator (same as fitness)
        stats = HealthStatisticsCalculator.calculate_nutrition_stats(all_logs)

        # Convert logs to response format using stable formatter (same as fitness)
        logs_data = [LoggingResponseFormatter.format_nutrition_log(log) for log in logs]

        # Format pagination using stable formatter (same as fitness)
        pagination = LoggingResponseFormatter.format_pagination_response(
            page, size, len(all_logs)
        )

        return LoggingResponseFormatter.format_logs_response(
            logs_data, stats, pagination, "logs"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to retrieve nutrition logs")

@router.get("/stats", response_model=dict)
@router.get("/stats/", response_model=dict)  # Handle trailing slash
def get_nutrition_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all")
):
    """Get nutrition statistics."""
    
    try:
        print(f"🔍 [NUTRITION STATS] Starting nutrition stats calculation for user {current_user.id}, period: {period}")
        
        # Use user's timezone for date calculation
        user_timezone = current_user.timezone or "UTC"
        print(f"🔍 [NUTRITION STATS] User timezone: {user_timezone}")
        
        if period == "week":
            print(f"🔍 [NUTRITION STATS] Calculating week range...")
            # Get current week range in user's timezone
            now_utc = datetime.now(timezone.utc)
            offset_hours = {
                "UTC": 0, "Asia/Kolkata": 5.5, "America/New_York": -5, 
                "America/Los_Angeles": -8, "Europe/London": 0, 
                "Asia/Tokyo": 9, "Australia/Sydney": 10
            }.get(user_timezone, 0)
            
            user_tz = timezone(timedelta(hours=offset_hours))
            now_user = now_utc.astimezone(user_tz)
            
            # Get start of week (Monday) in user's timezone
            week_start = now_user - timedelta(days=now_user.weekday())
            week_start = datetime.combine(week_start.date(), datetime.min.time()).replace(tzinfo=user_tz)
            week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
            
            # Convert to UTC
            start_date_obj = week_start.astimezone(timezone.utc)
            end_date_obj = week_end.astimezone(timezone.utc)
            print(f"🔍 [NUTRITION STATS] Week range: {start_date_obj} to {end_date_obj}")
        else:
            print(f"🔍 [NUTRITION STATS] Using DateRangeCalculator for period: {period}")
            # Use existing logic for month/all
            start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(period)
            print(f"🔍 [NUTRITION STATS] Period range: {start_date_obj} to {end_date_obj}")

        print(f"🔍 [NUTRITION STATS] Fetching logs from database...")
        # Get logs from database
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )
        print(f"🔍 [NUTRITION STATS] Retrieved {len(logs)} logs")

        print(f"🔍 [NUTRITION STATS] Calculating statistics...")
        # Use stable statistics calculator (same as fitness)
        stats = HealthStatisticsCalculator.calculate_nutrition_stats(logs)
        print(f"🔍 [NUTRITION STATS] Calculated stats: {stats}")

        print(f"🔍 [NUTRITION STATS] Formatting response...")
        formatted_stats = LoggingResponseFormatter.format_stats_response(stats)
        print(f"🔍 [NUTRITION STATS] Formatted stats: {formatted_stats}")

        return formatted_stats

    except Exception as e:
        print(f"❌ [NUTRITION STATS] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve nutrition statistics: {str(e)}")

@router.get("/{id}", response_model=dict)
def get_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Get a specific nutrition log by ID."""
    log = nutrition_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    return LoggingResponseFormatter.format_nutrition_log(log)

@router.post("/", response_model=dict)
def create_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_data: NutritionLogCreate
):
    """Create a new nutrition log."""
    try:
        # Convert to dict and handle field mapping (same pattern as fitness)
        log_data_dict = log_data.model_dump()
        
        # Handle field name mapping from frontend
        if 'meal_name' in log_data_dict and log_data_dict['meal_name']:
            log_data_dict['meal_name'] = log_data_dict['meal_name']
        
        # Set default meal_date if not provided
        if not log_data_dict.get('meal_date'):
            log_data_dict['meal_date'] = datetime.now()
        
        # Convert food_items to JSON string if it's a list
        if 'food_items' in log_data_dict and isinstance(log_data_dict['food_items'], list):
            log_data_dict['food_items'] = json.dumps(log_data_dict['food_items'])

        # Create a new schema instance with the processed data
        from app.schemas.health.fitness_log import NutritionLogCreate
        processed_log_data = NutritionLogCreate(**log_data_dict)
        
        log = nutrition_log.create_with_user(db, obj_in=processed_log_data, user_id=current_user.id)

        return LoggingResponseFormatter.format_nutrition_log(log)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create nutrition log")

@router.put("/{id}", response_model=dict)
def update_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    log_data: NutritionLogUpdate
):
    """Update an existing nutrition log."""
    log = nutrition_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    try:
        # Convert food_items to JSON string if it's a list
        if hasattr(log_data, 'food_items') and isinstance(log_data.food_items, list):
            log_data.food_items = json.dumps(log_data.food_items)

        updated_log = nutrition_log.update(db, db_obj=log, obj_in=log_data)

        return LoggingResponseFormatter.format_nutrition_log(updated_log)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update nutrition log")

@router.delete("/{id}")
def delete_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Delete a nutrition log."""
    log = nutrition_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    try:
        nutrition_log.remove(db, id=id)
        return {"message": "Nutrition log deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete nutrition log")

@router.get("/today", response_model=List[dict])
def get_todays_nutrition_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's nutrition logs."""
    try:
        # Simple approach - just return empty array for now
        return []

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve today's nutrition logs: {str(e)}")

@router.get("/recent", response_model=List[dict])
def get_recent_meals(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent meals (last 7 days)."""
    try:
        # Use stable date utilities (same as fitness)
        start_date_obj, end_date_obj = DateRangeCalculator.get_period_range("week")

        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            limit=10
        )

        # Use stable response formatter (same as fitness)
        return [LoggingResponseFormatter.format_nutrition_log(log) for log in logs]

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve recent meals")

@router.get("/streak", response_model=dict)
def get_meal_streak(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meal streak information."""
    try:
        # Get all logs for streak calculation
        logs = nutrition_log.get_user_logs(db, user_id=current_user.id)

        # Use stable streak calculator (same as fitness)
        from app.utils.date_helpers import StreakCalculator
        current_streak = StreakCalculator.calculate_streak(logs, "meal_date")
        longest_streak = StreakCalculator.calculate_longest_streak(logs, "meal_date")

        # Get last meal date
        last_meal_date = None
        if logs:
            last_log = max(logs, key=lambda x: x.meal_date or x.created_at)
            last_meal_date = (last_log.meal_date or last_log.created_at).isoformat()

        return {
            "currentStreak": current_streak,
            "longestStreak": longest_streak,
            "lastMealDate": last_meal_date
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve meal streak")

@router.put("/food-items/{food_item_id}", response_model=dict)
def update_food_item_quantity(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    food_item_id: int,
    quantity_grams: float
):
    """Update the quantity of a specific food item in a nutrition log."""
    
    try:
        # Find the nutrition log that contains this food item
        logs = nutrition_log.get_by_user(db, user_id=current_user.id)
        target_log = None
        
        for log in logs:
            if log.food_items:
                try:
                    food_items = json.loads(log.food_items) if isinstance(log.food_items, str) else log.food_items
                    if any(item.get('id') == food_item_id for item in food_items):
                        target_log = log
                        break
                except (json.JSONDecodeError, TypeError):
                    continue
        
        if not target_log:
            raise HTTPException(status_code=404, detail="Food item not found")
        
        # Update the food item quantity
        food_items = json.loads(target_log.food_items) if isinstance(target_log.food_items, str) else target_log.food_items
        updated = False
        
        for item in food_items:
            if item.get('id') == food_item_id:
                # Update quantity and recalculate nutrition
                old_quantity = item.get('quantity_grams', 0)
                item['quantity_grams'] = quantity_grams
                
                # Recalculate nutrition based on new quantity
                if old_quantity > 0:
                    ratio = quantity_grams / old_quantity
                    item['calories'] = round(item.get('calories', 0) * ratio, 2)
                    item['protein_g'] = round(item.get('protein_g', 0) * ratio, 2)
                    item['carbs_g'] = round(item.get('carbs_g', 0) * ratio, 2)
                    item['fat_g'] = round(item.get('fat_g', 0) * ratio, 2)
                
                updated = True
                break
        
        if not updated:
            raise HTTPException(status_code=404, detail="Food item not found in log")
        
        # Recalculate total nutrition for the meal
        total_calories = sum(item.get('calories', 0) for item in food_items)
        total_protein = sum(item.get('protein_g', 0) for item in food_items)
        total_carbs = sum(item.get('carbs_g', 0) for item in food_items)
        total_fat = sum(item.get('fat_g', 0) for item in food_items)
        
        # Update the nutrition log
        update_data = {
            'food_items': json.dumps(food_items),
            'total_calories': total_calories,
            'protein_g': total_protein,
            'carbs_g': total_carbs,
            'fat_g': total_fat
        }
        
        nutrition_log.update(db, db_obj=target_log, obj_in=update_data)
        
        return {
            "success": True,
            "message": "Food item quantity updated successfully",
            "food_item_id": food_item_id,
            "new_quantity_grams": quantity_grams,
            "updated_nutrition": {
                "total_calories": total_calories,
                "protein_g": total_protein,
                "carbs_g": total_carbs,
                "fat_g": total_fat
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update food item quantity")