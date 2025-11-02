"""WhatsApp message sending utilities.

This module provides functions for sending formatted messages to users
via WhatsApp API.
"""
from typing import Any, Dict
from app.helpers.api.whatsapp_api import send_whatsapp_message
from app.utils.messages import WELCOME_MESSAGE, ERROR_WAID_REQUIRED


def send_hi_message_to_contact(waid: str) -> Dict[str, Any]:
    """
    Sends a "Hi" message to a contact using their WhatsApp ID.
    
    Args:
        waid (str): The WhatsApp ID of the contact
        
    Returns:
        Dict[str, Any]: API response containing success status and details
    """
    if not waid:
        return {
            "success": False,
            "error": ERROR_WAID_REQUIRED
        }
    
    return send_whatsapp_message(waid, WELCOME_MESSAGE)
