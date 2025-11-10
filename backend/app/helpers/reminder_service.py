"""Background reminder service for sending goal reminders.

This module provides a thread-based reminder service that efficiently monitors
the database for goals with reminder times and sends WhatsApp messages when needed.
Instead of polling every few seconds, it calculates the next reminder time
and sleeps until then, reducing database queries and CPU usage.
"""
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo
from flask import Flask

from app.db.sqlite import fetch_all
from app.helpers.api.whatsapp_api import send_whatsapp_message


def build_reminder_message(goal_emoji: str, goal_description: str) -> str:
    """
    Build a formatted reminder message for a goal.
    
    Args:
        goal_emoji (str): Emoji representing the goal
        goal_description (str): Text description of the goal
    
    Returns:
        str: Formatted reminder message ready for sending
    """
    return f"⏰ Reminder: {goal_emoji} {goal_description}"


def get_timezone_info(tz_name: str) -> Any:
    """
    Get timezone object from timezone name.
    
    Args:
        tz_name (str): IANA timezone name or empty string
    
    Returns:
        Timezone object for the given name or system timezone
    """
    if not tz_name:
        return datetime.now().astimezone().tzinfo
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return datetime.now().astimezone().tzinfo


def calculate_next_reminder_seconds(app: Flask) -> float:
    """
    Calculate seconds until the next reminder should be sent.
    
    Args:
        app: Flask application instance for context
    
    Returns:
        float: Seconds until next reminder (minimum 10, maximum 3600)
    """
    with app.app_context():
        try:
            goals = fetch_all("""
                SELECT ug.reminder_time, u.timezone
                FROM user_goals ug
                JOIN user u ON u.id = ug.user_id
                WHERE ug.is_active = 1 AND ug.reminder_time IS NOT NULL
            """)
            if not goals:
                return 60.0  # Sleep 1 minute if no reminders
            
            now = datetime.now()
            next_times = []
            
            for goal in goals:
                reminder_hhmm = goal['reminder_time']
                tz_name = goal['timezone'] or ''
                tz = get_timezone_info(tz_name)
                
                try:
                    hour, minute = map(int, reminder_hhmm.split(':'))
                    # Get reminder time for today in user's timezone
                    reminder_time = now.astimezone(tz).replace(
                        hour=hour, minute=minute, second=0, microsecond=0
                    )
                    
                    # If reminder already passed today, schedule for tomorrow
                    if reminder_time <= now.astimezone(tz):
                        reminder_time += timedelta(days=1)
                    
                    # Convert to seconds from now
                    seconds_until = (reminder_time - now.astimezone(tz)).total_seconds()
                    next_times.append(seconds_until)
                except Exception as e:
                    logging.error(f"[REMINDER] Error calculating reminder time: {e}")
                    continue
            
            if not next_times:
                return 60.0
            
            next_seconds = min(next_times)
            # Clamp between 10 seconds and 1 hour
            return max(10.0, min(3600.0, next_seconds))
            
        except Exception as e:
            logging.error(f"[REMINDER] Error in calculate_next_reminder_seconds: {e}")
            return 60.0


def check_and_send_reminders(app: Flask, last_sent_cache: dict[tuple[int, str], bool]) -> None:
    """
    Check for due reminders and send them.
    
    Args:
        app: Flask application instance for context
        last_sent_cache: Dictionary tracking sent reminders (goal_id, date) -> bool
    """
    with app.app_context():
        try:
            goals = fetch_all("""
                SELECT 
                    ug.id AS goal_id,
                    ug.goal_emoji,
                    ug.goal_description,
                    ug.reminder_time,
                    u.phone AS user_phone,
                    COALESCE(u.timezone, '') AS user_timezone
                FROM user_goals ug
                JOIN user u ON u.id = ug.user_id
                WHERE ug.is_active = 1 AND ug.reminder_time IS NOT NULL
            """)
            if not goals:
                return
            
            now = datetime.now()
            
            for goal in goals:
                goal_id = goal['goal_id']
                reminder_hhmm = goal['reminder_time']
                user_phone = goal['user_phone']
                tz_name = goal['user_timezone'] or ''
                goal_emoji = goal['goal_emoji']
                goal_description = goal['goal_description']
                
                tz = get_timezone_info(tz_name)
                current_time = now.astimezone(tz).strftime("%H:%M")
                today_iso = now.astimezone(tz).date().isoformat()
                
                # Check if reminder time matches and hasn't been sent today
                if current_time == reminder_hhmm:
                    cache_key = (goal_id, today_iso)
                    if cache_key not in last_sent_cache:
                        message = build_reminder_message(goal_emoji, goal_description)
                        response = send_whatsapp_message(user_phone, message)
                        
                        if response and response.get("success"):
                            last_sent_cache[cache_key] = True
                            logging.debug(f"[REMINDER] Sent reminder to {user_phone} for goal {goal_id}")
                        else:
                            logging.error(f"[REMINDER] Failed to send reminder to {user_phone}")
                    
        except Exception as e:
            logging.error(f"[REMINDER] Error in check_and_send_reminders: {e}")


def reminder_worker(app: Flask) -> None:
    """
    Background worker thread that manages reminder sending.
    
    This function runs in a loop, calculating when the next reminder should
    be sent and sleeping until then. When it wakes up, it checks for due
    reminders and sends them.
    
    Args:
        app: Flask application instance for context management
    """
    last_sent_cache: dict[tuple[int, str], bool] = {}
    logging.info("[REMINDER] Reminder service started")
    
    while True:
        try:
            # Calculate how long to sleep until next reminder
            sleep_seconds = calculate_next_reminder_seconds(app)
            
            # Sleep with periodic wake-ups to check for reminders
            # Sleep in small chunks to handle app shutdown gracefully
            sleep_chunks = max(1, int(sleep_seconds))
            for _ in range(min(sleep_chunks, 60)):  # Max 60 chunks (1 minute each)
                time.sleep(min(1.0, sleep_seconds / sleep_chunks))
                sleep_seconds -= 1.0
                if sleep_seconds <= 0:
                    break
            
            # Check and send any due reminders
            check_and_send_reminders(app, last_sent_cache)
            
            # Clean old cache entries (older than 1 day)
            now = datetime.now()
            keys_to_remove = [
                key for key in last_sent_cache.keys()
                if key[1] < (now - timedelta(days=1)).date().isoformat()
            ]
            for key in keys_to_remove:
                del last_sent_cache[key]
                
        except Exception as e:
            logging.error(f"[REMINDER] Error in reminder worker: {e}")
            time.sleep(60)  # Wait 1 minute before retrying


def start_reminder_service(app: Flask) -> threading.Thread:
    """
    Start the reminder service in a background thread.
    
    Args:
        app: Flask application instance
    
    Returns:
        threading.Thread: The started reminder thread (daemon thread)
    """
    reminder_thread = threading.Thread(
        target=reminder_worker,
        args=(app,),
        daemon=True,
        name="ReminderService"
    )
    reminder_thread.start()
    logging.info("[REMINDER] Reminder service thread started")
    return reminder_thread

