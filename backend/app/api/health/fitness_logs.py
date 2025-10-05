"""
Refactored fitness logs endpoint using generic logging patterns.
This reduces code duplication while maintaining all existing functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import json

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.health.fitness_log import FitnessLog
from app.schemas.health.fitness_log import FitnessLog as FitnessLogSchema, FitnessLogCreate, FitnessLogUpdate
from app.crud.health.fitness_log import fitness_log
# from app.api.common.fitness_endpoints import fitness_endpoints  # Not used in this implementation

# Import our centralized utilities
from app.utils.date_helpers import DateRangeCalculator, DateValidator
from app.api.common.response_formatter import HealthLogResponseFormatter
from app.services.common.statistics import HealthStatisticsCalculator
from app.utils.timezone_handler import TimezoneHandler

router = APIRouter()

@router.get("/latest-exercise")
async def get_latest_workout_for_exercise(
    exercise_name: str = Query(..., description="Name of the exercise", min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest workout data for a specific exercise."""
    try:
        from sqlalchemy import text
        
        # Validate exercise name
        if not exercise_name or not exercise_name.strip():
            return {"message": "Exercise name is required"}
        
        exercise_name = exercise_name.strip()
        print(f"[BACKEND] Looking for exercise: '{exercise_name}' for user_id: {current_user.id}")
        
        # Query for the most recent fitness log containing this exact exercise
        # Use PostgreSQL JSONB operators to search for exact exercise name match
        query = text("""
            SELECT id, exercises, activity_date, created_at
            FROM fitness_logs 
            WHERE user_id = :user_id 
            AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(exercises) AS exercise
                WHERE exercise->>'exercise_name' ILIKE :exercise_name
            )
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        print(f"[BACKEND] Searching for exact exercise name: '{exercise_name}'")
        
        result = db.execute(query, {
            "user_id": current_user.id,
            "exercise_name": exercise_name
        })
        row = result.fetchone()
        
        print(f"[BACKEND] Query result: {row}")
        
        if not row:
            print(f"[BACKEND] No rows found for exercise: '{exercise_name}'")
            return {"message": "No previous workouts found for this exercise"}
        
        # Parse the exercises JSON to find the specific exercise
        try:
            exercises_data = json.loads(row.exercises) if isinstance(row.exercises, str) else row.exercises
            print(f"[BACKEND] Parsed exercises data: {exercises_data}")
            
            if isinstance(exercises_data, list) and exercises_data:
                # Find the exercise with matching name - normalize both names for comparison
                def normalize_exercise_name(name):
                    """Normalize exercise name for comparison"""
                    if not name:
                        return ""
                    # Convert to lowercase, remove extra spaces, and standardize hyphens
                    return name.lower().strip().replace('_', '-').replace(' ', '-')
                
                normalized_search_name = normalize_exercise_name(exercise_name)
                print(f"[BACKEND] Normalized search name: '{normalized_search_name}'")
                
                for exercise in exercises_data:
                    exercise_name_in_data = exercise.get('exercise_name', '')
                    normalized_data_name = normalize_exercise_name(exercise_name_in_data)
                    print(f"[BACKEND] Comparing '{normalized_data_name}' with '{normalized_search_name}'")
                    
                    if normalized_data_name == normalized_search_name:
                        result_data = {
                            "exercise_name": exercise.get('exercise_name'),
                            "sets": exercise.get('sets'),
                            "reps": exercise.get('reps'),
                            "weight_kg": exercise.get('weight_kg'),
                            "weight_used": exercise.get('weight_used'),  # Alternative weight field
                            "duration_minutes": exercise.get('duration_minutes'),
                            "distance": exercise.get('distance'),
                            "rest_time": exercise.get('rest_time'),
                            "notes": exercise.get('notes'),
                            "workout_date": row.activity_date.isoformat() if row.activity_date else None
                        }
                        print(f"[BACKEND] Found matching exercise: {result_data}")
                        return result_data
                        
            print(f"[BACKEND] No matching exercise found in data")
        except (json.JSONDecodeError, TypeError) as e:
            print(f"[BACKEND] Error parsing exercises data: {e}")
            pass
        
        return {"message": "No previous workouts found for this exercise"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get latest workout: {str(e)}")

@router.get("/exercise-logged-today")
async def check_exercise_logged_today(
    exercise_name: str = Query(..., description="Name of the exercise", min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a specific exercise was logged today."""
    try:
        from sqlalchemy import text
        from datetime import datetime, timezone
        
        # Validate exercise name
        if not exercise_name or not exercise_name.strip():
            return {"logged_today": False, "message": "Exercise name is required"}
        
        exercise_name = exercise_name.strip()
        
        # Get today's date range in user's timezone (assuming UTC for now)
        today = datetime.now(timezone.utc).date()
        start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        print(f"[BACKEND] Checking if exercise '{exercise_name}' was logged today for user_id: {current_user.id}")
        print(f"[BACKEND] Date range: {start_of_day} to {end_of_day}")
        
        # Query for today's fitness logs containing this exact exercise
        query = text("""
            SELECT id, exercises, activity_date, created_at
            FROM fitness_logs 
            WHERE user_id = :user_id 
            AND activity_date >= :start_date
            AND activity_date <= :end_date
            AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(exercises) AS exercise
                WHERE exercise->>'exercise_name' ILIKE :exercise_name
            )
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        result = db.execute(query, {
            "user_id": current_user.id,
            "exercise_name": exercise_name,
            "start_date": start_of_day,
            "end_date": end_of_day
        })
        row = result.fetchone()
        
        if not row:
            print(f"[BACKEND] Exercise '{exercise_name}' was NOT logged today")
            return {"logged_today": False, "message": "Exercise not logged today"}
        
        print(f"[BACKEND] Exercise '{exercise_name}' WAS logged today")
        return {"logged_today": True, "message": "Exercise was logged today"}
        
    except Exception as e:
        print(f"[BACKEND] Error checking if exercise was logged today: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check exercise status: {str(e)}")


# Removed duplicated timezone function - now using TimezoneHandler

# Note: Generic endpoints are available but not included to avoid conflicts
# Use fitness_endpoints.create_fitness_router() if you want to use the generic patterns

# Keep the debug endpoint as it's specific to this implementation
@router.get("/debug-exercises")
def debug_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to test fitness logs query"""
    try:
        from sqlalchemy import text
        
        # Simple query to get all logs for user
        query = text("SELECT COUNT(*) FROM fitness_logs WHERE user_id = :user_id")
        count = db.execute(query, {"user_id": current_user.id}).scalar()
        
        # Get a sample log
        sample_query = text("SELECT * FROM fitness_logs WHERE user_id = :user_id LIMIT 1")
        sample = db.execute(sample_query, {"user_id": current_user.id}).fetchone()
        
        return {
            "user_id": current_user.id,
            "total_logs": count,
            "sample_log": sample
        }
    except Exception as e:
        return {"error": str(e)}

# Keep the original complex endpoint for backward compatibility
@router.get("/", response_model=dict)
def get_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=100, description="Page size"),
    routine_id: Optional[str] = Query(None, description="Filter by routine ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    activity_type: Optional[str] = Query(None, description="Filter by activity type")
):
    """Get fitness logs with optional filtering and pagination."""
    print(f"🏋️ [FITNESS LOGS ENDPOINT] Called for user {current_user.id}")
    print(f"🏋️ [FITNESS LOGS ENDPOINT] Parameters: period={period}, page={page}, size={size}, start_date={start_date}, end_date={end_date}")
    
    try:
        # Use the generic endpoint logic
        # from app.api.common.fitness_endpoints import fitness_endpoints  # Not used
        
        # Parse date filters using centralized handler
        start_date_obj = TimezoneHandler.parse_date_string(start_date) if start_date else None
        end_date_obj = TimezoneHandler.parse_date_string(end_date) if end_date else None
        
        # If end_date is provided, set it to end of day
        if end_date_obj:
            end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Use period-based filtering if no custom dates
        if not start_date_obj and not end_date_obj:
            start_date_obj, end_date_obj = DateRangeCalculator.get_period_range(period)
        
        # Get logs using the CRUD
        skip = (page - 1) * size
        try:
            logs = fitness_log.get_user_logs(
                db,
                user_id=current_user.id,
                skip=skip,
                limit=size,
                start_date=start_date_obj,
                end_date=end_date_obj
            )
            pass
        except Exception as e:
            pass
            raise e
        
        # Apply activity_type filter if provided
        if activity_type:
            logs = [log for log in logs if log.activity_type == activity_type]
        
        # Get total count for pagination
        try:
            total_count = fitness_log.get_user_logs_count(
                db,
                user_id=current_user.id,
                start_date=start_date_obj,
                end_date=end_date_obj
            )
            pass
        except Exception as e:
            pass
            total_count = len(logs)  # Fallback to logs length
        
        # Calculate statistics using the centralized calculator
        all_logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )
        
        stats = HealthStatisticsCalculator.calculate_fitness_stats(all_logs)
        
        # Format response using centralized formatter
        logs_data = [HealthLogResponseFormatter.format_fitness_log_response(log) for log in logs]

        print(f"🏋️ [FITNESS LOGS ENDPOINT] Returning {len(logs_data)} logs")
        for i, log in enumerate(logs_data):
            print(f"🏋️ [FITNESS LOGS ENDPOINT] Log {i+1}: ID={log['id']}, Activity={log['workout_name']}, Date={log['activity_date']}")
        
        return {
            "logs": logs_data,
            "stats": stats,
            "pagination": {
                "page": page,
                "size": size,
                "total": total_count,
                "totalPages": (total_count + size - 1) // size
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve fitness logs")

# Add missing stats endpoint that mobile app expects
@router.get("/stats", response_model=dict)
def get_fitness_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = Query("week", description="Filter by period: week, month, all")
):
    """Get fitness statistics."""
    try:
        # Use TimezoneHandler for proper timezone handling
        user_timezone = current_user.timezone or "UTC"
        
        if period == "week":
            # Get week range using TimezoneHandler
            start_date, end_date = TimezoneHandler.get_user_week_range(user_timezone)
        elif period == "month":
            # Get month range using TimezoneHandler
            start_date, end_date = TimezoneHandler.get_user_month_range(user_timezone)
        else:
            # Use existing logic for all
            start_date, end_date = DateRangeCalculator.get_period_range(period)
        
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        stats = HealthStatisticsCalculator.calculate_fitness_stats(logs)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve fitness statistics")

# Add missing today endpoint that mobile app expects
@router.get("/today", response_model=List[dict])
def get_todays_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get today's fitness logs."""
    try:
        # Use TimezoneHandler for proper timezone handling
        user_timezone = current_user.timezone or "UTC"
        
        # Get today's date range in user's timezone
        start_of_day, end_of_day = TimezoneHandler.get_user_timezone_range(datetime.now(), user_timezone)
        
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        logs_data = [HealthLogResponseFormatter.format_fitness_log_response(log) for log in logs]
        
        return logs_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve today's fitness logs")

# Add missing recent endpoint that mobile app expects
@router.get("/recent", response_model=List[dict])
def get_recent_fitness_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50, description="Number of recent logs")
):
    """Get recent fitness logs."""
    try:
        logs = fitness_log.get_recent_logs(db, user_id=current_user.id, limit=limit)
        
        logs_data = [HealthLogResponseFormatter.format_fitness_log_response(log) for log in logs]
        
        return logs_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve recent fitness logs")

