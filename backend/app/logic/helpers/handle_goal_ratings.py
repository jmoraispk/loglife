from datetime import datetime
from app.utils.config import STYLE

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
    from app.db.CRUD.user_goals.get_user_goals import get_user_goals
    user_goals = get_user_goals(user_id)
    
    if not user_goals:
        return "❌ No goals set. Please set goals first."
    
    # Validate input length
    if len(payload) != len(user_goals):
        return f"❌ Invalid input. Send {len(user_goals)} digits like: 31232"

    # Validate input digits
    if not all(c in "123" for c in payload):
        return f"❌ Invalid input. Send {len(user_goals)} digits between 1 and 3"

    # Store ratings
    ratings = [int(c) for c in payload]
    now = datetime.now()
    today_storage = storage_date_format(now)  # For storage
    today_display = now.strftime('%a (%b %d)')  # For display
    
    # TODO: Store ratings in database using the new schema
    # For now, we'll return a success message with the ratings
    
    # Get goal emojis for display
    goal_emojis = [goal['emoji'] for goal in user_goals]
    status = [STYLE[r] for r in ratings]

    # Return success message
    return f"📅 {today_display}\n{' '.join(goal_emojis)}\n{' '.join(status)}"
