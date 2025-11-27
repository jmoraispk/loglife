"""Events blueprint for Server-Sent Events (SSE) streaming.

This module defines a Flask blueprint for streaming log events to clients
using Server-Sent Events protocol.
"""

from flask import Blueprint, Response

from app.helpers import log_queue

events_bp = Blueprint("events", __name__)


@events_bp.route("/events")
def events():
    """Stream log events using Server-Sent Events (SSE).

    Returns:
        Response: SSE stream with log messages

    """

    def stream():
        while True:
            msg = log_queue.get()
            yield f"data: {msg}\n\n"

    return Response(stream(), mimetype="text/event-stream")
