"""E2E-style tests exercising the handler path via simulator-like calls."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare a temporary DB for e2e tests."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Remove temp DB after e2e tests."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_onboarding_add_list_check_export():
    """Happy path: start, add, list, checkin, export."""
    phone = "+15551234567"
    out = handle_message({"from": phone, "text": "start"})
    assert "Welcome" in out.text

    out = handle_message({"from": phone, "text": "add Sleep by 23:00 at 21:30"})
    assert "Added" in out.text

    out = handle_message({"from": phone, "text": "list"})
    assert "Sleep" in out.text

    out = handle_message({"from": phone, "text": "3"})
    assert "Day" in out.text

    out = handle_message({"from": phone, "text": "export w1"})
    assert "Export" in out.text
