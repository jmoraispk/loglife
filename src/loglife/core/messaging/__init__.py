"""Messaging module - unified interface for message handling."""

from loglife.core.messaging.message import Message
from loglife.core.messaging.receiver import enqueue_inbound_message, start_message_worker
from loglife.core.messaging.sender import (
    build_outbound_message,
    enqueue_outbound_message,
    get_outbound_message,
    log_queue,
    queue_async_message,
    send_message,
    start_sender_worker,
)

__all__ = [
    "Message",
    "build_outbound_message",
    "enqueue_inbound_message",
    "enqueue_outbound_message",
    "get_outbound_message",
    "log_queue",
    "queue_async_message",
    "send_message",
    "start_message_worker",
    "start_sender_worker",
]

