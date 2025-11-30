"""Pytest configuration and fixtures for database testing."""

import sqlite3
from collections.abc import Generator
from pathlib import Path
from unittest.mock import patch

import pytest
from loglife.app.config.paths import SCHEMA_FILE
from loglife.app.db.client import db
from loglife.app.factory import create_app
from flask import Flask
from flask.testing import FlaskClient


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    """Create a Flask app instance for testing."""
    app = create_app()
    app.config["TESTING"] = True

    # Stop the reminder service thread from starting
    with patch("loglife.app.factory.start_reminder_service"):
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
def mock_db_connection(test_db: sqlite3.Connection) -> Generator[None, None, None]:
    """Mock the database connection in the singleton 'db' instance.

    This fixture automatically runs for every test (autouse=True). It injects
    the in-memory `test_db` connection into the global `db` singleton.

    This ensures that any application code importing `app.db.client.db` will
    use our isolated test database instead of trying to open a real file on disk.
    """
    # Inject the test database connection into the singleton
    db.set_connection(test_db)

    yield

    # Reset the connection after the test to ensure clean state
    db.clear_connection()
