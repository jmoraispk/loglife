from app.db.CRUD.user_goals.get_user_goals import get_user_goals

def format_goals(user_id: str) -> str:
    """
    Format the goals for the user based on their personal goals from the database.
    """

    # get user goals from database
    user_goals = get_user_goals(user_id)
    
    # Format each goal with its description
    goal_lines = []
    for goal in user_goals:
        goal_lines.append(f"{goal['emoji']} {goal['description']}")
    
    return "```" + "\n".join(goal_lines) + "```"