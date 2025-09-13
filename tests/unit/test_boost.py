"""Tests for boost setters and nudge precompute."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB."""
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


def test_boost_setters_and_nudges():
    """Set minimum/ifthen and get Saved acknowledgements."""
    phone = "+10000000004"
    handle_message({"from": phone, "text": "add Run 20m at 20:00"})
    out = handle_message({"from": phone, "text": "boost"})
    assert "Boost" in out.text
    handle_message({"from": phone, "text": "set minimum Run: 5 minutes"})
    handle_message({"from": phone, "text": "set ifthen Run: put shoes on"})
    # No direct output for nudges, but ensure no error and Saved acks
    out2 = handle_message({"from": phone, "text": "set why Run: better sleep"})
    assert "Saved" in out2.text
