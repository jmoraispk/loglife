"""Webhook entrypoint and healthcheck for WhatsApp Habit Tracker.

Exposes a message handler used by adapters and a simple healthcheck that
verifies database connectivity and renderer template loading.
"""

import argparse
from typing import Any

from app.core.parser import parse_command
from app.core.services import ServiceContainer
from app.domain.dto import InboundMessage, OutboundMessage
from app.ui.render_whatsapp import render


def handle_message(raw_payload: dict[str, Any]) -> OutboundMessage:
    """Handle a single inbound message and produce an outbound reply.

    Args:
        raw_payload: Transport-specific payload containing at least keys
            "from" (user phone), "text" (message text), and optional "id".

    Returns:
        OutboundMessage with the rendered response for the user.
    """
    text = raw_payload.get("text", "").strip()
    user_phone = raw_payload.get("from", "")
    message_id = raw_payload.get("id")

    inbound = InboundMessage(
        user_phone=user_phone, message_id=message_id, text=text, raw=raw_payload
    )

    services = ServiceContainer.default()
    # Ensure user exists before logging messages
    services.repo.ensure_user(inbound.user_phone)
    services.repo.log_message(inbound.user_phone, "in", inbound.text)
    cmd = parse_command(inbound.text)
    response_text = services.route_command(inbound, cmd)
    services.repo.log_message(inbound.user_phone, "out", response_text)
    return OutboundMessage(user_phone=inbound.user_phone, text=response_text)


def _healthcheck() -> int:
    """Return 0 if DB is reachable and templates load, 1 otherwise."""
    try:
        ServiceContainer.default().repo.ensure_ready()
        _ = render("onboarding_welcome", style="bullet")
        return 0
    except Exception:
        return 1


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint supporting --check health probe."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check", action="store_true", help="Healthcheck: DB reachable & renderer loads"
    )
    args = parser.parse_args(argv)
    if args.check:
        return _healthcheck()
    print("Usage: module is intended for webhook entry or --check")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
