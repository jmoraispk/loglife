"""Pytest configuration and fixtures for database testing."""

import sqlite3
from contextlib import contextmanager

import pytest
from app.config.paths import SCHEMA_FILE


@pytest.fixture
def test_db():
    """Creates a temporary test database for each test.

    This fixture:
    1. Creates a temporary SQLite database in memory (fast!)
    2. Applies the schema from schema.sql
    3. Returns a connection to the test database
    4. Cleans up automatically after the test

    Usage in tests:
        def test_something(test_db):
            # test_db is ready to use
            pass
    """
    # Create an in-memory SQLite database (fast, isolated)
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row

    # Apply your schema
    with open(SCHEMA_FILE, encoding="utf-8") as f:
        conn.executescript(f.read())

    yield conn  # Provide the connection to the test

    conn.close()  # Clean up after test


@pytest.fixture
def mock_connect(monkeypatch, test_db):
    """Mocks the connect() function in ALL db operations modules.

    This ensures your db operations use the test database
    instead of the real one.

    The key: Patch where connect is USED, not where it's DEFINED.

    Usage in tests:
        def test_something(mock_connect):
            # Now any call to connect() uses test_db
            result = get_all_users()
    """

    # Create a context manager that returns the test database
    @contextmanager
    def mock_connect_func():
        try:
            yield test_db
            test_db.commit()  # Commit transaction on success
        except Exception:
            test_db.rollback()  # Rollback on error
            raise

    # Patch connect in ALL the operations modules where it's imported
    operations_modules = [
        "app.db.operations.users",
        "app.db.operations.user_goals",
        "app.db.operations.user_states",
        "app.db.operations.goal_ratings",
        "app.db.operations.goal_reminders",
        "app.db.operations.referrals",
        "app.db.operations.audio_journal_entries",
    ]

    for module in operations_modules:
        monkeypatch.setattr(f"{module}.connect", mock_connect_func)

    return test_db
