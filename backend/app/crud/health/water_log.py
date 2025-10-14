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

    def get_multi_by_user(
        self, 
        db: Session, 
        *, 
        user_id: int, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[WaterLog]:
        """Get multiple water logs for a user with optional date filtering"""
        query = db.query(WaterLog).filter(WaterLog.user_id == user_id)
        
        if start_date:
            query = query.filter(func.date(WaterLog.log_date) >= start_date)
        if end_date:
            query = query.filter(func.date(WaterLog.log_date) <= end_date)
            
        return query.order_by(WaterLog.log_date.desc()).offset(skip).limit(limit).all()

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
        import logging
        from datetime import datetime
        from app.utils.timezone_handler import TimezoneHandler
        
        logger = logging.getLogger(__name__)
        
        # Get user timezone from user profile
        from app.models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        user_timezone = user.timezone if user and user.timezone else "UTC"
        logger.info(f"🚰 [WATER STATS] Getting water stats for user {user_id} in timezone {user_timezone}")
        
        # Use timezone-aware filtering like the dashboard
        now_utc = datetime.now()
        start_of_day, end_of_day = TimezoneHandler.get_user_timezone_range(now_utc, user_timezone)
        
        logger.info(f"🚰 [WATER STATS] Using timezone range: {start_of_day} to {end_of_day}")
        
        # First, let's check what water logs exist for this user today
        all_logs_today = db.query(WaterLog).filter(
            WaterLog.user_id == user_id,
            WaterLog.log_date >= start_of_day,
            WaterLog.log_date <= end_of_day
        ).all()
        
        logger.info(f"🚰 [WATER STATS] Found {len(all_logs_today)} water logs for today")
        for i, log in enumerate(all_logs_today):
            logger.info(f"🚰 [WATER STATS] Log {i+1}: ID={log.id}, amount_ml={log.amount_ml}, log_date={log.log_date}")
        
        # Get total ml and count using timezone-aware filtering
        result = db.query(
            func.sum(WaterLog.amount_ml).label('total_ml'),
            func.count(WaterLog.id).label('count')
        ).filter(
            WaterLog.user_id == user_id,
            WaterLog.log_date >= start_of_day,
            WaterLog.log_date <= end_of_day
        ).first()
        
        total_ml = int(result.total_ml) if result.total_ml else 0
        logs_count = int(result.count) if result.count else 0
        
        logger.info(f"🚰 [WATER STATS] Raw query result - total_ml: {result.total_ml}, count: {result.count}")
        logger.info(f"🚰 [WATER STATS] Processed - total_ml: {total_ml}, logs_count: {logs_count}")
        
        # Calculate ounces (1 ml = 0.033814 oz)
        total_oz = total_ml * 0.033814
        
        # Get user's gender to determine water goal
        from app.models.health.user_goals import UserHealthProfile
        health_profile = db.query(UserHealthProfile).filter(
            UserHealthProfile.user_id == user_id
        ).first()
        
        logger.info(f"🚰 [WATER STATS] Health profile found: {health_profile is not None}")
        if health_profile:
            logger.info(f"🚰 [WATER STATS] User gender: {health_profile.gender}")
        else:
            logger.warning(f"🚰 [WATER STATS] No health profile found for user {user_id}")
        
        # Calculate water goal based on gender
        if health_profile and health_profile.gender:
            if health_profile.gender == 'female':
                goal_ml = 2700  # 2.7L for females
                logger.info(f"🚰 [WATER STATS] Setting female goal: {goal_ml}ml")
            elif health_profile.gender == 'male':
                goal_ml = 3700  # 3.7L for males
                logger.info(f"🚰 [WATER STATS] Setting male goal: {goal_ml}ml")
            else:
                goal_ml = 3200  # 3.2L average for other/unspecified
                logger.info(f"🚰 [WATER STATS] Setting other gender goal: {goal_ml}ml")
        else:
            goal_ml = 3200  # 3.2L default if no gender info
            logger.info(f"🚰 [WATER STATS] Using default goal (no gender info): {goal_ml}ml")
        
        goal_oz = goal_ml * 0.033814
        
        progress_percentage = (total_ml / goal_ml) * 100 if goal_ml > 0 else 0
        average_per_log = total_ml / logs_count if logs_count > 0 else 0
        
        logger.info(f"🚰 [WATER STATS] Final calculation:")
        logger.info(f"🚰 [WATER STATS] - Total ML today: {total_ml}")
        logger.info(f"🚰 [WATER STATS] - Goal ML: {goal_ml}")
        logger.info(f"🚰 [WATER STATS] - Progress percentage: {progress_percentage:.1f}%")
        logger.info(f"🚰 [WATER STATS] - Logs count: {logs_count}")
        
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
        import time
        start_time = time.time()
        print(f"🚰 [CRUD] Starting water log CRUD operations at {time.strftime('%H:%M:%S')}")
        
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
        
        db_commit_start = time.time()
        db.commit()
        db_commit_end = time.time()
        print(f"🚰 [CRUD] Database commit took {(db_commit_end - db_commit_start) * 1000:.2f}ms")
        
        db.refresh(db_obj)
        
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        print(f"🚰 [CRUD] Water log CRUD operations completed in {duration:.2f}ms")
        
        return db_obj

# Create instance
water_log = CRUDWaterLog()
