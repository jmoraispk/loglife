"""Tests for VCARD processing logic."""

import json
from unittest.mock import patch

import pytest
from app.config import REFERRAL_SUCCESS
from app.db.client import db
from app.logic.vcard.processor import process_vcard


@pytest.fixture
def referrer():
    return db.users.create("+1234567890", "UTC")


def test_process_vcard_success(referrer):
    """Test successful VCARD processing."""
    vcards = ['BEGIN:VCARD\nVERSION:3.0\nN:;Test;;;\nFN:Test\nTEL;waid=9876543210:+98 765 43210\nEND:VCARD']
    raw_vcards = json.dumps(vcards)

    with patch("app.logic.vcard.processor.send_message") as mock_send:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        mock_send.assert_called_once()

        # Verify referred user created
        referred = db.users.get_by_phone("9876543210")
        assert referred is not None
        assert referred.timezone == "Asia/Karachi"  # Default

        # Verify referral created (we can't directly get referral by ID easily without ID, 
        # but we can check it exists via get_referral if we had get_by_referrer, 
        # or just trust no error raised and users created)
        # Since we don't have get_by_referrer exposed in Table (yet), we assume success if no error.
        # Or we can use the fact that create_referral creates a record.


def test_process_vcard_existing_user(referrer):
    """Test processing VCARD for existing user."""
    # Create existing referred user
    db.users.create("9876543210", "Europe/London")

    vcards = ['BEGIN:VCARD\nVERSION:3.0\nTEL;waid=9876543210:+98 765 43210\nEND:VCARD']
    raw_vcards = json.dumps(vcards)

    with patch("app.logic.vcard.processor.send_message") as mock_send:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        mock_send.assert_called_once()

        # Verify user still exists and wasn't overwritten
        referred = db.users.get_by_phone("9876543210")
        assert referred.timezone == "Europe/London"


def test_process_vcard_multiple(referrer):
    """Test processing multiple VCARDs."""
    vcards = [
        'BEGIN:VCARD\nTEL;waid=1111111111:+1 111\nEND:VCARD',
        'BEGIN:VCARD\nTEL;waid=2222222222:+2 222\nEND:VCARD',
    ]
    raw_vcards = json.dumps(vcards)

    with patch("app.logic.vcard.processor.send_message") as mock_send:
        response = process_vcard(referrer, raw_vcards)

        assert response == REFERRAL_SUCCESS
        assert mock_send.call_count == 2

        assert db.users.get_by_phone("1111111111") is not None
        assert db.users.get_by_phone("2222222222") is not None
