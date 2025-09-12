"""Clock utilities for timezone-aware date/time operations."""

from __future__ import annotations

from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    """Return current UTC datetime with tzinfo=UTC."""
    return datetime.now(tz=UTC)


def now_in_tz(tz_name: str) -> datetime:
    """Return current datetime in the given IANA timezone name.

    Args:
        tz_name: IANA timezone, e.g., "America/Los_Angeles".
    """
    return now_utc().astimezone(ZoneInfo(tz_name))


def today_in_tz(tz_name: str) -> date:
    """Return today's date in the given timezone."""
    return now_in_tz(tz_name).date()


def yesterday_in_tz(tz_name: str) -> date:
    """Return yesterday's date in the given timezone."""
    return date.fromordinal(today_in_tz(tz_name).toordinal() - 1)
