"""SQLite web interface service."""

import logging
import os
import threading

from loglife.app.config import DATABASE_FILE, DATABASE_PORT

# Get port from environment, default to 8080 if not set
SQLITE_PORT = int(os.environ.get("SQLITE_WEB_PORT", str(DATABASE_PORT)))

try:
    from sqlite_web import sqlite_web
except ImportError:
    sqlite_web = None

logger = logging.getLogger(__name__)


def _run_sqlite_web_thread() -> None:
    """Run the sqlite_web server.

    This function is intended to run in a background thread.
    """
    if sqlite_web is None:
        return

    # Silence peewee logger to avoid verbose SQL query logs
    logging.getLogger("peewee").setLevel(logging.WARNING)

    # Silence werkzeug logger for this thread to reduce startup noise
    logging.getLogger("werkzeug").setLevel(logging.ERROR)

    # Initialize the sqlite_web application with our database file
    # We pass str(DATABASE_FILE) because it expects a string path
    sqlite_web.initialize_app(str(DATABASE_FILE))

    # Run the Flask app for sqlite_web
    # use_reloader=False is crucial to avoid starting a new process
    # debug=False prevents the debugger from kicking in and potentially interfering
    try:
        sqlite_web.app.run(host="127.0.0.1", port=SQLITE_PORT, debug=False, use_reloader=False)
    except (OSError, SystemExit) as e:
        logger.warning("Failed to start sqlite_web server: %s", e)


def start_sqlite_web() -> None:
    """Start sqlite_web in a background thread.

    This starts the sqlite_web interface on the configured port.
    It respects the FLASK_ENV setting and prevents duplicate execution
    during Flask auto-reloads.
    """
    # Prevent starting twice if Flask reloader is active (run only in main parent process)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        return

    # Check if sqlite_web is installed
    if sqlite_web is None:
        return

    try:
        thread = threading.Thread(target=_run_sqlite_web_thread, daemon=True)
        thread.start()
        logger.info("🗄️  Database UI running at http://127.0.0.1:%s", SQLITE_PORT)
    except RuntimeError as exc:
        logger.warning("Failed to start sqlite_web thread: %s", exc)
