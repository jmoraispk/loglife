"""Reminder service utility functions."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.db.client import db
from app.db.tables.goals import Goal
from app.db.tables.ratings import Rating


def get_timezone_safe(timezone_str: str) -> ZoneInfo:
    """Get ZoneInfo, falling back to UTC if timezone is invalid or unknown.

    Args:
        timezone_str: Timezone string in IANA format (e.g., "Asia/Karachi",
            "America/New_York")

    Returns:
        A ZoneInfo object for the given timezone string, or UTC if the timezone
        is invalid or unknown.

    """
    timezone_str = timezone_str.strip()
    try:
        return ZoneInfo(timezone_str)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def get_goals_not_tracked_today(user_id: int) -> list[dict]:
    """Get goals not yet tracked today.

    Args:
        user_id: The unique identifier of the user

    Returns:
        A list of untracked goals for today

    """
    user_goals: list[Goal] = db.goals.get_by_user(user_id)
    today_str: str = datetime.now(tz=UTC).date().strftime("%Y-%m-%d")
    untracked_goals: list[dict] = []

    # exclude journaling goal
    filtered_goals = [
        goal
        for goal in user_goals
        if goal.goal_emoji != "📓" or goal.goal_description != "journaling"
    ]

    for goal in filtered_goals:
        rating: Rating | None = db.ratings.get_by_goal_and_date(goal.id, today_str)
        if rating is None:
            # Returning as dict because the caller expects dict access for now, 
            # or we should update caller to use object access. 
            # The handler accessing this is JournalPromptsHandler which does:
            # f"- {goal['goal_description']}"
            # So we should update this to return dict or update handler to use object.
            # Let's update this to return dict to minimize changes or we update handler
            # handler already updated to use object attributes? 
            # Let's check JournalPromptsHandler in handlers.py
            # It does: [f"- {goal['goal_description']}" for goal in goals_not_tracked_today]
            # wait, I might have missed updating that line in handler. Let's check.
            untracked_goals.append({
                "goal_description": goal.goal_description,
                "goal_emoji": goal.goal_emoji,
                "id": goal.id
            })

    return untracked_goals
