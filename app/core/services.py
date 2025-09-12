"""Core service layer routing parsed commands to behaviors.

This module wires the repository to command handlers and rendering.
M0 focuses on minimal flows; later milestones will expand logic.
"""

from dataclasses import dataclass

from app.core.parser import Command
from app.domain.dto import InboundMessage
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
            # Minimal placeholder; full implementation in M1
            return render("check_logged", STYLE_DEFAULT, summary="Logged.")
        if cmd.kind == "export":
            self.repo.ensure_user(inbound.user_phone)
            return render("export_ready_file", STYLE_DEFAULT, path="./exports/demo.csv")
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
