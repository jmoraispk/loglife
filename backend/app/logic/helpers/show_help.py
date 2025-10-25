"""Help message display utilities.

This module provides functions for displaying help and usage information
to users of the Life Bot application.
"""
from app.utils.messages import HELP_MESSAGE

def show_help() -> str:
    """
    Show available commands and their descriptions.
    
    Returns:
        str: Formatted help message
    """
    help_text = """```Life Bot Commands:

📋 GOALS
• goals - Show your personal goals
• add goal 😴 Description - Add new goal (will ask for reminder time)

📊 TRACKING  
• rate 2 3 - Rate goal #2 with rating 3 (1=fail, 2=partial, 3=success)
• 31232 - Rate all goals at once

📈 VIEWING
• week - Show week summary
• lookback 7 - Show last 7 days (or any number)

❓ HELP
• help - Show this help message

Examples:
• add goal 🏃 Exercise daily (then set reminder time)
• rate 1 3 (rate first goal as success)
• lookback 3 (show last 3 days)

⏰ REMINDER TIME FORMATS:
• 18:00, 6 PM, 6pm, 6:00 PM, 6```"""
    
    return help_text
