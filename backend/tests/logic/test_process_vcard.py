"""Tests for process_vcard logic."""

import json
import sqlite3
from unittest.mock import patch

import pytest
from app.db.operations import referrals, users
from app.logic.process_vcard import _extract_phone_number, process_vard


def test_internal_extract_phone_number() -> None:
    """Test internal _extract_phone_number function."""
    test_cases = [
        # Simple vcard with phone number
        ("waid=1234567890", "1234567890"),
        # Vcard with additional text before
        ("BEGIN:VCARD\nwaid=9876543210", "9876543210"),
        # Vcard with additional text after
        ("waid=5555555555:END", "5555555555"),
    ]

    for vcard_string, expected_phone in test_cases:
        result = _extract_phone_number(vcard_string)
        assert result == expected_phone


def test_process_vcard_creates_referral() -> None:
    """Test processing a vcard creates a referral."""
    # Arrange
    referrer = users.create_user("+1234567890", "UTC")
    vcards = json.dumps(["waid=9876543210"])

    with patch("app.logic.process_vcard.send_message") as mock_send:
        # Act
        response = process_vard(referrer, vcards)

        # Assert
        assert "Thank you for the referral" in response

        # Verify referred user created
        referred = users.get_user_by_phone_number("9876543210")
        assert referred is not None

        # Verify referral record created
        # Note: referrals.create_referral doesn't have a simple getter exposed
        # to check directly easily without custom query, but we can check if it runs without error.
        # Or we can try to create it again and expect IntegrityError if it exists
        with pytest.raises(sqlite3.IntegrityError):
            referrals.create_referral(referrer["id"], referred["id"])

        mock_send.assert_called_once()


def test_process_vcard_existing_user() -> None:
    """Test processing a vcard for an existing user."""
    # Arrange
    referrer = users.create_user("+1234567890", "UTC")
    existing_user = users.create_user("9876543210", "UTC")
    vcards = json.dumps(["waid=9876543210"])

    with patch("app.logic.process_vcard.send_message") as mock_send:
        # Act
        process_vard(referrer, vcards)

        # Verify referral created (would fail if tried to create again)
        with pytest.raises(sqlite3.IntegrityError):
            referrals.create_referral(referrer["id"], existing_user["id"])

        mock_send.assert_called_once()
