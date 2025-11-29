"""Tests for goal_reminders database operations."""

from app.db.operations import goal_reminders, user_goals, users


def test_create_goal_reminder() -> None:
    """Test creating a new goal reminder with specified time.

    Verifies successful reminder creation linking user, goal, and reminder
    time, ensuring all fields are properly stored and multiple reminders
    can be created for the same user and goal.

    """
    # Arrange - create user and goal
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")

    # Test successful creation
    reminder = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal["id"],
        reminder_time="2024-12-25 09:00:00",
    )

    # Assert successful creation
    assert reminder is not None
    assert isinstance(reminder, dict)
    assert reminder["user_id"] == user["id"]
    assert reminder["user_goal_id"] == goal["id"]
    assert reminder["reminder_time"] == "2024-12-25 09:00:00"
    assert reminder["id"] is not None
    assert "created_at" in reminder

    # Test creating another reminder
    reminder2 = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal["id"],
        reminder_time="2024-12-26 10:00:00",
    )

    assert reminder2["reminder_time"] == "2024-12-26 10:00:00"
    assert reminder2["id"] != reminder["id"]


def test_get_goal_reminder() -> None:
    """Test retrieving a reminder by its unique ID.

    Verifies that existing reminders can be successfully retrieved by ID
    with all expected fields, while non-existent reminder IDs properly
    return None.

    """
    # Arrange - create user, goal, and reminder
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    created_reminder = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal["id"],
        reminder_time="2024-12-25 09:00:00",
    )

    # Test retrieving existing reminder
    retrieved_reminder = goal_reminders.get_goal_reminder(created_reminder["id"])

    # Assert existing reminder
    assert retrieved_reminder is not None
    assert isinstance(retrieved_reminder, dict)
    assert retrieved_reminder["id"] == created_reminder["id"]
    assert retrieved_reminder["user_id"] == user["id"]
    assert retrieved_reminder["user_goal_id"] == goal["id"]
    assert retrieved_reminder["reminder_time"] == "2024-12-25 09:00:00"

    # Test retrieving non-existent reminder
    non_existent_reminder = goal_reminders.get_goal_reminder(999)
    assert non_existent_reminder is None


def test_get_goal_reminder_by_goal_id() -> None:
    """Test retrieving a reminder by its goal ID.

    Verifies that reminders can be retrieved via the goal ID.
    """
    # Arrange - create user, goal, and reminder
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    created_reminder = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal["id"],
        reminder_time="2024-12-25 09:00:00",
    )

    # Test retrieving existing reminder
    retrieved_reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])

    # Assert existing reminder
    assert retrieved_reminder is not None
    assert isinstance(retrieved_reminder, dict)
    assert retrieved_reminder["id"] == created_reminder["id"]
    assert retrieved_reminder["user_id"] == user["id"]
    assert retrieved_reminder["user_goal_id"] == goal["id"]

    # Test retrieving non-existent reminder
    non_existent_reminder = goal_reminders.get_goal_reminder_by_goal_id(999)
    assert non_existent_reminder is None


def test_get_all_goal_reminders() -> None:
    """Test retrieving all reminders from the database.

    Verifies that all reminder records are returned with complete field data
    and correct associations to users and goals.

    """
    # Arrange - create user, goals, and reminders
    user = users.create_user("+1234567890", "America/New_York")
    goal1 = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    goal2 = user_goals.create_goal(user["id"], "💪", "Exercise")
    goal3 = user_goals.create_goal(user["id"], "📚", "Read books")

    goal_reminders.create_goal_reminder(user["id"], goal1["id"], "2024-12-25 09:00:00")
    goal_reminders.create_goal_reminder(user["id"], goal2["id"], "2024-12-25 10:00:00")
    goal_reminders.create_goal_reminder(user["id"], goal3["id"], "2024-12-25 11:00:00")

    # Act
    all_reminders = goal_reminders.get_all_goal_reminders()

    # Assert correct count
    assert len(all_reminders) == 3

    # Verify all reminders have required fields
    for reminder in all_reminders:
        assert "id" in reminder
        assert "user_id" in reminder
        assert "user_goal_id" in reminder
        assert "reminder_time" in reminder
        assert "created_at" in reminder
        assert reminder["user_id"] == user["id"]


def test_update_goal_reminder() -> None:
    """Test updating reminder information with optional fields.

    Verifies that individual fields (reminder_time, user_goal_id) can be
    updated independently or together, and that unchanged fields retain
    their original values. Also tests that calling without fields returns
    the existing reminder.

    """
    # Arrange - create user, goals, and reminder
    user = users.create_user("+1234567890", "America/New_York")
    goal1 = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    goal2 = user_goals.create_goal(user["id"], "💪", "Exercise")
    reminder = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal1["id"],
        reminder_time="2024-12-25 09:00:00",
    )

    # Test updating reminder_time only
    updated_reminder = goal_reminders.update_goal_reminder(
        reminder["id"],
        reminder_time="2024-12-26 10:00:00",
    )

    assert updated_reminder["reminder_time"] == "2024-12-26 10:00:00"
    assert updated_reminder["user_goal_id"] == goal1["id"]

    # Test updating user_goal_id only
    updated_reminder = goal_reminders.update_goal_reminder(
        reminder["id"],
        user_goal_id=goal2["id"],
    )

    assert updated_reminder["user_goal_id"] == goal2["id"]
    assert updated_reminder["reminder_time"] == "2024-12-26 10:00:00"

    # Test updating both fields
    updated_reminder = goal_reminders.update_goal_reminder(
        reminder["id"],
        user_goal_id=goal1["id"],
        reminder_time="2024-12-27 11:00:00",
    )

    assert updated_reminder["user_goal_id"] == goal1["id"]
    assert updated_reminder["reminder_time"] == "2024-12-27 11:00:00"

    # Test updating with no fields returns existing reminder
    unchanged_reminder = goal_reminders.update_goal_reminder(reminder["id"])
    assert unchanged_reminder["id"] == reminder["id"]


def test_delete_goal_reminder() -> None:
    """Test deleting a reminder from the database.

    Verifies that a reminder can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted reminder return None.

    """
    # Arrange - create user, goal, and reminder
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    reminder = goal_reminders.create_goal_reminder(
        user_id=user["id"],
        user_goal_id=goal["id"],
        reminder_time="2024-12-25 09:00:00",
    )
    reminder_id = reminder["id"]

    # Verify reminder exists
    assert goal_reminders.get_goal_reminder(reminder_id) is not None

    # Act - delete the reminder
    goal_reminders.delete_goal_reminder(reminder_id)

    # Assert reminder is deleted
    deleted_reminder = goal_reminders.get_goal_reminder(reminder_id)
    assert deleted_reminder is None
