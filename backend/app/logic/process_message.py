"""Message processing and routing logic.

This module handles incoming user messages, parses commands, and routes them
to appropriate handlers for goals, ratings, summaries, and help commands.
"""
<<<<<<< HEAD
import logging
=======
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)
from app.logic.helpers.format_goals import format_goals
from app.logic.helpers.format_week_summary import format_week_summary
from app.logic.helpers.look_back_summary import look_back_summary
from app.logic.helpers.handle_goal_ratings import handle_goal_ratings
from app.logic.helpers.add_goal import add_goal
from app.logic.helpers.rate_individual_goal import rate_individual_goal
from app.logic.helpers.show_help import show_help
from app.helpers.contact_detector import is_vcard, extract_waid_from_vcard
from app.helpers.referral_tracker import process_referral
from app.utils.messages import USAGE_ADD_GOAL, USAGE_RATE, ERROR_UNRECOGNIZED_MESSAGE, REFERRAL_SUCCESS

def process_message(message: str, sender: str) -> str:
    """Process incoming messages and route to appropriate handlers.
    
    Parses user messages and routes them to the appropriate command handlers
    based on message content. Supports goals, ratings, summaries, help commands,
    and contact referrals (VCARD format).

    Args:
        message (str): The message text from the user
        sender (str): User identifier (phone number or group ID)

    Returns:
        str: Response message to send back to the user
    """
    # Check if the message is a shared contact (VCARD format)
    # Contact sharing detection: When users share contacts on WhatsApp, the message contains VCARD data
    # Example: BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD
    if is_vcard(message):
        # Extract WhatsApp ID from the VCARD data
        waid: str = extract_waid_from_vcard(message)
        logging.debug(f"[BACKEND] Contact shared detected, WAID: {waid}")
        
        # Process referral: save to database and send onboarding message
        if waid:
            process_referral(sender, waid)
        
        return REFERRAL_SUCCESS
    
    user_id: str = sender  # could be phone or group ID
    message: str = message.strip().lower()

    if message.startswith("help"):
        return show_help()
    
    if message.startswith("goals"):
        return format_goals(user_id)
    
    if message.startswith("week"):
        return format_week_summary(user_id)
    
    if message.startswith("lookback"):
        # Extract number of days from message (e.g., "lookback 5" or "lookback")
        parts: list[str] = message.split()
        if len(parts) > 1 and parts[1].isdigit():
            days: int = int(parts[1])
        else:
            days = 7  # Default to 7 days
        return look_back_summary(user_id, days)
    
    if message.startswith("add goal"):
        # Extract the complete goal string (e.g., "add goal 😴 Sleep by 9pm")
        parts = message.split(" ", 2)  # Split into max 3 parts
        if len(parts) >= 3:
            goal_string: str = parts[2]  # Everything after "add goal"
            return add_goal(user_id, goal_string)
        else:
            return USAGE_ADD_GOAL
    
    if message.startswith("rate"):
        # Extract goal number and rating (e.g., "rate 2 3")
        parts = message.split()
        if len(parts) == 3 and parts[1].isdigit() and parts[2].isdigit():
            goal_number: int = int(parts[1])
            rating: int = int(parts[2])
            return rate_individual_goal(user_id, goal_number, rating)
        else:
            return USAGE_RATE
    
    # Handle goal ratings (digits 1-3) - rate all goals at once
    if message.isdigit() and all(c in "123" for c in message):
        return handle_goal_ratings(message, user_id)

    return ERROR_UNRECOGNIZED_MESSAGE
