"""Tests for timezone utilities."""

from zoneinfo import ZoneInfo

from loglife.app.logic.router import get_timezone_from_number
from loglife.app.services.reminder.worker import get_timezone_safe


def test_get_timezone_from_number() -> None:
    """Test extracting timezone from phone number."""
    # 1. Valid numbers
    cases = [
        ("+12125551212", "America/New_York"),  # NY
        ("+442071234567", "Europe/London"),  # London
        ("+919876543210", "Asia/Calcutta"),  # India
    ]
    for number, expected in cases:
        assert get_timezone_from_number(number) == expected

    # 2. Invalid number -> UTC
    assert get_timezone_from_number("invalid") == "UTC"

    # 3. Number with no geo info -> UTC (e.g. some toll free)
    # +800 is International Freephone, might map to something or fail
    # phonenumbers usually returns empty list for non-geo
    assert get_timezone_from_number("+80012345678") == "UTC"


def test_get_timezone_safe() -> None:
    """Test safe timezone parsing with fallback to UTC.

    Verifies that the get_timezone_safe function correctly handles:
    - Valid timezone strings
    - Valid timezone strings with whitespace
    - Invalid timezone strings (defaults to UTC)
    - Empty strings (defaults to UTC)
    """
    assert get_timezone_safe("America/New_York") == ZoneInfo("America/New_York")
    assert get_timezone_safe(" America/New_York ") == ZoneInfo("America/New_York")
    assert get_timezone_safe("Not/AZone") == ZoneInfo("UTC")
    assert get_timezone_safe("") == ZoneInfo("UTC")
