"""Goal formatting utilities.

This module provides functions for formatting and displaying user goals
in a readable format.
"""
<<<<<<< HEAD
from app.db.data_access import get_user_goals
=======
from app.db.data_access.user_goals.get_user_goals import get_user_goals
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)

def format_goals(user_id: str) -> str:
    """Format user goals for display.
    
    Retrieves user goals from the database and formats them as a readable list
    with emojis and descriptions.

    Args:
        user_id (str): User identifier for retrieving goals

    Returns:
        str: Formatted goals list wrapped in code blocks
    """

    # get user goals from database
    user_goals: list[dict[str, str]] = get_user_goals(user_id)
    
    # Format each goal with its description
    goal_lines: list[str] = []
    for goal in user_goals:
        goal_lines.append(f"{goal['emoji']} {goal['description']}")
    
    return "```" + "\n".join(goal_lines) + "```"