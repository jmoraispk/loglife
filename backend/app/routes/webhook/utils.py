"""Webhook utilities."""

from typing import Any

import phonenumbers
from flask import Response, jsonify
from phonenumbers import PhoneNumber, timezone


def get_timezone_from_number(number: str) -> str:
    """Extract the timezone associated with a phone number.

    Parse the given phone number and determine its geographic timezone using
    the phonenumbers library. Automatically handle E.164 format by prepending
    '+' if missing. Return 'UTC' as a fallback if the number cannot be parsed
    or no timezone is found.

    Arguments:
        number: Phone number string, with or without '+' prefix
            (e.g., "923186491240" or "+923186491240")

    Returns:
        A timezone string in IANA format (e.g., "Asia/Karachi",
        "America/New_York") or "UTC" if the number is invalid or no timezone
        can be determined.

    """
    try:
        # Ensure number starts with + for E.164 format
        if not number.startswith("+"):
            number = f"+{number}"
        # Either returns a PhoneNumber object or raises a NumberParseException
        parsed: PhoneNumber = phonenumbers.parse(number)
    except phonenumbers.NumberParseException:
        return "UTC"

    # Returns a list of the corresponding time zones or a single element list with the default
    # unknown time zone if no other time zone was found or if the number was invalid
    timezones: list[str] | None = timezone.time_zones_for_number(parsed)

    if not timezones:
        user_timezone: str = "UTC"
    else:
        user_timezone: str = timezones[0]

    return user_timezone


def error_response(
    message: str,
    data: dict[str, Any] | None = None,
    status_code: int = 400,
) -> tuple[Response, int]:
    """Build an error response body.

    Arguments:
        message: The error message
        data: Optional error data
        status_code: HTTP status code (default: 400)

    Returns:
        A tuple of (Response, status_code)

    """
    return (
        jsonify(
            {
                "success": False,
                "message": message,
                "data": data,
            }
        ),
        status_code,
    )


def success_response(
    message: str | None = None,
    status_code: int = 200,
    **kwargs: Any,  # noqa: ANN401
) -> tuple[Response, int]:
    """Build a success response body.

    Arguments:
        message: The success message
        status_code: HTTP status code (default: 200)
        **kwargs: Additional data to include in the response

    Returns:
        A tuple of (Response, status_code)

    """
    return (
        jsonify(
            {
                "success": True,
                "message": message,
                "data": kwargs,
            }
        ),
        status_code,
    )
