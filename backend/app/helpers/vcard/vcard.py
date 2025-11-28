"""Utility for extracting data from WhatsApp VCARD payload.

This module exposes a helper to extract normalized phone number from vcard string.
"""

import re


def extract_phone_number(vcard_str: str) -> str:
    """Extract phone_number from a vcard string.

    Args:
        vcard_str: The vcard string to parse

    Returns:
        The extracted phone number.

    """
    match: re.Match[str] = re.search(r"waid=([0-9]+)", vcard_str)
    return match.group(1)
