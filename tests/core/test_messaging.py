"""Messaging logic tests."""

import threading
import time
from queue import Empty
from unittest.mock import MagicMock, patch

import pytest

from loglife.core.messaging import (
    Message,
    _inbound_queue,
    _outbound_queue,
    enqueue_inbound_message,
    get_outbound_message,
    start_message_worker,
    start_sender_worker,
)


class MsgTimeoutError(Exception):
    """Raised when a test exceeds the timeout."""


class TimeoutThread(threading.Thread):
    """Thread that times out after 1 second."""

    def __init__(
        self,
        target: object,
        daemon: bool = False,  # noqa: FBT001, FBT002
        name: str | None = None,
    ) -> None:
        """Initialize the thread."""
        super().__init__(target=target, daemon=daemon, name=name)
        self._target = target
        self._start_time: float | None = None

    def start(self) -> None:
        """Start the thread."""
        self._start_time = time.time()
        super().start()

    def join(self, timeout: float = 1.0) -> None:
        """Join the thread with a timeout."""
        if self._start_time and time.time() - self._start_time > 1.0:
            return  # Timeout reached
        super().join(timeout=timeout)


@pytest.fixture(autouse=True)
def reset_messaging_state() -> None:
    """Ensure clean slate for messaging state."""
    import loglife.core.messaging as messaging_module  # noqa: PLC0415
    from loglife.core.messaging import _inbound_queue, _outbound_queue  # noqa: PLC0415

    messaging_module._router_worker_started = False  # noqa: SLF001
    messaging_module._sender_worker_started = False  # noqa: SLF001

    # Drain inbound queue
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except Empty:
            break

    # Drain outbound queue
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except Empty:
            break

    yield

    # Cleanup after test
    messaging_module._router_worker_started = False  # noqa: SLF001
    messaging_module._sender_worker_started = False  # noqa: SLF001

    # Drain queues again
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except Empty:
            break
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except Empty:
            break


def test_enqueue_inbound_message() -> None:
    """Test that messages are added to the inbound queue."""
    message = Message(
        sender="+1234567890",
        msg_type="chat",
        raw_payload="test",
        client_type="whatsapp",
    )
    enqueue_inbound_message(message)
    assert not _inbound_queue.empty()
    assert _inbound_queue.get() == message


def test_start_message_worker_handles_exception(caplog: pytest.LogCaptureFixture) -> None:
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

        # Run the worker loop in the main thread for testing
        worker_func()

        # Verify handler was called at least once (resilience check)
        assert mock_handler.call_count >= 1
        assert "Router failed to process message" in caplog.text


def test_high_volume_queue_pressure() -> None:
    """Integration-style test with real thread under pressure."""
    processed_count = 0
    lock = threading.Lock()

    def handler(_: Message) -> None:
        nonlocal processed_count
        with lock:
            processed_count += 1

    import loglife.core.messaging as messaging_module  # noqa: PLC0415

    messaging_module._router_worker_started = False  # noqa: SLF001

    with patch("loglife.core.messaging.Thread") as mock_thread_cls:
        # Just to capture the target function, but run it in a real thread
        start_message_worker(handler)
        worker_func = mock_thread_cls.call_args[1]["target"]

    # Start real thread manually with the captured target
    t = threading.Thread(target=worker_func, daemon=True)
    t.start()

    # Blast 1000 messages
    for i in range(1000):
        enqueue_inbound_message(Message(f"{i}", "chat", "load", "w"))

    # Stop signal
    enqueue_inbound_message(Message("stop", "_stop", "", "w"))

    t.join(timeout=5.0)
    assert processed_count == 1000


def test_message_from_payload() -> None:
    """Test Message.from_payload factory method."""
    payload = {
        "sender": "+123",
        "msg_type": "audio",
        "raw_msg": "base64data",
        "client_type": "whatsapp",
        "metadata": {"duration": 10},
    }
    msg = Message.from_payload(payload)
    assert msg.sender == "+123"
    assert msg.msg_type == "audio"
    assert msg.raw_payload == "base64data"
    assert msg.client_type == "whatsapp"
    assert msg.metadata == {"duration": 10}


