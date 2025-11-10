"""Individual goal rating utilities.

This module provides functions for rating individual goals for users
with validation and database storage.
"""
from datetime import datetime
from app.db.sqlite import get_db
from app.utils.config import STYLE
from app.db.data_access import get_user_goals
from app.utils.messages import (
    ERROR_RATING_INVALID,
    ERROR_NO_GOALS_ADD_FIRST,
    ERROR_GOAL_NUMBER_RANGE,
    ERROR_USER_NOT_FOUND,
    ERROR_GOAL_NOT_FOUND,
    SUCCESS_INDIVIDUAL_RATING
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

def rate_individual_goal(user_id: str, goal_number: int, rating: int) -> str:
    """
    Rate a specific goal for the user.
    
    Args:
        user_id (str): User identifier
        goal_number (int): Goal number (1-based index)
        rating (int): Rating (1-3)
        
    Returns:
        str: Success or error message
    """
    # Validate rating
    if rating not in [1, 2, 3]:
        return ERROR_RATING_INVALID
    
    db = get_db()
    
    # Get user's goals
    user_goals: list[dict[str, str]] = get_user_goals(user_id)
    
    if not user_goals:
        return ERROR_NO_GOALS_ADD_FIRST
    
    # Validate goal number
    if goal_number < 1 or goal_number > len(user_goals):
        return ERROR_GOAL_NUMBER_RANGE(len(user_goals))
    
    # Get the specific goal
    goal: dict[str, str] = user_goals[goal_number - 1]  # Convert to 0-based index
    goal_emoji: str = goal['emoji']
    goal_description: str = goal['description']
    
    # Get user ID from database
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return ERROR_USER_NOT_FOUND
    user_id_db: int = user['id']
    
    # Get user_goal_id
    cursor = db.execute("""
        SELECT id FROM user_goals 
        WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
    """, (user_id_db, goal_emoji))
    user_goal = cursor.fetchone()
    if not user_goal:
        return ERROR_GOAL_NOT_FOUND
    user_goal_id: int = user_goal['id']
    
    # Store or update rating
    today: str = storage_date_format(datetime.now())
    today_display: str = datetime.now().strftime('%a (%b %d)')
    
    # Check if rating already exists for today
    cursor = db.execute("""
        SELECT id FROM goal_ratings 
        WHERE user_goal_id = ? AND date = ?
    """, (user_goal_id, today))
    
    if cursor.fetchone():
        # Update existing rating
        db.execute("""
            UPDATE goal_ratings 
            SET rating = ? 
            WHERE user_goal_id = ? AND date = ?
        """, (rating, user_goal_id, today))
    else:
        # Insert new rating
        db.execute("""
            INSERT INTO goal_ratings (user_goal_id, rating, date) 
            VALUES (?, ?, ?)
        """, (user_goal_id, rating, today))
    
    db.commit()
    
    status_symbol: str = STYLE[rating]
    return SUCCESS_INDIVIDUAL_RATING(today_display, goal_emoji, goal_description, status_symbol)
