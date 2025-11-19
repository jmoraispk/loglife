"""Timezone detection utility for phone numbers."""

import phonenumbers
from phonenumbers import PhoneNumber, timezone


def get_timezone_from_number(number: str) -> str:
    """Extracts the timezone associated with a phone number.

    Parses the given phone number and determines its geographic timezone using
    the phonenumbers library. Automatically handles E.164 format by prepending
    '+' if missing. Returns 'UTC' as a fallback if the number cannot be parsed
    or no timezone is found.

    Arguments:
    number -- Phone number string, with or without '+' prefix (e.g., "923186491240" or "+923186491240")

    Returns a Timezone string in IANA format (e.g., "Asia/Karachi", "America/New_York") or "UTC" if the number is invalid or no timezone can be determined.
    """
    try:
        # Ensure number starts with + for E.164 format
        if not number.startswith("+"):
            number: str = f"+{number}"
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
