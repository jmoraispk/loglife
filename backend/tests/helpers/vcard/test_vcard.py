"""Tests for vcard phone number extraction helpers."""

from app.helpers.vcard import vcard


def test_extract_phone_number():
    """Test phone number extraction from vcard strings."""
    test_cases = [
        # Simple vcard with phone number
        ("waid=1234567890", "1234567890"),
        # Vcard with additional text before
        ("BEGIN:VCARD\nwaid=9876543210", "9876543210"),
        # Vcard with additional text after
        ("waid=5555555555:END", "5555555555"),
    ]

    for vcard_string, expected_phone in test_cases:
        result = vcard.extract_phone_number(vcard_string)
        assert result == expected_phone
