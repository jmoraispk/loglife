"""End-to-end tests for reminder functionality.

This module contains comprehensive tests for:
- Adding goals with reminder time flow
- Setting reminder times with various formats
- Time parsing validation
- State management for reminder time setting
"""
from unittest.mock import Mock, patch
from app.logic.process_message import process_message
from app.db.sqlite import get_db
from typing import Any


# ============================================================================
# Reminder Time Setting Flow Tests
# ============================================================================

def test_add_goal_triggers_reminder_prompt() -> None:
    """Test that adding a goal prompts for reminder time.
    
    Verifies that when a user adds a goal, the bot asks for a reminder time
    and sets the user state to 'waiting_for_reminder_time'.
    """
    user: str = "reminder_user_001"
    resp: str = process_message("add goal 😴 Sleep early", user)
    
    assert "✅ Goal added" in resp
    assert "⏰ What time should I remind you daily?" in resp
    assert "18:00" in resp or "6 PM" in resp or "6pm" in resp


def test_set_reminder_time_24_hour_format() -> None:
    """Test setting reminder time using 24-hour format (18:00).
    
    Verifies that users can set reminder times using the 24-hour format
    and that the bot confirms the reminder is set.
    """
    user: str = "reminder_user_002"
    
    # Add goal first
    resp1: str = process_message("add goal 🏃 Exercise daily", user)
    assert "⏰ What time should I remind you daily?" in resp1
    
    # Set reminder time using 24-hour format
    resp2: str = process_message("18:00", user)
    assert "✅ Reminder set" in resp2
    assert "6:00 PM" in resp2 or "18:00" in resp2
    assert "daily" in resp2.lower()


def test_set_reminder_time_12_hour_pm() -> None:
    """Test setting reminder time using 12-hour format with PM.
    
    Verifies that users can set reminder times using formats like '6 PM' or '6pm'.
    """
    user: str = "reminder_user_003"
    
    # Add goal first
    process_message("add goal 💧 Drink water", user)
    
    # Set reminder time using 12-hour PM format
    resp: str = process_message("6 PM", user)
    assert "✅ Reminder set" in resp
    assert "6:00 PM" in resp


def test_set_reminder_time_12_hour_am() -> None:
    """Test setting reminder time using 12-hour format with AM.
    
    Verifies that users can set reminder times using formats like '9 AM' or '9am'.
    """
    user: str = "reminder_user_004"
    
    # Add goal first
    process_message("add goal 🧘 Meditate", user)
    
    # Set reminder time using 12-hour AM format
    resp: str = process_message("9 AM", user)
    assert "✅ Reminder set" in resp
    assert "9:00 AM" in resp


def test_set_reminder_time_simple_number() -> None:
    """Test setting reminder time using simple number format.
    
    Verifies that users can set reminder times using simple numbers like '18' or '6'.
    """
    user: str = "reminder_user_005"
    
    # Add goal first
    process_message("add goal 📚 Read books", user)
    
    # Set reminder time using simple number (assumes PM for 1-12)
    resp: str = process_message("18", user)
    assert "✅ Reminder set" in resp


def test_set_reminder_time_with_minutes_12hour() -> None:
    """Test setting reminder time with minutes in 12-hour format.
    
    Verifies that users can specify minutes like '6:30 PM' or '6:30pm'.
    """
    user: str = "reminder_user_006"
    
    # Add goal first
    process_message("add goal 🍎 Eat healthy", user)
    
    # Set reminder time with minutes
    resp: str = process_message("6:30 PM", user)
    assert "✅ Reminder set" in resp
    assert "6:30 PM" in resp


def test_set_reminder_time_with_minutes_24hour() -> None:
    """Test setting reminder time with minutes in 24-hour format.
    
    Verifies that users can specify minutes like '18:30'.
    """
    user: str = "reminder_user_007"
    
    # Add goal first
    process_message("add goal 🎯 Focus work", user)
    
    # Set reminder time with minutes
    resp: str = process_message("18:30", user)
    assert "✅ Reminder set" in resp


def test_set_reminder_time_lowercase_pm() -> None:
    """Test setting reminder time with lowercase 'pm'.
    
    Verifies that the parser handles lowercase 'pm' format.
    """
    user: str = "reminder_user_008"
    
    # Add goal first
    process_message("add goal 🌱 Grow plants", user)
    
    # Set reminder time with lowercase pm
    resp: str = process_message("6pm", user)
    assert "✅ Reminder set" in resp
    assert "PM" in resp or "pm" in resp


