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
from app.logic.helpers.add_goal import add_goal, set_reminder_time
from app.logic.helpers.rate_individual_goal import rate_individual_goal
from app.logic.helpers.show_help import show_help
from app.logic.command_parser import parse_add_goal_command, parse_rate_command, is_valid_rating_digits
from app.helpers.contact_detector import is_vcard, extract_waid_from_vcard
from app.helpers.referral_tracker import process_referral
from app.helpers.state_manager import get_user_state
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
    message_lower: str = message.strip().lower()
    message_original: str = message.strip()  # Keep original for reminder time parsing

    # Check commands first (commands should work even when in reminder state)
    if message_lower.startswith("help"):
        return show_help()
    
    if message_lower.startswith("goals"):
        return format_goals(user_id)
    
    if message_lower.startswith("week"):
        return format_week_summary(user_id)
    
    if message_lower.startswith("lookback"):
        # Extract number of days from message (e.g., "lookback 5" or "lookback")
        parts: list[str] = message_lower.split()
        if len(parts) > 1 and parts[1].isdigit():
            days: int = int(parts[1])
        else:
            days = 7  # Default to 7 days
        return look_back_summary(user_id, days)
    
    if message_lower.startswith("add goal"):
        goal_string = parse_add_goal_command(message_lower)
        if goal_string:
            return add_goal(user_id, goal_string)
        return USAGE_ADD_GOAL
    
    if message_lower.startswith("rate"):
        parsed = parse_rate_command(message_lower)
        if parsed:
            goal_number, rating = parsed
            return rate_individual_goal(user_id, goal_number, rating)
        return USAGE_RATE
    
    # Check if user is waiting for reminder time (only for non-command messages)
    # This should be checked BEFORE rating digits to prioritize reminder time input
    user_state = get_user_state(user_id)
    if user_state and user_state.get('state') == 'waiting_for_reminder_time':
        goal_id = user_state.get('temp_data')
        if goal_id:
            # Treat any non-command message as reminder time input
            return set_reminder_time(user_id, message_original, goal_id)
    
    # Handle goal ratings (digits 1-3) - rate all goals at once
    if is_valid_rating_digits(message_lower):
        return handle_goal_ratings(message_lower, user_id)

    return ERROR_UNRECOGNIZED_MESSAGE
