"""User-facing messages and text constants.

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
• `enable journaling` - Quick add journaling goal

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

I'm here to help you build better habits and achieve your goals!
What would you like to start with?"""

# -----------------------------
# Help Messages
# -----------------------------
HELP_MESSAGE = """❓ *LogLife Commands*

📋 *GOALS*
• `goals` - Show your personal goals
• `add goal 😴 Description` - Add new goal
• `enable journaling` - Quick add journaling goal
• `delete [number]` - Delete a goal
• `update [number] [time]` - Update reminder time

📊 *TRACKING*
• `rate 2 3` - Rate goal #2 with rating 3 (1=fail, 2=partial, 3=success)
• `31232` - Rate all goals at once

📈 *VIEWING*
• `week` - Show week summary
• `lookback 7` - Show last 7 days (or any number)

⚙️ *SETTINGS*
• `on transcript` - Get text files with audio transcripts
• `off transcript` - Only get summary (no files)

❓ *HELP*
• `help` - Show this help message

*Examples:*
• `add goal 🏃 Exercise daily`
• `rate 1 3` (rate first goal as success)
• `lookback 3` (show last 3 days)
• `delete 2` (delete goal #2)
• `update 1 8pm` (change goal #1 reminder to 8pm)"""

# -----------------------------
# Referral Messages
# -----------------------------
REFERRAL_SUCCESS = """🎉 *Thank you for the referral!*

You've successfully shared a contact with LogLife. The person you referred
will receive an onboarding message to get started with their goal tracking
journey.

💡 *What happens next:*
• They'll get a welcome message with instructions
• They can start adding and tracking their goals
• You've helped someone improve their life habits!

Keep up the great work of spreading positive habits! 🌟"""

# -----------------------------
# Error Messages
# -----------------------------
ERROR_NO_GOALS_SET = "❌ You don't have any goals yet. Add one with `add goal 😴 Description`"
ERROR_INVALID_INPUT_LENGTH = "❌ Invalid input. Send <num_goals> digits."
ERROR_INVALID_GOAL_NUMBER = "Invalid goal number. Type `goals` to see your goals."
ERROR_INVALID_DELETE_FORMAT = "Invalid format. Usage: `delete [goal number]`\nExample: `delete 1`"
ERROR_INVALID_UPDATE_FORMAT = "Usage: `update [goal number] [time]`\nExample: `update 1 8pm`"
ERROR_INVALID_TIME_FORMAT = "Invalid time format. Try: 8pm, 9:30am, 20:00"
ERROR_ADD_GOAL_FIRST = "Please add a goal first."

# Usage messages
USAGE_RATE = "❌ Usage: rate 2 3 (goal number and rating 1-3)"

# -----------------------------
# Success Messages
# -----------------------------
SUCCESS_RATINGS_SUBMITTED = "📅 <today_display>\n<goal_emojis> <goal_description>: <status>"
SUCCESS_INDIVIDUAL_RATING = "📅 <today_display>\n<goal_emoji> <goal_description>: <status_symbol>"
SUCCESS_GOAL_ADDED = "Goal Added successfully! When you would like to be reminded?"
SUCCESS_JOURNALING_ENABLED = "✅ You already have a journaling goal! Check `goals` to see it."
SUCCESS_GOAL_DELETED = "✅ Goal deleted: {goal_emoji} {goal_description}"
SUCCESS_REMINDER_UPDATED = (
    "✅ Reminder updated! I'll remind you at {display_time} for {goal_emoji} {goal_desc}"
)
SUCCESS_TRANSCRIPT_ENABLED = (
    "✅ Transcript files enabled! You'll now receive transcript file with your audio journaling."
)
SUCCESS_TRANSCRIPT_DISABLED = (
    "✅ Transcript files disabled! You'll only receive the summary message when audio journaling."
)

# -----------------------------
# Lookback Summary Messages
# -----------------------------
LOOKBACK_NO_GOALS = "No goals set. Use `add goal 😴 Description` to add goals."

# -----------------------------
# Reminder Messages
# -----------------------------
REMINDER_MESSAGE = "⏰ Reminder: <goal_emoji> <goal_description>"
JOURNAL_REMINDER_MESSAGE = """📓 *Time to reflect on your day!*

Take a moment to journal your thoughts, experiences, and feelings.

- *What's on my mind right now?*
  (I'll dump my thoughts freely — no filter.)

- *Did my day go as I expected?*
  (I'll notice surprises or patterns.)

- *What's bothering me? Why?*
  (I'll name it without overthinking.)

- *What mistake or lesson stood out to me today?*
  (I'll keep it honest, short, and specific.)

- *What's one clear thing I want to do tomorrow?*
  (I'll set a simple intention without pressure.)

<goals_not_tracked_today>

You can reply with a voice note. 💭"""


# -------------------
# New Centralized Messages
# -------------------

# From handlers.py
ERROR_GOAL_NOT_FOUND = "Goal not found."
SUCCESS_REMINDER_SET = (
    "Got it! I'll remind you daily at {display_time} for {goal_emoji} {goal_desc}."
)
GOALS_LIST_TIPS = (
    "\n\n💡 _Tips:_\n"
    "_Update reminders with `update [goal#] [time]`_\n"
    "_Delete goals with `delete [goal#]`_"
)
ERROR_INVALID_TRANSCRIPT_CMD = "Invalid command. Usage: `transcript [on|off]`"

# From processor.py
ERROR_TEXT_PROCESSOR = "Error in text processor: {exc}"
ERROR_WRONG_COMMAND = "Wrong command!"

# From services/reminder/worker.py
REMINDER_UNTRACKED_HEADER = "- *Did you complete the goals?*\n"
