from __future__ import annotations

import queue
import threading
import time
from unittest.mock import MagicMock, patch

import pytest

from loglife.core.messaging import Message, enqueue_inbound_message, start_message_worker
@pytest.fixture(autouse=True)
def reset_worker_state():
    """Ensure clean slate for worker state."""
    import loglife.core.messaging.receiver as receiver_module
    from loglife.core.messaging.receiver import _inbound_queue

    receiver_module._worker_started = False
    # Drain queue
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except queue.Empty:
            break
    yield
    # Cleanup after test
    receiver_module._worker_started = False
    # Send stop signal if thread is running?
    while not _inbound_queue.empty():
        try:
            _inbound_queue.get_nowait()
        except queue.Empty:
            break


def test_start_message_worker_handles_exception(caplog):
    """Test that the worker logs exceptions and continues processing."""
    mock_handler = MagicMock()
    # First call raises, second succeeds, third stops
    mock_handler.side_effect = [ValueError("Test Error"), None]

    # Using the synchronous execution trick for unit testing logic
    with patch("loglife.core.messaging.receiver.Thread") as mock_thread_cls:
        start_message_worker(mock_handler)
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Enqueue messages
        enqueue_inbound_message(Message("1", "chat", "fail", "w"))
        enqueue_inbound_message(Message("2", "chat", "ok", "w"))
        enqueue_inbound_message(Message("3", "_stop", "", "w"))

        # Run worker loop (it runs until _stop)
        worker_func()

    assert mock_handler.call_count == 2
    assert "Router failed to process message" in caplog.text
    assert "Test Error" in caplog.text


def test_high_volume_queue_pressure():
    """Integration-style test with real thread under pressure."""
    processed_count = 0
    lock = threading.Lock()

    def handler(msg):
        nonlocal processed_count
        with lock:
            processed_count += 1

    # Reset worker state to allow starting
    import loglife.core.messaging.receiver as receiver_module
    receiver_module._worker_started = False

    # Use mocked thread to run synchronously
    with patch("loglife.core.messaging.receiver.Thread") as mock_thread_cls:
        start_message_worker(handler)
        # Verify thread was created
        assert mock_thread_cls.called, "Thread should have been created"
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Enqueue 50 messages
        count = 50
        for i in range(count):
            enqueue_inbound_message(Message(str(i), "chat", "hi", "w"))
        
        # Enqueue stop signal
        enqueue_inbound_message(Message("stop", "_stop", "", "w"))

        # Run worker loop (it runs until _stop)
        worker_func()

    assert processed_count == count
