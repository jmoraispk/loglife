"""Tests for stats command and usage streak updates."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB for stats and usage tests."""
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


def test_stats_simple():
    """Stats command returns a summary string including counts."""
    phone = "+19990000000"
    handle_message({"from": phone, "text": "start"})
    handle_message({"from": phone, "text": "add Run 20m at 20:00"})
    handle_message({"from": phone, "text": "3"})
    out = handle_message({"from": phone, "text": "stats w1"})
    assert "3=" in out.text


def test_usage_streak_increment():
    """Inbound should update usage streak without error."""
    phone = "+19990000001"
    out = handle_message({"from": phone, "text": "hello"})
    assert out.text is not None
