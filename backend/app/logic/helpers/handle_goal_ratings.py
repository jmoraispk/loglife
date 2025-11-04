"""Goal rating handling utilities.

This module provides functions for handling user goal ratings input,
validation, and storage in the database.
"""
from datetime import datetime
from app.utils.config import STYLE
<<<<<<< HEAD
from app.db.data_access import get_user_goals
=======
from app.db.data_access.user_goals.get_user_goals import get_user_goals
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)
from app.db.sqlite import get_db
from app.utils.messages import (
    ERROR_NO_GOALS_SET,
    ERROR_USER_NOT_FOUND,
    ERROR_INVALID_INPUT_LENGTH,
    ERROR_INVALID_INPUT_DIGITS,
    ERROR_GOAL_NOT_FOUND_WITH_EMOJI,
    SUCCESS_RATINGS_SUBMITTED
)

def storage_date_format(date: datetime) -> str:
    """
    Standardize date format for storage/indexing in the database.
    
    Args:
        date (datetime): The date to format
        
    Returns:
        str: Date formatted as YYYY-MM-DD for storage
    """
    return date.strftime('%Y-%m-%d')

def handle_goal_ratings(payload: str, user_id: str) -> str:
    """
    Handle goal ratings input from user, validate it and store the ratings.
    
    Args:
        payload (str): String containing goal ratings (must be digits 1-3)
        user_id (str): User identifier for data storage
        
    Returns:
        str: Response message indicating success or error
    """
    # Get user goals to validate input length
    user_goals: list[dict[str, str]] = get_user_goals(user_id)
    
    if not user_goals:
        return ERROR_NO_GOALS_SET
    
    # Validate input length
    if len(payload) != len(user_goals):
        return ERROR_INVALID_INPUT_LENGTH(len(user_goals))

    # Validate input digits
    if not all(c in "123" for c in payload):
        return ERROR_INVALID_INPUT_DIGITS(len(user_goals))

    # Store ratings
    ratings: list[int] = [int(c) for c in payload]
    now: datetime = datetime.now()
    today_storage: str = storage_date_format(now)  # For storage
    today_display: str = now.strftime('%a (%b %d)')  # For display
    
    # Get database connection
    db = get_db()
    
    # Get user ID from database
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return ERROR_USER_NOT_FOUND
    user_id_db: int = user['id']
    
    # Store ratings for each goal
    for i, rating in enumerate(ratings):
        goal: dict[str, str] = user_goals[i]
        goal_emoji: str = goal['emoji']
        
        # Get user_goal_id
        cursor = db.execute("""
            SELECT id FROM user_goals 
            WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
        """, (user_id_db, goal_emoji))
        user_goal = cursor.fetchone()
        if not user_goal:
            return ERROR_GOAL_NOT_FOUND_WITH_EMOJI(goal_emoji)
        user_goal_id: int = user_goal['id']
        
        # Check if rating already exists for today
        cursor = db.execute("""
            SELECT id FROM goal_ratings 
            WHERE user_goal_id = ? AND date = ?
        """, (user_goal_id, today_storage))
        
        if cursor.fetchone():
            # Update existing rating
            db.execute("""
                UPDATE goal_ratings 
                SET rating = ? 
                WHERE user_goal_id = ? AND date = ?
            """, (rating, user_goal_id, today_storage))
        else:
            # Insert new rating
            db.execute("""
                INSERT INTO goal_ratings (user_goal_id, rating, date) 
                VALUES (?, ?, ?)
            """, (user_goal_id, rating, today_storage))
    
    db.commit()
    
    # Get goal emojis for display
    goal_emojis: list[str] = [goal['emoji'] for goal in user_goals]
    status: list[str] = [STYLE[r] for r in ratings]

    # Return success message
    return SUCCESS_RATINGS_SUBMITTED(today_display, goal_emojis, status)