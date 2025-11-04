"""Contact detection utilities for WhatsApp VCARD format.

This module provides functions to detect and extract contact information
from WhatsApp messages when users share contact cards.
"""
import re


def is_vcard(message: str) -> bool:
    """
    Detects if the message contains VCARD format data from WhatsApp.
    
    When users share contacts on WhatsApp, the message contains VCARD data in this format:
    BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD
    
    Args:
        message (str): The message content to check
        
    Returns:
        bool: True if the message contains VCARD format data, False otherwise
    """
    if not message or not isinstance(message, str):
        return False
    
    # Check if message starts with BEGIN:VCARD and ends with END:VCARD
    return message.strip().startswith("BEGIN:VCARD") and message.strip().endswith("END:VCARD")


def extract_waid_from_vcard(message: str) -> str:
    """
    Extracts the WhatsApp ID (waid) from VCARD data.
    
    Args:
        message (str): The VCARD message content
        
    Returns:
        str: The WhatsApp ID (waid) if found, empty string otherwise
        
    Example:
        Input: "BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD"
        Output: "923325727426"
    """
    if not message or not isinstance(message, str):
        return ""
    
    try:
        # Look for waid= pattern in the message
        waid_pattern: str = r'waid=(\d+)'
        match: re.Match[str] | None = re.search(waid_pattern, message)
        
        if match:
            return match.group(1)
        return ""
    except Exception:
        return ""
