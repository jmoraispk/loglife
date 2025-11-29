"""Tests for process_vcard logic."""

import json
import sqlite3
from unittest.mock import patch

import pytest
from app.db.operations import referrals, users
from app.logic import process_vcard
from app.logic.vcard.processor import _extract_phone_number


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

    with patch("app.logic.vcard.processor.send_message") as mock_send:
        # Act
        response = process_vcard(referrer, vcards)

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

    with patch("app.logic.vcard.processor.send_message") as mock_send:
        # Act
        process_vcard(referrer, vcards)

        # Verify referral created (would fail if tried to create again)
        with pytest.raises(sqlite3.IntegrityError):
            referrals.create_referral(referrer["id"], existing_user["id"])

        mock_send.assert_called_once()


def test_process_vcard_malformed_json():
    """Test vcard processing with malformed JSON string."""
    referrer = users.create_user("+1234567890", "UTC")

    # If json.loads fails, it will raise JSONDecodeError.
    # The current implementation does NOT catch this in process_vcard.
    # It relies on the caller (webhook) to catch Exception.
    # Let's verify it raises so webhook can catch it.
    with pytest.raises(json.JSONDecodeError):
        process_vcard(referrer, "{invalid_json")


def test_process_vcard_empty_list():
    """Test processing an empty list of vcards."""
    referrer = users.create_user("+1234567890", "UTC")

    # Empty list
    response = process_vcard(referrer, "[]")
    assert "Thank you for the referral" in response
    # Should succeed but do nothing


def test_process_vcard_missing_waid():
    """Test vcard string that doesn't contain a waid."""
    referrer = users.create_user("+1234567890", "UTC")
    vcards = json.dumps(["BEGIN:VCARD\nFN:John Doe\nEND:VCARD"])

    # _extract_phone_number will raise AttributeError if regex doesn't match
    # This is an unhandled edge case in current logic if we expect strict vcards.
    # Ideally it should probably skip or error gracefully.
    # For now, let's document behavior: it raises AttributeError
    with pytest.raises(AttributeError):
        process_vcard(referrer, vcards)
