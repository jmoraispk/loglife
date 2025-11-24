"""
User-facing messages and text constants.

This module contains all user-facing messages, responses, and text strings
used throughout the application. Centralizing messages makes translation
and maintenance easier.
"""

# -----------------------------
# Welcome and Onboarding Messages
# -----------------------------
WELCOME_MESSAGE = """🎯 *Welcome to LogLife!*

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

# -----------------------------
# Help Messages
# -----------------------------
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

# -----------------------------
# Referral Messages
# -----------------------------
REFERRAL_SUCCESS = """🎉 *Thank you for the referral!*

You've successfully shared a contact with Life Bot. The person you referred will receive an onboarding message to get started with their goal tracking journey.

💡 *What happens next:*
• They'll get a welcome message with instructions
• They can start adding and tracking their goals
• You've helped someone improve their life habits!

Keep up the great work of spreading positive habits! 🌟"""

# -----------------------------
# Error Messages
# -----------------------------
ERROR_NO_GOALS_SET = "❌ You don't have any goals yet. Add one with 'add goal 😴 Description'"
ERROR_INVALID_INPUT_LENGTH = "❌ Invalid input. Send <num_goals> digits."

# Usage messages
USAGE_RATE = "❌ Usage: rate 2 3 (goal number and rating 1-3)"

# -----------------------------
# Success Messages
# -----------------------------
SUCCESS_RATINGS_SUBMITTED = (
    "📅 <today_display>\n<goal_emojis> <goal_description>: <status>"
)
SUCCESS_INDIVIDUAL_RATING = (
    "📅 <today_display>\n<goal_emoji> <goal_description>: <status_symbol>"
)

# -----------------------------
# Lookback Summary Messages
# -----------------------------
LOOKBACK_NO_GOALS = "```No goals set. Use 'add goal 😴 Description' to add goals.```"
