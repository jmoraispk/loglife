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
    # Mock log_broadcaster.listen to return a finite iterator
    # This verifies the route is reachable and consumes the broadcaster
    with patch("loglife.core.routes.emulator.routes.log_broadcaster.listen") as mock_listen:
        mock_listen.return_value = iter(["hello"])
        response = client.get("/events")
        assert response.status_code == 200
        # Verify the data format
        assert b"data: hello\n\n" in response.data
