import argparse
from typing import Optional

from app.domain.dto import InboundMessage, OutboundMessage
from app.core.parser import parse_command
from app.core.services import ServiceContainer
from app.ui.render_whatsapp import render


def handle_message(raw_payload: dict) -> OutboundMessage:
    text = raw_payload.get("text", "").strip()
    user_phone = raw_payload.get("from", "")
    message_id = raw_payload.get("id")

    inbound = InboundMessage(user_phone=user_phone, message_id=message_id, text=text, raw=raw_payload)

    services = ServiceContainer.default()
    cmd = parse_command(inbound.text)
    response_text = services.route_command(inbound, cmd)
    return OutboundMessage(user_phone=inbound.user_phone, text=response_text)


def _healthcheck() -> int:
    try:
        # Ensure DB reachable and migrations runnable
        ServiceContainer.default().repo.ensure_ready()
        # Ensure renderer loads a simple template
        _ = render("onboarding_welcome", style="bullet")
        return 0
    except Exception:
        return 1


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Healthcheck: DB reachable & renderer loads")
    args = parser.parse_args(argv)
    if args.check:
        return _healthcheck()
    print("Usage: module is intended for webhook entry or --check")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

