from app.logic.helpers.format_goals import format_goals
from app.logic.helpers.format_week_summary import format_week_summary
from app.logic.helpers.look_back_summary import look_back_summary
from app.logic.helpers.handle_goal_ratings import handle_goal_ratings
from app.logic.helpers.add_goal import add_goal
from app.logic.helpers.rate_individual_goal import rate_individual_goal
from app.logic.helpers.show_help import show_help

def process_message(message: str, sender: str) -> str:
    """Process incoming messages and route to appropriate handlers.
    
    Parses user messages and routes them to the appropriate command handlers
    based on message content. Supports goals, ratings, summaries, and help commands.

    Args:
        message (str): The message text from the user
        sender (str): User identifier (phone number or group ID)

    Returns:
        str: Response message to send back to the user
    """
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("help"):
        return show_help()
    
    if message.startswith("goals"):
        return format_goals(user_id)
    
    if message.startswith("week"):
        return format_week_summary(user_id)
    
    if message.startswith("lookback"):
        # Extract number of days from message (e.g., "lookback 5" or "lookback")
        parts = message.split()
        if len(parts) > 1 and parts[1].isdigit():
            days = int(parts[1])
        else:
            days = 7  # Default to 7 days
        return look_back_summary(user_id, days)
    
    if message.startswith("add goal"):
        # Extract the complete goal string (e.g., "add goal 😴 Sleep by 9pm")
        parts = message.split(" ", 2)  # Split into max 3 parts
        if len(parts) >= 3:
            goal_string = parts[2]  # Everything after "add goal"
            return add_goal(user_id, goal_string)
        else:
            return "❌ Usage: add goal 😴 Sleep by 9pm"
    
    if message.startswith("rate"):
        # Extract goal number and rating (e.g., "rate 2 3")
        parts = message.split()
        if len(parts) == 3 and parts[1].isdigit() and parts[2].isdigit():
            goal_number = int(parts[1])
            rating = int(parts[2])
            return rate_individual_goal(user_id, goal_number, rating)
        else:
            return "❌ Usage: rate 2 3 (goal number and rating 1-3)"
    
    # Handle goal ratings (digits 1-3) - rate all goals at once
    if message.isdigit() and all(c in "123" for c in message):
        return handle_goal_ratings(message, user_id)

    return "❌ Unrecognized message. Type 'help' to see available commands."