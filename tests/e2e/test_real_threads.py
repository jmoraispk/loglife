"""End-to-End tests with REAL threading and file-based DB.

This test file verifies that the entire system works when threads are ACTUALLY running.
It bypasses the global mocks in conftest.py to ensure we are testing the real machinery.

Note regarding WhatsApp API:
    These tests verify the internal pipeline (Inbound -> DB -> Logic -> Outbound).
    They do NOT hit the real WhatsApp API. Instead, we mock 'requests.post' to verify
    that the system ATTEMPTS to send the correct payload.

    We simulate:
    1. Successful delivery (200 OK)
    2. API Failure (500 Error) to verify error handling/resilience
"""

import os
import tempfile
import time
from collections.abc import Generator
from pathlib import Path
from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

import pytest
import requests
from flask import Flask

from loglife.app import create_app
from loglife.app.db import db
from loglife.core.messaging import Message, enqueue_inbound_message

if TYPE_CHECKING:
    from flask.testing import FlaskClient

# We need to override the default conftest mocks for THIS file only.
# pytest fixtures can be overridden by defining them locally.


@pytest.fixture
def real_db_path() -> Generator[str, None, None]:
    """Create a real temporary file for the database."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    Path(path).unlink(missing_ok=True)


@pytest.fixture
def app_and_mock(real_db_path: str) -> Generator[tuple[Flask, MagicMock], None, None]:
    """Create app WITH REAL WORKERS and REAL FILE DB."""
    # 1. Setup: Point the global DB client to our temp file
    # We need to initialize the DB schema manually since we aren't using the memory fixture
    import sqlite3  # noqa: PLC0415

    from loglife.app.config import SCHEMA_FILE  # noqa: PLC0415

    conn = sqlite3.connect(real_db_path, check_same_thread=False)
    with Path(SCHEMA_FILE).open(encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.close()

    # Tell the app to use this file
    # We inject the connection into the db singleton.
    # CRITICAL: For threads to share this connection, we MUST use check_same_thread=False
    # AND the connection object must be the SAME object used by all threads.
    # Our singleton pattern (db._conn) supports this as long as we inject it BEFORE threads start.

    real_conn = sqlite3.connect(
        real_db_path,
        check_same_thread=False,
        isolation_level=None,
    )  # Auto-commit mode!
    real_conn.row_factory = sqlite3.Row
    db.set_connection(real_conn)

    # 2. Create App without mocks
    # We intentionally do NOT mock start_message_worker etc.
    # However, we might need to mock 'requests.post' if we don't want to hit real WhatsApp
    with patch("loglife.core.messaging.requests.post") as mock_post:
        # Default to success, but tests can override side_effect
        mock_post.return_value.status_code = 200

        # We must ensure previous tests didn't leave "started" flags as True
        import loglife.core.messaging as messaging_module  # noqa: PLC0415

        # Force flags to False so threads restart
        messaging_module._router_worker_started = False  # noqa: SLF001
        messaging_module._sender_worker_started = False  # noqa: SLF001

        # Start the app (this spawns real threads!)
        app = create_app()
        app.config["TESTING"] = True

        # Yield both app and the mock so the test can assert on the mock
        yield app, mock_post

        # Teardown
        # We must signal threads to stop, otherwise they might access the closed DB file later
        # For router worker:
        enqueue_inbound_message(Message("stop", "_stop", "", "w"))

        # For sender worker:
        # We can't easily access the sender worker from here if we don't expose its queue properly,
        # but startup.py starts it. It listens to _outbound_queue.
        # Let's import it from core.messaging
        from loglife.core.messaging import enqueue_outbound_message  # noqa: PLC0415

        enqueue_outbound_message(Message("stop", "_stop", "", "w"))

        # Give threads a moment to shut down cleanly
        time.sleep(0.2)

    # IMPORTANT: We must close the connection we opened
    db.clear_connection()
    real_conn.close()


def test_real_threading_flow_success(
    app_and_mock: tuple[Flask, MagicMock],
    real_db_path: str,  # noqa: ARG001
) -> None:
    """Verify successful message processing and delivery."""
    app, mock_post = app_and_mock
    client: FlaskClient = app.test_client()

    # 1. Send Webhook Request
    response = client.post(
        "/webhook",
        json={
            "sender": "+15550001",
            "msg_type": "chat",
            "raw_msg": "add goal 🏃 Run Test",
            "client_type": "whatsapp",
        },
    )
    assert response.status_code == 200

    # 2. Wait for background threads
    start = time.time()
    while time.time() - start < 5.0:
        if mock_post.call_count >= 1:
            break
        time.sleep(0.1)

    # Verify the full pipeline worked
    assert mock_post.call_count >= 1, "Sender thread failed to call WhatsApp API within 5s"

    # Verify the content of the call
    args, kwargs = mock_post.call_args
    payload = kwargs.get("json") or args[1]

    assert payload["number"] == "+15550001"
    assert "When you would like to be reminded?" in payload["message"]


def test_real_threading_api_failure(
    app_and_mock: tuple[Flask, MagicMock],
    real_db_path: str,  # noqa: ARG001
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Verify that the worker handles API failures (500) without crashing.

    This ensures that if WhatsApp is down, the worker catches the exception/error
    and logs it, rather than the thread dying.
    """
    app, mock_post = app_and_mock
    client: FlaskClient = app.test_client()

    # Configure mock to simulate API failure
    # To test "Failure handling", we should make it RAISE an exception (like ConnectionError).
    mock_post.side_effect = requests.exceptions.ConnectionError("WhatsApp Down")

    # 1. Send Webhook Request
    client.post(
        "/webhook",
        json={
            "sender": "+15550002",
            "msg_type": "chat",
            "raw_msg": "hi",
            "client_type": "whatsapp",
        },
    )

    # 2. Wait for logs to appear (since we can't check call_count on a failing mock easily in loop?)
    # Actually call_count still increments even if side_effect raises.

    start = time.time()
    while time.time() - start < 5.0:
        if mock_post.call_count >= 1:
            break
        time.sleep(0.1)

    assert mock_post.call_count >= 1

    # 3. Wait a bit longer for the log to be written and captured from the background thread
    time.sleep(0.5)

    # 4. Verify the error was caught and logged
    # The worker should NOT crash. If it crashed, subsequent tests or logic would fail.
    # We check the logs for the specific error message from messaging.py
    # Check both caplog.text and caplog.records for reliability
    log_found = "Failed to deliver outbound message" in caplog.text or any(
        "Failed to deliver outbound message" in record.getMessage()
        for record in caplog.records
        if record.levelname == "ERROR"
    )
    assert log_found, f"Expected log message not found. caplog.text: {caplog.text[:500]}"
