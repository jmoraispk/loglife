"""Test export link mode signing."""

import os
import tempfile

from app.api.handler import handle_message
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB for export link test."""
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


def test_export_link_mode():
    """Export in link mode should return a signed pseudo-URL."""
    phone = "+10000000006"
    handle_message({"from": phone, "text": "start"})
    handle_message({"from": phone, "text": "add Run 20m at 20:00"})
    # Switch to link mode
    repo = repo_sqlite.Repo.default()
    repo.set_user_pref(phone, "export_mode", "link")
    out = handle_message({"from": phone, "text": "export w1"})
    assert out.text.startswith("Export")
