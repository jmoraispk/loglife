"""Tests for emulator sender helper."""

from unittest.mock import patch

from app.helpers.sender.emulator_sender import send_emulator_message


def test_send_emulator_message() -> None:
    """Test sending message to emulator queue."""
    with patch("app.helpers.sender.emulator_sender.log_queue") as mock_queue:
        message = "Test message"
        send_emulator_message(message)
        mock_queue.put.assert_called_once_with(message)
