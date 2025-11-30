"""Blueprint exposing the web-based emulator and event streaming.

This module defines a Flask blueprint for:
1. Serving the emulator interface.
2. Streaming log events to the emulator via SSE.
"""

from app.services.sender import log_queue
from flask import Blueprint, Response, render_template

emulator_bp = Blueprint("emulator", __name__)


@emulator_bp.route("/")
def emulator() -> str:
    """Render the emulator template.

    Returns:
        The rendered emulator HTML template.

    """
    return render_template("emulator.html")


@emulator_bp.route("/events")
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
