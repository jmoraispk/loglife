"""Blueprint exposing the web-based emulator and event streaming.

This module defines a Flask blueprint for:
1. Serving the emulator interface.
2. Streaming log events to the emulator via SSE.
"""

from flask import Blueprint, Response, render_template

from loglife.core.messaging import log_queue

emulator_bp = Blueprint(
    "emulator",
    __name__,
    template_folder="templates",
    static_folder="static",
)


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
