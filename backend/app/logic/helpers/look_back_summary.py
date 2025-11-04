"""Historical goal tracking summary utilities.

This module provides functions for generating formatted summaries
of goal ratings over specified time periods.
"""
from datetime import datetime, timedelta
from app.db.sqlite import get_db
from app.utils.config import STYLE
from app.db.data_access.user_goals.get_user_goals import get_user_goals
from app.utils.messages import (
    LOOKBACK_NO_GOALS,
    LOOKBACK_USER_NOT_FOUND,
    LOOKBACK_HEADER
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

def look_back_summary(user_id: str, days: int, start: datetime | None = None) -> str:
    """
    Look back at the summary for the last N days.
    
    Args:
        user_id (str): User identifier for data storage
        days (int): Number of days to look back
        start (datetime, optional): Start date for the summary
        
    Returns:
        str: Formatted summary
    """
    summary: str = "```"
    if start is None:
        start = datetime.now() - timedelta(days=days-1)  # Include today
        summary += LOOKBACK_HEADER(days)

    # Get user goals to determine how many goals to show
    user_goals: list[dict[str, str]] = get_user_goals(user_id)
    
    if not user_goals:
        return LOOKBACK_NO_GOALS()
    
    # Get user ID from database
    db = get_db()
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return LOOKBACK_USER_NOT_FOUND
    user_id_db: int = user['id']
    
    for i in range(days):
        current_date: datetime = start + timedelta(days=i)
        storage_date: str = storage_date_format(current_date)  # For looking up in data
        display_date: str = current_date.strftime('%a')  # For display
        
        # Get ratings for this date
        cursor = db.execute("""
            SELECT ug.goal_emoji, gr.rating
            FROM user_goals ug
            LEFT JOIN goal_ratings gr ON ug.id = gr.user_goal_id AND gr.date = ?
            WHERE ug.user_id = ? AND ug.is_active = 1
            ORDER BY ug.created_at
        """, (storage_date, user_id_db))
        
        ratings_data = cursor.fetchall()
        
        # Create status symbols for each goal
        status_symbols: list[str] = []
        for goal in user_goals:
            # Find rating for this goal
            rating: int | None = None
            for rating_row in ratings_data:
                if rating_row['goal_emoji'] == goal['emoji']:
                    rating = rating_row['rating']
                    break
            
            if rating:
                status_symbols.append(STYLE[rating])
            else:
                status_symbols.append(' ')  # No rating yet
        
        status: str = ' '.join(status_symbols)
        summary += f"{display_date} {status}\n"

    return summary[:-1] + "```"