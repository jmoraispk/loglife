import threading
import time
from app.db import get_user, get_all_goal_reminders, get_goal
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.helpers import send_whatsapp_message

def next_reminder_seconds():
    reminders: list[dict] = get_all_goal_reminders()
    now_utc: datetime = datetime.now(timezone.utc)
    wait_times = []

    for reminder in reminders:
        user_id: int = reminder["user_id"]
        user_timezone: str = get_user(user_id)["timezone"]
        time_str: str = reminder.get("reminder_time")
        hours_minutes: list[str] = time_str.split(":")
        # Extract hours and minutes as integers
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])
        tz: ZoneInfo = ZoneInfo(user_timezone)
        local_now: datetime = now_utc.astimezone(tz) # current time in user's timezone
        target: datetime = local_now.replace(hour=hours, minute=minutes)
        
        if target <= local_now: # target already passed
            target += timedelta(days=1) # move to next day

        wait_times.append((target - local_now).total_seconds())

    # default=60 is used in case wait_times is empty
    next_wait = min(wait_times, default=60)

    return max(10, min(3600, next_wait)) # limits the maximum wait to 1 hour and ensures a minimum wait of 10 seconds

def check_reminders():
    reminders: list[dict] = get_all_goal_reminders()
    now_utc: datetime = datetime.now(timezone.utc)
    
    for reminder in reminders:
        user_id: int = reminder["user_id"]
        user_goal_id: int = reminder["user_goal_id"]

        user: dict = get_user(user_id)
        user_goal: dict = get_goal(user_goal_id)

        user_timezone: str = user["timezone"]
        tz: ZoneInfo = ZoneInfo(user_timezone)
        local_now: datetime = now_utc.astimezone(tz)
        
        time_str: str = reminder.get("reminder_time")
        hours_minutes: list[str] = time_str.split(":")
        # Extract hours and minutes as integers
        hours: int = int(hours_minutes[0])
        minutes: int = int(hours_minutes[1])
        
        # Check if current time matches reminder time (HH:MM)
        if local_now.hour == hours and local_now.minute == minutes:
            message = f"⏰ Reminder: {user_goal['goal_emoji']} {user_goal['goal_description']}"
            send_whatsapp_message(user['phone_number'], message)

def reminder_worker():
    while True:
        time.sleep(next_reminder_seconds())
        check_reminders()

def start_reminder_service():
    t = threading.Thread(target=reminder_worker, daemon=True) # daemon makes the thread to get killed automatically when main program exits
    t.start()
    return t