"""Preferences command tests (tz/style/morning, pause/resume)."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Create a temp DB for prefs tests."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Remove the temp DB."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_style_and_morning_and_pause():
    """Set style, get it, set morning, and pause/resume."""
    phone = "+10000000005"
    handle_message({"from": phone, "text": "start"})
    out = handle_message({"from": phone, "text": "style set compact"})
    assert "Style set" in out.text
    out = handle_message({"from": phone, "text": "style get"})
    assert "Style:" in out.text
    out = handle_message({"from": phone, "text": "set morning 07:30"})
    assert "Morning reminder set" in out.text
    out = handle_message({"from": phone, "text": "pause"})
    assert "Paused" in out.text
    out = handle_message({"from": phone, "text": "resume"})
    assert "Resumed" in out.text