def test_set_reminder_time_invalid_format() -> None:
    """Test setting reminder time with invalid format.
    
    Verifies that invalid time formats are rejected with an appropriate error message.
    """
    user: str = "reminder_user_009"
    
    # Add goal first
    process_message("add goal 🎨 Create art", user)
    
    # Try to set reminder time with invalid format
    resp: str = process_message("invalid time", user)
    assert "❌ Invalid time format" in resp
    assert "18:00" in resp or "6 PM" in resp


def test_set_reminder_time_invalid_hour() -> None:
    """Test setting reminder time with invalid hour value.
    
    Verifies that hours outside the valid range (0-23) are rejected.
    """
    user: str = "reminder_user_010"
    
    # Add goal first
    process_message("add goal 🏋️ Workout", user)
    
    # Try to set reminder time with invalid hour
    resp: str = process_message("25:00", user)
    assert "❌ Invalid time format" in resp or "Unrecognized" in resp


def test_set_reminder_time_invalid_minute() -> None:
    """Test setting reminder time with invalid minute value.
    
    Verifies that minutes outside the valid range (0-59) are rejected.
    """
    user: str = "reminder_user_011"
    
    # Add goal first
    process_message("add goal 🌙 Sleep early", user)
    
    # Try to set reminder time with invalid minutes
    resp: str = process_message("18:60", user)
    assert "❌ Invalid time format" in resp or "Unrecognized" in resp


def test_reminder_state_persistence() -> None:
    """Test that user state persists when waiting for reminder time.
    
    Verifies that after adding a goal, the user remains in reminder-setting state
    until they provide a valid time or the state is cleared.
    """
    user: str = "reminder_user_012"
    
    # Add goal first
    resp1: str = process_message("add goal 🎵 Practice music", user)
    assert "⏰ What time should I remind you daily?" in resp1
    
    # Send an invalid time - should still be in reminder state
    resp2: str = process_message("invalid", user)
    assert "❌ Invalid time format" in resp2
    
    # Send a valid time - should clear state and succeed
    resp3: str = process_message("19:00", user)
    assert "✅ Reminder set" in resp3


def test_set_reminder_then_add_another_goal() -> None:
    """Test adding multiple goals with reminders.
    
    Verifies that users can add multiple goals, each with its own reminder time.
    """
    user: str = "reminder_user_013"
    
    # Add first goal and set reminder
    process_message("add goal 😴 Sleep", user)
    resp1: str = process_message("22:00", user)
    assert "✅ Reminder set" in resp1
    
    # Add second goal and set reminder
    process_message("add goal 🏃 Run", user)
    resp2: str = process_message("7 AM", user)
    assert "✅ Reminder set" in resp2
    
    # Verify both goals exist
    resp3: str = process_message("goals", user)
    assert "😴" in resp3
    assert "🏃" in resp3


def test_set_reminder_time_midnight_12am() -> None:
    """Test setting reminder time for midnight (12 AM).
    
    Verifies that 12 AM (midnight) is handled correctly.
    """
    user: str = "reminder_user_014"
    
    # Add goal first
    process_message("add goal 🌙 Night routine", user)
    
    # Set reminder time to midnight
    resp: str = process_message("12 AM", user)
    assert "✅ Reminder set" in resp
    assert "12:00 AM" in resp


def test_set_reminder_time_noon_12pm() -> None:
    """Test setting reminder time for noon (12 PM).
    
    Verifies that 12 PM (noon) is handled correctly.
    """
    user: str = "reminder_user_015"
    
    # Add goal first
    process_message("add goal 🍽️ Lunch break", user)
    
    # Set reminder time to noon
    resp: str = process_message("12 PM", user)
    assert "✅ Reminder set" in resp
    assert "12:00 PM" in resp


def test_set_reminder_time_early_morning() -> None:
    """Test setting reminder time for early morning hours.
    
    Verifies that early morning times (1-11 AM) are handled correctly.
    """
    user: str = "reminder_user_016"
    
    # Add goal first
    process_message("add goal ☀️ Morning routine", user)
    
    # Set reminder time to early morning
    resp: str = process_message("7:30 AM", user)
    assert "✅ Reminder set" in resp
    assert "7:30 AM" in resp


