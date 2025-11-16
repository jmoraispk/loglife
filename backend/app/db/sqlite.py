import sqlite3
from app.config import DATABASE_FILE, SCHEMA_FILE

def connect():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not DATABASE_FILE.exists() or DATABASE_FILE.stat().st_size == 0:
        with sqlite3.connect(DATABASE_FILE) as conn, open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            conn.executescript(f.read())