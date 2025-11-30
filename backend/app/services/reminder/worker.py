"""Reminder service worker logic."""

from __future__ import annotations

import logging
import threading
import time
from datetime import UTC, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.tables import Goal, Reminder, User

from app.config import JOURNAL_REMINDER_MESSAGE, REMINDER_MESSAGE
from app.db.client import db
from app.services.reminder.utils import get_goals_not_tracked_today, get_timezone_safe
from app.services.sender import send_message

logger = logging.getLogger(__name__)

MIN_WAIT_SECONDS = 10
MAX_WAIT_SECONDS = 60


def _is_reminder_due(reminder: Reminder, user: User, now_utc: datetime) -> bool:
    """Check if a reminder is due at the current time for the user's timezone."""
    tz = get_timezone_safe(user.timezone)
    local_now = now_utc.astimezone(tz)

    try:
        time_parts = str(reminder.reminder_time).split(":")
        rem_hour = int(time_parts[0])
        rem_minute = int(time_parts[1])
    except (ValueError, IndexError):
        logger.warning(
            "Invalid reminder time format for reminder %s: %s",
            reminder.id,
            reminder.reminder_time,
        )
        return False

    return local_now.hour == rem_hour and local_now.minute == rem_minute


def _build_journal_reminder_message(user_id: int) -> str:
    """Construct the journaling reminder message, listing untracked goals if any."""
    goals_not_tracked = get_goals_not_tracked_today(user_id)

    if not goals_not_tracked:
        return JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")

    goals_list = "\n".join([f"- {goal.goal_description}" for goal in goals_not_tracked])
    replacement = f"- *Did you complete the goals?*\n{goals_list}"

    return JOURNAL_REMINDER_MESSAGE.replace("<goals_not_tracked_today>", replacement)


def _build_standard_reminder_message(goal: Goal) -> str:
    """Construct a standard reminder message for a specific goal."""
    return REMINDER_MESSAGE.replace("<goal_emoji>", goal.goal_emoji).replace(
        "<goal_description>", goal.goal_description
    )


def _process_due_reminder(user: User, reminder: Reminder) -> None:
    """Process a due reminder by fetching the goal and sending the notification."""
    user_goal: Goal | None = db.goals.get(reminder.user_goal_id)
    if not user_goal:
        return

    is_journaling = user_goal.goal_emoji == "📓" and user_goal.goal_description == "journaling"

    if is_journaling:
        message = _build_journal_reminder_message(user.id)
    else:
        message = _build_standard_reminder_message(user_goal)

    send_message(user.phone_number, message)
    logger.info(
        "Sent reminder '%s' to %s",
        user_goal.goal_description,
        user.phone_number,
    )


def _check_reminders() -> None:
    """Check all reminders and send notifications when scheduled time matches."""
    reminders: list[Reminder] = db.reminders.get_all()
    if not reminders:
        return

    # Batch fetch all users to avoid N+1 queries
    users_map: dict[int, User] = {user.id: user for user in db.users.get_all()}
    now_utc: datetime = datetime.now(UTC)

    for reminder in reminders:
        user = users_map.get(reminder.user_id)
        if not user:
            continue

        if _is_reminder_due(reminder, user, now_utc):
            _process_due_reminder(user, reminder)


def _reminder_worker() -> None:
    """Run daemonized worker loop for checking and sending reminders."""
    while True:
        # Calculate seconds until the start of the next minute
        now = datetime.now(UTC)
        sleep_seconds = 60 - now.second + 0.5  # +0.5s buffer to land in next minute
        logger.debug("Reminder worker sleeping for %.2f seconds", sleep_seconds)
        time.sleep(sleep_seconds)

        try:
            _check_reminders()
        except Exception:
            logger.exception("Unhandled error while checking reminders")


def start_reminder_service() -> threading.Thread:
    """Start the reminder service in a daemon thread."""
    t: threading.Thread = threading.Thread(
        target=_reminder_worker,
        daemon=True,
    )
    t.start()
    logger.info("Reminder service thread %s started (daemon=%s)", t.name, t.daemon)
    return t
