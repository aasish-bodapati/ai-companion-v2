"""
Centralized timezone utilities for consistent date/time handling across the app.
"""

from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional


class TimezoneUtils:
    """Centralized timezone handling utilities."""
    
    @staticmethod
    def get_user_timezone_offset_minutes(user_timezone: Optional[str] = None) -> int:
        """
        Get user's timezone offset in minutes from UTC.
        
        Args:
            user_timezone: User's timezone string (e.g., "America/New_York", "Asia/Kolkata")
        
        Returns:
            Offset in minutes from UTC (positive for east, negative for west)
        """
        if not user_timezone or user_timezone == "UTC":
            return 0
            
        # Use common timezone mappings for now (can be enhanced later)
        common_offsets = {
            "Asia/Kolkata": 330,  # IST
            "America/New_York": -300,  # EST (approximate)
            "America/Los_Angeles": -480,  # PST (approximate)
            "Europe/London": 0,  # GMT (approximate)
            "Asia/Tokyo": 540,  # JST
            "Australia/Sydney": 600,  # AEST (approximate)
        }
        
        return common_offsets.get(user_timezone, 0)
    
    @staticmethod
    def get_user_timezone_range(
        date_obj: datetime, 
        user_timezone: Optional[str] = None,
        user_offset_minutes: Optional[int] = None
    ) -> Tuple[datetime, datetime]:
        """
        Get start and end of day in user's timezone, converted to UTC for database queries.
        
        Args:
            date_obj: The date to get range for
            user_timezone: User's timezone string (e.g., "America/New_York")
            user_offset_minutes: User's timezone offset in minutes (if timezone string not available)
        
        Returns:
            tuple: (start_of_day_utc, end_of_day_utc)
        """
        # Get timezone offset
        if user_timezone:
            offset_minutes = TimezoneUtils.get_user_timezone_offset_minutes(user_timezone)
        elif user_offset_minutes is not None:
            offset_minutes = user_offset_minutes
        else:
            offset_minutes = 0  # Default to UTC
        
        # Create timezone-aware datetime for user's timezone
        user_tz = timezone(timedelta(minutes=offset_minutes))
        
        # Get start and end of day in user's timezone
        start_of_day_user = datetime.combine(date_obj.date(), datetime.min.time()).replace(tzinfo=user_tz)
        end_of_day_user = datetime.combine(date_obj.date(), datetime.max.time()).replace(tzinfo=user_tz)
        
        # Convert to UTC for database queries
        start_of_day_utc = start_of_day_user.astimezone(timezone.utc)
        end_of_day_utc = end_of_day_user.astimezone(timezone.utc)
        
        return start_of_day_utc, end_of_day_utc
    
    @staticmethod
    def get_week_range(
        date_obj: datetime,
        user_timezone: Optional[str] = None,
        user_offset_minutes: Optional[int] = None
    ) -> Tuple[datetime, datetime]:
        """
        Get start and end of week in user's timezone, converted to UTC.
        
        Args:
            date_obj: The date to get week range for
            user_timezone: User's timezone string
            user_offset_minutes: User's timezone offset in minutes
        
        Returns:
            tuple: (start_of_week_utc, end_of_week_utc)
        """
        # Get timezone offset
        if user_timezone:
            offset_minutes = TimezoneUtils.get_user_timezone_offset_minutes(user_timezone)
        elif user_offset_minutes is not None:
            offset_minutes = user_offset_minutes
        else:
            offset_minutes = 0
        
        user_tz = timezone(timedelta(minutes=offset_minutes))
        
        # Get start of week (Monday)
        week_start = date_obj.date() - timedelta(days=date_obj.weekday())
        start_of_week_user = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=user_tz)
        
        # Get end of week (Sunday)
        week_end = week_start + timedelta(days=6)
        end_of_week_user = datetime.combine(week_end, datetime.max.time()).replace(tzinfo=user_tz)
        
        # Convert to UTC
        start_of_week_utc = start_of_week_user.astimezone(timezone.utc)
        end_of_week_utc = end_of_week_user.astimezone(timezone.utc)
        
        return start_of_week_utc, end_of_week_utc
    
    @staticmethod
    def format_datetime_for_user(
        dt: datetime,
        user_timezone: Optional[str] = None,
        user_offset_minutes: Optional[int] = None
    ) -> str:
        """
        Format datetime for display in user's timezone.
        
        Args:
            dt: UTC datetime from database
            user_timezone: User's timezone string
            user_offset_minutes: User's timezone offset in minutes
        
        Returns:
            ISO formatted string in user's timezone
        """
        if not dt:
            return ""
            
        # Get timezone offset
        if user_timezone:
            offset_minutes = TimezoneUtils.get_user_timezone_offset_minutes(user_timezone)
        elif user_offset_minutes is not None:
            offset_minutes = user_offset_minutes
        else:
            offset_minutes = 0
        
        user_tz = timezone(timedelta(minutes=offset_minutes))
        user_dt = dt.astimezone(user_tz)
        return user_dt.isoformat()
    
    @staticmethod
    def parse_user_datetime(
        date_str: str,
        user_timezone: Optional[str] = None,
        user_offset_minutes: Optional[int] = None
    ) -> datetime:
        """
        Parse datetime string from user input and convert to UTC.
        
        Args:
            date_str: Date string from user input
            user_timezone: User's timezone string
            user_offset_minutes: User's timezone offset in minutes
        
        Returns:
            UTC datetime for database storage
        """
        # Get timezone offset
        if user_timezone:
            offset_minutes = TimezoneUtils.get_user_timezone_offset_minutes(user_timezone)
        elif user_offset_minutes is not None:
            offset_minutes = user_offset_minutes
        else:
            offset_minutes = 0
        
        user_tz = timezone(timedelta(minutes=offset_minutes))
        
        # Parse the date string
        if 'T' in date_str:
            # ISO format with time
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            # Date only, assume start of day
            dt = datetime.fromisoformat(date_str)
            dt = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # If no timezone info, assume user's timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=user_tz)
        
        # Convert to UTC
        return dt.astimezone(timezone.utc)


# Common timezone mappings for easy reference
COMMON_TIMEZONES = {
    "UTC": 0,
    "America/New_York": -300,  # EST (varies with DST)
    "America/Los_Angeles": -480,  # PST (varies with DST)
    "Europe/London": 0,  # GMT (varies with DST)
    "Asia/Kolkata": 330,  # IST
    "Asia/Tokyo": 540,  # JST
    "Australia/Sydney": 600,  # AEST (varies with DST)
}
