import threading
import time
from app.db import fetch_reminder_times, get_active_reminders_with_user
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.helpers import send_whatsapp_message

def next_reminder_seconds():
    reminder_times = fetch_reminder_times()
    now = datetime.now(timezone.utc)
    wait_times = []

    for reminder in reminder_times:
        tz_name = reminder.get("timezone")
        time_str = reminder.get("reminder_time")
        if not tz_name or not time_str:
            continue

        try:
            tz = ZoneInfo(tz_name)
            # Handle both formats
            if ' ' in time_str or 'T' in time_str:
                # Full datetime: extract time portion
                parts = time_str.split()
                time_part = parts[1] if len(parts) > 1 else parts[0].split('T')[1]
                hours, minutes = map(int, time_part.split(":")[:2])
            else:
                # Just time format
                hours, minutes = map(int, time_str.split(":")[:2])
            local_now = now.astimezone(tz)
            target = local_now.replace(hour=hours, minute=minutes, second=0, microsecond=0)
            if target <= local_now:
                target += timedelta(days=1)
            wait_times.append((target - local_now).total_seconds())
        except Exception:
            continue

    next_wait = min(wait_times, default=60)
    return max(10, min(3600, next_wait))

def check_reminders():
    goals = get_active_reminders_with_user()
    now = datetime.now(timezone.utc)
    
    for g in goals:
        try:
            tz = ZoneInfo(g['user_timezone'])
            local_now = now.astimezone(tz)
            
            # Parse reminder_time - SQLite DATETIME is a string
            reminder_str = g['reminder_time']
            if 'T' in reminder_str or ' ' in reminder_str:
                # Full datetime format - extract time portion directly
                parts = reminder_str.split()
                time_part = parts[1] if len(parts) > 1 else parts[0].split('T')[1]
                time_components = time_part.split(':')
                reminder_hour = int(time_components[0])
                reminder_minute = int(time_components[1])
            else:
                # Just time format (HH:MM or HH:MM:SS)
                parts = reminder_str.split(':')
                reminder_hour = int(parts[0])
                reminder_minute = int(parts[1])
            
            # Check if current time matches reminder time (HH:MM)
            if local_now.hour == reminder_hour and local_now.minute == reminder_minute:
                message = f"⏰ Reminder: {g['goal_emoji']} {g['goal_description']}"
                send_whatsapp_message(g['user_phone'], message)
        except Exception:
            continue

def reminder_worker():
    while True:
        time.sleep(next_reminder_seconds())
        check_reminders()

def start_reminder_service():
    t = threading.Thread(target=reminder_worker, daemon=True) # daemon makes the thread to get killed automatically when main program exits
    t.start()
    return t