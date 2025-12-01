"""Tests for sender service."""

import time
from threading import Event, Thread
from unittest.mock import MagicMock, patch

import pytest

from loglife.core.messaging import (
    Message,
    queue_async_message,
    send_message,
    start_sender_worker,
)
from loglife.core.messaging.sender import _send_emulator_message, _send_whatsapp_message


class TimeoutThread(Thread):
    """Thread that times out after 1 second."""

    def __init__(self, target, daemon=False, name=None):
        super().__init__(target=target, daemon=daemon, name=name)
        self._target = target
        self._start_time = None

    def start(self):
        self._start_time = time.time()
        super().start()

    def join(self, timeout=1.0):
        if self._start_time and time.time() - self._start_time > 1.0:
            return  # Timeout reached
        super().join(timeout=timeout)


def test_send_emulator_message() -> None:
    """Test sending message to emulator queue."""
    with patch("loglife.core.messaging.sender.log_queue") as mock_queue:
        message = "Test message"
        _send_emulator_message(message)
        mock_queue.put.assert_called_once_with(message)


def test_send_whatsapp_message_success() -> None:
    """Test successful WhatsApp message sending."""
    mock_response = MagicMock()
    mock_response.status_code = 200

    with patch("loglife.core.messaging.sender.requests.post") as mock_post:
        mock_post.return_value = mock_response

        _send_whatsapp_message("1234567890", "Hello")

        mock_post.assert_called_once()
        args = mock_post.call_args
        assert args[1]["json"]["number"] == "1234567890"
        assert args[1]["json"]["message"] == "Hello"


def test_send_whatsapp_message_failure() -> None:
    """Test WhatsApp message sending failure."""
    with patch("loglife.core.messaging.sender.requests.post") as mock_post:
        mock_post.side_effect = Exception("Connection error")

        with pytest.raises(RuntimeError) as exc:
            _send_whatsapp_message("1234567890", "Hello")

        assert "Error sending WhatsApp message" in str(exc.value)


def test_send_message_falls_back_to_queue() -> None:
    """When client_type is unknown, the message should be queued."""
    with patch("loglife.core.messaging.sender.enqueue_outbound_message") as mock_enqueue:
        send_message("123", "Hello", client_type="unknown")
        mock_enqueue.assert_called_once()


def test_queue_async_message_builds_message() -> None:
    """queue_async_message should build Message objects correctly."""
    with patch("loglife.core.messaging.sender.enqueue_outbound_message") as mock_enqueue:
        queue_async_message("123", "Hi", client_type="emulator")
        args = mock_enqueue.call_args[0]
        assert isinstance(args[0], Message)
        assert args[0].sender == "123"
        assert args[0].client_type == "emulator"


def test_start_sender_worker_dispatches(monkeypatch):
    """Sender worker should dispatch queued messages."""
    messages = [Message(sender="+1", msg_type="chat", raw_payload="hello", client_type="test")]

    def fake_get_outbound_message(timeout=None):
        if messages:
            return messages.pop(0)
        return Message(sender="stop", msg_type="_stop", raw_payload="", client_type="")

    dispatched: list[str] = []
    stop_event = Event()

    def fake_dispatch(msg: Message) -> None:
        dispatched.append(msg.raw_payload)
        stop_event.set()

    with (
        patch("loglife.core.messaging.sender.Thread", TimeoutThread),
        patch("loglife.core.messaging.sender.get_outbound_message", fake_get_outbound_message),
        patch("loglife.core.messaging.sender._dispatch_outbound", fake_dispatch),
        patch("loglife.core.messaging.sender._sender_worker_started", False),
    ):
        start_sender_worker()
        # Wait for dispatch with timeout
        stop_event.wait(timeout=1.0)
        assert dispatched == ["hello"]


def test_sender_worker_recovers_after_exception(monkeypatch):
    """Worker should continue after dispatch errors."""
    messages = [
        Message(sender="+1", msg_type="chat", raw_payload="first", client_type="test"),
        Message(sender="+1", msg_type="chat", raw_payload="second", client_type="test"),
    ]

    def fake_get_outbound_message(timeout=None):
        if messages:
            return messages.pop(0)
        return Message(sender="stop", msg_type="_stop", raw_payload="", client_type="")

    calls: list[str] = []
    stop_event = Event()

    def flaky_dispatch(msg: Message) -> None:
        calls.append(msg.raw_payload)
        if len(calls) == 2:
            stop_event.set()

    with (
        patch("loglife.core.messaging.sender.Thread", TimeoutThread),
        patch("loglife.core.messaging.sender.get_outbound_message", fake_get_outbound_message),
        patch("loglife.core.messaging.sender._dispatch_outbound", flaky_dispatch),
        patch("loglife.core.messaging.sender._sender_worker_started", False),
    ):
        start_sender_worker()
        # Wait for both calls with timeout
        stop_event.wait(timeout=1.0)
        assert calls == ["first", "second"]
