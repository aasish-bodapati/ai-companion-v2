"""
Date and time utilities for health logging applications.
Centralized date calculations, period handling, and streak calculations.
"""

from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Any
from sqlalchemy.orm import Session


class DateRangeCalculator:
    """Centralized date range and period calculations for health logging."""
    
    @staticmethod
    def get_period_range(period: str, custom_start: Optional[datetime] = None, 
                        custom_end: Optional[datetime] = None) -> Tuple[Optional[datetime], datetime]:
        """
        Get start and end dates for common periods.
        
        Args:
            period: 'week', 'month', 'all', or 'custom'
            custom_start: Custom start date (for 'custom' period)
            custom_end: Custom end date (for 'custom' period)
            
        Returns:
            Tuple of (start_date, end_date). start_date can be None for 'all' period.
        """
        end_date = custom_end or datetime.now()
        
        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "custom":
            start_date = custom_start
        else:  # 'all' or any other value
            start_date = None
            
        return start_date, end_date
    
    @staticmethod
    def get_week_start(date: datetime) -> datetime:
        """Get the start of the week (Monday) for a given date."""
        return date - timedelta(days=date.weekday())
    
    @staticmethod
    def get_month_start(date: datetime) -> datetime:
        """Get the start of the month for a given date."""
        return date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    @staticmethod
    def get_day_range(date: datetime) -> Tuple[datetime, datetime]:
        """Get start and end of day for a given date."""
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        return start_of_day, end_of_day


class StreakCalculator:
    """Generic streak calculation for any log type."""
    
    @staticmethod
    def calculate_streak(logs: List[Any], date_field: str, 
                        current_date: Optional[datetime] = None) -> int:
        """
        Calculate current streak in days.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field on the log objects
            current_date: Current date (defaults to now)
            
        Returns:
            Current streak in days
        """
        if not logs:
            return 0
        
        current_date = current_date or datetime.now()
        
        # Sort logs by date (most recent first)
        sorted_logs = sorted(logs, key=lambda x: getattr(x, date_field) or x.created_at, reverse=True)
        
        streak = 0
        check_date = current_date.date()
        
        for log in sorted_logs:
            log_date = getattr(log, date_field, log.created_at).date()
            
            # If this is today or yesterday, continue the streak
            if log_date == check_date or log_date == check_date - timedelta(days=1):
                streak += 1
                check_date = log_date
            else:
                break
        
        return streak
    
    @staticmethod
    def calculate_longest_streak(logs: List[Any], date_field: str) -> int:
        """
        Calculate the longest streak.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field on the log objects
            
        Returns:
            Longest streak in days
        """
        if not logs:
            return 0
        
        # Sort logs by date (oldest first)
        sorted_logs = sorted(logs, key=lambda x: getattr(x, date_field) or x.created_at)
        
        longest_streak = 0
        current_streak = 0
        last_date = None
        
        for log in sorted_logs:
            log_date = getattr(log, date_field, log.created_at).date()
            
            if last_date is None:
                current_streak = 1
            elif log_date == last_date + timedelta(days=1):
                current_streak += 1
            else:
                longest_streak = max(longest_streak, current_streak)
                current_streak = 1
            
            last_date = log_date
        
        return max(longest_streak, current_streak)


class PeriodAggregator:
    """Helper for aggregating data by time periods."""
    
    @staticmethod
    def group_by_week(logs: List[Any], date_field: str) -> dict:
        """
        Group logs by week.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field on the log objects
            
        Returns:
            Dictionary with week keys and log lists as values
        """
        weekly_data = {}
        
        for log in logs:
            log_date = getattr(log, date_field, log.created_at)
            week_start = DateRangeCalculator.get_week_start(log_date)
            week_key = week_start.strftime("%Y-%m-%d")
            
            if week_key not in weekly_data:
                weekly_data[week_key] = []
            
            weekly_data[week_key].append(log)
        
        return weekly_data
    
    @staticmethod
    def group_by_day(logs: List[Any], date_field: str) -> dict:
        """
        Group logs by day.
        
        Args:
            logs: List of log objects
            date_field: Name of the date field on the log objects
            
        Returns:
            Dictionary with day keys and log lists as values
        """
        daily_data = {}
        
        for log in logs:
            log_date = getattr(log, date_field, log.created_at).date()
            day_key = log_date.strftime("%Y-%m-%d")
            
            if day_key not in daily_data:
                daily_data[day_key] = []
            
            daily_data[day_key].append(log)
        
        return daily_data


class DateValidator:
    """Date validation utilities."""
    
    @staticmethod
    def is_valid_date_string(date_string: str, format: str = "%Y-%m-%d") -> bool:
        """Check if a string is a valid date in the specified format."""
        try:
            datetime.strptime(date_string, format)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def parse_date_string(date_string: str, format: str = "%Y-%m-%d") -> Optional[datetime]:
        """Parse a date string, return None if invalid."""
        try:
            return datetime.strptime(date_string, format)
        except ValueError:
            return None
