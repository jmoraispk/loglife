"""Tests for user_goals database operations."""

from app.db.operations import user_goals, users


def test_create_goal():
    """Test creating a new user goal with emoji and description.

    Verifies successful goal creation with both default and custom boost
    levels, ensuring all fields are properly stored and the goal is
    associated with the correct user.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create a user first (foreign key requirement)
    user = users.create_user("+1234567890", "America/New_York")

    # Test successful creation with default boost_level
    goal = user_goals.create_goal(
        user_id=user["id"],
        goal_emoji="🎯",
        goal_description="Learn Python",
    )

    # Assert successful creation
    assert goal is not None
    assert isinstance(goal, dict)
    assert goal["user_id"] == user["id"]
    assert goal["goal_emoji"] == "🎯"
    assert goal["goal_description"] == "Learn Python"
    assert goal["boost_level"] == 1
    assert goal["id"] is not None

    # Test creation with custom boost_level
    goal2 = user_goals.create_goal(
        user_id=user["id"],
        goal_emoji="💪",
        goal_description="Exercise daily",
        boost_level=3,
    )

    assert goal2["boost_level"] == 3


def test_get_goal():
    """Test retrieving a goal by its unique ID.

    Verifies that existing goals can be successfully retrieved by ID with
    all expected fields, while non-existent goal IDs properly return None.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user and goal
    user = users.create_user("+1234567890", "America/New_York")
    created_goal = user_goals.create_goal(
        user_id=user["id"],
        goal_emoji="🎯",
        goal_description="Learn Python",
    )

    # Test retrieving existing goal
    retrieved_goal = user_goals.get_goal(created_goal["id"])

    # Assert existing goal
    assert retrieved_goal is not None
    assert isinstance(retrieved_goal, dict)
    assert retrieved_goal["id"] == created_goal["id"]
    assert retrieved_goal["goal_emoji"] == "🎯"
    assert retrieved_goal["goal_description"] == "Learn Python"

    # Test retrieving non-existent goal
    non_existent_goal = user_goals.get_goal(999)
    assert non_existent_goal is None


def test_get_user_goals():
    """Test retrieving all goals associated with a specific user.

    Verifies that all goals belonging to a user are returned with complete
    field data, and that users with no goals return an empty list.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user and multiple goals
    user = users.create_user("+1234567890", "America/New_York")
    user_goals.create_goal(user["id"], "🎯", "Learn Python")
    user_goals.create_goal(user["id"], "💪", "Exercise daily")
    user_goals.create_goal(user["id"], "📚", "Read books")

    # Act
    goals = user_goals.get_user_goals(user["id"])

    # Assert correct count
    assert len(goals) == 3

    # Check all goals belong to the user
    for goal in goals:
        assert goal["user_id"] == user["id"]
        assert "id" in goal
        assert "goal_emoji" in goal
        assert "goal_description" in goal
        assert "boost_level" in goal
        assert "created_at" in goal

    # Test retrieving goals for user with no goals
    user2 = users.create_user("+9999999999", "Europe/London")
    empty_goals = user_goals.get_user_goals(user2["id"])
    assert len(empty_goals) == 0


def test_update_goal():
    """Test updating goal information with optional fields.

    Verifies that individual fields (emoji, description, boost_level) can
    be updated independently or together, and that unchanged fields retain
    their original values. Also tests that calling without fields returns
    the existing goal.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user and goal
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(
        user_id=user["id"],
        goal_emoji="🎯",
        goal_description="Learn Python",
    )

    # Test updating emoji only
    updated_goal = user_goals.update_goal(goal["id"], goal_emoji="🔥")

    assert updated_goal["goal_emoji"] == "🔥"
    assert updated_goal["goal_description"] == "Learn Python"
    assert updated_goal["boost_level"] == 1

    # Test updating description only
    updated_goal = user_goals.update_goal(goal["id"], goal_description="Master Python")

    assert updated_goal["goal_emoji"] == "🔥"
    assert updated_goal["goal_description"] == "Master Python"

    # Test updating boost_level only
    updated_goal = user_goals.update_goal(goal["id"], boost_level=2)

    assert updated_goal["boost_level"] == 2

    # Test updating all fields
    updated_goal = user_goals.update_goal(
        goal["id"],
        goal_emoji="💎",
        goal_description="Become Python expert",
        boost_level=3,
    )

    assert updated_goal["goal_emoji"] == "💎"
    assert updated_goal["goal_description"] == "Become Python expert"
    assert updated_goal["boost_level"] == 3

    # Test updating with no fields returns existing goal
    unchanged_goal = user_goals.update_goal(goal["id"])
    assert unchanged_goal["id"] == goal["id"]


def test_delete_goal():
    """Test deleting a goal from the database.

    Verifies that a goal can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted goal return None.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user and goal
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(
        user_id=user["id"],
        goal_emoji="🎯",
        goal_description="Learn Python",
    )
    goal_id = goal["id"]

    # Verify goal exists
    assert user_goals.get_goal(goal_id) is not None

    # Act - delete the goal
    user_goals.delete_goal(goal_id)

    # Assert goal is deleted
    deleted_goal = user_goals.get_goal(goal_id)
    assert deleted_goal is None
