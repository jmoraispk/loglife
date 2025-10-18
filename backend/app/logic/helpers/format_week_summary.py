from datetime import datetime, timedelta
from app.logic.helpers.look_back_summary import look_back_summary

def get_last_monday(from_date: datetime = None) -> datetime:
    """
    Get the date of the most recent past Monday.
    
    Args:
        from_date (datetime, optional): Reference date. Defaults to current date.
        
    Returns:
        datetime: Date of the last Monday (if today is Monday, returns today)
    """
    reference_date = from_date if from_date else datetime.now()
    days_since_monday = reference_date.weekday()  # Monday is 0, Sunday is 6
    return reference_date - timedelta(days=days_since_monday)

def format_week_summary(user_id: str) -> str:
    """
    Format a week summary for the user.
    
    Args:
        user_id (str): User identifier for data storage
    
    Returns:
        str: Formatted week summary
    """
    start = get_last_monday()
    
    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)    
    week_num = start.strftime('%W')
    week_start = start.strftime('%b %d')
    week_end = (start + timedelta(days=6)).strftime('%b %d')
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]
    
    summary = f"```Week {week_num}: {week_start} - {week_end}\n"
    
    # Add Goals Header - we'll need to get user goals dynamically
    from app.db.CRUD.user_goals.get_user_goals import get_user_goals
    user_goals = get_user_goals(user_id)
    goal_emojis = [goal['emoji'] for goal in user_goals]
    summary += '    ' + ' '.join(goal_emojis) + "\n```"

    # Add Day-by-Day Summary
    summary += look_back_summary(user_id, 7, start)
    return summary