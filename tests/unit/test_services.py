"""Service-level tests using a temporary SQLite database."""

import os
import tempfile

from app.api.handler import handle_message
from app.core.services import ServiceContainer
from app.infra import repo_sqlite


def setup_function(_):
    """Create a temporary DB for each test function."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Remove temporary DB after each test function."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_add_and_list():
    """Adding a habit appears in the list output."""
    sc = ServiceContainer.default()
    sc.repo.ensure_user("+10000000000")
    msg = {"from": "+10000000000", "text": "add Sleep by 23:00 at 21:30"}
    out = handle_message(msg)
    assert "Added" in out.text

    out2 = handle_message({"from": "+10000000000", "text": "list"})
    assert "Sleep" in out2.text


def test_checkin_single():
    """Single-habit checkin with score 3 returns a streak line."""
    sc = ServiceContainer.default()
    sc.repo.ensure_user("+10000000001")
    handle_message({"from": "+10000000001", "text": "add Run 20m at 20:00"})
    out = handle_message({"from": "+10000000001", "text": "3"})
    assert "Day" in out.text and "🎉" in out.text
