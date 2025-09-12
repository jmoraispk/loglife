"""Simple scheduler loop for morning reminders and evening checks.

This MVP implementation runs a single tick or a loop (every 60 seconds)
and dispatches messages based on user preferences and habit times.
"""

from __future__ import annotations

import argparse
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from app.infra.repo_sqlite import Repo
from app.ui.render_whatsapp import render


def _at_hhmm(now_local: datetime, hhmm: str) -> bool:
    return now_local.strftime("%H:%M") == hhmm


def tick(repo: Repo) -> None:
    """Execute one scheduler tick across all users and habits."""
    users = repo.list_users()
    for u in users:
        tz = u["tz"] or "America/Los_Angeles"
        now_local = datetime.now(tz=ZoneInfo(tz))
        prefs = repo.get_user_prefs(u["phone"])

        # Morning reminder
        mr = prefs.get("morning_remind_hhmm", "08:00")
        if mr and _at_hhmm(now_local, mr):
            # In a full system, this would send via adapter and log message
            _ = render("morning_reminder", prefs.get("style", "bullet"))

        # Evening checks per habit
        for h in repo.get_habits(u["phone"]):
            if _at_hhmm(now_local, h["remind_hhmm"]):
                # suppression: if already logged today, skip
                today_iso = now_local.date().isoformat()
                if repo.has_log_for_date(int(h["id"]), today_iso):
                    continue
                _ = render("check_prompt", prefs.get("style", "bullet"))


def main() -> int:
    """CLI entrypoint for the scheduler module."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run a single tick and exit")
    args = parser.parse_args()
    repo = Repo.default()
    if args.once:
        tick(repo)
        return 0
    while True:
        tick(repo)
        time.sleep(60)


if __name__ == "__main__":
    raise SystemExit(main())
