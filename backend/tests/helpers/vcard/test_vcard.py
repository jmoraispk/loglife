"""Tests for vcard phone number extraction helpers."""

import pytest
from backend.app.helpers.vcard import vcard


@pytest.mark.parametrize(
    "vcard_string, expected_phone",
    [
        # Simple vcard with phone number
        ("waid=1234567890", "1234567890"),
        # Vcard with additional text before
        ("BEGIN:VCARD\nwaid=9876543210", "9876543210"),
        # Vcard with additional text after
        ("waid=5555555555:END", "5555555555"),
    ],
)
def test_extract_phone_number(vcard_string, expected_phone):
    """
    Test phone number extraction from vcard strings.

    Arguments:
        vcard_string: Vcard formatted string to extract phone from (parametrized)
        expected_phone: Expected extracted phone number (parametrized)
    """
    result = vcard.extract_phone_number(vcard_string)
    assert result == expected_phone
