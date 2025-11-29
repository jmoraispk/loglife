"""Tests for user_states database operations."""

from app.db.client import db
from app.db.tables.user_states import UserState
from app.db.tables.users import User


def test_create_user_state() -> None:
    """Test creating a new user state with upsert behavior.

    Verifies successful state creation with or without temp_data, and
    ensures the upsert mechanism properly updates existing states instead
    of creating duplicates, maintaining only one state per user.

    """
    # Arrange - create a user first
    user = db.users.create("+1234567890", "America/New_York")

    # Test creating initial state without temp_data
    state = db.user_states.create(user_id=user.id, state="MAIN_MENU")

    # Assert successful creation
    assert state is not None
    assert isinstance(state, UserState)
    assert state.user_id == user.id
    assert state.state == "MAIN_MENU"
    assert state.temp_data is None

    # Test creating state with temp_data
    state2 = db.user_states.create(
        user_id=user.id,
        state="SETTING_GOAL",
        temp_data='{"goal_emoji": "🎯"}',
    )

    assert state2.state == "SETTING_GOAL"
    assert state2.temp_data == '{"goal_emoji": "🎯"}'

    # Test upsert behavior - updating existing state
    state3 = db.user_states.create(
        user_id=user.id,
        state="RATING_GOALS",
        temp_data='{"rating": 3}',
    )

    assert state3.state == "RATING_GOALS"
    assert state3.temp_data == '{"rating": 3}'

    # Verify only one state exists for the user
    retrieved_state = db.user_states.get(user.id)
    assert retrieved_state.state == "RATING_GOALS"


def test_get_user_state() -> None:
    """Test retrieving a user's current state.

    Verifies that existing user states can be successfully retrieved with
    all fields (state and temp_data), while non-existent user states
    properly return None.

    """
    # Arrange - create user and state
    user = db.users.create("+1234567890", "America/New_York")
    db.user_states.create(
        user_id=user.id,
        state="MAIN_MENU",
        temp_data='{"key": "value"}',
    )

    # Test retrieving existing state
    retrieved_state = db.user_states.get(user.id)

    # Assert existing state
    assert retrieved_state is not None
    assert isinstance(retrieved_state, UserState)
    assert retrieved_state.user_id == user.id
    assert retrieved_state.state == "MAIN_MENU"
    assert retrieved_state.temp_data == '{"key": "value"}'

    # Test retrieving non-existent state
    non_existent_state = db.user_states.get(999)
    assert non_existent_state is None


def test_update_user_state() -> None:
    """Test updating user state information with optional fields.

    Verifies that individual fields (state, temp_data) can be updated
    independently or together, and that unchanged fields retain their
    original values. Also tests that calling without fields returns the
    existing state.

    """
    # Arrange - create user and state
    user = db.users.create("+1234567890", "America/New_York")
    db.user_states.create(user_id=user.id, state="MAIN_MENU")

    # Test updating state only
    updated_state = db.user_states.update(user.id, state="SETTING_GOAL")

    assert updated_state.state == "SETTING_GOAL"
    assert updated_state.temp_data is None

    # Test updating temp_data only
    updated_state = db.user_states.update(
        user.id,
        temp_data='{"goal_emoji": "🎯"}',
    )

    assert updated_state.state == "SETTING_GOAL"
    assert updated_state.temp_data == '{"goal_emoji": "🎯"}'

    # Test updating both fields
    updated_state = db.user_states.update(
        user.id,
        state="RATING_GOALS",
        temp_data='{"rating": 3}',
    )

    assert updated_state.state == "RATING_GOALS"
    assert updated_state.temp_data == '{"rating": 3}'

    # Test updating with no fields returns existing state
    unchanged_state = db.user_states.update(user.id)
    assert unchanged_state.user_id == user.id


def test_delete_user_state() -> None:
    """Test deleting a user state from the database.

    Verifies that a user state can be successfully deleted and that
    subsequent attempts to retrieve the deleted state return None.

    """
    # Arrange - create user and state
    user = db.users.create("+1234567890", "America/New_York")
    db.user_states.create(user_id=user.id, state="MAIN_MENU")

    # Verify state exists
    assert db.user_states.get(user.id) is not None

    # Act - delete the state
    db.user_states.delete(user.id)

    # Assert state is deleted
    deleted_state = db.user_states.get(user.id)
    assert deleted_state is None
