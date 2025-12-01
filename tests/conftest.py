"""Pytest configuration and fixtures for database testing."""

import _thread
import sqlite3
import threading
from collections.abc import Generator
from pathlib import Path
from unittest.mock import patch

import pytest
from flask import Flask
from flask.testing import FlaskClient

from loglife.app import create_app
from loglife.app.config.paths import SCHEMA_FILE
from loglife.app.db.client import db

TIMEOUT = 1.0  # seconds


class TestTimeoutError(Exception):
    """Raised when a test exceeds the timeout."""


@pytest.fixture(autouse=True)
def global_timeout() -> Generator[None, None, None]:
    """Global timeout fixture to prevent hanging tests ({TIMEOUT} seconds max).

    Works on both Linux and Windows by using a separate thread to interrupt
    the main thread if the timeout is reached.
    """

    def timeout_handler() -> None:
        _thread.interrupt_main()

    # Increase timeout for E2E tests? Or make it configurable?
    # 1.0s might be too tight for the E2E test initialization + thread spawn
    timer = threading.Timer(10.0, timeout_handler)
    timer.start()

    try:
        yield
    except KeyboardInterrupt:
        # Caught the interrupt from our timer
        msg = f"Test exceeded {TIMEOUT} second timeout"
        raise TestTimeoutError(msg) from None
    finally:
        timer.cancel()


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    """Create a Flask app instance for testing."""
    with (
        patch("loglife.core.startup.start_reminder_service"),
        patch("loglife.core.startup.start_sender_worker"),  # Don't start sender worker in tests
        patch("loglife.core.startup.start_message_worker"), # Don't start message worker in tests
    ):
        app = create_app()
        app.config["TESTING"] = True
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
