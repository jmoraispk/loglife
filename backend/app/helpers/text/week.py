from datetime import datetime, timedelta
from app.config import LOOKBACK_HEADER, LOOKBACK_NO_GOALS, LOOKBACK_USER_NOT_FOUND, STYLE
from app.db import get_user_goals, get_goal_ratings_for_date


def get_monday_before() -> datetime:
    reference_date: datetime = datetime.now()
    days_since_monday: int = reference_date.weekday()
    return reference_date - timedelta(days=days_since_monday)

def look_back_summary(user_id: int, days: int, start: datetime) -> str:
    summary: str = "```"
    
    # Get user goals to determine how many goals to show
    user_goals: list[dict] = get_user_goals(user_id)
    
    if not user_goals:
        return LOOKBACK_NO_GOALS
    
    for i in range(days):
        current_date: datetime = start + timedelta(days=i)
        storage_date: str = current_date.strftime('%Y-%m-%d')  # For looking up in data
        display_date: str = current_date.strftime('%a')  # For display
        
        # Get ratings for this date
        ratings_data = get_goal_ratings_for_date(user_id, storage_date)
        
        # Create status symbols for each goal
        status_symbols: list[str] = []
        for goal in user_goals:
            # Find rating for this goal
            rating: int | None = None
            for rating_row in ratings_data:
                if rating_row['goal_emoji'] == goal['goal_emoji']:
                    rating = rating_row['rating']
                    break
            
            if rating:
                status_symbols.append(STYLE[rating])
            else:
                status_symbols.append(' ')  # No rating yet
        
        status: str = ' '.join(status_symbols)
        summary += f"{display_date} {status}\n"

    return summary[:-1] + "```"