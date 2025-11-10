"""Tests for contact detection and referral tracking functionality.

This module contains comprehensive tests for:
- VCARD detection and parsing from WhatsApp messages
- WAID extraction from contact cards
- Referral processing and database operations
- Integration with WhatsApp API for onboarding messages
"""
from typing import Any
from unittest.mock import Mock, patch
from app.helpers.contact_detector import is_vcard, extract_waid_from_vcard
from app.helpers.referral_tracker import (
    process_referral,
    save_referral,
    get_referral_count
)
from app.db.sqlite import get_db


# ============================================================================
# Contact Detection Tests
# ============================================================================

def test_is_vcard_valid_vcard() -> None:
    """Test detection of a valid VCARD message."""
    vcard_message: str = """BEGIN:VCARD
VERSION:3.0
N:;0332 5727426;;;
FN:0332 5727426
TEL;type=CELL;waid=923325727426:+92 332 5727426
END:VCARD"""
    assert is_vcard(vcard_message) is True


def test_is_vcard_invalid_missing_begin() -> None:
    """Test detection fails when BEGIN:VCARD is missing."""
    invalid_message: str = "VERSION:3.0\nFN:Test\nEND:VCARD"
    assert is_vcard(invalid_message) is False


def test_is_vcard_invalid_missing_end() -> None:
    """Test detection fails when END:VCARD is missing."""
    invalid_message: str = "BEGIN:VCARD\nVERSION:3.0\nFN:Test"
    assert is_vcard(invalid_message) is False


def test_is_vcard_empty_string() -> None:
    """Test detection fails for empty string."""
    assert is_vcard("") is False


def test_is_vcard_regular_message() -> None:
    """Test detection correctly identifies non-VCARD messages."""
    regular_message: str = "This is just a regular message"
    assert is_vcard(regular_message) is False


def test_is_vcard_with_whitespace() -> None:
    """Test detection handles whitespace correctly."""
    vcard_with_spaces: str = """   BEGIN:VCARD
   VERSION:3.0
   N:;Test;;;
   END:VCARD   """
    assert is_vcard(vcard_with_spaces) is True


def test_extract_waid_from_vcard_valid() -> None:
    """Test extraction of WAID from valid VCARD."""
    vcard_message: str = """BEGIN:VCARD
VERSION:3.0
N:;0332 5727426;;;
FN:0332 5727426
TEL;type=CELL;waid=923325727426:+92 332 5727426
END:VCARD"""
    waid: str = extract_waid_from_vcard(vcard_message)
    assert waid == "923325727426"


def test_extract_waid_from_vcard_invalid() -> None:
    """Test extraction fails for invalid VCARD without WAID."""
    invalid_vcard: str = """BEGIN:VCARD
VERSION:3.0
N:;Test;;;
END:VCARD"""
    waid: str = extract_waid_from_vcard(invalid_vcard)
    assert waid == ""


def test_extract_waid_from_vcard_empty_string() -> None:
    """Test extraction fails for empty string."""
    assert extract_waid_from_vcard("") == ""


def test_extract_waid_from_vcard_non_vcard_message() -> None:
    """Test extraction fails for non-VCARD message."""
    regular_message: str = "This is not a VCARD message"
    assert extract_waid_from_vcard(regular_message) == ""


def test_extract_waid_from_vcard_multiple_waids() -> None:
    """Test extraction gets first WAID when multiple exist."""
    vcard_multiple: str = """BEGIN:VCARD
VERSION:3.0
TEL;waid=923325727426:+92 332 5727426
TEL;waid=123456789:+1 234 5678
END:VCARD"""
    waid: str = extract_waid_from_vcard(vcard_multiple)
    assert waid == "923325727426"


# ============================================================================
# Referral Processing Tests
# ============================================================================

@patch('app.helpers.referral_tracker.send_onboarding_msg')
def test_process_referral_success(mock_send: Mock) -> None:
    """Test successful referral processing with message sending."""
    mock_send.return_value = {"success": True}
    
    result: bool = process_referral("03325727426", "923325727426")
    
    assert result is True
    mock_send.assert_called_once_with("923325727426")


@patch('app.helpers.referral_tracker.send_onboarding_msg')
def test_process_referral_message_failure(mock_send: Mock) -> None:
    """Test referral processing succeeds even if message send fails."""
    mock_send.return_value = {"success": False, "error": "API error"}
    
    result: bool = process_referral("03325727426", "923325727426")
    
    # Should still return True because referral was saved
    assert result is True
    mock_send.assert_called_once_with("923325727426")


@patch('app.helpers.referral_tracker.send_onboarding_msg')
def test_process_referral_invalid_waid(mock_send: Mock) -> None:
    """Test referral processing fails for invalid WAID."""
    result: bool = process_referral("03325727426", "")
    
    assert result is False
    mock_send.assert_not_called()


