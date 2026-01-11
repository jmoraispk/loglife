"""Background worker for checking and sending scheduled reminders.

Runs a minutely job to check if any user reminders are due for their timezone.
"""

import logging
import threading
import time
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from loglife.app.config import (
    JOURNAL_REMINDER_MESSAGE,
    REMINDER_MESSAGE,
    messages,
)
from loglife.app.db import db
from loglife.app.db.tables import Goal, User
from loglife.app.services.reminder.utils import get_goals_not_tracked_today
from loglife.core.messaging import queue_async_message

logger = logging.getLogger(__name__)

WORKER_SLEEP_SECONDS = 60


def get_timezone_safe(timezone_str: str) -> ZoneInfo:
    """Get ZoneInfo, falling back to UTC if timezone is invalid or unknown.

    Arguments:
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


def _is_reminder_due(goal: Goal, user: User, now_utc: datetime) -> bool:
    """Check if a reminder is due at the current time for the user's timezone."""
    if not goal.reminder_time:
        return False

    tz = get_timezone_safe(user.timezone)
    local_now = now_utc.astimezone(tz)

    try:
        # reminder_time is likely a string "HH:MM:SS" or datetime
        time_parts = str(goal.reminder_time).split(":")
        rem_hour = int(time_parts[0])
        rem_minute = int(time_parts[1])
    except (ValueError, IndexError):
        logger.warning(
            "Invalid reminder time format for goal %s: %s",
            goal.id,
            goal.reminder_time,
        )
        return False

    return local_now.hour == rem_hour and local_now.minute == rem_minute


def _build_journal_reminder_message(user_id: int) -> str:
    """Construct the journaling reminder message, listing untracked goals if any."""
    goals_not_tracked = get_goals_not_tracked_today(user_id)

    if not goals_not_tracked:
        return JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")

    goals_list = "\n".join([f"- {goal.goal_description}" for goal in goals_not_tracked])
    replacement = f"{messages.REMINDER_UNTRACKED_HEADER}{goals_list}"

    return JOURNAL_REMINDER_MESSAGE.replace("<goals_not_tracked_today>", replacement)


def _build_standard_reminder_message(goal: Goal) -> str:
    """Construct a standard reminder message for a specific goal."""
    return REMINDER_MESSAGE.replace("<goal_emoji>", goal.goal_emoji).replace(
        "<goal_description>",
        goal.goal_description,
    )


def _process_due_reminder(user: User, goal: Goal) -> None:
    """Process a due reminder by fetching the goal and sending the notification."""
    is_journaling = goal.goal_emoji == "📓" and goal.goal_description == "journaling"

    if is_journaling:
        message = _build_journal_reminder_message(user.id)
    else:
        message = _build_standard_reminder_message(goal)

    queue_async_message(user.phone_number, message, client_type=user.client_type)
    logger.info(
        "Sent reminder '%s' to %s",
        goal.goal_description,
        user.phone_number,
    )


def _check_reminders() -> None:
    """Check all reminders and send notifications when scheduled time matches."""
    goals_with_reminders: list[Goal] = db.goals.get_all_with_reminders()
    if not goals_with_reminders:
        return

    # Batch fetch all users to avoid N+1 queries
    users_map: dict[int, User] = {user.id: user for user in db.users.get_all()}
    now_utc: datetime = datetime.now(UTC)

    for goal in goals_with_reminders:
        user = users_map.get(goal.user_id)
        if not user:
            continue

        if _is_reminder_due(goal, user, now_utc):
            _process_due_reminder(user, goal)


def _reminder_worker() -> None:
    """Run daemonized worker loop for checking and sending reminders."""
    while True:
        try:
            _check_reminders()
        except Exception:
            logger.exception("Unhandled error while checking reminders")

        # Sleep for 60 seconds.
        # We rely on _is_reminder_due matching the Hour:Minute of the current time.
        time.sleep(WORKER_SLEEP_SECONDS)


def start_reminder_service() -> threading.Thread:
    """Start the reminder service in a daemon thread."""
    t: threading.Thread = threading.Thread(
        target=_reminder_worker,
        daemon=True,
    )
    t.start()
    logger.info("Reminder service thread %s started (daemon=%s)", t.name, t.daemon)
    return t
