"""Tests for VCARD processing logic."""

import json
from unittest.mock import patch

import pytest

from loglife.app.config import REFERRAL_SUCCESS
from loglife.app.db import db
from loglife.app.db.tables import User
from loglife.app.logic.vcard import process_vcard as _real_process_vcard
from loglife.core.messaging import Message


def create_message(raw_payload: str, user: User) -> Message:
    """Create a dummy Message object for testing."""
    return Message(
        sender=user.phone_number,
        msg_type="vcard",
        raw_payload=raw_payload,
        client_type="whatsapp",
    )


def process_vcard(user: User, raw_vcards: str) -> str:
    """Wrapper to allow tests to call process_vcard with string payload."""
    return _real_process_vcard(user, create_message(raw_vcards, user))


@pytest.fixture
def referrer() -> User:
    """Create a test referrer."""
    return db.users.create("+1234567890", "UTC")


def test_process_vcard_success(referrer: User) -> None:
    """Test successful VCARD processing."""
    vcards = [
        "BEGIN:VCARD\nVERSION:3.0\nN:;Test;;;\nFN:Test\n"
        "TEL;waid=9876543210:+98 765 43210\nEND:VCARD",
    ]
    raw_vcards = json.dumps(vcards)

    with patch("loglife.app.logic.vcard.processor.queue_async_message") as mock_queue:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        mock_queue.assert_called_once()

        # Verify referred user created
        referred = db.users.get_by_phone("9876543210")
        assert referred is not None
        assert referred.timezone == "Asia/Karachi"  # Default
        assert referred.referred_by_id == referrer.id


def test_process_vcard_existing_user(referrer: User) -> None:
    """Test processing VCARD for existing user."""
    # Create existing referred user
    db.users.create("9876543210", "Europe/London")

    vcards = ["BEGIN:VCARD\nVERSION:3.0\nTEL;waid=9876543210:+98 765 43210\nEND:VCARD"]
    raw_vcards = json.dumps(vcards)

    with patch("loglife.app.logic.vcard.processor.queue_async_message") as mock_queue:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        # Should NOT send welcome message for existing user
        mock_queue.assert_not_called()

        # Verify user still exists and wasn't overwritten
        referred = db.users.get_by_phone("9876543210")
        assert referred.timezone == "Europe/London"
        # Verify referrer WAS updated (since it was None)
        assert referred.referred_by_id == referrer.id


def test_process_vcard_multiple(referrer: User) -> None:
    """Test processing multiple VCARDs."""
    vcards = [
        "BEGIN:VCARD\nTEL;waid=1111111111:+1 111\nEND:VCARD",
        "BEGIN:VCARD\nTEL;waid=2222222222:+2 222\nEND:VCARD",
    ]
    raw_vcards = json.dumps(vcards)

    with patch("loglife.app.logic.vcard.processor.queue_async_message") as mock_queue:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        assert mock_queue.call_count == 2

        u1 = db.users.get_by_phone("1111111111")
        assert u1 is not None
        assert u1.referred_by_id == referrer.id

        u2 = db.users.get_by_phone("2222222222")
        assert u2 is not None
        assert u2.referred_by_id == referrer.id
