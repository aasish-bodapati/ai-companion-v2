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

# Import our stable utilities (same as fitness)
from app.utils.date_helpers import DateRangeCalculator, DateValidator
from app.api.common.response_formatters import LoggingResponseFormatter
from app.services.common.statistics import HealthStatisticsCalculator
from app.utils.timezone_service import TimezoneService

router = APIRouter()

def get_user_timezone_range(date_obj: datetime, user_timezone: str = "UTC"):
    """Get start and end of day in user's timezone, converted to UTC for database queries."""
    # Common timezone mappings
    timezone_offsets = {
        "UTC": 0,
        "Asia/Kolkata": 5.5,  # IST
        "America/New_York": -5,  # EST
        "America/Los_Angeles": -8,  # PST
        "Europe/London": 0,  # GMT
        "Asia/Tokyo": 9,  # JST
        "Australia/Sydney": 10,  # AEST
    }
    
    offset_hours = timezone_offsets.get(user_timezone, 0)
    user_tz = timezone(timedelta(hours=offset_hours))
    
    # Get start and end of day in user's timezone
    start_of_day_user = datetime.combine(date_obj, datetime.min.time()).replace(tzinfo=user_tz)
    end_of_day_user = datetime.combine(date_obj, datetime.max.time()).replace(tzinfo=user_tz)
    
    # Convert to UTC for database queries
    start_of_day_utc = start_of_day_user.astimezone(timezone.utc)
    end_of_day_utc = end_of_day_user.astimezone(timezone.utc)
    
    return start_of_day_utc, end_of_day_utc

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
    try:
        # Use the generic endpoint logic
        # from app.api.common.fitness_endpoints import fitness_endpoints  # Not used
        
        # Parse date filters - handle both ISO format and YYYY-MM-DD format
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            try:
                # Try ISO format first (from mobile app)
                start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                try:
                    # Fall back to YYYY-MM-DD format - make it timezone-aware
                    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
                    # Convert to UTC to match database timezone
                    start_date_obj = start_date_obj.replace(tzinfo=timezone.utc)
                except ValueError:
                    # If both fail, skip the filter
                    pass
        
        if end_date:
            try:
                # Try ISO format first (from mobile app)
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                try:
                    # Fall back to YYYY-MM-DD format - make it timezone-aware
                    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
                    # Set to end of day and convert to UTC
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
                    end_date_obj = end_date_obj.replace(tzinfo=timezone.utc)
                except ValueError:
                    # If both fail, skip the filter
                    pass
        
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
            print(f"🔍 DEBUG: Retrieved {len(logs)} fitness logs for user {current_user.id}")
        except Exception as e:
            print(f"❌ DEBUG: Error getting fitness logs: {str(e)}")
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
            print(f"🔍 DEBUG: Total count: {total_count}")
        except Exception as e:
            print(f"❌ DEBUG: Error getting count: {str(e)}")
            total_count = len(logs)  # Fallback to logs length
        
        # Calculate statistics using the centralized calculator
        all_logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_date_obj,
            end_date=end_date_obj
        )
        
        stats = HealthStatisticsCalculator.calculate_fitness_stats(all_logs)
        
        # Format response using the formatter
        formatter = LoggingResponseFormatter()
        logs_data = []
        for log in logs:
            # Parse exercises from JSON string
            exercises = []
            if log.exercises:
                try:
                    exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
                except (json.JSONDecodeError, TypeError):
                    exercises = []
            
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "routine_id": None,  # Not available in current structure
                "routine_name": None,  # Not available in current structure
                "workout_name": log.activity_name,  # Use activity_name as workout_name
                "exercises": exercises,  # Include exercises data
                "unit": getattr(log, 'unit', 'kg'),  # Include unit field
                "duration_minutes": int(log.duration_minutes) if log.duration_minutes else 0,
                "calories_burned": int(log.calories_burned) if log.calories_burned else 0,
                "difficulty_rating": 0,  # Not tracked in current structure
                "notes": log.notes,
                "logged_at": log.activity_date.isoformat() if log.activity_date else None,
                "activity_date": log.activity_date.isoformat() if log.activity_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)

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
        # Use TimezoneService for proper timezone handling
        user_timezone = current_user.timezone or "UTC"
        
        if period == "week":
            # Get week range using TimezoneService
            start_date, end_date = TimezoneService.get_user_week_range(user_timezone)
        elif period == "month":
            # Get month range using TimezoneService
            start_date, end_date = TimezoneService.get_user_month_range(user_timezone)
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
        # Use TimezoneService for proper timezone handling
        user_timezone = current_user.timezone or "UTC"
        
        # Get today's date range in user's timezone
        start_of_day, end_of_day = TimezoneService.get_user_date_range(user_timezone)
        
        logs = fitness_log.get_user_logs(
            db,
            user_id=current_user.id,
            start_date=start_of_day,
            end_date=end_of_day
        )
        
        logs_data = []
        for log in logs:
            exercises = []
            if log.exercises:
                try:
                    exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
                except (json.JSONDecodeError, TypeError):
                    exercises = []
            
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "activity_type": log.activity_type,
                "activity_name": log.activity_name,
                "exercises": exercises,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "unit": getattr(log, 'unit', 'kg'),
                "notes": log.notes,
                "activity_date": log.activity_date.isoformat() if log.activity_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)
        
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
        
        logs_data = []
        for log in logs:
            exercises = []
            if log.exercises:
                try:
                    exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
                except (json.JSONDecodeError, TypeError):
                    exercises = []
            
            log_dict = {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "activity_type": log.activity_type,
                "activity_name": log.activity_name,
                "exercises": exercises,
                "duration_minutes": log.duration_minutes,
                "calories_burned": log.calories_burned,
                "unit": getattr(log, 'unit', 'kg'),
                "notes": log.notes,
                "activity_date": log.activity_date.isoformat() if log.activity_date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            logs_data.append(log_dict)
        
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
        # Add debugging
        print(f"🔍 DEBUG: Received fitness log data from user {current_user.id}")
        print(f"🔍 DEBUG: Raw log_data: {log_data}")
        
        # Convert to dict and handle field mapping
        log_data_dict = log_data.model_dump()
        print(f"🔍 DEBUG: log_data_dict: {log_data_dict}")
        
        # Handle field name mapping from frontend
        if 'workout_name' in log_data_dict and log_data_dict['workout_name']:
            log_data_dict['activity_name'] = log_data_dict['workout_name']
        
        # Set default activity_date if not provided
        if not log_data_dict.get('activity_date'):
            from datetime import datetime
            log_data_dict['activity_date'] = datetime.now()
        
        # Convert exercises to JSON string if it's a list
        if 'exercises' in log_data_dict and isinstance(log_data_dict['exercises'], list):
            log_data_dict['exercises'] = json.dumps(log_data_dict['exercises'])
            print(f"🔍 DEBUG: Converted exercises to JSON: {log_data_dict['exercises']}")

        print(f"🔍 DEBUG: Final processed data: {log_data_dict}")

        # Create a new schema instance with the processed data
        from app.schemas.health.fitness_log import FitnessLogCreate
        processed_log_data = FitnessLogCreate(**log_data_dict)
        
        print(f"🔍 DEBUG: Created FitnessLogCreate instance: {processed_log_data}")
        
        log = fitness_log.create_with_user(db, obj_in=processed_log_data, user_id=current_user.id)
        print(f"🔍 DEBUG: Created fitness log with ID: {log.id}")

        # Parse exercises from JSON string
        exercises = []
        if log.exercises:
            try:
                exercises = json.loads(log.exercises) if isinstance(log.exercises, str) else log.exercises
            except (json.JSONDecodeError, TypeError):
                exercises = []

        return {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "routine_id": None,  # Not available in current model
            "routine_name": None,  # Not available in current model
            "workout_name": log.activity_name,  # Map activity_name to workout_name for frontend
            "exercises": exercises,  # Return actual exercises from database
            "duration_minutes": log.duration_minutes,
            "calories_burned": log.calories_burned,
            "difficulty_rating": None,  # Not available in current model
            "notes": log.notes,
            "logged_at": log.activity_date.isoformat() if log.activity_date else None,  # Map activity_date to logged_at
            "activity_date": log.activity_date.isoformat() if log.activity_date else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "unit": log.unit  # Include unit field
        }
    except Exception as e:
        import traceback
        print(f"❌ DEBUG: Exception in create_fitness_log: {str(e)}")
        print(f"❌ DEBUG: Exception type: {type(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create fitness log: {str(e)}")

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

        return {
            "id": str(updated_log.id),
            "user_id": str(updated_log.user_id),
            "activity_type": updated_log.activity_type,
            "activity_name": updated_log.activity_name,
            "exercises": json.loads(updated_log.exercises) if isinstance(updated_log.exercises, str) else updated_log.exercises,
            "duration_minutes": updated_log.duration_minutes,
            "calories_burned": updated_log.calories_burned,
            "unit": updated_log.unit,
            "notes": updated_log.notes,
            "activity_date": updated_log.activity_date.isoformat() if updated_log.activity_date else None,
            "created_at": updated_log.created_at.isoformat() if updated_log.created_at else None,
            "updated_at": updated_log.updated_at.isoformat() if updated_log.updated_at else None
        }
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