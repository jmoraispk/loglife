from .sqlite import init_db, connect
from .operations import (
    get_user,
    create_user,
    get_user_goals,
    create_goal,
    get_user_by_phone_number,
    create_rating,
    get_rating_by_goal_and_date,
    update_rating,
    create_referral,
    get_all_goal_reminders,
    get_goal,
    create_user_state,
    get_user_state,
    create_goal_reminder,
    delete_user_state,
    create_audio_journal_entry,
)

__all__ = [
    # SQLite functions
    "init_db",
    "connect",
    # User operations
    "get_user",
    "create_user",
    "get_user_goals",
    "create_goal",
    "get_user_by_phone_number",
    "create_rating",
    "get_rating_by_goal_and_date",
    "update_rating",
    "create_referral",
    "get_all_goal_reminders",
    "get_goal",
    "create_user_state",
    "get_user_state",
    "create_goal_reminder",
    "delete_user_state",
    "create_audio_journal_entry",
]
