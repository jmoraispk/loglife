"""Utilities for working with user timezones based on phone numbers."""


from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import phonenumbers
from phonenumbers import NumberParseException, timezone


def get_timezone_from_number(number: str) -> str:
    """Derive an IANA timezone string for a given phone number.

    The function attempts to parse the phone number using `phonenumbers` and
    returns the first timezone associated with the parsed region. If parsing
    fails or no timezone information is available, "UTC" is returned.
    """
    try:
        normalized = number if number.startswith("+") else f"+{number}"
        parsed = phonenumbers.parse(normalized)
    except NumberParseException:
        return "UTC"

    timezones = timezone.time_zones_for_number(parsed)
    if not timezones:
        return "UTC"

    tz = timezones[0]
    if tz == "Etc/Unknown":
        return "UTC"

    return tz


def get_timezone_safe(timezone_str: str) -> ZoneInfo:
    """Get ZoneInfo, falling back to UTC if timezone is invalid or unknown.

    Arguments:
        timezone_str: Timezone string in IANA format (e.g., "Asia/Karachi",
            "America/New_York")

    Returns:
        A ZoneInfo object for the given timezone string, or UTC if the timezone
        is invalid or unknown.

    """
    timezone_str = timezone_str.strip()
    try:
        return ZoneInfo(timezone_str)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")
