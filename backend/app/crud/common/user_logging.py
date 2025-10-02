"""
Generic CRUD operations for user-owned logging entities.
Provides reusable CRUD functionality for all health logging models.
"""

from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from app.crud.base import CRUDBase
from app.utils.date_helpers import DateRangeCalculator, StreakCalculator, PeriodAggregator

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class UserLoggingCRUD(CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType], Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic CRUD for user-owned logging entities.
    Extends the base CRUD with user-specific logging functionality.
    """
    
    def __init__(self, model: Type[ModelType], date_field: str = "created_at"):
        """
        Initialize with model and date field name.
        
        Args:
            model: SQLAlchemy model class
            date_field: Name of the date field for filtering and sorting
        """
        super().__init__(model)
        self.date_field = date_field
    
    def create_with_user(self, db: Session, *, obj_in: CreateSchemaType, user_id: int) -> ModelType:
        """Create a new log entry for a specific user."""
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
    
    def get_user_logs(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        **filters
    ) -> List[ModelType]:
        """
        Get logs for a specific user with optional filtering.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            **filters: Additional field filters (e.g., meal_type="breakfast")
            
        Returns:
            List of log objects
        """
        query = db.query(self.model).filter(self.model.user_id == user_id)
        
        # Apply date filters
        if start_date:
            query = query.filter(getattr(self.model, self.date_field) >= start_date)
        if end_date:
            query = query.filter(getattr(self.model, self.date_field) <= end_date)
        
        # Apply additional filters
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        
        return query.order_by(getattr(self.model, self.date_field)).offset(skip).limit(limit).all()
    
    def get_daily_logs(self, db: Session, user_id: int, date: datetime) -> List[ModelType]:
        """Get all logs for a specific day."""
        start_of_day, end_of_day = DateRangeCalculator.get_day_range(date)
        
        return db.query(self.model).filter(
            and_(
                self.model.user_id == user_id,
                getattr(self.model, self.date_field) >= start_of_day,
                getattr(self.model, self.date_field) < end_of_day
            )
        ).order_by(getattr(self.model, self.date_field)).all()
    
    def get_weekly_logs(self, db: Session, user_id: int, week_start: datetime) -> List[ModelType]:
        """Get all logs for a specific week."""
        week_end = week_start + timedelta(days=7)
        
        return db.query(self.model).filter(
            and_(
                self.model.user_id == user_id,
                getattr(self.model, self.date_field) >= week_start,
                getattr(self.model, self.date_field) < week_end
            )
        ).order_by(getattr(self.model, self.date_field)).all()
    
    def get_user_logs_by_period(
        self,
        db: Session,
        user_id: int,
        period: str = "week",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None,
        **filters
    ) -> List[ModelType]:
        """
        Get user logs for a specific time period.
        
        Args:
            db: Database session
            user_id: User ID
            period: 'week', 'month', 'all', or 'custom'
            custom_start: Custom start date (for 'custom' period)
            custom_end: Custom end date (for 'custom' period)
            **filters: Additional field filters
            
        Returns:
            List of log objects
        """
        start_date, end_date = DateRangeCalculator.get_period_range(period, custom_start, custom_end)
        return self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date, **filters)
    
    def calculate_user_streak(self, db: Session, user_id: int) -> int:
        """Calculate current streak for the user."""
        logs = self.get_user_logs(db, user_id)
        return StreakCalculator.calculate_streak(logs, self.date_field)
    
    def calculate_longest_streak(self, db: Session, user_id: int) -> int:
        """Calculate longest streak for the user."""
        logs = self.get_user_logs(db, user_id)
        return StreakCalculator.calculate_longest_streak(logs, self.date_field)
    
    def get_user_stats(
        self,
        db: Session,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        **filters
    ) -> Dict[str, Any]:
        """
        Get basic statistics for user logs.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            **filters: Additional field filters
            
        Returns:
            Dictionary with basic statistics
        """
        logs = self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date, **filters)
        
        if not logs:
            return {
                "total_count": 0,
                "current_streak": 0,
                "longest_streak": 0,
                "first_log": None,
                "last_log": None
            }
        
        # Get streak information
        all_logs = self.get_user_logs(db, user_id)
        current_streak = StreakCalculator.calculate_streak(all_logs, self.date_field)
        longest_streak = StreakCalculator.calculate_longest_streak(all_logs, self.date_field)
        
        # Get first and last log dates
        sorted_logs = sorted(logs, key=lambda x: getattr(x, self.date_field))
        first_log = sorted_logs[0] if sorted_logs else None
        last_log = sorted_logs[-1] if sorted_logs else None
        
        return {
            "total_count": len(logs),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "first_log": getattr(first_log, self.date_field) if first_log else None,
            "last_log": getattr(last_log, self.date_field) if last_log else None
        }
    
    def get_weekly_breakdown(
        self,
        db: Session,
        user_id: int,
        weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Get weekly breakdown of user logs.
        
        Args:
            db: Database session
            user_id: User ID
            weeks: Number of weeks to analyze
            
        Returns:
            Dictionary with weekly breakdown
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(weeks=weeks)
        
        logs = self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date)
        
        # Group by week
        weekly_data = PeriodAggregator.group_by_week(logs, self.date_field)
        
        # Convert to list format
        weeks_list = []
        for week, week_logs in sorted(weekly_data.items()):
            weeks_list.append({
                "week": week,
                "count": len(week_logs),
                "logs": week_logs
            })
        
        return {
            "weekly_data": weeks_list,
            "total_weeks": len(weeks_list),
            "total_logs": len(logs)
        }
    
    def get_daily_breakdown(
        self,
        db: Session,
        user_id: int,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get daily breakdown of user logs.
        
        Args:
            db: Database session
            user_id: User ID
            days: Number of days to analyze
            
        Returns:
            Dictionary with daily breakdown
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        logs = self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date)
        
        # Group by day
        daily_data = PeriodAggregator.group_by_day(logs, self.date_field)
        
        # Convert to list format
        days_list = []
        for day, day_logs in sorted(daily_data.items()):
            days_list.append({
                "day": day,
                "count": len(day_logs),
                "logs": day_logs
            })
        
        return {
            "daily_data": days_list,
            "total_days": len(days_list),
            "total_logs": len(logs)
        }
    
    def get_recent_logs(
        self,
        db: Session,
        user_id: int,
        limit: int = 10,
        days: int = 7
    ) -> List[ModelType]:
        """
        Get recent logs for the user.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of logs to return
            days: Number of days to look back
            
        Returns:
            List of recent log objects
        """
        start_date = datetime.now() - timedelta(days=days)
        return self.get_user_logs(
            db, user_id, start_date=start_date, limit=limit
        )
    
    def get_user_logs_count(
        self,
        db: Session,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        **filters
    ) -> int:
        """
        Get count of user logs with optional filtering.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            **filters: Additional field filters
            
        Returns:
            Number of matching logs
        """
        query = db.query(self.model).filter(self.model.user_id == user_id)
        
        # Apply date filters
        if start_date:
            query = query.filter(getattr(self.model, self.date_field) >= start_date)
        if end_date:
            query = query.filter(getattr(self.model, self.date_field) <= end_date)
        
        # Apply additional filters
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        
        return query.count()
