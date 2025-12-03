"""Utility helpers for connecting to the SQLite database and bootstrapping its schema."""

import sqlite3

from loglife.app.config import DATABASE_FILE, SCHEMA_FILE


def connect() -> sqlite3.Connection:
    """Connect to the SQLite database.

    Configure the connection to return rows as dictionary-like sqlite3.Row
    objects (so you can access columns by name), and hands back that
    ready-to-use connection.
    """
    conn: sqlite3.Connection = sqlite3.connect(DATABASE_FILE, check_same_thread=False, isolation_level=None)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Bootstrap (set up from scratch) the SQLite database.

    Check whether DATABASE_FILE exists and is non-empty. If the file is
    missing or empty, it opens a temporary connection with sqlite3.connect,
    reads the SQL schema from SCHEMA_FILE, and runs that script via
    conn.executescript(...). If the database already contains data, it does
    nothing.
    """
    if not DATABASE_FILE.exists() or DATABASE_FILE.stat().st_size == 0:
        with (
            sqlite3.connect(DATABASE_FILE) as conn,
            SCHEMA_FILE.open(encoding="utf-8") as f,
        ):
            conn.executescript(f.read())
