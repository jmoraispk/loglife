def is_contact_shared(message):
    """
    Detects if the message contains contact sharing data (VCARD format) from WhatsApp.
    
    When users share contacts on WhatsApp, the message contains VCARD data in this format:
    BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD
    
    Args:
        message (str): The message content to check
        
    Returns:
        bool: True if the message contains contact sharing data (VCARD format), False otherwise
    """
    if not message or not isinstance(message, str):
        return False
    
    # Check if message starts with BEGIN:VCARD and ends with END:VCARD
    return message.strip().startswith("BEGIN:VCARD") and message.strip().endswith("END:VCARD")


def extract_waid_from_contact(message):
    """
    Extracts the WhatsApp ID (waid) from VCARD contact sharing data.
    
    Args:
        message (str): The VCARD message content
        
    Returns:
        str: The WhatsApp ID (waid) if found, None otherwise
        
    Example:
        Input: "BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD"
        Output: "923325727426"
    """
    if not message or not isinstance(message, str):
        return None
    
    try:
        # Look for waid= pattern in the message
        import re
        waid_pattern = r'waid=(\d+)'
        match = re.search(waid_pattern, message)
        
        if match:
            return match.group(1)
        return None
    except Exception:
        return None
