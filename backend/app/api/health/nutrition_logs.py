from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.health.fitness_log import NutritionLog
from app.schemas.health.fitness_log import NutritionLog as NutritionLogSchema, NutritionLogCreate, NutritionLogUpdate
from app.crud.health.fitness_log import nutrition_log

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
        # Calculate date range based on period
        end_date_obj = datetime.now()
        if period == "week":
            start_date_obj = end_date_obj - timedelta(days=7)
        elif period == "month":
            start_date_obj = end_date_obj - timedelta(days=30)
        else:  # all
            start_date_obj = None

        # Override with custom dates if provided
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date)
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date)

        # Get logs from database
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            skip=(page - 1) * size,
            limit=size
        )

        # Calculate statistics
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

        total_meals = len(all_logs)
        total_calories = sum(log.total_calories or 0 for log in all_logs)
        total_protein = sum(log.protein_g or 0 for log in all_logs)
        total_carbs = sum(log.carbs_g or 0 for log in all_logs)
        total_fat = sum(log.fat_g or 0 for log in all_logs)
        total_fiber = sum(log.fiber_g or 0 for log in all_logs)
        total_sugar = sum(log.sugar_g or 0 for log in all_logs)
        total_sodium = sum(log.sodium_mg or 0 for log in all_logs)

        # Calculate current streak
        current_streak = calculate_meal_streak(all_logs)

        # Calculate average calories per meal
        avg_calories_per_meal = total_calories / total_meals if total_meals > 0 else 0

        # Convert logs to response format
        logs_data = []
        for log in logs:
            # Parse food_items if it's a JSON string
            food_items = []
            if log.food_items:
                try:
                    if isinstance(log.food_items, str):
                        food_items = json.loads(log.food_items)
                    else:
                        food_items = log.food_items
                except (json.JSONDecodeError, TypeError):
                    food_items = []

            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": None,  # Not available in current model
                "routine_name": None,  # Not available in current model
                "meal_name": log.meal_name or log.meal_type,
                "meal_type": log.meal_type,
                "food_items": food_items,
                "total_calories": log.total_calories,
                "protein_g": log.protein_g,
                "carbs_g": log.carbs_g,
                "fat_g": log.fat_g,
                "fiber_g": log.fiber_g,
                "sugar_g": log.sugar_g,
                "sodium_mg": log.sodium_mg,
                "notes": log.notes,
                "mood_before": log.mood_before,
                "mood_after": log.mood_after,
                "logged_at": log.meal_date.isoformat() if log.meal_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

        return {
            "logs": logs_data,
            "stats": {
                "totalMeals": total_meals,
                "totalCalories": total_calories,
                "totalProtein": round(total_protein, 1),
                "totalCarbs": round(total_carbs, 1),
                "totalFat": round(total_fat, 1),
                "totalFiber": round(total_fiber, 1),
                "totalSugar": round(total_sugar, 1),
                "totalSodium": round(total_sodium, 1),
                "avgCaloriesPerMeal": round(avg_calories_per_meal, 1),
                "currentStreak": current_streak
            },
            "pagination": {
                "page": page,
                "size": size,
                "total": total_meals,
                "totalPages": (total_meals + size - 1) // size
            }
        }

    except Exception as e:
        print(f"Error getting nutrition logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve nutrition logs")

@router.get("/{log_id}", response_model=dict)
def get_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str
):
    """Get a specific nutrition log by ID."""
    log = nutrition_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    # Parse food_items if it's a JSON string
    food_items = []
    if log.food_items:
        try:
            if isinstance(log.food_items, str):
                food_items = json.loads(log.food_items)
            else:
                food_items = log.food_items
        except (json.JSONDecodeError, TypeError):
            food_items = []

    return {
        "id": str(log.id),
        "user_id": str(log.user_id),
        "routine_id": None,  # Not available in current model
        "routine_name": None,  # Not available in current model
        "meal_name": log.meal_name or log.meal_type,
        "meal_type": log.meal_type,
        "food_items": food_items,
        "total_calories": log.total_calories,
        "protein_g": log.protein_g,
        "carbs_g": log.carbs_g,
        "fat_g": log.fat_g,
        "fiber_g": log.fiber_g,
        "sugar_g": log.sugar_g,
        "sodium_mg": log.sodium_mg,
        "notes": log.notes,
        "mood_before": log.mood_before,
        "mood_after": log.mood_after,
        "logged_at": log.meal_date.isoformat() if log.meal_date else None,
        "created_at": log.created_at.isoformat() if log.created_at else None
    }

