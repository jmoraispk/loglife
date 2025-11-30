"""Tests for sender service."""

from unittest.mock import MagicMock, patch

import pytest
from loglife.core.messaging import Message
from loglife.core.services.sender.service import (
    _send_emulator_message,
    _send_whatsapp_message,
    queue_async_message,
    send_message,
)


def test_send_emulator_message() -> None:
    """Test sending message to emulator queue."""
    with patch("loglife.core.services.sender.service.log_queue") as mock_queue:
        message = "Test message"
        _send_emulator_message(message)
        mock_queue.put.assert_called_once_with(message)


def test_send_whatsapp_message_success() -> None:
    """Test successful WhatsApp message sending."""
    mock_response = MagicMock()
    mock_response.status_code = 200

    with patch("loglife.core.services.sender.service.requests.post") as mock_post:
        mock_post.return_value = mock_response

        _send_whatsapp_message("1234567890", "Hello")

        mock_post.assert_called_once()
        args = mock_post.call_args
        assert args[1]["json"]["number"] == "1234567890"
        assert args[1]["json"]["message"] == "Hello"


def test_send_whatsapp_message_failure() -> None:
    """Test WhatsApp message sending failure."""
    with patch("loglife.core.services.sender.service.requests.post") as mock_post:
        mock_post.side_effect = Exception("Connection error")

        with pytest.raises(RuntimeError) as exc:
            _send_whatsapp_message("1234567890", "Hello")

        assert "Error sending WhatsApp message" in str(exc.value)


def test_send_message_falls_back_to_queue() -> None:
    """When client_type is unknown, the message should be queued."""
    with patch(
        "loglife.core.services.sender.service.enqueue_outbound_message"
    ) as mock_enqueue:
        send_message("123", "Hello", client_type="unknown")
        mock_enqueue.assert_called_once()


def test_queue_async_message_builds_message() -> None:
    """queue_async_message should build Message objects correctly."""
    with patch(
        "loglife.core.services.sender.service.enqueue_outbound_message"
    ) as mock_enqueue:
        queue_async_message("123", "Hi", client_type="emulator")
        args = mock_enqueue.call_args[0]
        assert isinstance(args[0], Message)
        assert args[0].sender == "123"
        assert args[0].client_type == "emulator"