def test_save_referral_new_referral() -> None:
    """Test saving a new referral record."""
    referrer: str = "03325727426"
    referred: str = "03325727427"
    referred_waid: str = "923325727427"
    
    # Clean database state
    db = get_db()
    db.execute("DELETE FROM referrals WHERE referrer_phone = ? AND referred_phone = ?", 
               (referrer, referred))
    db.commit()
    
    result: bool = save_referral(referrer, referred, referred_waid)
    
    assert result is True
    
    # Verify it was saved
    cursor = db.execute(
        "SELECT * FROM referrals WHERE referrer_phone = ? AND referred_phone = ?",
        (referrer, referred)
    )
    row = cursor.fetchone()
    assert row is not None
    assert row['referrer_phone'] == referrer
    assert row['referred_phone'] == referred
    assert row['referred_waid'] == referred_waid
    assert row['status'] == 'pending'


def test_save_referral_duplicate_referral() -> None:
    """Test saving duplicate referral returns True without error."""
    referrer: str = "03325727426"
    referred: str = "03325727428"
    referred_waid: str = "923325727428"
    
    db = get_db()
    
    # Clean database state
    db.execute("DELETE FROM referrals WHERE referrer_phone = ? AND referred_phone = ?",
               (referrer, referred))
    db.commit()
    
    # Save first time
    result1: bool = save_referral(referrer, referred, referred_waid)
    assert result1 is True
    
    # Save duplicate
    result2: bool = save_referral(referrer, referred, referred_waid)
    assert result2 is True
    
    # Verify only one record exists
    cursor: Any = db.execute(
        "SELECT COUNT(*) as count FROM referrals WHERE referrer_phone = ? AND referred_phone = ?",
        (referrer, referred)
    )
    count: int = cursor.fetchone()['count']
    assert count == 1


def test_get_referral_count_no_referrals() -> None:
    """Test getting referral count when user has no referrals."""
    phone: str = "03325727499"
    count: int = get_referral_count(phone)
    assert count == 0


def test_get_referral_count_with_referrals() -> None:
    """Test getting referral count for user with multiple referrals."""
    referrer: str = "03325727500"
    referred1: str = "03325727501"
    referred2: str = "03325727502"
    
    db = get_db()
    
    # Clean database state
    db.execute("DELETE FROM referrals WHERE referrer_phone = ?", (referrer,))
    db.commit()
    
    # Add referrals
    save_referral(referrer, referred1, "923325727501")
    save_referral(referrer, referred2, "923325727502")
    
    count: int = get_referral_count(referrer)
    assert count == 2


def test_get_referral_count_partial_match() -> None:
    """Test getting referral count only includes referrals for specific user."""
    referrer1: str = "03325727510"
    referrer2: str = "03325727511"
    referred: str = "03325727512"
    
    db = get_db()
    
    # Clean database state
    db.execute("DELETE FROM referrals WHERE referrer_phone IN (?, ?)", 
               (referrer1, referrer2))
    db.commit()
    
    # Add referrals from different referrers
    save_referral(referrer1, referred, "923325727512")
    save_referral(referrer2, referred, "923325727512")
    
    count1: int = get_referral_count(referrer1)
    count2: int = get_referral_count(referrer2)
    
    assert count1 == 1
    assert count2 == 1


# ============================================================================
# Integration Test
# ============================================================================

@patch('app.helpers.referral_tracker.send_onboarding_msg')
def test_full_referral_workflow(mock_send: Mock) -> None:
    """Test complete referral workflow from VCARD to database."""
    # Setup
    mock_send.return_value = {"success": True}
    referrer_phone: str = "03325727600"
    
    # Create VCARD message
    vcard_message: str = """BEGIN:VCARD
VERSION:3.0
N:;Contact Name;;;
FN:Contact Name
TEL;type=CELL;waid=923325727601:+92 332 5727601
END:VCARD"""
    
    # Test VCARD detection
    assert is_vcard(vcard_message) is True
    
    # Extract WAID
    waid: str | None = extract_waid_from_vcard(vcard_message)
    assert waid is not None
    assert waid == "923325727601"
    
    # Process referral
    result: bool = process_referral(referrer_phone, waid)
    assert result is True
    
    # Verify onboarding message was sent
    mock_send.assert_called_once_with("923325727601")
    
    # Verify referral count
    count: int = get_referral_count(referrer_phone)
    assert count >= 1
    
    # Cleanup
    db = get_db()
    db.execute("DELETE FROM referrals WHERE referrer_phone = ? AND referred_phone = ?",
               (referrer_phone, "923325727601"))
    db.commit()