# Keep the original create endpoint for backward compatibility
@router.post("/", response_model=dict)
def create_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_data: FitnessLogCreate
):
    """Create a new fitness log."""
    try:
        # Convert to dict and handle field mapping
        log_data_dict = log_data.model_dump()
        
        # Handle field name mapping from frontend
        if 'workout_name' in log_data_dict and log_data_dict['workout_name']:
            log_data_dict['activity_name'] = log_data_dict['workout_name']
        
        # Set default activity_date if not provided
        if not log_data_dict.get('activity_date'):
            log_data_dict['activity_date'] = datetime.now(timezone.utc)
        
        # Convert exercises to JSON string if it's a list
        if 'exercises' in log_data_dict and isinstance(log_data_dict['exercises'], list):
            log_data_dict['exercises'] = json.dumps(log_data_dict['exercises'])

        # Create a new schema instance with the processed data
        from app.schemas.health.fitness_log import FitnessLogCreate
        processed_log_data = FitnessLogCreate(**log_data_dict)
        
        log = fitness_log.create_with_user(db, obj_in=processed_log_data, user_id=current_user.id)

        return HealthLogResponseFormatter.format_fitness_log_response(log)
    except Exception as e:
        import traceback
        logger.error(f"Error creating fitness log: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create fitness log")

# Keep the original update endpoint for backward compatibility
@router.put("/{id}", response_model=dict)
def update_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str,
    log_data: FitnessLogUpdate
):
    """Update an existing fitness log."""
    log = fitness_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    try:
        # Convert exercises to JSON string if it's a list
        if hasattr(log_data, 'exercises') and isinstance(log_data.exercises, list):
            log_data.exercises = json.dumps(log_data.exercises)

        updated_log = fitness_log.update(db, db_obj=log, obj_in=log_data)

        return HealthLogResponseFormatter.format_fitness_log_response(updated_log)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update fitness log")

# Keep the original delete endpoint for backward compatibility
@router.delete("/{id}")
def delete_fitness_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: str
):
    """Delete a fitness log."""
    log = fitness_log.get(db, id=id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fitness log not found")

    try:
        fitness_log.remove(db, id=id)
        return {"message": "Fitness log deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete fitness log")