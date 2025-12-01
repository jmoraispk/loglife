"""Chat interface core package.

Exposes the simplified API for building chat applications.
"""

from loglife.app.config import setup_logging
from loglife.app.db import init_db
from loglife.core.messaging import (
    Message,
    _inbound_queue,
    enqueue_outbound_message,
    queue_async_message,
    start_sender_worker,
)

__all__ = [
    "Message",
    "init",
    "recv_msg",
    "send_msg",
]


def init() -> None:
    """Initialize the core system (DB, Logging, Workers).

    Call this at the start of your application.
    """
    setup_logging()
    init_db()
    # Start the sender worker to handle outbound traffic
    start_sender_worker()
    # Note: We do NOT start the message (router) worker here by default,
    # enabling the user to write their own consumer loop using recv_msg().
    # If they want the automatic router, they should call start_message_worker(handler).


def recv_msg(block: bool = True, timeout: float | None = None) -> Message:
    """Receive the next message from the inbound queue.

    Blocks until a message is available unless block=False.
    """
    return _inbound_queue.get(block=block, timeout=timeout)


def send_msg(message: Message | str, to: str | None = None) -> None:
    """Send a message to the outbound queue.

    Args:
        message: A Message object OR a string text.
        to: The phone number to send to (required if message is a string).

    """
    if isinstance(message, str):
        if not to:
            raise ValueError("Target 'to' number is required when sending a string.")
        queue_async_message(to, message)
    else:
        enqueue_outbound_message(message)

