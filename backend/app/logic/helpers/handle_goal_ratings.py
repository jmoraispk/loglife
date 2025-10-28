from datetime import datetime
from app.utils.config import STYLE

def storage_date_format(date: datetime) -> str:
    """
    Standardize date format for storage/indexing in the database.
    
    Args:
        date (datetime): The date to format
        
    Returns:
        str: Date formatted as YYYY-MM-DD for storage
    """
    return date.strftime('%Y-%m-%d')

def handle_goal_ratings(payload: str, user_id: str) -> str:
    """
    Handle goal ratings input from user, validate it and store the ratings.
    
    Args:
        payload (str): String containing goal ratings (must be digits 1-3)
        user_id (str): User identifier for data storage
        
    Returns:
        str: Response message indicating success or error
    """
    # Get user goals to validate input length
    from app.db.CRUD.user_goals.get_user_goals import get_user_goals
    user_goals = get_user_goals(user_id)
    
    if not user_goals:
        return "❌ No goals set. Please set goals first."
    
    # Validate input length
    if len(payload) != len(user_goals):
        return f"❌ Invalid input. Send {len(user_goals)} digits like: 31232"

    # Validate input digits
    if not all(c in "123" for c in payload):
        return f"❌ Invalid input. Send {len(user_goals)} digits between 1 and 3"

    # Store ratings
    ratings = [int(c) for c in payload]
    now = datetime.now()
    today_storage = storage_date_format(now)  # For storage
    today_display = now.strftime('%a (%b %d)')  # For display
    
    # Get database connection
    from app.db.sqlite import get_db
    db = get_db()
    
    # Get user ID from database
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return "❌ User not found"
    user_id_db = user['id']
    
    # Store ratings for each goal
    for i, rating in enumerate(ratings):
        goal = user_goals[i]
        goal_emoji = goal['emoji']
        
        # Get user_goal_id
        cursor = db.execute("""
            SELECT id FROM user_goals 
            WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
        """, (user_id_db, goal_emoji))
        user_goal = cursor.fetchone()
        if not user_goal:
            return f"❌ Goal {goal_emoji} not found"
        user_goal_id = user_goal['id']
        
        # Check if rating already exists for today
        cursor = db.execute("""
            SELECT id FROM goal_ratings 
            WHERE user_goal_id = ? AND date = ?
        """, (user_goal_id, today_storage))
        
        if cursor.fetchone():
            # Update existing rating
            db.execute("""
                UPDATE goal_ratings 
                SET rating = ? 
                WHERE user_goal_id = ? AND date = ?
            """, (rating, user_goal_id, today_storage))
        else:
            # Insert new rating
            db.execute("""
                INSERT INTO goal_ratings (user_goal_id, rating, date) 
                VALUES (?, ?, ?)
            """, (user_goal_id, rating, today_storage))
    
    db.commit()
    
    # Get goal emojis for display
    goal_emojis = [goal['emoji'] for goal in user_goals]
    status = [STYLE[r] for r in ratings]

    # Return success message
    return f"📅 {today_display}\n{' '.join(goal_emojis)}\n{' '.join(status)}"