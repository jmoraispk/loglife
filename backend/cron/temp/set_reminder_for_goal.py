"""
Temporary testing script (manual helper) — not for production.

What this script does:
- Prompts you for a goal ID.
- Prompts you for a reminder time (accepts formats like 18:00, 6 PM, 6pm, or 6).
- Validates and normalizes the time to HH:MM using the existing parser.
- Updates the goal's reminder_time in the SQLite database (table: user_goals).

How to run:
- From the backend directory, run: python -m cron.temp.set_reminder_for_goal

Notes:
- This is only for quick local testing and will likely be removed later.
- It does not change any schema or handle timezones; it only sets reminder_time.
"""

import os
import sqlite3
from app.helpers.time_parser import parse_reminder_time, format_time_for_display


def get_db_path() -> str:
    """Return absolute path to the SQLite database file."""
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(backend_root, "db", "life_bot.db")


def open_connection(db_path: str) -> sqlite3.Connection:
    """Open a SQLite connection with row factory for named access."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def prompt_goal_id() -> int:
    """Ask the user for a goal ID and return it as an integer."""
    while True:
        raw = input("Enter goal ID: ").strip()
        if raw.isdigit():
            return int(raw)
        print("Please enter a valid numeric goal ID.")


def prompt_reminder_time() -> str:
    """Ask for a reminder time, parse it to HH:MM, and return the normalized value."""
    while True:
        raw = input("Enter reminder time (e.g., 18:00, 6 PM, 6pm): ").strip()
        parsed = parse_reminder_time(raw)
        if parsed:
            return parsed
        print("Invalid time. Try formats like 18:00, 6 PM, 6pm, or 6.")


def update_goal_reminder(conn: sqlite3.Connection, goal_id: int, reminder_hhmm: str) -> bool:
    """Update the reminder_time for a specific goal ID. Returns True if updated."""
    cur = conn.execute(
        "UPDATE user_goals SET reminder_time = ? WHERE id = ?",
        (reminder_hhmm, goal_id),
    )
    conn.commit()
    return cur.rowcount > 0


def main() -> None:
    """Interactive script to set/update reminder_time for a goal by ID."""
    db_path = get_db_path()
    conn = open_connection(db_path)
    try:
        goal_id = prompt_goal_id()
        reminder_hhmm = prompt_reminder_time()

        if update_goal_reminder(conn, goal_id, reminder_hhmm):
            print(
                f"✅ Updated goal {goal_id} reminder to {format_time_for_display(reminder_hhmm)} ({reminder_hhmm})."
            )
        else:
            print("❌ Goal not found or not updated.")
    finally:
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()


