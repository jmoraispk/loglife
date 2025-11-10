"""User data access functions.

This module provides CRUD operations for user management, including
user creation and retrieval with automatic timezone detection.
"""
from app.db.sqlite import fetch_one, execute_query, get_db
from app.helpers.user_timezone import detect_user_timezone, save_user_timezone, update_existing_user_timezone


def get_or_create_user(user_phone: str) -> int:
    """
    Get existing user or create new user if not found.
    
    Automatically handles user creation and timezone detection for new users.
    Also updates timezone for existing users if not set.
    
    Args:
        user_phone (str): User's phone number identifier
    
    Returns:
        int: Database user ID
    """
    user = fetch_one("SELECT id FROM user WHERE phone = ?", (user_phone,))
    
    if not user:
        # Create user if doesn't exist
        cursor = execute_query("INSERT INTO user (phone) VALUES (?)", (user_phone,))
        user_id_db = cursor.lastrowid
        
        # Detect and save timezone for new user
        db = get_db()
        db_cursor = db.cursor()
        timezone = detect_user_timezone(user_phone)
        if timezone:
            save_user_timezone(user_phone, timezone, db_cursor, db)
    else:
        user_id_db = user['id']
        
        # Check and update timezone for existing user if not set
        db = get_db()
        db_cursor = db.cursor()
        update_existing_user_timezone(user_phone, db_cursor, db)
    
    return user_id_db

