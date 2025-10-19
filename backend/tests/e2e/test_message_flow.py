from app.logic.process_message import process_message

def test_add_goal_and_show_goals():
    """Test adding a goal and then displaying all goals.
    
    Verifies that goals can be added successfully and that the 'goals'
    command returns the added goal with proper formatting.
    """
    user = "12345"
    resp1 = process_message("add goal 😴 Sleep early", user)
    assert "✅ Added goal" in resp1

    resp2 = process_message("goals", user)
    assert "😴 sleep early" in resp2

def test_rate_goal():
    """Test rating an individual goal.
    
    Verifies that goals can be rated using the 'rate <goal_number> <rating>'
    command format and that the response includes the goal emoji and success symbol.
    """
    user = "99999"
    process_message("add goal 🏃 Run", user)
    resp = process_message("rate 1 3", user)
    assert "🏃" in resp
    assert "✅" in resp

def test_help_command():
    """Test the help command functionality.
    
    Verifies that the help command returns a comprehensive list of
    available commands and their descriptions.
    """
    user = "11111"
    resp = process_message("help", user)
    assert "Life Bot Commands" in resp
    assert "goals" in resp
    assert "add goal" in resp
    assert "rate" in resp
    assert "week" in resp
    assert "lookback" in resp

def test_week_summary():
    """Test the week summary functionality.
    
    Verifies that the week command returns a formatted week summary
    including the week number, date range, and goal emojis.
    """
    user = "22222"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    process_message("add goal 🏃 Exercise", user)
    
    resp = process_message("week", user)
    assert "Week" in resp
    assert "😴" in resp
    assert "🏃" in resp

def test_lookback_summary():
    """Test the lookback summary with specific number of days.
    
    Verifies that the lookback command with a specific number of days
    returns a formatted summary showing day names and status symbols.
    """
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
    """Test the lookback summary with default number of days.
    
    Verifies that the lookback command without parameters defaults to
    showing the last 7 days with proper formatting.
    """
    user = "44444"
    # Add some goals first
    process_message("add goal 😴 Sleep early", user)
    
    resp = process_message("lookback", user)
    assert "Last 7 days" in resp
    # The lookback shows day names and status symbols, not emojis directly
    # Check for any day abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    assert any(day in resp for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

def test_goal_ratings_all_at_once():
    """Test rating all goals at once using digit sequence.
    
    Verifies that multiple goals can be rated simultaneously using
    a sequence of digits (e.g., '32' for success and partial ratings).
    """
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
    """Test rating with incorrect number of digits.
    
    Verifies that the system properly handles cases where the number
    of rating digits doesn't match the number of active goals.
    """
    user = "66666"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with wrong number of digits
    resp = process_message("32", user)  # Should fail - need 1 digit for 1 goal
    assert "❌ Invalid input" in resp

def test_goal_ratings_invalid_digits():
    """Test rating with invalid digit values.
    
    Verifies that the system properly handles invalid rating digits
    that are outside the valid range (1-3).
    """
    user = "77777"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with invalid digits (4 is not in 1-3 range)
    resp = process_message("4", user)  # Should be unrecognized since 4 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_goal_ratings_invalid_digits_within_range():
    """Test rating with digits that are in range but not valid for rating.
    
    Verifies that the system properly handles digits that are within
    the 1-3 range but not valid for the rating system (like 0).
    """
    user = "77778"
    # Add one goal
    process_message("add goal 😴 Sleep early", user)
    
    # Try to rate with digits that are in 1-3 range but invalid (like 0)
    resp = process_message("0", user)  # Should be unrecognized since 0 is not in "123"
    assert "❌ Unrecognized message" in resp

def test_no_goals_lookback():
    """Test lookback command when no goals are set.
    
    Verifies that the lookback command returns an appropriate message
    when the user has no goals configured.
    """
    user = "88888"
    resp = process_message("lookback 3", user)
    assert "No goals set" in resp

def test_no_goals_ratings():
    """Test rating command when no goals are set.
    
    Verifies that rating commands return an appropriate message
    when the user has no goals configured.
    """
    user = "99999"
    resp = process_message("123", user)
    assert "No goals set" in resp