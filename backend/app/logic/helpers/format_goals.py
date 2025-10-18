from app.db.CRUD.user_goals.get_user_goals import get_user_goals

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
    user_goals = get_user_goals(user_id)
    
    # Format each goal with its description
    goal_lines = []
    for goal in user_goals:
        goal_lines.append(f"{goal['emoji']} {goal['description']}")
    
    return "```" + "\n".join(goal_lines) + "```"