"""
Simple water logging endpoint - no complex stats, just log and return basic info
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.health.water_log import WaterLog
from app.schemas.health.water_log import WaterLogCreate
from app.utils.timezone_handler import TimezoneHandler

router = APIRouter()

@router.post("/log")
def simple_log_water(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    amount_ml: int = Query(..., gt=0, le=10000, description="Amount in milliliters")
):
    """Simple water logging - just log and return basic stats"""
    try:
        # Create water log
        water_log_data = WaterLogCreate(
            amount_ml=amount_ml,
            log_type="manual",
            log_date=datetime.now()
        )
        
        # Simple database insert
        db_obj = WaterLog(
            user_id=current_user.id,
            amount_ml=amount_ml,
            amount_oz=amount_ml * 0.033814,
            log_type="manual",
            log_date=water_log_data.log_date
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Get simple stats for today
        from sqlalchemy import func
        from datetime import date
        
        today = date.today()
        result = db.query(
            func.sum(WaterLog.amount_ml).label('total_ml'),
            func.count(WaterLog.id).label('count')
        ).filter(
            WaterLog.user_id == current_user.id,
            func.date(WaterLog.log_date) == today
        ).first()
        
        total_ml = int(result.total_ml) if result.total_ml else 0
        logs_count = int(result.count) if result.count else 0
        
        # Simple goal calculation
        goal_ml = 3200  # Default 3.2L
        progress_percentage = (total_ml / goal_ml) * 100 if goal_ml > 0 else 0
        
        return {
            "success": True,
            "total_ml_today": total_ml,
            "goal_ml": goal_ml,
            "progress_percentage": round(progress_percentage, 1),
            "logs_today": logs_count,
            "amount_logged": amount_ml
        }
        
    except Exception as e:
        print(f"🚰 [SIMPLE WATER] Error logging water: {e}")
        raise HTTPException(status_code=500, detail="Failed to log water")

@router.get("/stats")
def simple_get_stats(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get simple water stats for today"""
    try:
        from sqlalchemy import func
        from datetime import date
        
        today = date.today()
        result = db.query(
            func.sum(WaterLog.amount_ml).label('total_ml'),
            func.count(WaterLog.id).label('count')
        ).filter(
            WaterLog.user_id == current_user.id,
            func.date(WaterLog.log_date) == today
        ).first()
        
        total_ml = int(result.total_ml) if result.total_ml else 0
        logs_count = int(result.count) if result.count else 0
        
        # Simple goal calculation
        goal_ml = 3200  # Default 3.2L
        progress_percentage = (total_ml / goal_ml) * 100 if goal_ml > 0 else 0
        
        return {
            "total_ml_today": total_ml,
            "total_oz_today": round(total_ml * 0.033814, 2),
            "goal_ml": goal_ml,
            "goal_oz": round(goal_ml * 0.033814, 2),
            "progress_percentage": round(progress_percentage, 1),
            "logs_today": logs_count
        }
        
    except Exception as e:
        print(f"🚰 [SIMPLE WATER] Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get water stats")
