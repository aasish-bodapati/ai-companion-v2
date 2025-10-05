"""
Centralized timezone handling utilities for health logging applications.
Eliminates duplication of timezone logic across API endpoints.
"""

from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
import pytz


class TimezoneHandler:
    """Centralized timezone handling for health logging applications."""
    
    # Common timezone mappings for better performance
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
        if user_timezone not in TimezoneHandler._timezone_cache:
            try:
                TimezoneHandler._timezone_cache[user_timezone] = pytz.timezone(user_timezone)
            except pytz.exceptions.UnknownTimeZoneError:
                TimezoneHandler._timezone_cache[user_timezone] = pytz.UTC
                
        return TimezoneHandler._timezone_cache[user_timezone]
    
    @staticmethod
    def get_user_timezone_range(date_obj: datetime, user_timezone: str = "UTC") -> Tuple[datetime, datetime]:
        """
        Get start and end of day in user's timezone, converted to UTC for database queries.
        
        Args:
            date_obj: Date to get range for
            user_timezone: User's timezone string
            
        Returns:
            Tuple of (start_of_day_utc, end_of_day_utc)
        """
        user_tz = TimezoneHandler.get_user_timezone(user_timezone)
        
        # Convert the date to user's timezone
        if date_obj.tzinfo is None:
            # If naive datetime, assume it's UTC
            date_obj = pytz.UTC.localize(date_obj)
        
        user_date = date_obj.astimezone(user_tz)
        
        # Get start and end of day in user's timezone
        start_of_day_user = datetime.combine(user_date, datetime.min.time()).replace(tzinfo=user_tz)
        end_of_day_user = datetime.combine(user_date, datetime.max.time()).replace(tzinfo=user_tz)
        
        # Convert to UTC for database queries
        start_of_day_utc = start_of_day_user.astimezone(pytz.UTC)
        end_of_day_utc = end_of_day_user.astimezone(pytz.UTC)
        
        return start_of_day_utc, end_of_day_utc
    
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
            
        user_tz = TimezoneHandler.get_user_timezone(user_timezone)
        
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
            
        user_tz = TimezoneHandler.get_user_timezone(user_timezone)
        
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
    def parse_date_string(date_string: str) -> Optional[datetime]:
        """
        Parse a date string with multiple format support.
        
        Args:
            date_string: Date string to parse
            
        Returns:
            Parsed datetime object or None if invalid
        """
        if not date_string:
            return None
            
        # Try ISO format first (from mobile app)
        try:
            return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except ValueError:
            pass
        
        # Try YYYY-MM-DD format
        try:
            parsed_date = datetime.strptime(date_string, "%Y-%m-%d")
            # Make it timezone-aware (UTC)
            return parsed_date.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
        
        # Try YYYY-MM-DD HH:MM:SS format
        try:
            parsed_date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
            return parsed_date.replace(tzinfo=pytz.UTC)
        except ValueError:
            pass
        
        return None
    
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
            
        user_tz = TimezoneHandler.get_user_timezone(user_timezone)
        user_datetime = utc_datetime.astimezone(user_tz)
        
        return user_datetime.strftime(format_str)
    
    @staticmethod
    def get_common_timezones() -> list:
        """
        Get list of common timezones for user selection.
        
        Returns:
            List of timezone dictionaries with label, value, and offset
        """
        return [
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

    @staticmethod
    def parse_date_string_in_user_timezone(date_string: str, user_timezone: str) -> datetime:
        """
        Parse a date string and interpret it in the user's timezone, then convert to UTC.
        
        Args:
            date_string: Date string in YYYY-MM-DD or ISO format
            user_timezone: User's timezone (e.g., 'Asia/Kolkata')
            
        Returns:
            timezone-aware datetime in UTC
        """
        if not date_string or not user_timezone:
            return None
            
        try:
            # Handle ISO format strings like '2025-10-03T00:00:00.000Z'
            if 'T' in date_string:
                # Extract just the date part (YYYY-MM-DD)
                date_part = date_string.split('T')[0]
            else:
                date_part = date_string
            
            # Parse the date string as a naive datetime
            parsed_date = datetime.strptime(date_part, '%Y-%m-%d')
            
            # Localize to user's timezone
            user_tz = pytz.timezone(user_timezone)
            localized_date = user_tz.localize(parsed_date)
            
            # Convert to UTC
            utc_date = localized_date.astimezone(timezone.utc)
            
            return utc_date
        except ValueError as e:
            raise ValueError(f"Unable to parse date string '{date_string}' in timezone '{user_timezone}': {e}")
