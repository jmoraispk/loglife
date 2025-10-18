from app.db.sqlite import get_db

def add_goal(user_id: str, goal_string: str) -> str:
    """
    Add a new goal for the user.
    
    Args:
        user_id (str): User identifier
        goal_string (str): Complete goal string with emoji and description
        
    Returns:
        str: Success or error message
    """
    # Separate emoji from text - find emoji anywhere in the string
    import re
    # Simple emoji detection - look for emoji characters anywhere in the string
    emoji_pattern = r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000026FF\U00002700-\U000027BF\U0001F900-\U0001F9FF\U0001FA70-\U0001FAFF\U0001F018-\U0001F0F5\U0001F200-\U0001F2FF]+'
    match = re.search(emoji_pattern, goal_string)
    
    if match:
        goal_emoji = match.group(0)
        # Remove the emoji from the original string
        goal_description = re.sub(emoji_pattern, '', goal_string).strip()
    else:
        # If no emoji found, use default and treat whole string as description
        goal_emoji = "🎯"
        goal_description = goal_string.strip()
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
