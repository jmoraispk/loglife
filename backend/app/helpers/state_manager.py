"""User conversation state management utilities.

This module provides functions for managing user conversation states,
allowing the bot to track multi-step interactions like setting reminder times.
"""
import logging
from app.db.sqlite import execute_query, fetch_one


def set_user_state(user_phone, state, temp_data=None):
    """
    Set user's conversation state.
    
    Args:
        user_phone (str): User's phone number
        state (str): State name (e.g., 'waiting_for_reminder_time', 'normal')
        temp_data (str): Optional temporary data to store
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        execute_query("""
            INSERT OR REPLACE INTO user_states (user_phone, state, temp_data)
            VALUES (?, ?, ?)
        """, (user_phone, state, temp_data))
        
        logging.debug(f"[STATE] Set user {user_phone} to state: {state}")
        return True
        
    except Exception as e:
        logging.error(f"[STATE] Failed to set user state: {str(e)}")
        return False


def get_user_state(user_phone):
    """
    Get user's current conversation state.
    
    Args:
        user_phone (str): User's phone number
        
    Returns:
        dict: State info with 'state' and 'temp_data', or None if not found
    """
    try:
        result = fetch_one("""
            SELECT state, temp_data FROM user_states 
            WHERE user_phone = ?
        """, (user_phone,))
        
        if result:
            return {
                'state': result['state'],
                'temp_data': result['temp_data']
            }
        return None
        
    except Exception as e:
        logging.error(f"[STATE] Failed to get user state: {str(e)}")
        return None


def clear_user_state(user_phone):
    """
    Clear user's conversation state (set to normal).
    
    Args:
        user_phone (str): User's phone number
        
    Returns:
        bool: True if successful, False otherwise
    """
    return set_user_state(user_phone, 'normal', None)
