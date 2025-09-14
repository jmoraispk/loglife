"""Tests for export frequency limit (<= 3 per day)."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB for export limit tests."""
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


def test_export_limit_three_per_day():
    """Fourth export in a day should be rejected with a friendly message."""
    phone = "+17770000000"
    handle_message({"from": phone, "text": "start"})
    handle_message({"from": phone, "text": "add Hydrate at 09:00"})
    # Perform three exports
    for _ in range(3):
        out = handle_message({"from": phone, "text": "export w1"})
        assert "Export" in out.text
    # Fourth export should be rejected
    out4 = handle_message({"from": phone, "text": "export w1"})
    assert "Too many exports" in out4.text

