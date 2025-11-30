from __future__ import annotations

import queue
from unittest.mock import MagicMock, patch

import pytest
import requests

from loglife.core.messaging import Message, enqueue_outbound_message
from loglife.core.services.sender import service as sender_service
from loglife.core.services.sender.service import (
    queue_async_message,
    start_sender_worker,
)


@pytest.fixture(autouse=True)
def reset_worker_state():
    sender_service._sender_worker_started = False
    # Drain outbound queue (it's in messaging module but imported/used)
    from loglife.core.messaging import _outbound_queue

    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break
    yield
    sender_service._sender_worker_started = False
    # Drain queue again to be safe
    while not _outbound_queue.empty():
        try:
            _outbound_queue.get_nowait()
        except queue.Empty:
            break


def test_sender_worker_http_failure(caplog):
    """Test that sender worker survives HTTP failures."""

    with patch("loglife.core.services.sender.service.Thread") as mock_thread_cls, \
         patch("loglife.core.services.sender.service.requests.post") as mock_post:

        mock_post.side_effect = [
            requests.exceptions.ConnectionError("Connection Refused"),
            MagicMock(status_code=200),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        # Queue messages
        queue_async_message("123", "fail")
        queue_async_message("123", "success")
        
        # Enqueue stop manually
        enqueue_outbound_message(Message("stop", "_stop", "", "w"))

        worker_func()

        assert mock_post.call_count == 2
        assert "Failed to deliver outbound message" in caplog.text


def test_sender_worker_timeout_handling():
    """Test timeout behavior (empty queue swallowed)."""
    # We mock get_outbound_message to raise Empty then return stop
    
    with patch("loglife.core.services.sender.service.Thread") as mock_thread_cls, \
         patch("loglife.core.services.sender.service.get_outbound_message") as mock_get:

        mock_get.side_effect = [
            queue.Empty,  # Should continue
            Message("stop", "_stop", "", "w"),
        ]

        start_sender_worker()
        worker_func = mock_thread_cls.call_args[1]["target"]

        worker_func()

        assert mock_get.call_count == 2

