"""
Water Log API endpoints
"""

from typing import List
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud.health.water_log import water_log
from app.schemas.health.water_log import (
    WaterLog, WaterLogCreate, WaterLogUpdate, 
    WaterLogStats, WaterLogSummary
)

router = APIRouter()

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
    logs = water_log.get_user_logs_today(db, user_id=current_user.id)
    return logs

@router.get("/stats", response_model=WaterLogStats)
def get_water_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get water intake statistics for today"""
    stats = water_log.get_water_stats_today(db, user_id=current_user.id)
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
