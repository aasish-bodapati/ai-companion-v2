"""
Refactored water logs endpoint using generic logging patterns.
This reduces code duplication while maintaining all existing functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timedelta, timezone

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.water_log import water_log
from app.schemas.health.water_log import (
    WaterLog, WaterLogCreate, WaterLogUpdate, 
    WaterLogStats, WaterLogSummary
)
from app.utils.timezone_service import TimezoneService
# from app.api.common.water_endpoints import water_endpoints  # Not used in this implementation

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
# Use water_endpoints.create_water_router() if you want to use the generic patterns

# Keep the original endpoints for backward compatibility
@router.get("/", response_model=List[WaterLog])
def get_water_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30, description="Number of days to retrieve")
):
    """Get user's water logs for the specified number of days"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    logs = water_log.get_user_logs_by_date_range(
        db, user_id=current_user.id, 
        start_date=start_date, end_date=end_date
    )
    return logs

@router.get("/today", response_model=List[WaterLog])
def get_todays_water_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's water logs for today"""
    # Use TimezoneService for proper timezone handling
    user_timezone = current_user.timezone or "UTC"
    
    # Get today's date range in user's timezone
    start_of_day, end_of_day = TimezoneService.get_user_date_range(user_timezone)
    
    logs = water_log.get_user_logs_by_date_range(
        db, user_id=current_user.id,
        start_date=start_of_day.date(), end_date=end_of_day.date()
    )
    return logs

@router.get("/stats", response_model=WaterLogStats)
def get_water_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get water intake statistics for today"""
    # Use TimezoneService for proper timezone handling
    user_timezone = current_user.timezone or "UTC"
    
    # Get today's date range in user's timezone
    start_of_day, end_of_day = TimezoneService.get_user_date_range(user_timezone)
    
    # Get logs for today in user's timezone
    logs = water_log.get_user_logs_by_date_range(
        db, user_id=current_user.id,
        start_date=start_of_day.date(), end_date=end_of_day.date()
    )
    
    # Calculate stats manually since we're using timezone-aware filtering
    total_ml = sum(log.amount_ml or 0 for log in logs)
    total_oz = sum(log.amount_oz or 0 for log in logs)
    goal_ml = 2000  # Default goal
    goal_oz = goal_ml * 0.033814  # Convert to ounces
    progress_percentage = (total_ml / goal_ml) * 100 if goal_ml > 0 else 0
    average_per_log = total_ml / len(logs) if logs else 0
    
    stats = {
        "total_ml_today": total_ml,
        "total_oz_today": total_oz,
        "goal_ml": goal_ml,
        "goal_oz": goal_oz,
        "progress_percentage": progress_percentage,
        "logs_today": len(logs),
        "average_per_log": average_per_log
    }
    
    return WaterLogStats(**stats)

@router.post("/", response_model=WaterLog)
def create_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    water_log_in: WaterLogCreate
):
    """Create a new water log entry"""
    return water_log.create_with_user(db, obj_in=water_log_in, user_id=current_user.id)

@router.post("/quick-log")
def quick_log_water(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    amount_ml: int = Query(..., gt=0, le=10000, description="Amount in milliliters")
):
    """Quick log water intake with default settings"""
    water_log_data = WaterLogCreate(
        amount_ml=amount_ml,
        log_type="manual",
        log_date=datetime.now()
    )
    
    log_entry = water_log.create_with_user(db, obj_in=water_log_data, user_id=current_user.id)
    
    # Get updated stats
    stats = water_log.get_water_stats_today(db, user_id=current_user.id)
    
    return {
        "message": f"Logged {amount_ml}ml of water",
        "log_entry": log_entry,
        "stats": stats
    }

@router.get("/{id}", response_model=WaterLog)
def get_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Get a specific water log entry"""
    log_entry = water_log.get(db, id=id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Water log not found")
    
    if log_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this water log")
    
    return log_entry

@router.put("/{id}", response_model=WaterLog)
def update_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int,
    water_log_in: WaterLogUpdate
):
    """Update a water log entry"""
    log_entry = water_log.get(db, id=id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Water log not found")
    
    if log_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this water log")
    
    # Recalculate ounces if amount_ml is being updated
    if water_log_in.amount_ml is not None:
        water_log_in.amount_oz = water_log_in.amount_ml * 0.033814
    
    return water_log.update(db, db_obj=log_entry, obj_in=water_log_in)

@router.delete("/{id}")
def delete_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    id: int
):
    """Delete a water log entry"""
    log_entry = water_log.get(db, id=id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Water log not found")
    
    if log_entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this water log")
    
    water_log.remove(db, id=id)
    return {"message": "Water log deleted successfully"}