import sqlite3
import os
from flask import g

def init_db() -> None:
    """Initialize database with schema if it doesn't exist.
    
    Creates the database file and applies the schema from schema.sql if the
    database file doesn't already exist.

    Raises:
        FileNotFoundError: If schema.sql file is not found
    """
    db: sqlite3.Connection = get_db()
    if not os.path.exists(DATABASE) or os.path.getsize(DATABASE) == 0:
        schema_path: str = os.path.join(PROJECT_ROOT, "db", "schema.sql")
        with open(schema_path, "r") as f:
            db.executescript(f.read())
            db.commit()