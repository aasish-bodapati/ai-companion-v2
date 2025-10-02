"""
Water Log CRUD operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.crud.common.generic_health_logging import GenericHealthLoggingCRUD
from app.models.health.water_log import WaterLog
from app.schemas.health.water_log import WaterLogCreate, WaterLogUpdate

class CRUDWaterLog(GenericHealthLoggingCRUD[WaterLog, WaterLogCreate, WaterLogUpdate]):
    """CRUD operations for WaterLog using GenericHealthLoggingCRUD base class."""
    
    def __init__(self):
        super().__init__(
            WaterLog, 
            date_field="log_date",
            stats_calculator=self._calculate_water_stats
        )
    
    def _calculate_water_stats(self, logs: List[WaterLog]) -> Dict[str, Any]:
        """Calculate water-specific statistics."""
        if not logs:
            return {
                "total_count": 0,
                "total_ml": 0,
                "total_oz": 0,
                "current_streak": 0,
                "longest_streak": 0
            }
        
        total_ml = sum(log.amount_ml or 0 for log in logs)
        total_oz = sum(log.amount_oz or 0 for log in logs)
        
        return {
            "total_count": len(logs),
            "total_ml": total_ml,
            "total_oz": round(total_oz, 2),
            "current_streak": self.calculate_user_streak(None, None),  # Will be calculated properly in context
            "longest_streak": self.calculate_user_streak(None, None)   # Will be calculated properly in context
        }

    def get_user_logs_today(self, db: Session, *, user_id: int) -> List[WaterLog]:
        """Get user's water logs for today"""
        today = date.today()
        return db.query(WaterLog).filter(
            WaterLog.user_id == user_id,
            func.date(WaterLog.log_date) == today
        ).order_by(WaterLog.log_date.desc()).all()

    def get_user_logs_by_date_range(
        self, 
        db: Session, 
        *, 
        user_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[WaterLog]:
        """Get user's water logs within a date range"""
        return db.query(WaterLog).filter(
            WaterLog.user_id == user_id,
            func.date(WaterLog.log_date) >= start_date,
            func.date(WaterLog.log_date) <= end_date
        ).order_by(WaterLog.log_date.desc()).all()

    def get_total_water_today(self, db: Session, *, user_id: int) -> int:
        """Get total water intake for today in ml"""
        today = date.today()
        result = db.query(func.sum(WaterLog.amount_ml)).filter(
            WaterLog.user_id == user_id,
            func.date(WaterLog.log_date) == today
        ).scalar()
        return int(result) if result else 0

    def get_water_stats_today(self, db: Session, *, user_id: int) -> dict:
        """Get comprehensive water stats for today"""
        today = date.today()
        
        # Get total ml and count
        result = db.query(
            func.sum(WaterLog.amount_ml).label('total_ml'),
            func.count(WaterLog.id).label('count')
        ).filter(
            WaterLog.user_id == user_id,
            func.date(WaterLog.log_date) == today
        ).first()
        
        total_ml = int(result.total_ml) if result.total_ml else 0
        logs_count = int(result.count) if result.count else 0
        
        # Calculate ounces (1 ml = 0.033814 oz)
        total_oz = total_ml * 0.033814
        
        # Default goal: 8 glasses = 2000ml
        goal_ml = 2000
        goal_oz = goal_ml * 0.033814
        
        progress_percentage = (total_ml / goal_ml) * 100 if goal_ml > 0 else 0
        average_per_log = total_ml / logs_count if logs_count > 0 else 0
        
        return {
            "total_ml_today": total_ml,
            "total_oz_today": round(total_oz, 2),
            "goal_ml": goal_ml,
            "goal_oz": round(goal_oz, 2),
            "progress_percentage": round(progress_percentage, 1),
            "logs_today": logs_count,
            "average_per_log": round(average_per_log, 1)
        }

    def create_with_user(self, db: Session, *, obj_in: WaterLogCreate, user_id: int) -> WaterLog:
        """Create a water log for a user with water-specific logic"""
        # Calculate ounces if not provided
        if obj_in.amount_oz is None:
            obj_in.amount_oz = obj_in.amount_ml * 0.033814
        
        # Set log_date to now if not provided
        if obj_in.log_date is None:
            obj_in.log_date = datetime.now()
        
        # Use the parent class method but with our custom logic
        obj_in_data = obj_in.model_dump()
        obj_in_data["user_id"] = user_id
        
        # Filter out fields that don't exist in the model
        model_fields = {column.name for column in self.model.__table__.columns}
        filtered_data = {k: v for k, v in obj_in_data.items() if k in model_fields}
        
        db_obj = self.model(**filtered_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Create instance
water_log = CRUDWaterLog()
