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
from app.utils.timezone_handler import TimezoneHandler
from app.api.common.response_formatter import HealthLogResponseFormatter

router = APIRouter()

# Removed duplicated timezone function - now using TimezoneHandler

# Note: Generic endpoints are available but not included to avoid conflicts
# Use water_endpoints.create_water_router() if you want to use the generic patterns

# Keep the original endpoints for backward compatibility
@router.get("/", response_model=List[dict])
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
    return [HealthLogResponseFormatter.format_water_log_response(log) for log in logs]

@router.get("/today", response_model=List[dict])
def get_todays_water_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's water logs for today"""
    # Use TimezoneHandler for proper timezone handling
    user_timezone = current_user.timezone or "UTC"
    
    # Get today's date range in user's timezone
    start_of_day, end_of_day = TimezoneHandler.get_user_timezone_range(datetime.now(), user_timezone)
    
    logs = water_log.get_user_logs_by_date_range(
        db, user_id=current_user.id,
        start_date=start_of_day.date(), end_date=end_of_day.date()
    )
    return [HealthLogResponseFormatter.format_water_log_response(log) for log in logs]

@router.get("/stats", response_model=WaterLogStats)
def get_water_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get water intake statistics for today"""
    import logging
    from datetime import date
    from sqlalchemy import func
    from app.models.health.water_log import WaterLog
    
    logger = logging.getLogger(__name__)
    
    logger.info(f"🚰 [WATER API] Getting water stats for user {current_user.id}")
    
    # Debug: Check what the database actually has
    today = date.today()
    logger.info(f"🚰 [WATER API] Using date filter: {today}")
    
    # Direct query to see what we get
    direct_result = db.query(
        func.sum(WaterLog.amount_ml).label('total_ml'),
        func.count(WaterLog.id).label('count')
    ).filter(
        WaterLog.user_id == current_user.id,
        func.date(WaterLog.log_date) == today
    ).first()
    
    logger.info(f"🚰 [WATER API] Direct query result: total_ml={direct_result.total_ml}, count={direct_result.count}")
    
    # Use the CRUD function which has gender-based goal calculation
    stats = water_log.get_water_stats_today(db, user_id=current_user.id)
    
    logger.info(f"🚰 [WATER API] CRUD function result: {stats}")
    
    return WaterLogStats(**stats)

@router.post("/", response_model=dict)
def create_water_log(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    water_log_in: WaterLogCreate
):
    """Create a new water log entry"""
    import time
    start_time = time.time()
    print(f"🚰 [BACKEND] Starting water log creation at {time.strftime('%H:%M:%S')}")
    
    log = water_log.create_with_user(db, obj_in=water_log_in, user_id=current_user.id)
    
    end_time = time.time()
    duration = (end_time - start_time) * 1000  # Convert to milliseconds
    print(f"🚰 [BACKEND] Water log creation completed in {duration:.2f}ms")
    
    return HealthLogResponseFormatter.format_water_log_response(log)

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

@router.get("/{id}", response_model=dict)
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
    
    return HealthLogResponseFormatter.format_water_log_response(log_entry)

@router.put("/{id}", response_model=dict)
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
    
    updated_log = water_log.update(db, db_obj=log_entry, obj_in=water_log_in)
    return HealthLogResponseFormatter.format_water_log_response(updated_log)

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