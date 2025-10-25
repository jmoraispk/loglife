"""Goal management helper functions.

This module provides functions for adding and managing user goals.
"""
import re
from app.db.sqlite import get_db
from app.utils.messages import (
    DEFAULT_GOAL_EMOJI,
    ERROR_GOAL_ALREADY_EXISTS,
    SUCCESS_GOAL_ADDED
)
from app.helpers.state_manager import set_user_state
from app.helpers.time_parser import parse_reminder_time, format_time_for_display

def add_goal(user_id: str, goal_string: str) -> str:
    """
    Add a new goal for the user.
    
    Args:
        user_id (str): User identifier
        goal_string (str): Complete goal string with emoji and description
        
    Returns:
        str: Success or error message
    """
    # Separate emoji from text - find emoji anywhere in the string
    # Simple emoji detection - look for emoji characters anywhere in the string
    emoji_pattern: str = r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000026FF\U00002700-\U000027BF\U0001F900-\U0001F9FF\U0001FA70-\U0001FAFF\U0001F018-\U0001F0F5\U0001F200-\U0001F2FF]+'
    match: re.Match[str] | None = re.search(emoji_pattern, goal_string)
    
    if match:
        goal_emoji: str = match.group(0)
        # Remove the emoji from the original string
        goal_description: str = re.sub(emoji_pattern, '', goal_string).strip()
    else:
        # If no emoji found, use default and treat whole string as description
        goal_emoji = DEFAULT_GOAL_EMOJI
        goal_description = goal_string.strip()
    db = get_db()
    
    # First, get or create the user
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        # Create user if doesn't exist
        cursor = db.execute("INSERT INTO user (phone) VALUES (?)", (user_id,))
        db.commit()
        user_id_db: int = cursor.lastrowid
    else:
        user_id_db: int = user['id']
    
    # Check if goal already exists for this user
    cursor = db.execute("""
        SELECT id FROM user_goals 
        WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
    """, (user_id_db, goal_emoji))
    
    if cursor.fetchone():
        return ERROR_GOAL_ALREADY_EXISTS(goal_emoji)
    
    # Add the new goal (without reminder time initially)
    cursor = db.execute("""
        INSERT INTO user_goals (user_id, goal_emoji, goal_description, reminder_time) 
        VALUES (?, ?, ?, NULL)
    """, (user_id_db, goal_emoji, goal_description))
    goal_id = cursor.lastrowid
    db.commit()
    
    # Set user state to wait for reminder time
    set_user_state(user_id, 'waiting_for_reminder_time', str(goal_id))
    
    return f"✅ Goal added: {goal_emoji} {goal_description}\n\n⏰ What time should I remind you daily? (e.g., 18:00, 6 PM, 6pm)"


def set_reminder_time(user_id: str, time_input: str, goal_id: str) -> str:
    """
    Set reminder time for a goal.
    
    Args:
        user_id (str): User identifier
        time_input (str): User's time input
        goal_id (str): Goal ID to update
        
    Returns:
        str: Success or error message
    """
    # Parse the time input
    parsed_time = parse_reminder_time(time_input)
    
    if not parsed_time:
        return "❌ Invalid time format. Please use formats like: 18:00, 6 PM, 6pm, or 6"
    
    try:
        db = get_db()
        cursor = db.execute("""
            UPDATE user_goals 
            SET reminder_time = ? 
            WHERE id = ? AND user_id = (
                SELECT id FROM user WHERE phone = ?
            )
        """, (parsed_time, goal_id, user_id))
        
        if cursor.rowcount == 0:
            return "❌ Goal not found or you don't have permission to update it."
        
        db.commit()
        
        # Clear user state
        from app.helpers.state_manager import clear_user_state
        clear_user_state(user_id)
        
        formatted_time = format_time_for_display(parsed_time)
        return f"✅ Reminder set for {formatted_time} daily!\n\nYour goal is now active with daily reminders."
        
    except Exception as e:
        return f"❌ Failed to set reminder time: {str(e)}"
