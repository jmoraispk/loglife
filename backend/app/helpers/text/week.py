"""Weekly look-back text helpers for summaries."""

from datetime import datetime, timedelta

from app.config import (
    LOOKBACK_NO_GOALS,
    STYLE,
)
from app.db import get_rating_by_goal_and_date, get_user_goals


def get_monday_before() -> datetime:
    """Calculates the Monday of the current week."""
    reference_date: datetime = datetime.now()
    days_since_monday: int = reference_date.weekday()
    return reference_date - timedelta(days=days_since_monday)


def look_back_summary(user_id: int, days: int, start: datetime) -> str:
    """Builds a multi-day look-back summary for a user's goals.

    Collects the user's goals and ratings, then composes a Markdown-style block
    where each line represents a day and shows the status symbols for all goals.

    Arguments:
    user_id -- The unique identifier of the user
    days -- Number of days to include in the summary
    start -- The starting datetime for the look-back window

    Returns a formatted summary string or a predefined message if no goals exist.

    """
    summary: str = "```"

    # Get user goals to determine how many goals to show
    user_goals: list[dict] = get_user_goals(user_id)

    if not user_goals:
        return LOOKBACK_NO_GOALS

    for i in range(days):
        current_date: datetime = start + timedelta(days=i)
        storage_date: str = current_date.strftime("%Y-%m-%d")  # For looking up in data
        display_date: str = current_date.strftime("%a")  # For display

        # Get ratings for this date
        ratings_data = []
        for user_goal in user_goals:
            user_goal_rating: dict | None = get_rating_by_goal_and_date(
                user_goal["id"], storage_date,
            )
            if user_goal_rating:
                ratings_data.append(
                    {
                        "goal_emoji": user_goal["goal_emoji"],
                        "rating": user_goal_rating["rating"],
                    },
                )
            else:
                ratings_data.append(
                    {"goal_emoji": user_goal["goal_emoji"], "rating": None},
                )

        # Create status symbols for each goal
        status_symbols: list[str] = []
        for goal in user_goals:
            # Find rating for this goal
            rating: int | None = None
            for rating_row in ratings_data:
                if rating_row["goal_emoji"] == goal["goal_emoji"]:
                    rating = rating_row["rating"]
                    break

            if rating:
                status_symbols.append(STYLE[rating])
            else:
                status_symbols.append(" ")  # No rating yet

        status: str = " ".join(status_symbols)
        summary += f"{display_date} {status}\n"

    return summary[:-1] + "```"
