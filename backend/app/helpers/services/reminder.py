from datetime import date
from app.db import get_user_goals, get_rating_by_goal_and_date
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

def get_timezone_safe(timezone_str: str) -> ZoneInfo:
    """Get ZoneInfo, falling back to UTC if timezone is invalid or unknown.

    Arguments:
    timezone_str -- Timezone string in IANA format (e.g., "Asia/Karachi", "America/New_York")

    Returns a ZoneInfo object for the given timezone string, or UTC if the timezone is invalid or unknown.
    """
    timezone_str = timezone_str.strip()
    try:
        return ZoneInfo(timezone_str)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")

# get goals not yet tracked today
def get_goals_not_tracked_today(user_id: int) -> list:
    user_goals: list[dict] = get_user_goals(user_id)
    today_str: str = date.today().strftime("%Y-%m-%d")
    untracked_goals: list = []
    
    # exclude journaling goal
    user_goals = [goal for goal in user_goals if goal['goal_emoji'] != "📓" or goal['goal_description'] != "journaling"]
    
    for goal in user_goals:
        rating: dict | None = get_rating_by_goal_and_date(goal['id'], today_str)
        if rating is None:
            untracked_goals.append(goal)
    
    return untracked_goals