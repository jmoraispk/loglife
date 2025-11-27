"""Utility function to retrieve the journaling goal ID for a user."""

from app.db import get_user_goals


def get_journal_goal_id(user_id: int) -> int | None:
    """Retrieves the journaling goal ID for a user.
    
    Checks if the user has a journaling goal (identified by emoji "📓" 
    and description "journaling") and returns its ID if found.
    
    Arguments:
    user_id -- The unique identifier of the user
    
    Returns the goal ID if journaling goal exists, None otherwise.

    """
    user_goals = get_user_goals(user_id)
    for goal in user_goals:
        if goal["goal_emoji"] == "📓" and goal["goal_description"] == "journaling":
            return goal["id"]
    return None
