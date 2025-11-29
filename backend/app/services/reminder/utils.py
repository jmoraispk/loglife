"""Reminder service utility functions."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.db import get_rating_by_goal_and_date, get_user_goals


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


def get_goals_not_tracked_today(user_id: int) -> list:
    """Get goals not yet tracked today.

    Args:
        user_id: The unique identifier of the user

    Returns:
        A list of untracked goals for today

    """
    user_goals: list[dict] = get_user_goals(user_id)
    today_str: str = datetime.now(tz=UTC).date().strftime("%Y-%m-%d")
    untracked_goals: list = []

    # exclude journaling goal
    user_goals = [
        goal
        for goal in user_goals
        if goal["goal_emoji"] != "📓" or goal["goal_description"] != "journaling"
    ]

    for goal in user_goals:
        rating: dict | None = get_rating_by_goal_and_date(goal["id"], today_str)
        if rating is None:
            untracked_goals.append(goal)

    return untracked_goals
