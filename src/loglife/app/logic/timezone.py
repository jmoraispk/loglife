"""Utilities for working with user timezones based on phone numbers."""

from __future__ import annotations

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
    return timezones[0]
