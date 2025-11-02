"""User goals data access functions.

This module provides CRUD operations for retrieving user goals from the database,
including user creation and goal retrieval functionality.
"""
from app.db.sqlite import get_db

def get_user_goals(user_id: str) -> list[dict[str, str]]:
    """Retrieve user goals from the database.
    
    Fetches all active goals for a user from the database. Creates the user
    if they don't exist in the system.

    Args:
        user_id (str): User identifier (phone number)

    Returns:
        List[Dict[str, str]]: List of dictionaries containing goal emoji and description
    """
    db = get_db()
    
    # First, get or create the user
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        # Create user if doesn't exist
        cursor = db.execute("INSERT INTO user (phone) VALUES (?)", (user_id,))
        db.commit()
        user_id_db: int = cursor.lastrowid
    else:
        user_id_db: int = user['id']
    
    # Get user's active goals
    goals = fetch_all("""
        SELECT goal_emoji, goal_description 
        FROM user_goals 
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at
    """, (user_id_db,))
    
    goals = cursor.fetchall()
    
    return [{"emoji": goal['goal_emoji'], "description": goal['goal_description']} for goal in goals]