@router.post("/", response_model=dict)
def create_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_data: NutritionLogCreate
):
    """Create a new nutrition log."""
    try:
        # Convert to dict and handle field mapping
        log_data_dict = log_data.model_dump()
        
        # Set default meal_date if not provided
        if not log_data_dict.get('meal_date'):
            from datetime import datetime
            log_data_dict['meal_date'] = datetime.now()
        
        # Convert food_items to JSON string if it's a list
        if 'food_items' in log_data_dict and isinstance(log_data_dict['food_items'], list):
            log_data_dict['food_items'] = json.dumps(log_data_dict['food_items'])

        # Create a new schema instance with the processed data
        from app.schemas.health.nutrition_log import NutritionLogCreate
        processed_log_data = NutritionLogCreate(**log_data_dict)
        
        log = nutrition_log.create_with_user(db, obj_in=processed_log_data, user_id=current_user.id)

        # Parse food_items for response
        food_items = []
        if log.food_items:
            try:
                if isinstance(log.food_items, str):
                    food_items = json.loads(log.food_items)
                else:
                    food_items = log.food_items
            except (json.JSONDecodeError, TypeError):
                food_items = []

        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "routine_id": None,  # Not available in current model
            "routine_name": None,  # Not available in current model
            "meal_name": log.meal_name or log.meal_type,
            "meal_type": log.meal_type,
            "food_items": food_items,
            "total_calories": log.total_calories,
            "protein_g": log.protein_g,
            "carbs_g": log.carbs_g,
            "fat_g": log.fat_g,
            "fiber_g": log.fiber_g,
            "sugar_g": log.sugar_g,
            "sodium_mg": log.sodium_mg,
            "notes": log.notes,
            "mood_before": log.mood_before,
            "mood_after": log.mood_after,
            "logged_at": log.meal_date.isoformat() if log.meal_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
    except Exception as e:
        print(f"Error creating nutrition log: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create nutrition log")

@router.put("/{log_id}", response_model=dict)
def update_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str,
    log_data: NutritionLogUpdate
):
    """Update an existing nutrition log."""
    log = nutrition_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    try:
        # Convert food_items to JSON string if it's a list
        if hasattr(log_data, 'food_items') and isinstance(log_data.food_items, list):
            log_data.food_items = json.dumps(log_data.food_items)

        updated_log = nutrition_log.update(db, db_obj=log, obj_in=log_data)

        # Parse food_items for response
        food_items = []
        if updated_log.food_items:
            try:
                if isinstance(updated_log.food_items, str):
                    food_items = json.loads(updated_log.food_items)
                else:
                    food_items = updated_log.food_items
            except (json.JSONDecodeError, TypeError):
                food_items = []

        return {
            "id": str(updated_log.id),
            "user_id": str(updated_log.user_id),
            "routine_id": None,  # Not available in current model
            "routine_name": None,  # Not available in current model
            "meal_name": updated_log.meal_name or updated_log.meal_type,
            "meal_type": updated_log.meal_type,
            "food_items": food_items,
            "total_calories": updated_log.total_calories,
            "protein_g": updated_log.protein_g,
            "carbs_g": updated_log.carbs_g,
            "fat_g": updated_log.fat_g,
            "fiber_g": updated_log.fiber_g,
            "sugar_g": updated_log.sugar_g,
            "sodium_mg": updated_log.sodium_mg,
            "notes": updated_log.notes,
            "mood_before": updated_log.mood_before,
            "mood_after": updated_log.mood_after,
            "logged_at": updated_log.meal_date.isoformat() if updated_log.meal_date else None,
            "created_at": updated_log.created_at.isoformat() if updated_log.created_at else None
        }
    except Exception as e:
        print(f"Error updating nutrition log: {e}")
        raise HTTPException(status_code=500, detail="Failed to update nutrition log")

