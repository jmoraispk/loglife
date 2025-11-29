"""Reminder time parsing helpers."""

import re
from datetime import datetime

# internal variable (not intended for import)
_HH_MM = re.compile(r"^\d{1,2}:\d{2}$")
_HH_MM_AM_PM = re.compile(r"^\d{1,2}:\d{2}\s?(am|pm)$", re.IGNORECASE)
_HH_AM_PM = re.compile(r"^\d{1,2}\s?(am|pm)$", re.IGNORECASE)
_HH_ONLY = re.compile(r"^\d{1,2}$")

MAX_HOUR = 23


def parse_time_string(raw: str) -> str | None:
    """Parse user-provided time text into HH:MM:00 format.

    Accept inputs like '18:00', '10:15 PM', '6 PM', '6pm', or '6' and return
    a normalized time string with seconds set to 00. Returns None if the value
    cannot be parsed or is out of range.

    Args:
        raw: The incoming time value as typed by the user

    Returns:
        The normalized time string or None if invalid.

    """
    cleaned = raw.strip()
    lowered = cleaned.lower()

    try:
        if _HH_MM.match(cleaned):
            parsed = datetime.strptime(cleaned, "%H:%M").time()  # noqa: DTZ007
            return parsed.strftime("%H:%M:00")

        if _HH_MM_AM_PM.match(lowered):
            parsed = datetime.strptime(lowered.replace(" ", ""), "%I:%M%p").time()  # noqa: DTZ007
            return parsed.strftime("%H:%M:00")

        if _HH_AM_PM.match(lowered):
            parsed = datetime.strptime(lowered.replace(" ", ""), "%I%p").time()  # noqa: DTZ007
            return parsed.strftime("%H:%M:00")

        if _HH_ONLY.match(cleaned):
            hour = int(cleaned)
            if 0 <= hour <= MAX_HOUR:
                return f"{hour:02d}:00:00"
    except ValueError:
        return None

    return None
