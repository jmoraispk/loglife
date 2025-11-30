"""Tests for reminder service utils."""

from zoneinfo import ZoneInfo

from loglife.app.services.reminder.utils import get_timezone_safe


def test_get_timezone_safe() -> None:
    """Test safe timezone parsing with fallback to UTC.

    Verifies that the get_timezone_safe function correctly handles:
    - Valid timezone strings
    - Timezone strings with whitespace
    - Invalid timezone strings (defaults to UTC)
    - Empty strings (defaults to UTC)
    """
    assert get_timezone_safe("America/New_York") == ZoneInfo("America/New_York")
    assert get_timezone_safe(" America/New_York ") == ZoneInfo("America/New_York")
    assert get_timezone_safe("Not/AZone") == ZoneInfo("UTC")
    assert get_timezone_safe("") == ZoneInfo("UTC")
