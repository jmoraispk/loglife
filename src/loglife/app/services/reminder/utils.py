"""Reminder service utility functions."""

from datetime import UTC, datetime

from loglife.app.db.client import db
from loglife.app.db.tables import Goal, Rating


def get_goals_not_tracked_today(user_id: int) -> list[Goal]:
    """Get goals not yet tracked today.

    Arguments:
        user_id: The unique identifier of the user

    Returns:
        A list of untracked goals for today

    """
    user_goals: list[Goal] = db.goals.get_by_user(user_id)
    today_str: str = datetime.now(tz=UTC).date().strftime("%Y-%m-%d")
    untracked_goals: list[Goal] = []

    # exclude journaling goal
    filtered_goals = [
        goal
        for goal in user_goals
        if goal.goal_emoji != "📓" or goal.goal_description != "journaling"
    ]

    for goal in filtered_goals:
        rating: Rating | None = db.ratings.get_by_goal_and_date(goal.id, today_str)
        if rating is None:
            untracked_goals.append(goal)

    return untracked_goals
