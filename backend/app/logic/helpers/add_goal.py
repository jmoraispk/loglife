from app.db.sqlite import get_db

def add_goal(user_id: str, goal_emoji: str, goal_description: str) -> str:
    """
    Add a new goal for the user.
    
    Args:
        user_id (str): User identifier
        goal_emoji (str): Emoji for the goal
        goal_description (str): Description of the goal
        
    Returns:
        str: Success or error message
    """
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
    
    # Check if goal already exists for this user
    cursor = db.execute("""
        SELECT id FROM user_goals 
        WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
    """, (user_id_db, goal_emoji))
    
    if cursor.fetchone():
        return f"❌ Goal {goal_emoji} already exists for you."
    
    # Add the new goal
    cursor = db.execute("""
        INSERT INTO user_goals (user_id, goal_emoji, goal_description) 
        VALUES (?, ?, ?)
    """, (user_id_db, goal_emoji, goal_description))
    db.commit()
    
    return f"✅ Added goal: {goal_emoji} {goal_description}"
