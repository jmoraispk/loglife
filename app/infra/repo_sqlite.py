import argparse
import os
import sqlite3
from datetime import datetime
from typing import List, Tuple


DB_PATH = os.environ.get("HABITS_DB", os.path.join(os.getcwd(), "habits.sqlite3"))


SCHEMA_SQL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  tz TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  prefs_json TEXT NOT NULL DEFAULT '{}',
  usage_streak_current INTEGER NOT NULL DEFAULT 0,
  usage_streak_best INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  emoji TEXT NULL,
  remind_hhmm TEXT NOT NULL,
  order_idx INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  identity_frame TEXT NULL,
  horizon_days INTEGER NOT NULL DEFAULT 14,
  milestones_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id),
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK(score IN (1,2,3)),
  note TEXT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS feedback_tickets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open','closed')),
  created_at DATETIME NOT NULL,
  closed_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in','out')),
  timestamp DATETIME NOT NULL,
  snippet TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, active);
"""


class Repo:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    @classmethod
    def default(cls) -> "Repo":
        return cls()

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def ensure_ready(self) -> None:
        with self.connect() as conn:
            conn.executescript(SCHEMA_SQL)

    # --- Users & Habits ---
    def ensure_user(self, phone: str) -> int:
        now = datetime.utcnow().isoformat()
        with self.connect() as conn:
            cur = conn.execute("SELECT id FROM users WHERE phone=?", (phone,))
            row = cur.fetchone()
            if row:
                return row[0]
            cur = conn.execute(
                "INSERT INTO users(phone, created_at) VALUES(?, ?)", (phone, now)
            )
            return cur.lastrowid

    def list_habits(self, phone: str) -> str:
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            rows = conn.execute(
                "SELECT name, remind_hhmm FROM habits WHERE user_id=? AND active=1 ORDER BY order_idx ASC",
                (user_id,),
            ).fetchall()
        if not rows:
            return "(none)"
        return "\n".join(f"• {r['name']} at {r['remind_hhmm']}" for r in rows)

    def count_active_habits(self, phone: str) -> int:
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            row = conn.execute(
                "SELECT COUNT(*) AS c FROM habits WHERE user_id=? AND active=1", (user_id,)
            ).fetchone()
            return int(row[0])

    def add_habit(self, phone: str, name: str, hhmm: str, force: bool, max_default: int) -> str:
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            cur = conn.execute(
                "SELECT COUNT(*) AS c FROM habits WHERE user_id=? AND active=1",
                (user_id,),
            )
            count = int(cur.fetchone()[0])
            if count >= max_default and not force and count < 3:
                return "soft_cap"
            if count >= 3 and force:
                return "hard_cap"
            order_idx = count
            now = datetime.utcnow().isoformat()
            conn.execute(
                """
                INSERT INTO habits(user_id, name, remind_hhmm, order_idx, created_at, milestones_json)
                VALUES(?,?,?,?,?, '[]')
                """,
                (user_id, name, hhmm, order_idx, now),
            )
            return "ok"

    # --- Feedback ---
    def open_feedback(self, phone: str, text: str) -> int:
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            now = datetime.utcnow().isoformat()
            cur = conn.execute(
                "INSERT INTO feedback_tickets(user_id, text, status, created_at) VALUES(?, ?, 'open', ?)",
                (user_id, text, now),
            )
            return cur.lastrowid


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--migrate", action="store_true", help="Run SQLite schema migrations")
    args = parser.parse_args()
    if args.migrate:
        Repo.default().ensure_ready()
        print(f"Migrated DB at {DB_PATH}")


if __name__ == "__main__":
    main()

