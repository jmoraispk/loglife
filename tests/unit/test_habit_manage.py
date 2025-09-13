"""Unit tests for habit remove and rename commands."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB for habit manage tests."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Cleanup temp DB."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_remove_and_rename():
    """Rename then remove a habit via commands."""
    phone = "+18880000000"
    handle_message({"from": phone, "text": "start"})
    handle_message({"from": phone, "text": "add Run 20m at 20:00"})
    out = handle_message({"from": phone, "text": "rename Run 20m -> Jog 15m"})
    assert "Renamed" in out.text
    out = handle_message({"from": phone, "text": "remove Jog 15m"})
    assert "Removed" in out.text
