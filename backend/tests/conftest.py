"""Pytest configuration and fixtures for database testing."""

import sqlite3
from collections.abc import Generator
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from app.config.paths import SCHEMA_FILE
from app.db.client import Database, db
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
def mock_db_connection(
    monkeypatch: pytest.MonkeyPatch, test_db: sqlite3.Connection
) -> None:
    """Mock the database connection in the singleton 'db' instance.

    This ensures that whenever `app.db.client.db.conn` is accessed in the application code
    (or via `db.users`, `db.goals` etc.), it returns the in-memory `test_db` connection
    instead of opening the real database file.
    """
    # Mock the 'conn' property of the singleton 'db' instance
    # We need to patch the class property or the instance property.
    # Since 'db' is an instance of Database, we can just set its _conn attribute
    # or mock the property.
    
    # Simpler approach: directly inject the test_db connection into the db instance
    # and ensure it doesn't try to close or reopen it in a way that breaks tests.
    
    # However, the Database class lazily loads `conn`.
    # Let's patch the `conn` property on the class or instance.
    
    # Method 1: Patching the property on the class (Database.conn)
    # This affects all instances, which is fine since 'db' is a singleton.
    # But 'test_db' is a fixture value, so we need to do this per test.
    
    # Method 2: Patching the instance 'db' in app.db.client
    # We want 'db.conn' to return 'test_db'.
    
    # Let's use monkeypatch to replace the 'conn' property on the instance `db`
    # effectively. But 'conn' is a property.
    
    # Easiest way: Just set db._conn = test_db
    # The Database class checks 'if self._conn is None'.
    # If we set it, it returns it.
    # We also need to make sure it doesn't get closed prematurely if app code calls close().
    # But close() sets _conn = None.
    
    # Let's wrap the test_db in a way that close() is ignored or safe?
    # Or just let it close and rely on the fact that usually tests run one logic flow.
    
    # Reset the singleton before each test to ensure clean state
    db._conn = test_db
    
    yield
    
    # Cleanup
    db._conn = None
