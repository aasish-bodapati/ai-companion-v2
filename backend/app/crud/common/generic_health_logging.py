"""
Generic health logging CRUD operations.
Provides reusable CRUD functionality for all health logging models with common patterns.
"""

from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, text
from pydantic import BaseModel

from app.crud.common.user_logging import UserLoggingCRUD
from app.utils.date_helpers import DateRangeCalculator, StreakCalculator, PeriodAggregator
from app.services.common.statistics import HealthStatisticsCalculator

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class GenericHealthLoggingCRUD(UserLoggingCRUD[ModelType, CreateSchemaType, UpdateSchemaType], Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic CRUD for health logging entities with common patterns.
    Extends UserLoggingCRUD with health-specific functionality.
    """
    
    def __init__(self, model: Type[ModelType], date_field: str = "created_at", 
                 stats_calculator: Optional[callable] = None):
        """
        Initialize with model, date field, and optional custom stats calculator.
        
        Args:
            model: SQLAlchemy model class
            date_field: Name of the date field for filtering and sorting
            stats_calculator: Optional custom statistics calculator function
        """
        super().__init__(model, date_field)
        self.stats_calculator = stats_calculator or self._default_stats_calculator
    
    def get_user_logs_with_filters(
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
        Get user logs with advanced filtering options.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            start_date: Start date filter
            end_date: End date filter
            **filters: Additional field filters
            
        Returns:
            List of filtered log entries
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
        
        return query.order_by(desc(getattr(self.model, self.date_field))).offset(skip).limit(limit).all()
    
    def get_user_logs_count(
        self,
        db: Session,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        **filters
    ) -> int:
        """
        Get count of user logs with filters.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Start date filter
            end_date: End date filter
            **filters: Additional field filters
            
        Returns:
            Count of filtered log entries
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
    
    def get_user_logs_by_period(
        self,
        db: Session,
        user_id: int,
        period: str = "week",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None
    ) -> List[ModelType]:
        """
        Get user logs for a specific time period.
        
        Args:
            db: Database session
            user_id: User ID
            period: Time period ('week', 'month', 'all', 'custom')
            custom_start: Custom start date (for 'custom' period)
            custom_end: Custom end date (for 'custom' period)
            
        Returns:
            List of log entries for the period
        """
        start_date, end_date = DateRangeCalculator.get_period_range(period, custom_start, custom_end)
        return self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date)
    
    def get_user_logs_today(
        self,
        db: Session,
        user_id: int
    ) -> List[ModelType]:
        """
        Get user logs for today.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of today's log entries
        """
        today = datetime.now()
        start_of_day, end_of_day = DateRangeCalculator.get_day_range(today)
        return self.get_user_logs(db, user_id, start_date=start_of_day, end_date=end_of_day)
    
    def get_recent_logs(
        self,
        db: Session,
        user_id: int,
        limit: int = 10
    ) -> List[ModelType]:
        """
        Get recent log entries for a user.
        
        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of recent logs
            
        Returns:
            List of recent log entries
        """
        return db.query(self.model).filter(
            self.model.user_id == user_id
        ).order_by(desc(getattr(self.model, self.date_field))).limit(limit).all()
    
    def calculate_user_stats(
        self,
        db: Session,
        user_id: int,
        period: str = "week",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculate statistics for user logs.
        
        Args:
            db: Database session
            user_id: User ID
            period: Time period for stats
            start_date: Custom start date
            end_date: Custom end date
            
        Returns:
            Dictionary with calculated statistics
        """
        if start_date and end_date:
            logs = self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date)
        else:
            logs = self.get_user_logs_by_period(db, user_id, period)
        
        return self.stats_calculator(logs)
    
    def get_user_streak(
        self,
        db: Session,
        user_id: int,
        current_date: Optional[datetime] = None
    ) -> int:
        """
        Calculate current streak for user logs.
        
        Args:
            db: Database session
            user_id: User ID
            current_date: Current date (defaults to now)
            
        Returns:
            Current streak in days
        """
        logs = self.get_user_logs(db, user_id)
        return StreakCalculator.calculate_streak(logs, self.date_field, current_date)
    
    def get_user_longest_streak(
        self,
        db: Session,
        user_id: int
    ) -> int:
        """
        Calculate longest streak for user logs.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Longest streak in days
        """
        logs = self.get_user_logs(db, user_id)
        return StreakCalculator.calculate_longest_streak(logs, self.date_field)
    
    def get_weekly_trends(
        self,
        db: Session,
        user_id: int,
        weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Get weekly trends for user logs.
        
        Args:
            db: Database session
            user_id: User ID
            weeks: Number of weeks to analyze
            
        Returns:
            Dictionary with weekly trend data
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(weeks=weeks)
        
        logs = self.get_user_logs(db, user_id, start_date=start_date, end_date=end_date)
        
        # Group by week
        weekly_data = PeriodAggregator.group_by_week(logs, self.date_field)
        
        trends = []
        for week_key, week_logs in weekly_data.items():
            week_stats = self.stats_calculator(week_logs)
            trends.append({
                "week": week_key,
                "count": len(week_logs),
                "stats": week_stats
            })
        
        return {
            "weekly_data": trends,
            "total_weeks": len(trends),
            "period": f"Last {weeks} weeks"
        }
    
    def search_logs(
        self,
        db: Session,
        user_id: int,
        search_term: str,
        search_fields: List[str],
        limit: int = 20
    ) -> List[ModelType]:
        """
        Search logs by text in specified fields.
        
        Args:
            db: Database session
            user_id: User ID
            search_term: Search term
            search_fields: List of fields to search in
            limit: Maximum number of results
            
        Returns:
            List of matching log entries
        """
        query = db.query(self.model).filter(self.model.user_id == user_id)
        
        # Build search conditions
        search_conditions = []
        for field in search_fields:
            if hasattr(self.model, field):
                search_conditions.append(
                    getattr(self.model, field).ilike(f"%{search_term}%")
                )
        
        if search_conditions:
            from sqlalchemy import or_
            query = query.filter(or_(*search_conditions))
        
        return query.order_by(desc(getattr(self.model, self.date_field))).limit(limit).all()
    
    def _default_stats_calculator(self, logs: List[ModelType]) -> Dict[str, Any]:
        """
        Default statistics calculator.
        Can be overridden by subclasses for specific log types.
        
        Args:
            logs: List of log entries
            
        Returns:
            Basic statistics dictionary
        """
        if not logs:
            return {
                "total_count": 0,
                "current_streak": 0,
                "longest_streak": 0
            }
        
        return {
            "total_count": len(logs),
            "current_streak": StreakCalculator.calculate_streak(logs, self.date_field),
            "longest_streak": StreakCalculator.calculate_longest_streak(logs, self.date_field),
            "first_log": min(logs, key=lambda x: getattr(x, self.date_field)).created_at.isoformat() if logs else None,
            "last_log": max(logs, key=lambda x: getattr(x, self.date_field)).created_at.isoformat() if logs else None
        }
