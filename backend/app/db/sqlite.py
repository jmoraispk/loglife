"""SQLite database connection and management utilities.

This module provides database connection management using Flask's application
context, including connection handling, initialization, and teardown functions.
Also provides abstracted query helper functions for common database operations.
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


# ============================================================================
# Query Helper Functions
# ============================================================================

def fetch_one(query: str, params: Tuple = ()) -> Optional[sqlite3.Row]:
    """
    Execute a SELECT query and return the first row or None.
    
    Abstracted helper function for single-row SELECT queries.
    Automatically uses get_db() for proper Flask context handling.
    
    Args:
        query (str): SQL SELECT query string
        params (Tuple): Query parameters for placeholders
    
    Returns:
        Optional[sqlite3.Row]: First row from query result, or None if no results
                              Row supports both index and column name access
    
    Example:
        user = fetch_one("SELECT id, name FROM users WHERE phone = ?", (phone,))
        if user:
            user_id = user['id']  # or user[0]
    """
    db = get_db()
    cursor = db.execute(query, params)
    return cursor.fetchone()


def fetch_all(query: str, params: Tuple = ()) -> List[sqlite3.Row]:
    """
    Execute a SELECT query and return all rows.
    
    Abstracted helper function for multi-row SELECT queries.
    Automatically uses get_db() for proper Flask context handling.
    
    Args:
        query (str): SQL SELECT query string
        params (Tuple): Query parameters for placeholders
    
    Returns:
        List[sqlite3.Row]: List of rows from query result (empty list if no results)
                          Each row supports both index and column name access
    
    Example:
        goals = fetch_all("SELECT * FROM goals WHERE user_id = ?", (user_id,))
        for goal in goals:
            emoji = goal['goal_emoji']  # or goal[0]
    """
    db = get_db()
    cursor = db.execute(query, params)
    return cursor.fetchall()


def execute_query(query: str, params: Tuple = ()) -> sqlite3.Cursor:
    """
    Execute a query (INSERT/UPDATE/DELETE) and commit the transaction.
    
    Abstracted helper function for write operations. Automatically commits
    the transaction after execution. Use get_db() for proper Flask context handling.
    
    Args:
        query (str): SQL query string (INSERT, UPDATE, DELETE, etc.)
        params (Tuple): Query parameters for placeholders
    
    Returns:
        sqlite3.Cursor: Cursor object with execute results
                        Use cursor.lastrowid for INSERT queries
    
    Example:
        cursor = execute_query("INSERT INTO users (phone) VALUES (?)", (phone,))
        user_id = cursor.lastrowid
        
        cursor = execute_query("UPDATE goals SET is_active = 0 WHERE id = ?", (goal_id,))
        rows_affected = cursor.rowcount
    """
    db = get_db()
    cursor = db.execute(query, params)
    db.commit()
    return cursor


def execute_many(query: str, params_list: List[Tuple]) -> None:
    """
    Execute a query multiple times with different parameters and commit.
    
    Useful for batch insertions or updates. Automatically commits after all executions.
    
    Args:
        query (str): SQL query string to execute multiple times
        params_list (List[Tuple]): List of parameter tuples, one per execution
    
    Example:
        execute_many(
            "INSERT INTO ratings (goal_id, rating, date) VALUES (?, ?, ?)",
            [(1, 3, '2024-01-01'), (2, 2, '2024-01-01')]
        )
    """
    db = get_db()
    db.executemany(query, params_list)
    db.commit()
