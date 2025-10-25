import re

try:
    import phonenumbers
    from phonenumbers import timezone as pn_timezone
except ImportError:
    print("Missing dependency: phonenumbers. Install it with 'pip install phonenumbers'.")
    exit(1)


def get_timezone_from_number(number_str: str) -> str:
    """
    Get timezone from phone number.
    
    Args:
        number_str: Phone number string (e.g., "923090052353")
    
    Returns:
        str: Timezone(s) or "Unknown timezone for this number."
    """
    # Normalize input - remove non-digits and +, then add + if missing
    cleaned = re.sub(r"[^\d+]", "", number_str)
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    
    try:
        parsed = phonenumbers.parse(cleaned, None)
        timezones = pn_timezone.time_zones_for_number(parsed)
        
        if not timezones:
            return "Unknown timezone for this number."
        
        # Return comma-separated if multiple timezones
        return ", ".join(timezones)
        
    except Exception:
        return "Unknown timezone for this number."