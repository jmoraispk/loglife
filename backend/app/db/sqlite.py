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

def get_user_goals(user_id: str):
    """Get user goals from database."""
    db = get_db()
    
    # First, get or create the user
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        # Create user if doesn't exist
        cursor = db.execute("INSERT INTO user (phone) VALUES (?)", (user_id,))
        db.commit()
        user_id_db = cursor.lastrowid
    else:
        user_id_db = user['id']
    
    # Get user's active goals
    cursor = db.execute("""
        SELECT goal_emoji, goal_description 
        FROM user_goals 
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at
    """, (user_id_db,))
    
    goals = cursor.fetchall()
    
    return [{"emoji": goal['goal_emoji'], "description": goal['goal_description']} for goal in goals]