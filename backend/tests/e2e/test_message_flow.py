from app.logic.process_message import process_message

def test_add_goal_and_show_goals():
    user = "12345"
    resp1 = process_message("add goal 😴 Sleep early", user)
    assert "✅ Added goal" in resp1

    resp2 = process_message("goals", user)
    assert "😴 sleep early" in resp2

def test_rate_goal():
    user = "99999"
    process_message("add goal 🏃 Run", user)
    resp = process_message("rate 1 3", user)
    assert "🏃" in resp
    assert "✅" in resp

def test_help_command():
    user = "11111"
    resp = process_message("help", user)
    assert "Life Bot Commands" in resp
    assert "goals" in resp
    assert "add goal" in resp
    assert "rate" in resp
    assert "week" in resp
    assert "lookback" in resp

def test_week_summary():
    user = "22222"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    resp = process_message("week", user)
    assert "Week" in resp
    assert "😴" in resp
    assert "🏃" in resp

def test_lookback_summary():
    user = "33333"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    resp = process_message("lookback 3", user)
    assert "Last 3 days" in resp
    # The lookback shows day names and status symbols, not emojis directly
    # Check for any day abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    assert any(day in resp for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

def test_lookback_default():
    user = "44444"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    
    resp = process_message("lookback", user)
    assert "Last 7 days" in resp
    # The lookback shows day names and status symbols, not emojis directly
    # Check for any day abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    assert any(day in resp for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

def test_goal_ratings_all_at_once():
    user = "55555"
    # Add two goals
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    # Rate all goals at once (3=success, 2=partial)
    resp = process_message("32", user)
    assert "📅" in resp
    assert "😴" in resp
    assert "🏃" in resp
    assert "✅" in resp  # Success for first goal
    assert "⚠️" in resp  # Partial for second goal

def test_goal_ratings_invalid_length():
    user = "66666"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with wrong number of digits
    resp = process_message("32", user)  # Should fail - need 1 digit for 1 goal
    assert "❌ Invalid input" in resp

def test_goal_ratings_invalid_digits():
    user = "77777"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with invalid digits (4 is not in 1-3 range)
    resp = process_message("4", user)  # Should be unrecognized since 4 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_goal_ratings_invalid_digits_within_range():
    user = "77778"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with digits that are in 1-3 range but invalid (like 0)
    resp = process_message("0", user)  # Should be unrecognized since 0 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_no_goals_lookback():
    user = "88888"
    resp = process_message("lookback 3", user)
    assert "No goals set" in resp

def test_no_goals_ratings():
    user = "99999"
    resp = process_message("123", user)
    assert "No goals set" in resp