from app.helpers.api.whatsapp_api import send_whatsapp_message


def send_hi_message_to_contact(waid):
    """
    Sends a "Hi" message to a contact using their WhatsApp ID.
    
    Args:
        waid (str): The WhatsApp ID of the contact
        
    Returns:
        dict: API response containing success status and details
    """
    if not waid:
        return {
            "success": False,
            "error": "WAID is required"
        }
    
    message = """🎯 *Welcome to Life Bot!*

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
    return send_whatsapp_message(waid, message)