def test_reminder_stored_in_database() -> None:
    """Test that reminder time is properly stored in the database.
    
    Verifies that after setting a reminder time, it is persisted in the database.
    """
    user: str = "reminder_user_017"
    
    # Add goal and set reminder
    process_message("add goal 🎯 Daily goal", user)
    process_message("15:00", user)
    
    # Verify in database (goal description is stored without emoji)
    db = get_db()
    cursor: Any = db.execute("""
        SELECT ug.reminder_time 
        FROM user_goals ug
        JOIN user u ON u.id = ug.user_id
        WHERE u.phone = ? AND ug.goal_emoji = ? AND ug.is_active = 1
    """, (user, "🎯"))
    
    row: Any = cursor.fetchone()
    assert row is not None
    assert row['reminder_time'] == "15:00"


def test_reminder_time_edge_cases() -> None:
    """Test edge cases for reminder time parsing.
    
    Verifies handling of edge cases like single digit hours, midnight/noon,
    and various formatting options.
    """
    user: str = "reminder_user_018"
    
    # Test midnight (0 in 24-hour format)
    process_message("add goal 🌙 Midnight routine", user)
    resp1: str = process_message("0", user)
    assert "✅ Reminder set" in resp1
    
    # Test late night (23 in 24-hour format)
    process_message("add goal 🌃 Late night task", user)
    resp2: str = process_message("23", user)
    assert "✅ Reminder set" in resp2
    
    # Test 1 PM (should convert to 13:00)
    process_message("add goal 🍽️ Afternoon meal", user)
    resp3: str = process_message("1 PM", user)
    assert "✅ Reminder set" in resp3
    
    # Test noon with minutes
    process_message("add goal ⏰ Noon reminder", user)
    resp4: str = process_message("12:00", user)
    assert "✅ Reminder set" in resp4


# ============================================================================
# Integration Tests
# ============================================================================

def test_complete_reminder_workflow() -> None:
    """Test complete reminder workflow from goal creation to reminder confirmation.
    
    Verifies the end-to-end flow:
    1. User adds a goal
    2. Bot asks for reminder time
    3. User provides reminder time
    4. Bot confirms reminder is set
    5. Goal is active with reminder time stored
    """
    user: str = "reminder_user_019"
    
    # Step 1: Add goal
    resp1: str = process_message("add goal 🎯 Complete tasks", user)
    assert "✅ Goal added" in resp1
    assert "⏰ What time should I remind you daily?" in resp1
    
    # Step 2: Set reminder time
    resp2: str = process_message("17:30", user)
    assert "✅ Reminder set" in resp2
    assert "5:30 PM" in resp2 or "17:30" in resp2
    
    # Step 3: Verify goal is active (check via goals command)
    resp3: str = process_message("goals", user)
    assert "🎯" in resp3
    assert "complete tasks" in resp3.lower()
    
    # Step 4: Verify reminder is stored in database (goal description is stored without emoji)
    db = get_db()
    cursor: Any = db.execute("""
        SELECT ug.reminder_time 
        FROM user_goals ug
        JOIN user u ON u.id = ug.user_id
        WHERE u.phone = ? AND ug.goal_emoji = ? AND ug.is_active = 1
    """, (user, "🎯"))
    
    row: Any = cursor.fetchone()
    assert row is not None
    assert row['reminder_time'] == "17:30"


@patch('app.helpers.reminder_service.send_whatsapp_message')
def test_reminder_service_integration(mock_send: Mock) -> None:
    """Test that reminder service can access goals with reminder times.
    
    Note: This is a lightweight integration test. Full reminder service testing
    would require time manipulation which is complex for e2e tests.
    """
    mock_send.return_value = {"success": True}
    
    user: str = "reminder_user_020"
    
    # Add goal and set reminder
    process_message("add goal 🔔 Test reminder", user)
    process_message("12:00", user)
    
    # Verify reminder time is in database for reminder service to find
    db = get_db()
    cursor: Any = db.execute("""
        SELECT ug.id, ug.reminder_time, u.phone 
        FROM user_goals ug
        JOIN user u ON u.id = ug.user_id
        WHERE u.phone = ? AND ug.is_active = 1 AND ug.reminder_time IS NOT NULL
    """, (user,))
    
    row: Any = cursor.fetchone()
    assert row is not None
    assert row['reminder_time'] == "12:00"
    assert row['phone'] == user

