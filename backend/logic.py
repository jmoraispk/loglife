from datetime import datetime, timedelta
from storage import load_user_data, save_user_data
from config import GOALS, STYLE

# TODO: if things break, return a better message to the user

def process_message(message: str, sender: str) -> str:
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("bot: week"):
        return format_week_summary(user_id)

    if message.startswith("bot:"):
        payload = message[4:].strip()
        return handle_goal_ratings(payload, user_id)

    return "❌ Unrecognized message. Use 'bot: 31232' or 'bot: show week'"

def format_week_summary(user_id: str) -> str:
    """
    Format a week summary for the user.
    
    Args:
        user_id (str): User identifier for data storage
    
    Returns:
        str: Formatted week summary
    """
    today = datetime.now()
    start = today - timedelta(days=today.weekday())  # Monday
    data = load_user_data(user_id)

    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)    
    week_num = start.strftime('%W')
    week_start = start.strftime('%b %d')
    week_end = (start + timedelta(days=6)).strftime('%b %d')
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]
    summary = f"```Week {week_num}: {week_start} - {week_end}\n"
    
    # Add Goals Header
    summary += '    ' + ' '.join(GOALS)

    # Add Day-by-Day Summary
    for i in range(7): # 7 days in a week
        day = (start + timedelta(days=i)).strftime('%Y-%m-%d')
        ratings = data['entries'].get(day, None)
        if ratings:
            status = ' '.join(STYLE[r] for r in ratings)
        else:
            status = ' '.join(['🔲'] * len(GOALS))
        summary += f"\n{(start + timedelta(days=i)).strftime('%a')} {status}"
    return summary + "```"

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
    today = datetime.now().strftime('%a (%b %d)')
    data = load_user_data(user_id)
    data['goals'] = GOALS
    data['entries'][today] = ratings
    save_user_data(user_id, data)
    status = [STYLE[r] for r in ratings]

    # Return success message
    return f"📅 {today}\n{' '.join(GOALS)}\n{' '.join(status)}"

