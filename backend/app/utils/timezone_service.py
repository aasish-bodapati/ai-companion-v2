"""
Standard timezone service for global users.
Handles timezone conversions and date range calculations properly.
"""

from datetime import datetime, timezone as dt_timezone
from typing import Tuple, Optional
import pytz
from app.models.user import User


class TimezoneService:
    """Service for handling timezone operations for global users."""
    
    # Common timezones for better performance
    _timezone_cache = {}
    
    @staticmethod
    def get_user_timezone(user_timezone: str) -> pytz.BaseTzInfo:
        """
        Get timezone object from user's timezone string.
        
        Args:
            user_timezone: Timezone string (e.g., 'America/New_York', 'Europe/London')
            
        Returns:
            pytz timezone object, defaults to UTC if invalid
        """
        if not user_timezone or user_timezone == "UTC":
            return pytz.UTC
            
        # Use cache for better performance
        if user_timezone not in TimezoneService._timezone_cache:
            try:
                TimezoneService._timezone_cache[user_timezone] = pytz.timezone(user_timezone)
            except pytz.exceptions.UnknownTimeZoneError:
                TimezoneService._timezone_cache[user_timezone] = pytz.UTC
                
        return TimezoneService._timezone_cache[user_timezone]
    
    @staticmethod
    def get_user_date_range(user_timezone: str, date: Optional[datetime] = None) -> Tuple[datetime, datetime]:
        """
        Get start and end of day in user's timezone, converted to UTC for database queries.
        
        Args:
            user_timezone: User's timezone string
            date: Date to get range for (defaults to now)
            
        Returns:
            Tuple of (start_of_day_utc, end_of_day_utc)
        """
        if date is None:
            date = datetime.now(pytz.UTC)
            
        user_tz = TimezoneService.get_user_timezone(user_timezone)
        
        # Convert the date to user's timezone
        if date.tzinfo is None:
            # If naive datetime, assume it's UTC
            date = pytz.UTC.localize(date)
        
        user_date = date.astimezone(user_tz)
        
        # Get start and end of day in user's timezone
        start_of_day = user_tz.localize(
            datetime.combine(user_date.date(), datetime.min.time())
        )
        end_of_day = user_tz.localize(
            datetime.combine(user_date.date(), datetime.max.time())
        )
        
        # Convert to UTC for database queries
        return start_of_day.astimezone(pytz.UTC), end_of_day.astimezone(pytz.UTC)
    
    @staticmethod
    def get_user_week_range(user_timezone: str, date: Optional[datetime] = None) -> Tuple[datetime, datetime]:
        """
        Get start and end of week (Monday to Sunday) in user's timezone, converted to UTC.
        
        Args:
            user_timezone: User's timezone string
            date: Date to get week range for (defaults to now)
            
        Returns:
            Tuple of (start_of_week_utc, end_of_week_utc)
        """
        if date is None:
            date = datetime.now(pytz.UTC)
            
        user_tz = TimezoneService.get_user_timezone(user_timezone)
        
        # Convert the date to user's timezone
        if date.tzinfo is None:
            date = pytz.UTC.localize(date)
            
        user_date = date.astimezone(user_tz)
        
        # Get start of week (Monday)
        days_since_monday = user_date.weekday()
        week_start = user_date - timedelta(days=days_since_monday)
        week_start = user_tz.localize(
            datetime.combine(week_start.date(), datetime.min.time())
        )
        
        # Get end of week (Sunday)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        # Convert to UTC for database queries
        return week_start.astimezone(pytz.UTC), week_end.astimezone(pytz.UTC)
    
    @staticmethod
    def get_user_month_range(user_timezone: str, date: Optional[datetime] = None) -> Tuple[datetime, datetime]:
        """
        Get start and end of month in user's timezone, converted to UTC.
        
        Args:
            user_timezone: User's timezone string
            date: Date to get month range for (defaults to now)
            
        Returns:
            Tuple of (start_of_month_utc, end_of_month_utc)
        """
        if date is None:
            date = datetime.now(pytz.UTC)
            
        user_tz = TimezoneService.get_user_timezone(user_timezone)
        
        # Convert the date to user's timezone
        if date.tzinfo is None:
            date = pytz.UTC.localize(date)
            
        user_date = date.astimezone(user_tz)
        
        # Get start of month
        month_start = user_tz.localize(
            datetime.combine(
                user_date.replace(day=1).date(), 
                datetime.min.time()
            )
        )
        
        # Get end of month
        if user_date.month == 12:
            next_month = user_date.replace(year=user_date.year + 1, month=1, day=1)
        else:
            next_month = user_date.replace(month=user_date.month + 1, day=1)
            
        month_end = user_tz.localize(
            datetime.combine(
                (next_month - timedelta(days=1)).date(),
                datetime.max.time()
            )
        )
        
        # Convert to UTC for database queries
        return month_start.astimezone(pytz.UTC), month_end.astimezone(pytz.UTC)
    
    @staticmethod
    def format_date_for_user(utc_datetime: datetime, user_timezone: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
        """
        Format a UTC datetime for display in user's timezone.
        
        Args:
            utc_datetime: UTC datetime to format
            user_timezone: User's timezone string
            format_str: Format string for the output
            
        Returns:
            Formatted datetime string in user's timezone
        """
        if utc_datetime.tzinfo is None:
            utc_datetime = pytz.UTC.localize(utc_datetime)
            
        user_tz = TimezoneService.get_user_timezone(user_timezone)
        user_datetime = utc_datetime.astimezone(user_tz)
        
        return user_datetime.strftime(format_str)
    
    @staticmethod
    def get_common_timezones() -> list:
        """
        Get list of common timezones for user selection.
        
        Returns:
            List of timezone dictionaries with label, value, and offset
        """
        common_timezones = [
            {"label": "UTC", "value": "UTC", "offset": "UTC+0"},
            {"label": "New York (EST)", "value": "America/New_York", "offset": "UTC-5"},
            {"label": "Los Angeles (PST)", "value": "America/Los_Angeles", "offset": "UTC-8"},
            {"label": "London (GMT)", "value": "Europe/London", "offset": "UTC+0"},
            {"label": "Paris (CET)", "value": "Europe/Paris", "offset": "UTC+1"},
            {"label": "Berlin (CET)", "value": "Europe/Berlin", "offset": "UTC+1"},
            {"label": "Tokyo (JST)", "value": "Asia/Tokyo", "offset": "UTC+9"},
            {"label": "Sydney (AEST)", "value": "Australia/Sydney", "offset": "UTC+10"},
            {"label": "Mumbai (IST)", "value": "Asia/Kolkata", "offset": "UTC+5:30"},
            {"label": "Singapore (SGT)", "value": "Asia/Singapore", "offset": "UTC+8"},
            {"label": "Dubai (GST)", "value": "Asia/Dubai", "offset": "UTC+4"},
            {"label": "São Paulo (BRT)", "value": "America/Sao_Paulo", "offset": "UTC-3"},
        ]
        
        return common_timezones


# Import timedelta for the methods above
from datetime import timedelta
