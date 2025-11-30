"""Reminder service worker logic."""

from __future__ import annotations

import logging
import threading
import time
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from zoneinfo import ZoneInfo

from app.config import JOURNAL_REMINDER_MESSAGE, REMINDER_MESSAGE
from app.db.client import db
from app.db.tables import Goal, Reminder, User
from app.services.reminder.utils import get_goals_not_tracked_today, get_timezone_safe
from app.services.sender import send_message

logger = logging.getLogger(__name__)

MIN_WAIT_SECONDS = 10
MAX_WAIT_SECONDS = 60


def _next_reminder_seconds() -> float:
    """Calculate the next reminder execution window in seconds.

    Return the number of seconds to wait until the next reminder execution.
    """
    reminders: list[Reminder] = db.reminders.get_all()
    if not reminders:
        logger.info("No reminders scheduled; using default wait interval")
    now_utc: datetime = datetime.now(UTC)
    wait_times = []

    for reminder in reminders:
        user_id: int = reminder.user_id
        user: User | None = db.users.get(user_id)
        if not user:
             continue

        user_timezone: str = user.timezone
        time_str: str = str(reminder.reminder_time)

        hours_minutes: list[str] = time_str.split(":")
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])

        tz: ZoneInfo = get_timezone_safe(user_timezone)
        local_now: datetime = now_utc.astimezone(tz).replace(
            second=0,
            microsecond=0,
        )
        target: datetime = local_now.replace(hour=hours, minute=minutes)

        if target <= local_now:
            target += timedelta(days=1)

        wait_times.append((target - local_now).total_seconds())

    # default=60 is used in case wait_times is empty
    next_wait: float = float(min(wait_times, default=MAX_WAIT_SECONDS))

    # Limits the maximum wait to 60 seconds and ensures a minimum wait of 10 seconds.
    bounded_wait: float = float(max(MIN_WAIT_SECONDS, min(MAX_WAIT_SECONDS, next_wait)))
    logger.debug("Next reminder check scheduled in %d seconds", bounded_wait)
    return bounded_wait


def _check_reminders() -> None:
    """Check all reminders and send notifications when scheduled time matches."""
    reminders: list[Reminder] = db.reminders.get_all()
    now_utc: datetime = datetime.now(UTC)

    for reminder in reminders:
        user_id: int = reminder.user_id
        user_goal_id: int = reminder.user_goal_id

        user: User | None = db.users.get(user_id)
        user_goal: Goal | None = db.goals.get(user_goal_id)

        if not user or not user_goal:
             continue

        user_timezone: str = user.timezone
        logger.debug(
            "Evaluating reminder %s for user %s in timezone %s",
            reminder.id,
            user_id,
            user_timezone,
        )
        tz = get_timezone_safe(user_timezone)
        local_now: datetime = now_utc.astimezone(tz)

        time_str: str = str(reminder.reminder_time)
        hours_minutes: list[str] = time_str.split(":")
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])

        # Check if current time matches reminder time (HH:MM)
        if local_now.hour == hours and local_now.minute == minutes:
            # Check if this is a journaling reminder
            if user_goal.goal_emoji == "📓" and user_goal.goal_description == "journaling":
                goals_not_tracked_today: list[Goal] = get_goals_not_tracked_today(user_id)
                if goals_not_tracked_today != []:
                    message: str = JOURNAL_REMINDER_MESSAGE.replace(
                        "<goals_not_tracked_today>",
                        "- *Did you complete the goals?*\n"
                        + "\n".join(
                            [f"- {goal.goal_description}" for goal in goals_not_tracked_today]
                        ),
                    )
                else:
                    message: str = JOURNAL_REMINDER_MESSAGE.replace(
                        "\n\n<goals_not_tracked_today>", ""
                    )
            else:
                message: str = REMINDER_MESSAGE.replace(
                    "<goal_emoji>", user_goal.goal_emoji
                ).replace("<goal_description>", user_goal.goal_description)
            send_message(user.phone_number, message)
            logger.info(
                "Sent reminder '%s' to %s",
                user_goal.goal_description,
                user.phone_number,
            )


def _reminder_worker() -> None:
    """Run daemonized worker loop for checking and sending reminders."""
    while True:
        sleep_seconds: float = _next_reminder_seconds()
        logger.debug("Reminder worker sleeping for %d seconds", sleep_seconds)
        time.sleep(sleep_seconds)
        try:
            _check_reminders()
        except Exception:
            # Logs the full traceback including the line number.
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
