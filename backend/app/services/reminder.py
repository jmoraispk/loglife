"""Asynchronous reminder service for user goals.

This module continuously polls stored reminder definitions, calculates the next
execution window per user timezone, and dispatches WhatsApp notifications when
their goal schedules align with the current local time. It exposes a daemonized
worker loop that sleeps between batches based on upcoming reminders, minimizing
polling overhead while ensuring timely alerts.
"""

import logging
import threading
import time
from app.db import get_user, get_all_goal_reminders, get_goal
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.helpers import send_message, get_timezone_safe, get_goals_not_tracked_today
from app.config import REMINDER_MESSAGE, JOURNAL_REMINDER_MESSAGE


def _next_reminder_seconds() -> float:
    """Calculates the next reminder execution window in seconds.

    Returns the number of seconds to wait until the next reminder execution window. The minimum wait is 10 seconds and the maximum wait is 60 seconds. This ensures the service remains responsive to newly added reminders.
    """
    reminders: list[dict] = get_all_goal_reminders()
    if not reminders:
        logging.info("No reminders scheduled; using default wait interval")
    now_utc: datetime = datetime.now(timezone.utc)
    wait_times = []

    for reminder in reminders:
        user_id: int = reminder["user_id"]
        user_timezone: str = get_user(user_id)["timezone"]
        time_str: str = reminder["reminder_time"]

        hours_minutes: list[str] = time_str.split(":")
        # Extract hours and minutes as integers
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])

        tz: ZoneInfo = get_timezone_safe(user_timezone)
        local_now: datetime = now_utc.astimezone(tz).replace(
            second=0, microsecond=0
        )  # current time in user's timezone
        target: datetime = local_now.replace(hour=hours, minute=minutes)

        if target <= local_now:  # target already passed
            target += timedelta(days=1)  # move to next day

        wait_times.append((target - local_now).total_seconds())

    # default=60 is used in case wait_times is empty
    next_wait: float = float(min(wait_times, default=60))

    # Limits the maximum wait to 60 seconds and ensures a minimum wait of 10 seconds.
    # This ensures the service is responsive to newly added reminders.
    bounded_wait: float = float(max(10, min(60, next_wait)))
    logging.debug(f"Next reminder check scheduled in {bounded_wait:.0f} seconds")
    return bounded_wait


def _check_reminders():
    """Checks all reminders and sends notifications when their scheduled time matches the current local time."""
    reminders: list[dict] = get_all_goal_reminders()
    now_utc: datetime = datetime.now(timezone.utc)

    for reminder in reminders:
        user_id: int = reminder["user_id"]
        user_goal_id: int = reminder["user_goal_id"]

        user: dict = get_user(user_id)
        user_goal: dict = get_goal(user_goal_id)

        user_timezone: str = user["timezone"]
        logging.debug(
            f"Evaluating reminder {reminder.get('id')} for user {user_id} in timezone {user_timezone}"
        )
        tz: ZoneInfo = get_timezone_safe(user_timezone)
        local_now: datetime = now_utc.astimezone(tz)

        time_str: str = reminder.get("reminder_time")
        hours_minutes: list[str] = time_str.split(":")
        # Extract hours and minutes as integers
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])

        # Check if current time matches reminder time (HH:MM)
        if local_now.hour == hours and local_now.minute == minutes:
            # Check if this is a journaling reminder
            if user_goal['goal_emoji'] == "📓" and user_goal['goal_description'] == "journaling":
                goals_not_tracked_today: list = get_goals_not_tracked_today(user_id)
                if goals_not_tracked_today != []:
                    message: str = JOURNAL_REMINDER_MESSAGE.replace("<goals_not_tracked_today>", "- *Did you complete the goals?*\n" + "\n".join([f"- {goal['goal_description']}" for goal in goals_not_tracked_today]))
                else:
                    message: str = JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")
            else:
                message: str = REMINDER_MESSAGE.replace("<goal_emoji>", user_goal['goal_emoji']).replace("<goal_description>", user_goal['goal_description'])
            send_message(user["phone_number"], message)
            logging.info(
                f"Sent reminder '{user_goal['goal_description']}' to {user['phone_number']}"
            )


def _reminder_worker():
    """Daemonized worker loop that continuously checks for reminders and sends notifications when their scheduled time matches the current local time."""
    while True:
        sleep_seconds: float = _next_reminder_seconds()
        logging.debug(f"Reminder worker sleeping for {sleep_seconds:.0f} seconds")
        time.sleep(sleep_seconds)
        try:
            _check_reminders()
        except Exception as exc:
            # exc_info=True logs the full traceback of the exception, including the line number where the exception was raised.
            logging.error(
                f"Unhandled error while checking reminders: {exc}", exc_info=True
            )


def start_reminder_service() -> threading.Thread:
    """Starts the reminder service."""
    t: threading.Thread = threading.Thread(
        target=_reminder_worker, daemon=True
    )  # daemon makes the thread to get killed automatically when main program exits
    t.start()
    logging.info(f"Reminder service thread {t.name} started (daemon={t.daemon})")
    return t
