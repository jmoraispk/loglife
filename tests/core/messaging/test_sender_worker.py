from __future__ import annotations

import queue
import time
from unittest.mock import MagicMock, patch

import pytest
import requests

from loglife.core.messaging import (
    Message,
    enqueue_outbound_message,
    queue_async_message,
    start_sender_worker,
)


@pytest.fixture(autouse=True)
def reset_worker_state():
    """Reset worker state before and after each test."""
    # Reset worker state
    import loglife.core.messaging.sender as sender_module
    from loglife.core.messaging.sender import _outbound_queue

    sender_module._sender_worker_started = False

    # Drain outbound queue
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break
    yield
    # Cleanup after test
    sender_module._sender_worker_started = False
    # Drain queue again to be safe
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break


def test_sender_worker_http_failure(caplog):
    """Test that sender worker survives HTTP failures."""
    with (
        patch("loglife.core.messaging.sender.Thread") as mock_thread_cls,
        patch("loglife.core.messaging.sender.requests.post") as mock_post,
        patch("loglife.core.messaging.sender._sender_worker_started", False),
    ):
        mock_post.side_effect = [
            requests.exceptions.ConnectionError("Connection Refused"),
            MagicMock(status_code=200),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Queue messages - need to queue them before running worker
        queue_async_message("123", "fail")
        queue_async_message("123", "success")

        # Enqueue stop manually
        enqueue_outbound_message(Message("stop", "_stop", "", "w"))

        # Run worker - it should process all messages and stop
        worker_func()

        assert mock_post.call_count == 2
        assert "Failed to deliver outbound message" in caplog.text


def test_sender_worker_timeout_handling():
    """Test timeout behavior (empty queue swallowed)."""
    # We mock get_outbound_message to raise Empty then return stop

    with (
        patch("loglife.core.messaging.sender.Thread") as mock_thread_cls,
        patch("loglife.core.messaging.sender.get_outbound_message") as mock_get,
    ):
        mock_get.side_effect = [
            queue.Empty,  # Should continue
            Message("stop", "_stop", "", "w"),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Run worker with timeout protection
        start_time = time.time()
        worker_func()
        elapsed = time.time() - start_time

        # Ensure test completes quickly
        assert elapsed < 1.0, f"Test took {elapsed:.2f}s, should be < 1.0s"

        assert mock_get.call_count == 2
