"""Tests for goal_reminders database operations."""

from loglife.app.db.client import db
from loglife.app.db.tables import Reminder


def test_create_goal_reminder() -> None:
    """Test creating a new goal reminder with specified time.

    Verifies successful reminder creation linking user, goal, and reminder
    time, ensuring all fields are properly stored and multiple reminders
    can be created for the same user and goal.

    """
    # Arrange - create user and goal
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")

    # Test successful creation
    reminder = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal.id,
        reminder_time="2024-12-25 09:00:00",
    )

    # Assert successful creation
    assert reminder is not None
    assert isinstance(reminder, Reminder)
    assert reminder.user_id == user.id
    assert reminder.user_goal_id == goal.id
    # Note: SQLite stores datetime as strings or numbers based on implementation.
    # The model field is 'datetime'. If we pass string, it might be stored as string.
    # The assert below expects string match if that's what's stored.
    assert str(reminder.reminder_time) == "2024-12-25 09:00:00"
    assert reminder.id is not None
    assert reminder.created_at is not None

    # Test creating another reminder
    reminder2 = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal.id,
        reminder_time="2024-12-26 10:00:00",
    )

    assert str(reminder2.reminder_time) == "2024-12-26 10:00:00"
    assert reminder2.id != reminder.id


def test_get_goal_reminder() -> None:
    """Test retrieving a reminder by its unique ID.

    Verifies that existing reminders can be successfully retrieved by ID
    with all expected fields, while non-existent reminder IDs properly
    return None.

    """
    # Arrange - create user, goal, and reminder
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    created_reminder = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal.id,
        reminder_time="2024-12-25 09:00:00",
    )

    # Test retrieving existing reminder
    retrieved_reminder = db.reminders.get(created_reminder.id)

    # Assert existing reminder
    assert retrieved_reminder is not None
    assert isinstance(retrieved_reminder, Reminder)
    assert retrieved_reminder.id == created_reminder.id
    assert retrieved_reminder.user_id == user.id
    assert retrieved_reminder.user_goal_id == goal.id
    assert str(retrieved_reminder.reminder_time) == "2024-12-25 09:00:00"

    # Test retrieving non-existent reminder
    non_existent_reminder = db.reminders.get(999)
    assert non_existent_reminder is None


def test_get_goal_reminder_by_goal_id() -> None:
    """Test retrieving a reminder by its goal ID.

    Verifies that reminders can be retrieved via the goal ID.
    """
    # Arrange - create user, goal, and reminder
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    created_reminder = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal.id,
        reminder_time="2024-12-25 09:00:00",
    )

    # Test retrieving existing reminder
    retrieved_reminder = db.reminders.get_by_goal_id(goal.id)

    # Assert existing reminder
    assert retrieved_reminder is not None
    assert isinstance(retrieved_reminder, Reminder)
    assert retrieved_reminder.id == created_reminder.id
    assert retrieved_reminder.user_id == user.id
    assert retrieved_reminder.user_goal_id == goal.id

    # Test retrieving non-existent reminder
    non_existent_reminder = db.reminders.get_by_goal_id(999)
    assert non_existent_reminder is None


def test_get_all_goal_reminders() -> None:
    """Test retrieving all reminders from the database.

    Verifies that all reminder records are returned with complete field data
    and correct associations to users and goals.

    """
    # Arrange - create user, goals, and reminders
    user = db.users.create("+1234567890", "America/New_York")
    goal1 = db.goals.create(user.id, "🎯", "Learn Python")
    goal2 = db.goals.create(user.id, "💪", "Exercise")
    goal3 = db.goals.create(user.id, "📚", "Read books")

    db.reminders.create(user.id, goal1.id, "2024-12-25 09:00:00")
    db.reminders.create(user.id, goal2.id, "2024-12-25 10:00:00")
    db.reminders.create(user.id, goal3.id, "2024-12-25 11:00:00")

    # Act
    all_reminders = db.reminders.get_all()

    # Assert correct count
    assert len(all_reminders) == 3

    # Verify all reminders have required fields
    for reminder in all_reminders:
        assert reminder.id is not None
        assert reminder.user_id is not None
        assert reminder.user_goal_id is not None
        assert reminder.reminder_time is not None
        assert reminder.created_at is not None
        assert reminder.user_id == user.id


def test_update_goal_reminder() -> None:
    """Test updating reminder information with optional fields.

    Verifies that individual fields (reminder_time, user_goal_id) can be
    updated independently or together, and that unchanged fields retain
    their original values. Also tests that calling without fields returns
    the existing reminder.

    """
    # Arrange - create user, goals, and reminder
    user = db.users.create("+1234567890", "America/New_York")
    goal1 = db.goals.create(user.id, "🎯", "Learn Python")
    goal2 = db.goals.create(user.id, "💪", "Exercise")
    reminder = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal1.id,
        reminder_time="2024-12-25 09:00:00",
    )

    # Test updating reminder_time only
    updated_reminder = db.reminders.update(
        reminder.id,
        reminder_time="2024-12-26 10:00:00",
    )

    assert str(updated_reminder.reminder_time) == "2024-12-26 10:00:00"
    assert updated_reminder.user_goal_id == goal1.id

    # Test updating user_goal_id only
    updated_reminder = db.reminders.update(
        reminder.id,
        user_goal_id=goal2.id,
    )

    assert updated_reminder.user_goal_id == goal2.id
    assert str(updated_reminder.reminder_time) == "2024-12-26 10:00:00"

    # Test updating both fields
    updated_reminder = db.reminders.update(
        reminder.id,
        user_goal_id=goal1.id,
        reminder_time="2024-12-27 11:00:00",
    )

    assert updated_reminder.user_goal_id == goal1.id
    assert str(updated_reminder.reminder_time) == "2024-12-27 11:00:00"

    # Test updating with no fields returns existing reminder
    unchanged_reminder = db.reminders.update(reminder.id)
    assert unchanged_reminder.id == reminder.id


def test_delete_goal_reminder() -> None:
    """Test deleting a reminder from the database.

    Verifies that a reminder can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted reminder return None.

    """
    # Arrange - create user, goal, and reminder
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    reminder = db.reminders.create(
        user_id=user.id,
        user_goal_id=goal.id,
        reminder_time="2024-12-25 09:00:00",
    )
    reminder_id = reminder.id

    # Verify reminder exists
    assert db.reminders.get(reminder_id) is not None

    # Act - delete the reminder
    db.reminders.delete(reminder_id)

    # Assert reminder is deleted
    deleted_reminder = db.reminders.get(reminder_id)
    assert deleted_reminder is None
