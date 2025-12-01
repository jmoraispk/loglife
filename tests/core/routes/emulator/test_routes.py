"""Tests for emulator routes."""

from unittest.mock import patch

from flask.testing import FlaskClient


def test_emulator_page(client: FlaskClient) -> None:
    """Test that the emulator page loads correctly."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"LogLife Emulator" in response.data


def test_events_stream(client: FlaskClient) -> None:
    """Test that the events stream connects."""
    # Mock log_queue.get to raise an exception to break the infinite loop
    # This verifies the route is reachable and tries to access the queue
    with patch("loglife.core.routes.emulator.routes.log_queue.get", side_effect=StopIteration):
        try:
            client.get("/events")
        except StopIteration:
            pass
        except RuntimeError:
            # Flask might wrap the generator exception
            pass
