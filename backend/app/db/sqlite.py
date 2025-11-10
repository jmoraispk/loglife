"""SQLite database connection and management utilities.

This module provides database connection management using Flask's application
context, including connection handling, initialization, and teardown functions.
"""
import sqlite3
import os
from flask import g

# Get the absolute path to the project root (backend directory)
PROJECT_ROOT: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATABASE: str = os.path.join(PROJECT_ROOT, "db", "life_bot.db")

def get_db() -> sqlite3.Connection:
    """Get database connection with proper Flask context handling.
    
    Establishes a SQLite database connection using Flask's g object for
    proper context management. Returns existing connection if available.

    Returns:
        sqlite3.Connection: Database connection with row factory enabled
    """
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(exception: Exception | None) -> None:
    """Close database connection.
    
    Properly closes the database connection and removes it from Flask's g object.
    Called automatically by Flask's teardown mechanism.

    Args:
        exception: Exception that triggered the teardown (if any)
    """
    db: sqlite3.Connection | None = g.pop("db", None)
    if db is not None:
        db.close()

def init_db() -> None:
    """Initialize database with schema if it doesn't exist.
    
    Creates the database file and applies the schema from schema.sql if the
    database file doesn't already exist.

    Raises:
        FileNotFoundError: If schema.sql file is not found
    """
    if not os.path.exists(DATABASE):
        schema_path: str = os.path.join(PROJECT_ROOT, "db", "schema.sql")
        with open(schema_path, "r") as f:
            db: sqlite3.Connection = get_db()
            db.executescript(f.read())
            db.commit()
