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


def test_emulator_send_message(client: FlaskClient) -> None:
    """Test sending a chat message from the emulator.

    Simulates the payload sent by the emulator frontend to the webhook
    and verifies the backend handles it correctly for the emulator client type.
    """
    # Payload matches what emulator.html JavaScript sends
    payload = {
        "sender": "emulator_user",
        "msg_type": "chat",
        "raw_msg": "Hello Emulator",
        "client_type": "emulator",
    }

    # Mock the queueing so we verify the route logic without running the full worker
    with patch("loglife.core.routes.webhook.routes.enqueue_inbound_message") as mock_enqueue:
        response = client.post("/webhook", json=payload)

        assert response.status_code == 200
        data = response.get_json()

        assert data["success"] is True
        # Vital: Emulator expects empty message on success to NOT show "Message Queued" in UI
        assert data["message"] == ""

        # Verify message was extracted and queued correctly
        mock_enqueue.assert_called_once()
        queued_msg = mock_enqueue.call_args[0][0]
        assert queued_msg.sender == "emulator_user"
        assert queued_msg.raw_payload == "Hello Emulator"
        assert queued_msg.client_type == "emulator"
