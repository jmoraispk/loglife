"""Pytest configuration and fixtures for database testing."""

import sqlite3
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

import pytest
from app.config.paths import SCHEMA_FILE
from app.factory import create_app
from flask import Flask
from flask.testing import FlaskClient


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    """Create a Flask app instance for testing."""
    app = create_app()
    app.config["TESTING"] = True

    # Stop the reminder service thread from starting
    with patch("app.factory.start_reminder_service"):
        yield app


@pytest.fixture
def client(app: Flask) -> FlaskClient:
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def test_db() -> Generator[sqlite3.Connection, None, None]:
    """Create a temporary test database for each test.

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
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row

    # Apply your schema
    with Path(SCHEMA_FILE).open(encoding="utf-8") as f:
        conn.executescript(f.read())

    yield conn  # Provide the connection to the test

    conn.close()  # Clean up after test


@pytest.fixture(autouse=True)
def mock_connect(
    monkeypatch: pytest.MonkeyPatch, test_db: sqlite3.Connection
) -> sqlite3.Connection:
    """Mock the connect() function in ALL db operations modules.

    Ensure your db operations use the test database instead of the real one.

    The key: Patch where connect is USED, not where it's DEFINED.
    """

    # Create a context manager that returns the test database
    @contextmanager
    def mock_connect_func() -> Generator[sqlite3.Connection, None, None]:
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
