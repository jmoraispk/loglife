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
ERROR_GOAL_ALREADY_EXISTS = "❌ Goal <goal_emoji> already exists for you."
ERROR_GOAL_NOT_FOUND_WITH_EMOJI = "❌ Goal <goal_emoji> not found"
ERROR_INVALID_INPUT_LENGTH = "❌ Invalid input. Send <num_goals> digits like: 31232"
ERROR_INVALID_INPUT_DIGITS = "❌ Invalid input. Send <num_goals> digits between 1 and 3"
ERROR_GOAL_NUMBER_RANGE = "❌ Goal number must be between 1 and <max_goals>"

# Rating messages
ERROR_RATING_INVALID = "❌ Rating must be 1, 2, or 3"

# Usage messages
USAGE_ADD_GOAL = "❌ Usage: add goal 😴 Sleep by 9pm"
USAGE_RATE = "❌ Usage: rate 2 3 (goal number and rating 1-3)"

# Success messages
DEFAULT_GOAL_EMOJI = "🎯"
SUCCESS_GOAL_ADDED = "✅ Added goal: <goal_emoji> <goal_description>"

# Summary messages
SUCCESS_RATINGS_SUBMITTED = "📅 <today_display>\n<goal_emojis>\n<status>"
SUCCESS_INDIVIDUAL_RATING = "📅 <today_display>\n<goal_emoji> <goal_description>: <status_symbol>"

# Look back summary messages
LOOKBACK_NO_GOALS = "```No goals set. Use 'add goal 😴 Description' to add goals.```"
LOOKBACK_USER_NOT_FOUND = "```User not found```"
LOOKBACK_HEADER = "Last <days> days:\n"