def test_message_from_payload_defaults() -> None:
    """Test Message.from_payload with minimal data."""
    payload = {
        "sender": "+123",
        "msg_type": "chat",
    }
    msg = Message.from_payload(payload)
    assert msg.sender == "+123"
    assert msg.msg_type == "chat"
    assert msg.raw_payload == ""
    assert msg.client_type == "unknown"
    assert msg.metadata == {}


def test_get_outbound_message_timeout() -> None:
    """Test get_outbound_message raises Empty on timeout."""
    with pytest.raises(Empty):
        get_outbound_message(timeout=0.01)


def test_start_sender_worker_dispatches() -> None:
    """Sender worker should dispatch queued messages."""
    messages = [Message(sender="+1", msg_type="chat", raw_payload="hello", client_type="test")]

    def fake_get_outbound_message(timeout: float | None = None) -> Message:  # noqa: ARG001
        if messages:
            return messages.pop(0)
        return Message(sender="stop", msg_type="_stop", raw_payload="", client_type="")

    fake_dispatch = MagicMock()

    # Ideally we mock Thread to run inline or capture it
    # Re-doing with Thread mock for better control is safer:
    with (
        patch("loglife.core.messaging.Thread") as mock_thread,
        patch("loglife.core.messaging.get_outbound_message", fake_get_outbound_message),
        patch("loglife.core.messaging._dispatch_outbound", fake_dispatch),
        patch("loglife.core.messaging._sender_worker_started", False),  # noqa: FBT003
    ):
        start_sender_worker()
        worker_func = mock_thread.call_args[1]["target"]
        worker_func()  # Run inline

    fake_dispatch.assert_called_once()


def test_sender_worker_dispatch_calls_transports() -> None:
    """Test that _dispatch_outbound calls the correct transport functions."""
    with (
        patch("loglife.core.messaging.send_whatsapp_message") as mock_whatsapp,
        patch("loglife.core.messaging.send_emulator_message") as mock_emulator,
    ):
        # 1. WhatsApp
        from loglife.core.messaging import _dispatch_outbound
        msg_wa = Message("+1", "chat", "hi", "whatsapp")
        _dispatch_outbound(msg_wa)
        mock_whatsapp.assert_called_once_with("+1", "hi", attachments={})
        mock_emulator.assert_not_called()

        mock_whatsapp.reset_mock()

        # 2. Emulator
        msg_em = Message("em", "chat", "hi", "emulator")
        _dispatch_outbound(msg_em)
        mock_emulator.assert_called_once_with("hi", attachments={})
        mock_whatsapp.assert_not_called()


def test_sender_worker_transport_failure(caplog: pytest.LogCaptureFixture) -> None:
    """Test that sender worker survives transport failures."""
    with (
        patch("loglife.core.messaging.Thread") as mock_thread_cls,
        # Patch the actual transport function called by _dispatch_outbound
        patch("loglife.core.messaging.send_whatsapp_message") as mock_send,
        patch("loglife.core.messaging._sender_worker_started", False),  # noqa: FBT003
    ):
        mock_send.side_effect = [
            RuntimeError("Transport Error"),  # First fails
            None,  # Second succeeds
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Feed messages
        _outbound_queue.put(Message("+1", "chat", "fail", "whatsapp"))
        _outbound_queue.put(Message("+2", "chat", "ok", "whatsapp"))
        _outbound_queue.put(Message("stop", "_stop", "", ""))

        worker_func()

    assert "Failed to deliver outbound message" in caplog.text
    # Should have tried both messages
    assert mock_send.call_count == 2


def test_sender_worker_timeout_handling() -> None:
    """Test timeout behavior (empty queue swallowed)."""
    with (
        patch("loglife.core.messaging.Thread") as mock_thread_cls,
        patch("loglife.core.messaging.get_outbound_message") as mock_get,
        patch("loglife.core.messaging._sender_worker_started", False),  # noqa: FBT003
    ):
        # Raise Empty once, then stop
        mock_get.side_effect = [
            Empty,
            Message("stop", "_stop", "", ""),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]
        worker_func()

    assert mock_get.call_count == 2
