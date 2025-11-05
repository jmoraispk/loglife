"""User-facing messages and text constants.

This module contains all user-facing messages, responses, and text strings
used throughout the application. Centralizing messages makes translation
and maintenance easier.
"""


# Welcome and onboarding messages
WELCOME_MESSAGE = """🎯 *Welcome to Life Bot!*

I'm your personal goal tracking assistant. Here's how to get started:

📋 *GOALS*
• `goals` - Show your personal goals
• `add goal 😴 Description` - Add new goal

📊 *TRACKING*
• `rate 2 3` - Rate goal #2 with rating 3 (1=fail, 2=partial, 3=success)
• `31232` - Rate all goals at once

📈 *VIEWING*
• `week` - Show week summary
• `lookback 7` - Show last 7 days (or any number)

❓ *HELP*
• `help` - Show detailed help message

*Examples:*
• `add goal 🏃 Exercise daily`
• `rate 1 3` (rate first goal as success)
• `lookback 3` (show last 3 days)

I'm here to help you build better habits and achieve your goals! What would you like to start with?"""

HELP_MESSAGE = """```Life Bot Commands:

📋 GOALS
• goals - Show your personal goals
• add goal 😴 Description - Add new goal

📊 TRACKING  
• rate 2 3 - Rate goal #2 with rating 3 (1=fail, 2=partial, 3=success)
• 31232 - Rate all goals at once

📈 VIEWING
• week - Show week summary
• lookback 7 - Show last 7 days (or any number)

❓ HELP
• help - Show this help message

Examples:
• add goal 🏃 Exercise daily
• rate 1 3 (rate first goal as success)
• lookback 3 (show last 3 days)```"""

# Referral messages
REFERRAL_SUCCESS = """🎉 *Thank you for the referral!*

You've successfully shared a contact with Life Bot. The person you referred will receive an onboarding message to get started with their goal tracking journey.

💡 *What happens next:*
• They'll get a welcome message with instructions
• They can start adding and tracking their goals
• You've helped someone improve their life habits!

Keep up the great work of spreading positive habits! 🌟"""

# Error messages
ERROR_NO_GOALS_SET = "❌ No goals set. Please set goals first."
ERROR_NO_GOALS_ADD_FIRST = "❌ No goals set. Please add goals first."
ERROR_USER_NOT_FOUND = "❌ User not found"
ERROR_GOAL_NOT_FOUND = "❌ Goal not found"
ERROR_UNRECOGNIZED_MESSAGE = "❌ Unrecognized message. Type 'help' to see available commands."
ERROR_WAID_REQUIRED = "WAID is required"

# Goal-related messages
def ERROR_GOAL_ALREADY_EXISTS(goal_emoji: str) -> str:
    """
    Generate error message when user tries to add a duplicate goal.
    
    Args:
        goal_emoji (str): Emoji of the goal that already exists
    
    Returns:
        str: Error message informing user about duplicate goal
    """
    return f"❌ Goal {goal_emoji} already exists for you."

def ERROR_GOAL_NOT_FOUND_WITH_EMOJI(goal_emoji: str) -> str:
    """
    Generate error message when a goal with specific emoji is not found.
    
    Args:
        goal_emoji (str): Emoji of the goal that was not found
    
    Returns:
        str: Error message indicating goal not found
    """
    return f"❌ Goal {goal_emoji} not found"

def ERROR_INVALID_INPUT_LENGTH(num_goals: int) -> str:
    """
    Generate error message when rating input has incorrect length.
    
    Args:
        num_goals (int): Number of goals the user has (expected input length)
    
    Returns:
        str: Error message with example of correct format
    """
    return f"❌ Invalid input. Send {num_goals} digits like: 31232"

def ERROR_INVALID_INPUT_DIGITS(num_goals: int) -> str:
    """
    Generate error message when rating input contains invalid digits.
    
    Args:
        num_goals (int): Number of goals the user has
    
    Returns:
        str: Error message instructing user to use digits 1-3
    """
    return f"❌ Invalid input. Send {num_goals} digits between 1 and 3"

def ERROR_GOAL_NUMBER_RANGE(max_goals: int) -> str:
    """
    Generate error message when goal number is out of valid range.
    
    Args:
        max_goals (int): Maximum number of goals the user has
    
    Returns:
        str: Error message indicating valid goal number range
    """
    return f"❌ Goal number must be between 1 and {max_goals}"

# Rating messages
ERROR_RATING_INVALID = "❌ Rating must be 1, 2, or 3"

# Usage messages
USAGE_ADD_GOAL = "❌ Usage: add goal 😴 Sleep by 9pm"
USAGE_RATE = "❌ Usage: rate 2 3 (goal number and rating 1-3)"

# Success messages
DEFAULT_GOAL_EMOJI = "🎯"

def SUCCESS_GOAL_ADDED(goal_emoji: str, goal_description: str) -> str:
    """
    Generate success message when a goal is successfully added.
    
    Args:
        goal_emoji (str): Emoji of the added goal
        goal_description (str): Description of the added goal
    
    Returns:
        str: Success message confirming goal addition
    """
    return f"✅ Added goal: {goal_emoji} {goal_description}"

# Summary messages
def SUCCESS_RATINGS_SUBMITTED(today_display: str, goal_emojis: list[str], status: list[str]) -> str:
    return f"📅 {today_display}\n{' '.join(goal_emojis)}\n{' '.join(status)}"

def SUCCESS_INDIVIDUAL_RATING(today_display: str, goal_emoji: str, goal_description: str, status_symbol: str) -> str:
    """
    Generate success message when an individual goal is rated.
    
    Args:
        today_display (str): Formatted date string for display (e.g., "Mon (Jun 30)")
        goal_emoji (str): Emoji of the rated goal
        goal_description (str): Description of the rated goal
        status_symbol (str): Status symbol representing the rating (✅, ⚠️, or ❌)
    
    Returns:
        str: Formatted message showing date, goal, and rating status
    """
    return f"📅 {today_display}\n{goal_emoji} {goal_description}: {status_symbol}"

# Look back summary messages
def LOOKBACK_NO_GOALS(days: str = "") -> str:
    """
    Generate message when user has no goals set for lookback summary.
    
    Args:
        days (str, optional): Number of days for the lookback (not used in message,
                            kept for consistency with other message functions)
    
    Returns:
        str: Message instructing user to add goals first
    """
    return "```No goals set. Use 'add goal 😴 Description' to add goals.```"

LOOKBACK_USER_NOT_FOUND = "```User not found```"

def LOOKBACK_HEADER(days: int) -> str:
    """
    Generate header for lookback summary with number of days.
    
    Args:
        days (int): Number of days to look back
    
    Returns:
        str: Header string for the lookback summary (e.g., "Last 7 days:\n")
    """
    return f"Last {days} days:\n"

