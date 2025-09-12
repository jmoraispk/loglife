"""Backfill command tests."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare a temporary SQLite database for tests."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Remove the temporary database file and clear env override."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_backfill_yesterday():
    """Backfilling yesterday is accepted and acknowledged."""
    phone = "+10000000002"
    handle_message({"from": phone, "text": "add Run 20m at 20:00"})
    out = handle_message({"from": phone, "text": "backfill yesterday 3"})
    assert "Backfill saved" in out.text
