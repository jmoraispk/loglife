from datetime import datetime, timedelta
from storage import load_user_data, save_user_data
from config import GOALS, STYLE, GOAL_DESCRIPTIONS
from typing import Optional

# TODO: if things break, return a better message to the user
# TODO: handle timezones

# TODO: make goals a per-user settings & add bot: set goals

def storage_date_format(date: datetime) -> str:
    """
    Standardize date format for storage/indexing in the database.
    
    Args:
        date (datetime): The date to format
        
    Returns:
        str: Date formatted as YYYY-MM-DD for storage
    """
    return date.strftime('%Y-%m-%d')

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

def process_message(message: str, sender: str) -> str:
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("bot: goals"):
        return format_goals()

    if message.startswith("bot: week"):
        return format_week_summary(user_id)
    
    if message.startswith("bot: lookback"):
        return look_back_summary(user_id, int(message[13:]))

    if message.startswith("bot:"):
        payload = message[4:].strip()
        return handle_goal_ratings(payload, user_id)

    return "❌ Unrecognized message. Use 'bot: 31232' or 'bot: show week'"

def format_goals() -> str:
    """
    Format the goals for the user.
    """
    
    # Format each goal with its description
    goal_lines = []
    for goal, description in GOAL_DESCRIPTIONS.items():
        goal_lines.append(f"{goal} {description}")
    
    return "```" + "\n".join(goal_lines) + "```"

def format_week_summary(user_id: str) -> str:
    """
    Format a week summary for the user.
    
    Args:
        user_id (str): User identifier for data storage
        week_idx (str): If empty shows current week, if "last" shows last week
    
    Returns:
        str: Formatted week summary
    """

    # start = datetime.now() - timedelta(days=datetime.now().weekday())
    start = get_last_monday()
    
    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)    
    week_num = start.strftime('%W')
    week_start = start.strftime('%b %d')
    week_end = (start + timedelta(days=6)).strftime('%b %d')
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]
    
    summary = f"```Week {week_num}: {week_start} - {week_end}\n"
    
    # Add Goals Header
    summary += '    ' + ' '.join(GOALS) + "\n```"

    # Add Day-by-Day Summary
    summary += look_back_summary(user_id, 7, start)
    return summary

def look_back_summary(user_id: str, days: int, start: Optional[datetime] = None) -> str:
    """
    Look back at the summary for the last N days.
    
    Args:
        user_id (str): User identifier for data storage
        days (int): Number of days to look back
        
    Returns:
        str: Formatted week summary
    """
    data = load_user_data(user_id)
    summary = "```"
    if start is None:
        start = datetime.now() - timedelta(days=days)
        days += 1
        summary += f"Last {days} days:\n"

    for i in range(days):
        current_date = start + timedelta(days=i)
        storage_date = storage_date_format(current_date)  # For looking up in data
        display_date = current_date.strftime('%a')  # For display
        
        ratings = data['entries'].get(storage_date, None)
        if ratings:
            status = ' '.join(STYLE[r] for r in ratings)
        else:
            status = ' '.join([' '] * len(GOALS))
        summary += f"{display_date} {status}\n"

    return summary[:-1] + "```"


def handle_goal_ratings(payload: str, user_id: str) -> str:
    """
    Handle goal ratings input from user, validate it and store the ratings.
    
    Args:
        payload (str): String containing goal ratings (must be digits 1-3)
        user_id (str): User identifier for data storage
        
    Returns:
        str: Response message indicating success or error
    """
    # Validate input length
    if len(payload) != len(GOALS):
        return f"❌ Invalid input. Send {len(GOALS)} digits like: 31232"

    # Validate input digits
    if not all(c in "123" for c in payload):
        return f"❌ Invalid input. Send {len(GOALS)} digits between 1 and 3"

    # Store ratings
    ratings = [int(c) for c in payload]
    now = datetime.now()
    today_storage = storage_date_format(now)  # For storage
    today_display = now.strftime('%a (%b %d)')  # For display
    
    data = load_user_data(user_id)
    data['goals'] = GOALS
    data['entries'][today_storage] = ratings
    save_user_data(user_id, data)
    status = [STYLE[r] for r in ratings]

    # Return success message
    return f"📅 {today_display}\n{' '.join(GOALS)}\n{' '.join(status)}"