@router.delete("/{log_id}")
def delete_nutrition_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_id: str
):
    """Delete a nutrition log."""
    log = nutrition_log.get(db, id=log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    try:
        nutrition_log.remove(db, id=log_id)
        return {"message": "Nutrition log deleted successfully"}
    except Exception as e:
        print(f"Error deleting nutrition log: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete nutrition log")

@router.get("/stats", response_model=dict)
def get_nutrition_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all")
):
    """Get nutrition statistics."""
    try:
        # Calculate date range based on period
        end_date_obj = datetime.now()
        if period == "week":
            start_date_obj = end_date_obj - timedelta(days=7)
        elif period == "month":
            start_date_obj = end_date_obj - timedelta(days=30)
        else:  # all
            start_date_obj = None

        # Get logs from database
        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )

        total_meals = len(logs)
        total_calories = sum(log.total_calories or 0 for log in logs)
        total_protein = sum(log.protein_g or 0 for log in logs)
        total_carbs = sum(log.carbs_g or 0 for log in logs)
        total_fat = sum(log.fat_g or 0 for log in logs)
        total_fiber = sum(log.fiber_g or 0 for log in logs)
        total_sugar = sum(log.sugar_g or 0 for log in logs)
        total_sodium = sum(log.sodium_mg or 0 for log in logs)

        # Calculate current streak
        current_streak = calculate_meal_streak(logs)

        # Calculate average calories per meal
        avg_calories_per_meal = total_calories / total_meals if total_meals > 0 else 0

        return {
            "totalMeals": total_meals,
            "totalCalories": total_calories,
            "totalProtein": round(total_protein, 1),
            "totalCarbs": round(total_carbs, 1),
            "totalFat": round(total_fat, 1),
            "totalFiber": round(total_fiber, 1),
            "totalSugar": round(total_sugar, 1),
            "totalSodium": round(total_sodium, 1),
            "avgCaloriesPerMeal": round(avg_calories_per_meal, 1),
            "currentStreak": current_streak
        }

    except Exception as e:
        print(f"Error getting nutrition stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve nutrition statistics")

@router.get("/recent", response_model=List[dict])
def get_recent_meals(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent meals (last 7 days)."""
    try:
        end_date_obj = datetime.now()
        start_date_obj = end_date_obj - timedelta(days=7)

        logs = nutrition_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj,
            limit=10
        )

        logs_data = []
        for log in logs:
            # Parse food_items if it's a JSON string
            food_items = []
            if log.food_items:
                try:
                    if isinstance(log.food_items, str):
                        food_items = json.loads(log.food_items)
                    else:
                        food_items = log.food_items
                except (json.JSONDecodeError, TypeError):
                    food_items = []

            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": None,  # Not available in current model
                "routine_name": None,  # Not available in current model
                "meal_name": log.meal_name or log.meal_type,
                "meal_type": log.meal_type,
                "food_items": food_items,
                "total_calories": log.total_calories,
                "protein_g": log.protein_g,
                "carbs_g": log.carbs_g,
                "fat_g": log.fat_g,
                "fiber_g": log.fiber_g,
                "sugar_g": log.sugar_g,
                "sodium_mg": log.sodium_mg,
                "notes": log.notes,
                "mood_before": log.mood_before,
                "mood_after": log.mood_after,
                "logged_at": log.meal_date.isoformat() if log.meal_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

        return logs_data

    except Exception as e:
        print(f"Error getting recent meals: {e}")
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

        current_streak = calculate_meal_streak(logs)
        longest_streak = calculate_longest_meal_streak(logs)

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
        print(f"Error getting meal streak: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve meal streak")

def calculate_meal_streak(logs):
    """Calculate current meal streak in days."""
    if not logs:
        return 0

    # Sort logs by date (most recent first)
    sorted_logs = sorted(logs, key=lambda x: x.meal_date or x.created_at, reverse=True)

    streak = 0
    current_date = datetime.now().date()

    for log in sorted_logs:
        log_date = (log.meal_date or log.created_at).date()

        # If this is today or yesterday, continue the streak
        if log_date == current_date or log_date == current_date - timedelta(days=1):
            streak += 1
            current_date = log_date
        else:
            break

    return streak

def calculate_longest_meal_streak(logs):
    """Calculate the longest meal streak."""
    if not logs:
        return 0

    # Sort logs by date
    sorted_logs = sorted(logs, key=lambda x: x.meal_date or x.created_at)

    longest_streak = 0
    current_streak = 0
    last_date = None

    for log in sorted_logs:
        log_date = (log.meal_date or log.created_at).date()

        if last_date is None:
            current_streak = 1
        elif log_date == last_date + timedelta(days=1):
            current_streak += 1
        else:
            longest_streak = max(longest_streak, current_streak)
            current_streak = 1

        last_date = log_date

    return max(longest_streak, current_streak)
