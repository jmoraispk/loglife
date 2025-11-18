import re
import phonenumbers
from phonenumbers import timezone


def get_timezone_from_number(number: str) -> str | None:
    try:
        parsed = phonenumbers.parse(number, None)
    except phonenumbers.NumberParseException:
        return None

    timezones = timezone.time_zones_for_number(parsed)

    # Return first timezone if available, else None
    return timezones[0] if timezones else None