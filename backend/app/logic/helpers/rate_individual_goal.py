from datetime import datetime
from app.db.sqlite import get_db
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

def rate_individual_goal(user_id: str, goal_number: int, rating: int) -> str:
    """
    Rate a specific goal for the user.
    
    Args:
        user_id (str): User identifier
        goal_number (int): Goal number (1-based index)
        rating (int): Rating (1-3)
        
    Returns:
        str: Success or error message
    """
    # Validate rating
    if rating not in [1, 2, 3]:
        return "❌ Rating must be 1, 2, or 3"
    
    db = get_db()
    
    # Get user's goals
    from app.db.CRUD.user_goals.get_user_goals import get_user_goals
    user_goals = get_user_goals(user_id)
    
    if not user_goals:
        return "❌ No goals set. Please add goals first."
    
    # Validate goal number
    if goal_number < 1 or goal_number > len(user_goals):
        return f"❌ Goal number must be between 1 and {len(user_goals)}"
    
    # Get the specific goal
    goal = user_goals[goal_number - 1]  # Convert to 0-based index
    goal_emoji = goal['emoji']
    goal_description = goal['description']
    
    # Get user ID from database
    cursor = db.execute("SELECT id FROM user WHERE phone = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        return "❌ User not found"
    user_id_db = user['id']
    
    # Get user_goal_id
    cursor = db.execute("""
        SELECT id FROM user_goals 
        WHERE user_id = ? AND goal_emoji = ? AND is_active = 1
    """, (user_id_db, goal_emoji))
    user_goal = cursor.fetchone()
    if not user_goal:
        return "❌ Goal not found"
    user_goal_id = user_goal['id']
    
    # Store or update rating
    today = storage_date_format(datetime.now())
    today_display = datetime.now().strftime('%a (%b %d)')
    
    # Check if rating already exists for today
    cursor = db.execute("""
        SELECT id FROM goal_ratings 
        WHERE user_goal_id = ? AND date = ?
    """, (user_goal_id, today))
    
    if cursor.fetchone():
        # Update existing rating
        db.execute("""
            UPDATE goal_ratings 
            SET rating = ? 
            WHERE user_goal_id = ? AND date = ?
        """, (rating, user_goal_id, today))
    else:
        # Insert new rating
        db.execute("""
            INSERT INTO goal_ratings (user_goal_id, rating, date) 
            VALUES (?, ?, ?)
        """, (user_goal_id, rating, today))
    
    db.commit()
    
    status_symbol = STYLE[rating]
    return f"📅 {today_display}\n{goal_emoji} {goal_description}: {status_symbol}"
