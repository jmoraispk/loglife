"""Tests for the core interface (init, send_msg, recv_msg)."""

from unittest.mock import patch

import pytest

from loglife import core
from loglife.core.messaging import Message


def test_init_starts_components():
    """Test that init starts logging, db, and sender worker."""
    with (
        patch("loglife.core.interface.setup_logging") as mock_log,
        patch("loglife.core.interface.init_db") as mock_db,
        patch("loglife.core.interface.start_sender_worker") as mock_sender,
    ):
        core.init()

        mock_log.assert_called_once()
        mock_db.assert_called_once()
        mock_sender.assert_called_once()


def test_send_msg_string():
    """Test sending a simple string message."""
    with patch("loglife.core.interface.queue_async_message") as mock_queue:
        core.send_msg("Hello", to="+123")
        mock_queue.assert_called_once_with("+123", "Hello")


def test_send_msg_string_missing_to():
    """Test sending a string without a 'to' argument raises ValueError."""
    with pytest.raises(ValueError, match="Target 'to' number is required"):
        core.send_msg("Hello")


def test_send_msg_object():
    """Test sending a Message object directly."""
    msg = Message(
        sender="+123",
        msg_type="chat",
        raw_payload="test",
        client_type="whatsapp",
    )
    with patch("loglife.core.interface.enqueue_outbound_message") as mock_enqueue:
        core.send_msg(msg)
        mock_enqueue.assert_called_once_with(msg)


def test_recv_msg():
    """Test receiving a message from the queue."""
    # Need to mock the queue inside interface module
    with patch("loglife.core.interface._inbound_queue") as mock_queue:
        expected_msg = Message("+1", "chat", "hi", "wa")
        mock_queue.get.return_value = expected_msg

        msg = core.recv_msg(block=True, timeout=5.0)

        assert msg == expected_msg
        mock_queue.get.assert_called_once_with(block=True, timeout=5.0)

