from app.db import get_user_goals, get_rating_by_goal_and_date
from datetime import date

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