"""Command parser for WhatsApp Habit Tracker.

Parses inbound user text into a structured Command type. Parsing is
case-insensitive and focuses on MVP commands for M0/M1 scaffolding.
"""

import re
from dataclasses import dataclass

HHMM_RE = re.compile(r"\b([01]\d|2[0-3]):[0-5]\d\b")
DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")


@dataclass
class Command:
    """Parsed command with a kind discriminator and optional raw argument."""

    kind: str
    arg: str | None = None


def parse_command(text: str) -> Command:
    """Parse raw text into a Command.

    Args:
        text: User-provided message body.

    Returns:
        Command with kind and optional arg content.
    """
    t = text.strip().lower()
    if not t:
        return Command("unknown")

    if t == "start":
        return Command("start")
    if t.startswith("set tz "):
        return Command("set_tz", arg=text.strip()[7:].strip())
    if t.startswith("style set "):
        return Command("style_set", arg=text.strip()[10:].strip())
    if t == "style get":
        return Command("style_get")
    if t.startswith("set morning "):
        return Command("set_morning", arg=text.strip()[12:].strip())

    if t.startswith("add force ") and " at " in t:
        return Command("add_force", arg=text.strip()[10:].strip())
    if t.startswith("add ") and " at " in t:
        return Command("add", arg=text.strip()[4:].strip())
    if t.startswith("remove "):
        return Command("remove", arg=text.strip()[7:].strip())
    if t.startswith("rename ") and "->" in t:
        return Command("rename", arg=text.strip()[7:].strip())
    if t == "list":
        return Command("list")

    if t in {"1", "2", "3", "done", "321", "3 2 1", "✅⚠️❌"}:
        return Command("checkin", arg=text.strip())

    if t.startswith("backfill "):
        return Command("backfill", arg=text.strip()[9:].strip())

    if t.startswith("export "):
        return Command("export", arg=text.strip()[7:].strip())

    if t.startswith("feedback "):
        return Command("feedback", arg=text.strip()[9:].strip())

    if t.startswith("boost"):
        arg = text.strip()[5:].strip() if len(t) > 5 else ""
        return Command("boost", arg=arg)
    if t.startswith("set why "):
        return Command("set_why", arg=text.strip()[8:].strip())
    if t.startswith("set identity "):
        return Command("set_identity", arg=text.strip()[13:].strip())
    if t.startswith("set env+ "):
        return Command("set_env_add", arg=text.strip()[9:].strip())
    if t.startswith("set env- "):
        return Command("set_env_remove", arg=text.strip()[9:].strip())
    if t.startswith("set minimum "):
        return Command("set_minimum", arg=text.strip()[12:].strip())
    if t.startswith("set ifthen "):
        return Command("set_ifthen", arg=text.strip()[11:].strip())

    return Command("unknown")
