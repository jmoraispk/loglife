"""Tests for messaging module."""

import queue
import threading
import time
from queue import Empty
from threading import Event
from unittest.mock import MagicMock, patch

import pytest
import requests

from loglife.core.messaging import (
    Message,
    _send_emulator_message,
    _send_whatsapp_message,
    enqueue_inbound_message,
    enqueue_outbound_message,
    queue_async_message,
    send_message,
    start_message_worker,
    start_sender_worker,
)


class TimeoutThread(threading.Thread):
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


@pytest.fixture(autouse=True)
def reset_messaging_state():
    """Ensure clean slate for messaging state."""
    import loglife.core.messaging as messaging_module
    from loglife.core.messaging import _inbound_queue, _outbound_queue

    messaging_module._router_worker_started = False
    messaging_module._sender_worker_started = False

    # Drain inbound queue
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except queue.Empty:
            break

    # Drain outbound queue
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break

    yield

    # Cleanup after test
    messaging_module._router_worker_started = False
    messaging_module._sender_worker_started = False

    # Drain queues again
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except queue.Empty:
            break
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break


# --- Receiver Tests ---


def test_start_message_worker_handles_exception(caplog):
    """Test that the worker logs exceptions and continues processing."""
    mock_handler = MagicMock()
    # First call raises, second succeeds, third stops
    mock_handler.side_effect = [ValueError("Test Error"), None]

    with patch("loglife.core.messaging.Thread") as mock_thread_cls:
        start_message_worker(mock_handler)
        worker_func = mock_thread_cls.call_args[1]["target"]

        enqueue_inbound_message(Message("1", "chat", "fail", "w"))
        enqueue_inbound_message(Message("2", "chat", "ok", "w"))
        enqueue_inbound_message(Message("3", "_stop", "", "w"))

        worker_func()

    assert mock_handler.call_count >= 1
    assert "Router failed to process message" in caplog.text


def test_high_volume_queue_pressure():
    """Integration-style test with real thread under pressure."""
    processed_count = 0
    lock = threading.Lock()

    def handler(msg):
        nonlocal processed_count
        with lock:
            processed_count += 1

    import loglife.core.messaging as messaging_module

    messaging_module._router_worker_started = False

    with patch("loglife.core.messaging.Thread") as mock_thread_cls:
        start_message_worker(handler)
        worker_func = mock_thread_cls.call_args[1]["target"]

        count = 50
        for i in range(count):
            enqueue_inbound_message(Message(str(i), "chat", "hi", "w"))
        enqueue_inbound_message(Message("stop", "_stop", "", "w"))

        worker_func()

    assert processed_count == count


# --- Sender Tests ---


def test_send_emulator_message() -> None:
    """Test sending message to emulator queue."""
    with patch("loglife.core.messaging.log_queue") as mock_queue:
        message = "Test message"
        _send_emulator_message(message)
        mock_queue.put.assert_called_once_with(message)


def test_send_whatsapp_message_success() -> None:
    """Test successful WhatsApp message sending."""
    mock_response = MagicMock()
    mock_response.status_code = 200

    with patch("loglife.core.messaging.requests.post") as mock_post:
        mock_post.return_value = mock_response
        _send_whatsapp_message("1234567890", "Hello")
        mock_post.assert_called_once()


def test_send_whatsapp_message_failure() -> None:
    """Test WhatsApp message sending failure."""
    with patch("loglife.core.messaging.requests.post") as mock_post:
        mock_post.side_effect = Exception("Connection error")
        with pytest.raises(RuntimeError, match="Error sending WhatsApp message"):
            _send_whatsapp_message("1234567890", "Hello")


def test_send_message_falls_back_to_queue() -> None:
    """When client_type is unknown, the message should be queued."""
    with patch("loglife.core.messaging.enqueue_outbound_message") as mock_enqueue:
        send_message("123", "Hello", client_type="unknown")
        mock_enqueue.assert_called_once()


def test_queue_async_message_builds_message() -> None:
    """queue_async_message should build Message objects correctly."""
    with patch("loglife.core.messaging.enqueue_outbound_message") as mock_enqueue:
        queue_async_message("123", "Hi", client_type="emulator")
        args = mock_enqueue.call_args[0]
        assert isinstance(args[0], Message)
        assert args[0].sender == "123"


def test_start_sender_worker_dispatches():
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
        patch("loglife.core.messaging.Thread", TimeoutThread),
        patch("loglife.core.messaging.get_outbound_message", fake_get_outbound_message),
        patch("loglife.core.messaging._dispatch_outbound", fake_dispatch),
        patch("loglife.core.messaging._sender_worker_started", False),
    ):
        start_sender_worker()
        stop_event.wait(timeout=1.0)
        assert dispatched == ["hello"]


# --- Sender Worker Tests ---


def test_sender_worker_http_failure(caplog):
    """Test that sender worker survives HTTP failures."""
    with (
        patch("loglife.core.messaging.Thread") as mock_thread_cls,
        patch("loglife.core.messaging.requests.post") as mock_post,
        patch("loglife.core.messaging._sender_worker_started", False),
    ):
        mock_post.side_effect = [
            requests.exceptions.ConnectionError("Connection Refused"),
            MagicMock(status_code=200),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        queue_async_message("123", "fail")
        queue_async_message("123", "success")
        enqueue_outbound_message(Message("stop", "_stop", "", "w"))

        worker_func()

        assert mock_post.call_count == 2
        assert "Failed to deliver outbound message" in caplog.text


def test_sender_worker_timeout_handling():
    """Test timeout behavior (empty queue swallowed)."""
    with (
        patch("loglife.core.messaging.Thread") as mock_thread_cls,
        patch("loglife.core.messaging.get_outbound_message") as mock_get,
    ):
        mock_get.side_effect = [
            queue.Empty,
            Message("stop", "_stop", "", "w"),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        start_time = time.time()
        worker_func()
        elapsed = time.time() - start_time

        assert elapsed < 1.0
        assert mock_get.call_count == 2

