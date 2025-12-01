"""Chat interface core package (transports, clients, shared protocols)."""

from .interface import Message, init, recv_msg, send_msg

__all__ = [
    "Message",
    "init",
    "recv_msg",
    "send_msg",
]
