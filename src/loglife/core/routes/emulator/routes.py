"""Web-based emulator for testing chat flows.

Serves the emulator UI and provides an SSE stream for realtime logs.
"""

from collections.abc import Generator

from flask import Blueprint, Response, render_template

from loglife.app.config.settings import SQLITE_WEB_URL
from loglife.core.messaging import log_queue

emulator_bp = Blueprint(
    "emulator",
    __name__,
    template_folder="templates",
    static_folder="static",
)


@emulator_bp.route("/")
def emulator() -> str:
    """Render the emulator HTML interface."""
    return render_template("emulator.html", db_url=SQLITE_WEB_URL)


@emulator_bp.route("/events")
def events() -> Response:
    """Stream realtime log events to the browser via SSE."""

    def stream() -> Generator[str, None, None]:
        while True:
            msg = log_queue.get()
            yield f"data: {msg}\n\n"

    return Response(stream(), mimetype="text/event-stream")
