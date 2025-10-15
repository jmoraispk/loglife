from app.db.sqlite import get_db

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
