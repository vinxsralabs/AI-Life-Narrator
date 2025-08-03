from datetime import datetime, timezone
import pytz
from typing import Optional, Union
import os

# Global variable to store user timezone (in a real app, this would be per-user in database)
_user_timezone = 'UTC'

def get_user_timezone() -> str:
    """
    Get the user's timezone from system settings.
    This will automatically detect the user's local timezone.
    """
    global _user_timezone
    
    # Try to get timezone from environment variable first (for testing/override)
    env_timezone = os.getenv('USER_TIMEZONE')
    if env_timezone:
        _user_timezone = env_timezone
        return _user_timezone
    
    return _user_timezone

def set_user_timezone(timezone: str) -> None:
    """
    Set the user's timezone preference
    """
    global _user_timezone
    _user_timezone = timezone

def get_user_timezone_obj() -> timezone:
    """Get the user's timezone object"""
    tz_name = get_user_timezone()
    try:
        return pytz.timezone(tz_name)
    except pytz.exceptions.UnknownTimeZoneError:
        return pytz.UTC

def to_user_timezone(dt: datetime) -> datetime:
    """
    Convert a datetime to the user's local timezone.
    If the datetime is naive (no timezone), assume it's UTC.
    """
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=pytz.UTC)
    
    user_tz = get_user_timezone_obj()
    return dt.astimezone(user_tz)

def from_user_timezone(dt: datetime) -> datetime:
    """
    Convert a datetime from user's local timezone to UTC for storage.
    If the datetime is naive, assume it's in user's timezone.
    """
    if dt.tzinfo is None:
        # Assume it's in user's timezone
        user_tz = get_user_timezone_obj()
        dt = user_tz.localize(dt)
    
    return dt.astimezone(pytz.UTC)

def now_in_user_timezone() -> datetime:
    """Get current time in user's timezone"""
    return datetime.now(get_user_timezone_obj())

def now_utc() -> datetime:
    """Get current time in UTC"""
    return datetime.now(pytz.UTC)

def format_datetime_for_user(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format a datetime for display in user's timezone
    """
    user_dt = to_user_timezone(dt)
    return user_dt.strftime(format_str)

def parse_datetime_from_user(date_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """
    Parse a datetime string from user's timezone and convert to UTC
    """
    user_tz = get_user_timezone_obj()
    dt = datetime.strptime(date_str, format_str)
    dt = user_tz.localize(dt)
    return dt.astimezone(pytz.UTC)

def get_timezone_offset() -> int:
    """
    Get the current timezone offset in seconds from UTC
    """
    user_tz = get_user_timezone_obj()
    now = datetime.now(user_tz)
    return int(now.utcoffset().total_seconds()) if now.utcoffset() else 0 