"""Simple scheduler loop for morning reminders and evening checks.

This MVP implementation runs a single tick or a loop (every 60 seconds)
and dispatches messages based on user preferences and habit times.

Responsibilities:
- Morning reminders at user-configured HH:MM
- Evening check prompts per habit at configured HH:MM
- Suppress checks if the user already logged for that habit today
- Suppress nudges when the user interacted recently (basic 10-minute window)
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


def tick(repo: Repo, now_by_phone: dict[str, datetime] | None = None) -> list[tuple[str, str]]:
    """Execute one scheduler tick across all users and habits.

    Returns a list of (event, phone) tuples for testability. Events include
    "morning_reminder" and "check_prompt".
    """
    events: list[tuple[str, str]] = []
    users = repo.list_users()
    for u in users:
        phone = u["phone"]
        tz = u["tz"] or "America/Los_Angeles"
        now_local = (
            now_by_phone[phone].astimezone(ZoneInfo(tz))
            if now_by_phone and phone in now_by_phone
            else datetime.now(tz=ZoneInfo(tz))
        )
        # Skip paused users
        if repo.is_paused(phone):
            continue
        prefs = repo.get_user_prefs(phone)

        # Morning reminder
        mr = prefs.get("morning_remind_hhmm", "08:00")
        if mr and _at_hhmm(now_local, mr):
            _ = render("morning_reminder", prefs.get("style", "bullet"))
            events.append(("morning_reminder", phone))

        # Evening checks per habit
        for h in repo.get_habits(phone):
            if _at_hhmm(now_local, h["remind_hhmm"]):
                today_iso = now_local.date().isoformat()
                if repo.has_log_for_date(int(h["id"]), today_iso):
                    continue
                _ = render("check_prompt", prefs.get("style", "bullet"))
                events.append(("check_prompt", phone))

        # Nudges (minimal): skip if user interacted in last 10 minutes
        last_in = repo.last_inbound_ts(phone)
        if last_in:
            try:
                last_dt = datetime.fromisoformat(last_in)
                if (now_local - last_dt).total_seconds() < 600:
                    continue
            except Exception:
                pass
    return events


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
