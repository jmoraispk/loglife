"""User timezone detection and management utilities.

This module provides functions for detecting user timezones from phone numbers,
saving them to the database, and updating existing user timezone information.
It integrates with the timezone_helper module to perform actual timezone detection.
"""
import logging
import datetime
from app.helpers.timezone_helper import get_timezone_from_number


def detect_user_timezone(user_phone: str) -> str | None:
    """
    Detect timezone from user phone number.
    
    Args:
        user_phone (str): User's phone number (may include @c.us)
        
    Returns:
        str: Detected timezone or None if failed
    """
    try:
        logging.debug(f"[TIMEZONE] Starting timezone detection for: {user_phone}")
        
        # Format phone number: remove @c.us suffix if present
        formatted_phone = user_phone
        if "@c.us" in user_phone:
            formatted_phone = user_phone.split("@c.us")[0]
        
        logging.debug(f"[TIMEZONE] Formatted phone: {formatted_phone}")
        
        # Get timezone from phone number
        timezone_result = get_timezone_from_number(formatted_phone)
        logging.debug(f"[TIMEZONE] Raw timezone result: {timezone_result}")
        
        # Handle timezone result
        if "unknown" in timezone_result.lower():
            # Use system timezone as fallback
            system_tz = datetime.datetime.now().astimezone().tzinfo
            timezone = str(system_tz)
            logging.debug(f"[TIMEZONE] Using system timezone for {user_phone}: {timezone}")
        else:
            # Handle multiple timezones - take first one
            if ", " in timezone_result:
                timezone = timezone_result.split(", ")[0]
                logging.debug(f"[TIMEZONE] Multiple timezones found, using first: {timezone}")
            else:
                timezone = timezone_result
                logging.debug(f"[TIMEZONE] Single timezone found: {timezone}")
        
        return timezone
        
    except Exception as e:
        logging.error(f"[TIMEZONE] Failed to detect timezone for {user_phone}: {str(e)}")
        return None


def save_user_timezone(user_phone: str, timezone: str, db_cursor, db) -> bool:
    """
    Save timezone to database for a user.
    
    Args:
        user_phone (str): User's phone number
        timezone (str): Timezone to save
        db_cursor: Database cursor
        db: Database connection
        
    Returns:
        bool: True if saved successfully, False otherwise
    """
    try:
        db_cursor.execute("UPDATE user SET timezone = ? WHERE phone = ?", (timezone, user_phone))
        db.commit()
        logging.debug(f"[TIMEZONE] Successfully saved timezone {timezone} for {user_phone}")
        return True
        
    except Exception as e:
        logging.error(f"[TIMEZONE] Failed to save timezone for {user_phone}: {str(e)}")
        return False


def update_existing_user_timezone(user_phone, db_cursor, db):
    """
    Update timezone for existing user who doesn't have timezone set.
    
    Args:
        user_phone (str): User's phone number
        db_cursor: Database cursor
        db: Database connection
        
    Returns:
        bool: True if updated, False otherwise
    """
    try:
        # Check if user exists and has no timezone
        db_cursor.execute("SELECT id, timezone FROM user WHERE phone = ?", (user_phone,))
        user = db_cursor.fetchone()
        
        if not user:
            logging.debug(f"[TIMEZONE] User {user_phone} not found")
            return False
            
        if user[1] is not None:  # timezone is not NULL
            logging.debug(f"[TIMEZONE] User {user_phone} already has timezone: {user[1]}")
            return True
            
        logging.debug(f"[TIMEZONE] Updating timezone for existing user: {user_phone}")
        timezone = detect_user_timezone(user_phone)
        if timezone:
            return save_user_timezone(user_phone, timezone, db_cursor, db)
        return False
        
    except Exception as e:
        logging.error(f"[TIMEZONE] Failed to update timezone for existing user {user_phone}: {str(e)}")
        return False
