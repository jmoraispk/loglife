"""SQLite repository and migration runner.

Provides minimal read/write operations needed for M0 scaffolding.
"""

import argparse
import json
import os
import sqlite3
from datetime import datetime

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
    """Lightweight repository for SQLite persistence."""

    def __init__(self, db_path: str = DB_PATH):
        """Initialize repository with a target database path."""
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    @classmethod
    def default(cls) -> "Repo":
        """Return a Repo bound to the DB path (env override if set)."""
        db_path = os.environ.get("HABITS_DB", DB_PATH)
        return cls(db_path=db_path)

    def connect(self) -> sqlite3.Connection:
        """Open a SQLite connection with row factory set to Row."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def ensure_ready(self) -> None:
        """Create tables and indices if they do not exist."""
        with self.connect() as conn:
            conn.executescript(SCHEMA_SQL)

    # --- Users & Habits ---
    def ensure_user(self, phone: str) -> int:
        """Ensure a user row exists; return user_id."""
        now = datetime.utcnow().isoformat()
        with self.connect() as conn:
            cur = conn.execute("SELECT id FROM users WHERE phone=?", (phone,))
            row = cur.fetchone()
            if row:
                return row[0]
            cur = conn.execute("INSERT INTO users(phone, created_at) VALUES(?, ?)", (phone, now))
            return cur.lastrowid

    def list_users(self) -> list[sqlite3.Row]:
        """Return all users as row objects (id, phone, tz, prefs_json)."""
        with self.connect() as conn:
            rows = conn.execute("SELECT id, phone, tz, prefs_json FROM users").fetchall()
            return list(rows)

    def get_user_id(self, phone: str) -> int:
        """Return user id for a given phone number."""
        with self.connect() as conn:
            row = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()
            if not row:
                raise ValueError("user not found")
            return int(row[0])

    def get_user_tz(self, phone: str) -> str:
        """Return timezone name for a given phone number."""
        with self.connect() as conn:
            row = conn.execute("SELECT tz FROM users WHERE phone=?", (phone,)).fetchone()
            return row[0] if row else "America/Los_Angeles"

    def get_user_prefs(self, phone: str) -> dict:
        """Return prefs JSON (with defaults) for a given phone number."""
        with self.connect() as conn:
            row = conn.execute("SELECT prefs_json FROM users WHERE phone=?", (phone,)).fetchone()
            prefs = {}
            if row and row[0]:
                try:
                    prefs = json.loads(row[0])
                except Exception:
                    prefs = {}
            prefs.setdefault("style", "bullet")
            prefs.setdefault("export_mode", "file")
            prefs.setdefault("morning_remind_hhmm", "08:00")
            return prefs

    def list_habits(self, phone: str) -> str:
        """Return a user-friendly multi-line list of active habits."""
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            rows = conn.execute(
                (
                    "SELECT name, remind_hhmm FROM habits "
                    "WHERE user_id=? AND active=1 ORDER BY order_idx ASC"
                ),
                (user_id,),
            ).fetchall()
        if not rows:
            return "(none)"
        return "\n".join(f"• {r['name']} at {r['remind_hhmm']}" for r in rows)

    def count_active_habits(self, phone: str) -> int:
        """Return active habit count for a user by phone."""
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            row = conn.execute(
                "SELECT COUNT(*) AS c FROM habits WHERE user_id=? AND active=1", (user_id,)
            ).fetchone()
            return int(row[0])

    def add_habit(
        self,
        phone: str,
        name: str,
        hhmm: str,
        force: bool,
        max_default: int,
        milestones: list[int] | None = None,
        horizon_days: int = 14,
    ) -> str:
        """Add a habit, enforcing soft/hard caps. Returns status string."""
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
            milestones_json = json.dumps(milestones or [])
            conn.execute(
                (
                    "INSERT INTO habits(user_id, name, remind_hhmm, order_idx, created_at, "
                    "milestones_json, horizon_days) VALUES(?,?,?,?,?,?,?)"
                ),
                (user_id, name, hhmm, order_idx, now, milestones_json, horizon_days),
            )
            return "ok"

    def get_habits(self, phone: str) -> list[sqlite3.Row]:
        """Return all active habits for a user ordered by index."""
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            rows = conn.execute(
                "SELECT * FROM habits WHERE user_id=? AND active=1 ORDER BY order_idx ASC",
                (user_id,),
            ).fetchall()
            return list(rows)

    def upsert_log(self, habit_id: int, d_iso: str, score: int, note: str | None = None) -> None:
        """Insert or update a daily log for a habit on date d_iso."""
        now = datetime.utcnow().isoformat()
        with self.connect() as conn:
            sql = (
                "INSERT INTO logs(habit_id, date, score, note, created_at) VALUES(?,?,?,?,?) "
                "ON CONFLICT(habit_id, date) DO UPDATE SET score=excluded.score, note=excluded.note"
            )
            conn.execute(sql, (habit_id, d_iso, score, note, now))

    def get_log_for_date(self, habit_id: int, d_iso: str) -> sqlite3.Row | None:
        """Return the log row for a habit on a given date if present."""
        with self.connect() as conn:
            return conn.execute(
                "SELECT * FROM logs WHERE habit_id=? AND date=?", (habit_id, d_iso)
            ).fetchone()

    def has_log_for_date(self, habit_id: int, d_iso: str) -> bool:
        """Return True if there is a log for the habit on the given date."""
        return self.get_log_for_date(habit_id, d_iso) is not None

    def compute_streak(self, habit_id: int, upto_date_iso: str) -> int:
        """Compute current streak up to and including the provided date."""
        with self.connect() as conn:
            rows = conn.execute(
                "SELECT date, score FROM logs WHERE habit_id=? AND date<=? ORDER BY date DESC",
                (habit_id, upto_date_iso),
            ).fetchall()
        streak = 0
        for r in rows:
            if int(r[1]) == 3:
                streak += 1
            else:
                break
        return streak

    def export_rows(self, phone: str, start_iso: str, end_iso: str) -> list[tuple]:
        """Return rows for CSV export within [start, end] inclusive.

        Columns: user_phone,tz,habit_name,emoji,date,score,streak_after,created_at,note
        """
        with self.connect() as conn:
            user_row = conn.execute(
                "SELECT id, tz, phone FROM users WHERE phone=?", (phone,)
            ).fetchone()
            user_id = int(user_row[0])
            tz = user_row[1]
            phone_masked = user_row[2]
            rows = conn.execute(
                (
                    "SELECT h.id, h.name, h.emoji, l.date, l.score, l.created_at, l.note "
                    "FROM logs l JOIN habits h ON l.habit_id=h.id "
                    "WHERE h.user_id=? AND l.date BETWEEN ? AND ? ORDER BY h.id ASC, l.date ASC"
                ),
                (user_id, start_iso, end_iso),
            ).fetchall()
        out: list[tuple] = []
        last_streak_by_hid: dict[int, int] = {}
        for r in rows:
            hid = int(r[0])
            name = r[1]
            emoji = r[2]
            d = r[3]
            score = int(r[4])
            created = r[5]
            note = r[6]
            streak = last_streak_by_hid.get(hid, 0)
            streak = streak + 1 if score == 3 else 0
            last_streak_by_hid[hid] = streak
            out.append((phone_masked, tz, name, emoji, d, score, streak, created, note))
        return out

    # --- Feedback ---
    def open_feedback(self, phone: str, text: str) -> int:
        """Create a feedback ticket and return its id."""
        with self.connect() as conn:
            user_id = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()[0]
            now = datetime.utcnow().isoformat()
            cur = conn.execute(
                (
                    "INSERT INTO feedback_tickets(user_id, text, status, created_at) "
                    "VALUES(?, ?, 'open', ?)"
                ),
                (user_id, text, now),
            )
            return cur.lastrowid


def main():
    """CLI to run migrations for local development."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--migrate", action="store_true", help="Run SQLite schema migrations")
    args = parser.parse_args()
    if args.migrate:
        Repo.default().ensure_ready()
        print(f"Migrated DB at {DB_PATH}")


if __name__ == "__main__":
    main()
