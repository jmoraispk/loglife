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
from app.infra.signing import sign_path
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
        if cmd.kind == "set_tz":
            self.repo.ensure_user(inbound.user_phone)
            tz = (cmd.arg or "").strip()
            if not tz or "/" not in tz:
                return render("error_unknown", STYLE_DEFAULT)
            self.repo.set_user_tz(inbound.user_phone, tz)
            return render("nudge_text", STYLE_DEFAULT, text=f"Timezone set to {tz}.")
        if cmd.kind == "style_set":
            self.repo.ensure_user(inbound.user_phone)
            style = (cmd.arg or "").strip()
            if style not in {"bullet", "compact", "table", "card"}:
                return render("error_unknown", STYLE_DEFAULT)
            self.repo.set_user_pref(inbound.user_phone, "style", style)
            return render("nudge_text", STYLE_DEFAULT, text=f"Style set to {style}.")
        if cmd.kind == "style_get":
            self.repo.ensure_user(inbound.user_phone)
            prefs = self.repo.get_user_prefs(inbound.user_phone)
            return render(
                "nudge_text", STYLE_DEFAULT, text=f"Style: {prefs.get('style', 'bullet')}"
            )
        if cmd.kind == "set_morning":
            self.repo.ensure_user(inbound.user_phone)
            arg = (cmd.arg or "").strip().lower()
            if arg == "off":
                self.repo.set_user_pref(inbound.user_phone, "morning_remind_hhmm", "")
                return render("nudge_text", STYLE_DEFAULT, text="Morning reminder turned off.")
            if not (len(arg) == 5 and arg[2] == ":"):
                return render("error_syntax_time", STYLE_DEFAULT)
            self.repo.set_user_pref(inbound.user_phone, "morning_remind_hhmm", arg)
            return render("nudge_text", STYLE_DEFAULT, text=f"Morning reminder set to {arg}.")
        if cmd.kind == "pause":
            self.repo.ensure_user(inbound.user_phone)
            self.repo.set_paused(inbound.user_phone, True)
            return render("nudge_text", STYLE_DEFAULT, text="Paused reminders.")
        if cmd.kind == "resume":
            self.repo.ensure_user(inbound.user_phone)
            self.repo.set_paused(inbound.user_phone, False)
            return render("nudge_text", STYLE_DEFAULT, text="Resumed reminders.")
        if cmd.kind == "list":
            self.repo.ensure_user(inbound.user_phone)
            habits = self.repo.list_habits(inbound.user_phone)
            return render("list_habits", STYLE_DEFAULT, habits=habits)
        if cmd.kind == "remove":
            self.repo.ensure_user(inbound.user_phone)
            ok = self.repo.remove_habit(inbound.user_phone, cmd.arg or "")
            return render("nudge_text", STYLE_DEFAULT, text=("Removed." if ok else "Not found."))
        if cmd.kind == "rename":
            self.repo.ensure_user(inbound.user_phone)
            arg = cmd.arg or ""
            if "->" not in arg:
                return render("error_unknown", STYLE_DEFAULT)
            old, new = [p.strip() for p in arg.split("->", 1)]
            ok = self.repo.rename_habit(inbound.user_phone, old, new)
            return render("nudge_text", STYLE_DEFAULT, text=("Renamed." if ok else "Not found."))
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
            # frequency limit: <=3/day
            if self.repo.export_count_today(inbound.user_phone) >= 3:
                return render(
                    "nudge_text", STYLE_DEFAULT, text="Too many exports today. Try tomorrow."
                )
            path = self._handle_export(inbound.user_phone, cmd.arg)
            return render("export_ready_file", STYLE_DEFAULT, path=path)
        if cmd.kind == "export_mode":
            self.repo.ensure_user(inbound.user_phone)
            mode = (cmd.arg or "").strip().lower()
            if mode not in {"file", "link"}:
                return render("error_unknown", STYLE_DEFAULT)
            self.repo.set_user_pref(inbound.user_phone, "export_mode", mode)
            if mode == "link":
                return render("export_ready_link", STYLE_DEFAULT, url="(link mode enabled)")
            return render("nudge_text", STYLE_DEFAULT, text="Export mode set to file.")
        if cmd.kind == "backfill":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_backfill(inbound, cmd.arg)
        if cmd.kind == "feedback":
            self.repo.ensure_user(inbound.user_phone)
            ticket_id = self.repo.open_feedback(inbound.user_phone, cmd.arg)
            return render("feedback_opened", STYLE_DEFAULT, ticket_id=ticket_id)
        # Boost-related
        if cmd.kind in {
            "boost",
            "set_why",
            "set_identity",
            "set_env_add",
            "set_env_remove",
            "set_minimum",
            "set_ifthen",
        }:
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_boost(inbound, cmd)
        if cmd.kind == "streak":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_streak(inbound, cmd.arg or "")
        if cmd.kind == "stats":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_stats(inbound, cmd.arg or "")
        if cmd.kind == "celebrate":
            self.repo.ensure_user(inbound.user_phone)
            return self._handle_celebrate(inbound, cmd.arg or "")
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
        prefs = self.repo.get_user_prefs(phone)
        if prefs.get("export_mode", "file") == "link":
            return sign_path(fname)
        return fname

    def _handle_streak(self, inbound: InboundMessage, habit_name: str) -> str:
        phone = inbound.user_phone
        habits = self.repo.get_habits(phone)
        target = next((h for h in habits if h["name"].lower() == habit_name.lower()), None)
        if not target:
            return render("error_unknown", STYLE_DEFAULT)
        tz = self.repo.get_user_tz(phone)
        today = today_in_tz(tz).isoformat()
        streak = self.repo.compute_streak(int(target["id"]), today)
        horizon = int(target["horizon_days"]) if target["horizon_days"] else 14
        percent = min(100, round(100 * streak / horizon)) if horizon else 0
        return render(
            "streak_report", STYLE_DEFAULT, streak=streak, percent=percent, horizon=horizon
        )

    def _handle_stats(self, inbound: InboundMessage, window: str) -> str:
        tz = self.repo.get_user_tz(inbound.user_phone)
        end = today_in_tz(tz)
        if window.startswith("m"):
            start = date_type.fromordinal(
                end.toordinal() - (30 * (int(window[1:]) if window[1:].isdigit() else 1) - 1)
            )
        else:
            weeks = int(window[1:]) if window[1:].isdigit() else 1
            start = date_type.fromordinal(end.toordinal() - (7 * weeks - 1))
        counts = self.repo.stats_counts(inbound.user_phone, start.isoformat(), end.isoformat())
        summary = f"3={counts[3]} 2={counts[2]} 1={counts[1]} ({start}..{end})"
        if window.startswith("m"):
            return render("stats_month", STYLE_DEFAULT, summary=summary)
        return render("stats_week", STYLE_DEFAULT, summary=summary)

    def _handle_celebrate(self, inbound: InboundMessage, arg: str) -> str:
        # Placeholder: ack only
        return render("nudge_text", STYLE_DEFAULT, text="Celebrate settings updated.")

    # --- Boost & setters (M2 subset) ---
    def _handle_boost(self, inbound: InboundMessage, cmd: Command) -> str:
        phone = inbound.user_phone
        habits = self.repo.get_habits(phone)
        if not habits:
            return render("error_unknown", STYLE_DEFAULT)
        target = habits[0]  # MVP: first habit by order_idx; can parse name later
        hid = int(target["id"])
        key_map = {
            "set_why": ("habit_meta", "why"),
            "set_identity": ("habits", "identity_frame"),
            "set_env_add": ("habit_strategy", "env_additions"),
            "set_env_remove": ("habit_strategy", "env_removals"),
            "set_minimum": ("habit_meta", "minimum"),
            "set_ifthen": ("habit_meta", "if_then"),
        }
        if cmd.kind == "boost":
            return render("nudge_text", STYLE_DEFAULT, text="Boost started. Reply with setters.")
        table, column = key_map[cmd.kind]
        self.repo.upsert_boost_field(hid, table, column, cmd.arg or "")
        # Precompute nudges minimal stub
        self.repo.rebuild_habit_nudges(hid)
        return render("nudge_text", STYLE_DEFAULT, text="Saved.")
