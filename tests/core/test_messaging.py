from __future__ import annotations

import queue
import threading
import time
from unittest.mock import MagicMock, patch

import pytest

from loglife.core import messaging
from loglife.core.messaging import Message, enqueue_inbound_message, start_message_worker


@pytest.fixture(autouse=True)
def reset_worker_state():
    """Ensure clean slate for worker state."""
    messaging._worker_started = False
    # Drain queue
    while not messaging._inbound_queue.empty():
        try:
            messaging._inbound_queue.get_nowait()
        except queue.Empty:
            break
    yield
    # Cleanup after test
    messaging._worker_started = False
    # Send stop signal if thread is running?
    while not messaging._inbound_queue.empty():
        try:
            messaging._inbound_queue.get_nowait()
        except queue.Empty:
            break


def test_start_message_worker_handles_exception(caplog):
    """Test that the worker logs exceptions and continues processing."""
    mock_handler = MagicMock()
    # First call raises, second succeeds, third stops
    mock_handler.side_effect = [ValueError("Test Error"), None]

    # Using the synchronous execution trick for unit testing logic
    with patch("loglife.core.messaging.Thread") as mock_thread_cls:
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

    # Start real worker
    start_message_worker(handler)

    # Enqueue 50 messages
    count = 50
    for i in range(count):
        enqueue_inbound_message(Message(str(i), "chat", "hi", "w"))

    # Wait for completion
    timeout = 2.0
    start = time.time()
    while time.time() - start < timeout:
        with lock:
            if processed_count == count:
                break
        time.sleep(0.05)

    # Cleanup
    enqueue_inbound_message(Message("stop", "_stop", "", "w"))

    assert processed_count == count
