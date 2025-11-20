"""Reminder time parsing helpers."""

import re
from datetime import datetime

# internal variable (not intended for import)
_HH_MM = re.compile(r"^\d{1,2}:\d{2}$")
_HH_AM_PM = re.compile(r"^\d{1,2}\s?(am|pm)$", re.IGNORECASE)
_HH_ONLY = re.compile(r"^\d{1,2}$")


def is_valid_time_string(raw: str) -> bool:
    """Checks whether the raw string can be parsed into a valid time."""
    return parse_time_string(raw) is not None


def parse_time_string(raw: str) -> str | None:
    """Parses user-provided time text into HH:MM:00 format.

    Accepts inputs like '18:00', '6 PM', '6pm', or '6' and returns a normalized
    time string with seconds set to 00. Returns None if the value cannot be
    parsed or is out of range.

    Arguments:
    raw -- The incoming time value as typed by the user

    Returns the normalized time string or None if invalid.
    """
    cleaned = raw.strip()
    lowered = cleaned.lower()

    try:
        if _HH_MM.match(cleaned):
            parsed = datetime.strptime(cleaned, "%H:%M").time()
            return parsed.strftime("%H:%M:00")

        if _HH_AM_PM.match(lowered):
            parsed = datetime.strptime(lowered.replace(" ", ""), "%I%p").time()
            return parsed.strftime("%H:%M:00")

        if _HH_ONLY.match(cleaned):
            hour = int(cleaned)
            if 0 <= hour <= 23:
                return f"{hour:02d}:00:00"
    except ValueError:
        return None

    return None
