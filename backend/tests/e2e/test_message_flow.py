"""End-to-end tests for message flow functionality.

This module contains tests for the complete message processing flow,
including goal management, ratings, summaries, and contact/referral handling.
"""
from unittest.mock import Mock, patch
from app.logic.process_message import process_message
from app.helpers.contact_detector import is_vcard, extract_waid_from_vcard
from app.helpers.referral_tracker import get_referral_count
from app.helpers.referral_tracker import process_referral


def test_add_goal_and_show_goals() -> None:
    """Test adding a goal and then displaying all goals.
    
    Verifies that goals can be added successfully and that the 'goals'
    command returns the added goal with proper formatting.
    """
    user: str = "12345"
    resp1: str = process_message("add goal 😴 Sleep early", user)
    assert "✅ Added goal" in resp1

    resp2: str = process_message("goals", user)
    assert "😴 sleep early" in resp2

def test_rate_goal() -> None:
    """Test rating an individual goal.
    
    Verifies that goals can be rated using the 'rate <goal_number> <rating>'
    command format and that the response includes the goal emoji and success symbol.
    """
    user: str = "99999"
    process_message("add goal 🏃 Run", user)
    resp: str = process_message("rate 1 3", user)
    assert "🏃" in resp
    assert "✅" in resp

def test_help_command() -> None:
    """Test the help command functionality.
    
    Verifies that the help command returns a comprehensive list of
    available commands and their descriptions.
    """
    user: str = "11111"
    resp: str = process_message("help", user)
    assert "Life Bot Commands" in resp
    assert "goals" in resp
    assert "add goal" in resp
    assert "rate" in resp
    assert "week" in resp
    assert "lookback" in resp

def test_week_summary() -> None:
    """Test the week summary functionality.
    
    Verifies that the week command returns a formatted week summary
    including the week number, date range, and goal emojis.
    """
    user: str = "22222"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    resp: str = process_message("week", user)
    assert "Week" in resp
    assert "😴" in resp
    assert "🏃" in resp

def test_lookback_summary() -> None:
    """Test the lookback summary with specific number of days.
    
    Verifies that the lookback command with a specific number of days
    returns a formatted summary showing day names and status symbols.
    """
    user: str = "33333"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    resp: str = process_message("lookback 3", user)
    assert "Last 3 days" in resp
    # The lookback shows day names and status symbols, not emojis directly
    # Check for any day abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    assert any(day in resp for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

def test_lookback_default() -> None:
    """Test the lookback summary with default number of days.
    
    Verifies that the lookback command without parameters defaults to
    showing the last 7 days with proper formatting.
    """
    user: str = "44444"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    
    resp: str = process_message("lookback", user)
    assert "Last 7 days" in resp
    # The lookback shows day names and status symbols, not emojis directly
    # Check for any day abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    assert any(day in resp for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

def test_goal_ratings_all_at_once() -> None:
    """Test rating all goals at once using digit sequence.
    
    Verifies that multiple goals can be rated simultaneously using
    a sequence of digits (e.g., '32' for success and partial ratings).
    """
    user: str = "55555"
    # Add two goals
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    # Rate all goals at once (3=success, 2=partial)
    resp: str = process_message("32", user)
    assert "📅" in resp
    assert "😴" in resp
    assert "🏃" in resp
    assert "✅" in resp  # Success for first goal
    assert "⚠️" in resp  # Partial for second goal

def test_goal_ratings_invalid_length() -> None:
    """Test rating with incorrect number of digits.
    
    Verifies that the system properly handles cases where the number
    of rating digits doesn't match the number of active goals.
    """
    user: str = "66666"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with wrong number of digits
    resp: str = process_message("32", user)  # Should fail - need 1 digit for 1 goal
    assert "❌ Invalid input" in resp

def test_goal_ratings_invalid_digits() -> None:
    """Test rating with invalid digit values.
    
    Verifies that the system properly handles invalid rating digits
    that are outside the valid range (1-3).
    """
    user: str = "77777"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with invalid digits (4 is not in 1-3 range)
    resp: str = process_message("4", user)  # Should be unrecognized since 4 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_goal_ratings_invalid_digits_within_range() -> None:
    """Test rating with digits that are in range but not valid for rating.
    
    Verifies that the system properly handles digits that are within
    the 1-3 range but not valid for the rating system (like 0).
    """
    user: str = "77778"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with digits that are in 1-3 range but invalid (like 0)
    resp: str = process_message("0", user)  # Should be unrecognized since 0 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_no_goals_lookback() -> None:
    """Test lookback command when no goals are set.
    
    Verifies that the lookback command returns an appropriate message
    when the user has no goals configured.
    """
    user: str = "88888"
    resp: str = process_message("lookback 3", user)
    assert "No goals set" in resp

def test_no_goals_ratings() -> None:
    """Test rating command when no goals are set.
    
    Verifies that rating commands return an appropriate message
    when the user has no goals configured.
    """
    user: str = "99999"
    resp: str = process_message("123", user)
    assert "No goals set" in resp


# ============================================================================
# Contact Detection and Referral Tests
# ============================================================================

def test_vcard_detection() -> None:
    """Test VCARD detection in process_message flow."""
    vcard_message: str = """BEGIN:VCARD
VERSION:3.0
N:;0332 5727426;;;
FN:0332 5727426
TEL;type=CELL;waid=923325727426:+92 332 5727426
END:VCARD"""
    
    # Verify it's detected as VCARD
    assert is_vcard(vcard_message) is True


def test_vcard_extraction() -> None:
    """Test WAID extraction from VCARD."""
    vcard_message: str = """BEGIN:VCARD
VERSION:3.0
N:;0332 5727426;;;
FN:0332 5727426
TEL;type=CELL;waid=923325727426:+92 332 5727426
END:VCARD"""
    
    waid: str = extract_waid_from_vcard(vcard_message)
    waid: str = extract_waid_from_vcard(vcard_message)
    assert waid == "923325727426"


<<<<<<< HEAD
=======
def test_waid_to_phone_conversion() -> None:
    """Test WAID to phone number conversion."""
    waid: str = "923325727426"
    phone: str = convert_waid_to_phone(waid)
    assert phone == "03325727426"


>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)
@patch('app.helpers.referral_tracker.send_onboarding_msg')
def test_referral_process_integration(mock_send: Mock) -> None:
    """Test complete referral process integration."""
    mock_send.return_value = {"success": True}
    
    result: bool = process_referral("03325727426", "923325727426")
    
    assert result is True
    mock_send.assert_called_once_with("923325727426")


def test_regular_message_not_vcard() -> None:
    """Test that regular messages are not detected as VCARD."""
    regular_message: str = "This is just a regular message"
    assert is_vcard(regular_message) is False
    
    # Should be processed as regular message
    user: str = "12345678"
    resp: str = process_message(regular_message, user)
    # Should be unrecognized or return help
    assert "Unrecognized" in resp or "Life Bot" in resp