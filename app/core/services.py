"""Core service layer routing parsed commands to behaviors.

This module wires the repository to command handlers and rendering.
M0 focuses on minimal flows; later milestones will expand logic.
"""

import csv
import os
from dataclasses import dataclass
from datetime import date as date_type

from app.core.parser import Command
from app.domain.dto import InboundMessage
from app.infra.clock import today_in_tz
from app.infra.repo_sqlite import Repo
from app.ui.render_whatsapp import render

MAX_HABITS_DEFAULT = 1
DEFAULT_REMIND_HHMM = "20:00"
MORNING_REMIND_HHMM_DEFAULT = "08:00"
BACKFILL_MAX_DAYS = 1
STYLE_DEFAULT = "bullet"
EXPORT_MAX_ROWS = 1000
MILESTONES_DEFAULT = [1, 3, 5, 7, 10, 14, 21, 30, 50, 66, 100]


@dataclass
class ServiceContainer:
    """Service container aggregating infrastructure dependencies."""

    repo: Repo

    @classmethod
    def default(cls) -> "ServiceContainer":
        """Construct a default container with the default repository."""
        return cls(repo=Repo.default())

    def route_command(self, inbound: InboundMessage, cmd: Command) -> str:
        """Route a parsed command and return a rendered message body."""
        if cmd.kind == "start":
            self.repo.ensure_user(inbound.user_phone)
            return render("onboarding_welcome", STYLE_DEFAULT)
        if cmd.kind == "list":
            self.repo.ensure_user(inbound.user_phone)
            habits = self.repo.list_habits(inbound.user_phone)
            return render("list_habits", STYLE_DEFAULT, habits=habits)
        if cmd.kind == "add" or cmd.kind == "add_force":
            self.repo.ensure_user(inbound.user_phone)
            force = cmd.kind == "add_force"
            try:
                name, hhmm = self._parse_add_args(cmd.arg)
            except Exception:
                return render("error_syntax_time", STYLE_DEFAULT)
            res = self.repo.add_habit(
                inbound.user_phone, name, hhmm, force=force, max_default=MAX_HABITS_DEFAULT
            )
            if res == "soft_cap":
                return render("error_soft_cap", STYLE_DEFAULT)
            return render("habit_added", STYLE_DEFAULT, name=name, time=hhmm)
        if cmd.kind == "checkin":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_checkin(inbound, cmd.arg)
        if cmd.kind == "export":
            self.repo.ensure_user(inbound.user_phone)
            path = self._handle_export(inbound.user_phone, cmd.arg)
            return render("export_ready_file", STYLE_DEFAULT, path=path)
        if cmd.kind == "backfill":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_backfill(inbound, cmd.arg)
        if cmd.kind == "feedback":
            self.repo.ensure_user(inbound.user_phone)
            ticket_id = self.repo.open_feedback(inbound.user_phone, cmd.arg)
            return render("feedback_opened", STYLE_DEFAULT, ticket_id=ticket_id)
        return render("error_unknown", STYLE_DEFAULT)

    def _parse_add_args(self, arg: str) -> list[str]:
        """Parse arguments for the add command.

        Expected format: "<habit text> at HH:MM".
        Returns a list [name, hhmm].
        """
        parts = arg.rsplit(" at ", 1)
        if len(parts) != 2:
            raise ValueError("bad add args")
        name, hhmm = parts[0].strip(), parts[1].strip()
        if not name:
            raise ValueError("empty name")
        if not (len(hhmm) == 5 and hhmm[2] == ":"):
            raise ValueError("bad time")
        return [name, hhmm]

    def _parse_ratings(self, arg: str, num_habits: int) -> list[int | None]:
        t = (arg or "").strip().lower()
        if t == "done":
            return [3] + [None] * (num_habits - 1)
        if t in {"1", "2", "3"} and num_habits == 1:
            return [int(t)]
        compact = t.replace(" ", "")
        if all(ch in "123" for ch in compact) and compact:
            vals = [int(ch) for ch in compact[:num_habits]]
            while len(vals) < num_habits:
                vals.append(None)
            return vals
        mapping = {"✅": 3, "⚠": 2, "⚠️": 2, "❌": 1}
        if any(ch in mapping for ch in t):
            vals = [mapping.get(ch) for ch in t if ch in mapping]
            while len(vals) < num_habits:
                vals.append(None)
            return vals
        return [None] * num_habits

    def _handle_checkin(self, inbound: InboundMessage, arg: str) -> str:
        phone = inbound.user_phone
        tz = self.repo.get_user_tz(phone)
        today = today_in_tz(tz).isoformat()
        habits = self.repo.get_habits(phone)
        if not habits:
            return render("error_unknown", STYLE_DEFAULT)
        ratings = self._parse_ratings(arg, len(habits))
        lines: list[str] = []
        for i, habit in enumerate(habits):
            score = ratings[i]
            if score is None:
                continue
            hid = int(habit["id"])
            self.repo.upsert_log(hid, today, score)
            streak = self.repo.compute_streak(hid, today)
            horizon = int(habit["horizon_days"]) if habit["horizon_days"] is not None else 14
            percent = min(100, round(100 * streak / horizon)) if horizon else 0
            emoji = {1: "❌", 2: "⚠️", 3: "✅"}.get(score, "")
            name = habit["name"]
            # Celebration tone: congratulate on first 3 and milestone hits
            celebrate = ""
            if score == 3 and streak in MILESTONES_DEFAULT:
                celebrate = " 🎉"
            msg = (
                f"Logged {emoji} “{name}”. 🔥 Day {streak}{celebrate} "
                f"({percent}% of {horizon}-day ramp)."
            )
            lines.append(msg)
        style = self.repo.get_user_prefs(phone).get("style", STYLE_DEFAULT)
        return render("check_logged", style, summary="\n".join(lines) or "Logged.")

    def _handle_backfill(self, inbound: InboundMessage, arg: str) -> str:
        phone = inbound.user_phone
        tz = self.repo.get_user_tz(phone)
        today = today_in_tz(tz)
        parts = (arg or "").split(" ", 1)
        if len(parts) != 2:
            return render("error_syntax_date", STYLE_DEFAULT)
        day_spec, ratings_str = parts[0], parts[1]
        if day_spec == "yesterday":
            target = today.fromordinal(today.toordinal() - 1)
        else:
            try:
                target = date_type.fromisoformat(day_spec)
            except Exception:
                return render("error_syntax_date", STYLE_DEFAULT)
            if target not in {today, today.fromordinal(today.toordinal() - 1)}:
                return render("error_backfill_range", STYLE_DEFAULT)
        habits = self.repo.get_habits(phone)
        ratings = self._parse_ratings(ratings_str, len(habits))
        for i, habit in enumerate(habits):
            score = ratings[i]
            if score is None:
                continue
            self.repo.upsert_log(int(habit["id"]), target.isoformat(), score)
        return render(
            "check_logged", STYLE_DEFAULT, summary="Backfill saved for " + target.isoformat()
        )

    def _handle_export(self, phone: str, arg: str) -> str:
        tz = self.repo.get_user_tz(phone)
        end = today_in_tz(tz)
        if (arg or "").startswith("m"):
            start = date_type.fromordinal(end.toordinal() - 29)
        else:
            start = date_type.fromordinal(end.toordinal() - 6)
        rows = self.repo.export_rows(phone, start.isoformat(), end.isoformat())
        os.makedirs("exports", exist_ok=True)
        masked = "+***" + (phone[-4:] if len(phone) >= 4 else phone)
        fname = (
            "exports/"
            f"habits_{masked.replace('+', 'plus')}_{start.isoformat()}..{end.isoformat()}.csv"
        )
        with open(fname, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "user_phone",
                    "tz",
                    "habit_name",
                    "emoji",
                    "date",
                    "score",
                    "streak_after",
                    "created_at",
                    "note",
                ]
            )
            for r in rows[:EXPORT_MAX_ROWS]:
                writer.writerow(r)
        return fname
