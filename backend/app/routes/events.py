"""Events blueprint for Server-Sent Events (SSE) streaming.

This module defines a Flask blueprint for streaming log events to clients
using Server-Sent Events protocol.
"""

from app.services.sender import log_queue
from flask import Blueprint, Response

events_bp = Blueprint("events", __name__)


@events_bp.route("/events")
def events() -> Response:
    """Stream log events using Server-Sent Events (SSE).

    Returns:
        SSE stream with log messages

    """

    def stream() -> str:
        """Generate SSE stream of log messages.

        Yields:
            Log messages in SSE format.

        """
        while True:
            msg = log_queue.get()
            yield f"data: {msg}\n\n"

    return Response(stream(), mimetype="text/event-stream")
