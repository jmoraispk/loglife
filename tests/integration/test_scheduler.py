"""Integration tests for the scheduler tick."""

import os
import tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.scheduler import tick
from app.infra import repo_sqlite


def setup_function(_):
    """Prepare temp DB for integration tests."""
    fd, path = tempfile.mkstemp(prefix="habits_test_", suffix=".sqlite3")
    os.close(fd)
    os.environ["HABITS_DB"] = path
    repo_sqlite.Repo.default().ensure_ready()


def teardown_function(_):
    """Remove temp DB after integration tests."""
    path = os.environ.get("HABITS_DB")
    if path and os.path.exists(path):
        os.remove(path)
    os.environ.pop("HABITS_DB", None)


def test_morning_and_evening_events():
    """Scheduler emits morning reminder and evening check at the right times."""
    repo = repo_sqlite.Repo.default()
    phone = "+10000000003"
    repo.ensure_user(phone)
    repo.add_habit(phone, "Run 20m", "20:00", force=False, max_default=1)

    la = ZoneInfo("America/Los_Angeles")
    morning = datetime(2025, 1, 1, 8, 0, tzinfo=la)
    evening = datetime(2025, 1, 1, 20, 0, tzinfo=la)

    events_morning = tick(repo, now_by_phone={phone: morning})
    assert ("morning_reminder", phone) in events_morning

    events_evening = tick(repo, now_by_phone={phone: evening})
    assert ("check_prompt", phone) in events_evening
