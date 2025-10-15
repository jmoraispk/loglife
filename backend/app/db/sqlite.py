import sqlite3
import os
from flask import g

DATABASE = "db/life_bot.db"

def get_db():
    """Get database connection with proper Flask context handling."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(exception):
    """Close database connection."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Initialize database with schema if it doesn't exist."""
    if not os.path.exists(DATABASE):
        with open("db/schema.sql", "r") as f:
            db = get_db()
            db.executescript(f.read())
            db.commit()
