"""Week summary formatting utilities.

This module provides functions for formatting and displaying weekly
goal tracking summaries for users.
"""
from datetime import datetime, timedelta
from app.logic.helpers.look_back_summary import look_back_summary
<<<<<<< HEAD
from app.db.data_access import get_user_goals
=======
from app.db.data_access.user_goals.get_user_goals import get_user_goals
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)

def get_monday_before(date: datetime | None = None) -> datetime:
    """
    Get the Monday on or before the given date.

    Args:
        date (datetime, optional): Reference date. Defaults to current date/time.

    Returns:
        datetime: Monday of the same week if the date is a Monday; otherwise the previous Monday.
    """
    reference_date: datetime = date if date else datetime.now()
    days_since_monday: int = reference_date.weekday()  # Monday is 0, Sunday is 6
    return reference_date - timedelta(days=days_since_monday)

def format_week_summary(user_id: str) -> str:
    """
    Format a week summary for the user.
    
    Args:
        user_id (str): User identifier for data storage
    
    Returns:
        str: Formatted week summary
    """
    start: datetime = get_monday_before()
    
    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)    
    week_num: str = start.strftime('%W')
    week_start: str = start.strftime('%b %d')
    week_end: str = (start + timedelta(days=6)).strftime('%b %d')
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]
    
    summary: str = f"```Week {week_num}: {week_start} - {week_end}\n"
    
    # Add Goals Header - we'll need to get user goals dynamically
    user_goals: list[dict[str, str]] = get_user_goals(user_id)
    goal_emojis: list[str] = [goal['emoji'] for goal in user_goals]
    summary += '    ' + ' '.join(goal_emojis) + "\n```"

    # Add Day-by-Day Summary
    summary += look_back_summary(user_id, 7, start)
    return summary