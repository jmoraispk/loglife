import os
import sqlite3
import time
from datetime import datetime, date
from zoneinfo import ZoneInfo

# Reuse existing WhatsApp API helper
from app.helpers.api.whatsapp_api import send_whatsapp_message


def get_db_path() -> str:
    """Return absolute path to the SQLite database file."""
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(backend_root, "db", "life_bot.db")


def open_connection(db_path: str) -> sqlite3.Connection:
    """Open a SQLite connection with row factory for named access."""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_active_goals(conn: sqlite3.Connection) -> list:
    """Fetch all active goals with reminder time and their user info."""
    query = (
        """
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
        """
    )
    cur = conn.execute(query)
    return cur.fetchall()


def get_current_hhmm_in_timezone(tz_name: str) -> tuple:
    """Return (today_iso, HH:MM) for the given IANA timezone name or system TZ if empty/invalid."""
    try:
        tzinfo = ZoneInfo(tz_name) if tz_name else datetime.now().astimezone().tzinfo
    except Exception:
        tzinfo = datetime.now().astimezone().tzinfo
    now = datetime.now(tzinfo)
    return (now.date().isoformat(), now.strftime("%H:%M"))


def should_send(goal_id: int, today_iso: str, current_hhmm: str, reminder_hhmm: str, last_sent_cache: dict) -> bool:
    """Decide if a reminder should be sent for a goal at this moment, avoiding duplicates per day/minute."""
    if not reminder_hhmm:
        return False
    if current_hhmm != reminder_hhmm:
        return False
    last = last_sent_cache.get(goal_id)
    # last is a tuple (date_iso, hhmm)
    if last and last[0] == today_iso and last[1] == current_hhmm:
        return False
    return True


def mark_sent(goal_id: int, today_iso: str, current_hhmm: str, last_sent_cache: dict) -> None:
    """Record that a reminder was sent now for this goal."""
    last_sent_cache[goal_id] = (today_iso, current_hhmm)


def build_reminder_message(goal_emoji: str, goal_description: str) -> str:
    """Create the reminder message text for WhatsApp."""
    return f"⏰ Reminder: {goal_emoji} {goal_description}"


def send_reminder(phone: str, message: str) -> bool:
    """Send a WhatsApp reminder message; return True on success."""
    resp = send_whatsapp_message(phone, message)
    return bool(resp and resp.get("success"))


def main() -> None:
    """Continuously poll the database and send due reminders every 2 seconds."""
    db_path = get_db_path()
    conn = open_connection(db_path)
    last_sent_cache: dict[int, tuple[str, str]] = {}

    try:
        while True:
            goals = fetch_active_goals(conn)
            for row in goals:
                goal_id = row["goal_id"]
                reminder_hhmm = row["reminder_time"]
                user_phone = row["user_phone"]
                user_tz = row["user_timezone"] or ""
                goal_emoji = row["goal_emoji"]
                goal_description = row["goal_description"]

                today_iso, current_hhmm = get_current_hhmm_in_timezone(user_tz)

                if should_send(goal_id, today_iso, current_hhmm, reminder_hhmm, last_sent_cache):
                    message = build_reminder_message(goal_emoji, goal_description)
                    ok = send_reminder(user_phone, message)
                    if ok:
                        mark_sent(goal_id, today_iso, current_hhmm, last_sent_cache)
            time.sleep(15)
    finally:
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()


