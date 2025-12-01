"""Integration tests for full conversation flows."""

from queue import Empty
from typing import Any

from flask.testing import FlaskClient

from loglife.app.logic.router import route_message
from loglife.core.messaging import _inbound_queue, get_outbound_message


def _drain_outbound_queue() -> None:
    while True:
        try:
            get_outbound_message(timeout=0.01)
        except Empty:
            break


def process_inbound_queue() -> None:
    """Process all messages in the inbound queue synchronously."""
    while not _inbound_queue.empty():
        msg = _inbound_queue.get()
        route_message(msg)


def send_message(client: FlaskClient, text: str, sender: str = "+1234567890") -> dict[str, Any]:
    """Help simulate sending a WhatsApp message to the webhook."""
    # Drain queue manually to ensure clean state
    _drain_outbound_queue()

    response = client.post(
        "/webhook",
        json={
            "sender": sender,
            "msg_type": "chat",
            "raw_msg": text,
            "client_type": "whatsapp",
        },
    )
    assert response.status_code == 200

    # Manually process the inbound message (since worker is disabled in tests)
    process_inbound_queue()

    # Retrieve message directly from queue
    # Since sender worker is disabled in tests (via conftest), messages stay in queue
    outbound = get_outbound_message(timeout=1)
    return {"message": outbound.raw_payload}


def test_onboarding_and_goal_creation_flow(client: FlaskClient) -> None:
    """Test the end-to-end flow of a new user signing up and creating a goal."""
    # 1. New user sends "Hi"
    # -----------------------
    data = send_message(client, "Hi")
    # "Hi" is not a recognized command, so it returns "Wrong command!"
    # The welcome message is only sent for specific onboarding flows or manual triggers,
    # or if we changed the default behavior for unknown commands (which we haven't).
    # However, if we want to test onboarding, we should check if the user was created.
    # Since the user is created in the webhook before processing, checking for "Wrong command!"
    # confirms the webhook processed the message.
    assert "Wrong command!" in data["message"]

    # 2. User adds a goal
    # -----------------------
    data = send_message(client, "add goal 🏃 Run 5k")
    assert "When you would like to be reminded?" in data["message"]

    # 3. User sets reminder time (State machine check)
    # -----------------------
    data = send_message(client, "08:00")
    assert "remind you daily at 08:00 AM" in data["message"]
    # Goal descriptions are lowercased in the response
    assert "run 5k" in data["message"]

    # 4. User lists goals
    # -----------------------
    data = send_message(client, "goals")
    assert "1. 🏃 run 5k" in data["message"]


def test_rating_and_journaling_flow(client: FlaskClient) -> None:
    """Test the flow of rating goals and requesting journal prompts."""
    # Setup: Create user and goal
    send_message(client, "add goal 📚 Read book")
    send_message(client, "09:00")

    # 1. User rates the goal
    # -----------------------
    data = send_message(client, "rate 1 3")
    assert "✅" in data["message"]
    # The response format is: "📅 Fri (Nov 28)\n📚 read book: ✅"
    # The goal description is lowercased in the response.
    assert "read book" in data["message"]

    # 2. User asks for journal prompts (Since goal is rated, it shouldn't ask about it)
    # -----------------------
    data = send_message(client, "journal prompts")
    assert "Time to reflect on your day" in data["message"]
    # Ensure it doesn't ask "Did you complete..." because we just rated it
    assert "Did you complete the goals?" not in data["message"]


def test_full_daily_lifecycle(client: FlaskClient) -> None:
    """Test a full daily lifecycle: Add goals -> Check status -> Rate -> Journal."""
    sender = "+9876543210"

    # 1. Setup goals
    send_message(client, "add goal 💧 Drink Water", sender=sender)
    send_message(client, "10:00", sender=sender)

    send_message(client, "add goal 🧘 Meditate", sender=sender)
    send_message(client, "20:00", sender=sender)

    # 2. Check 'journal now' BEFORE rating
    # -----------------------
    data = send_message(client, "journal now", sender=sender)
    # It SHOULD ask about the untracked goals
    assert "Did you complete the goals?" in data["message"]
    # Goal descriptions are lowercased in the response
    assert "drink water" in data["message"]
    assert "meditate" in data["message"]

    # 3. Rate ONE goal
    # -----------------------
    send_message(client, "rate 1 3", sender=sender)  # Rate Water as success

    # 4. Check 'journal now' again
    # -----------------------
    data = send_message(client, "journal now", sender=sender)
    # It SHOULD still ask about Meditate, but NOT Drink Water
    assert "Did you complete the goals?" in data["message"]
    assert "drink water" not in data["message"]
    assert "meditate" in data["message"]

    # 5. Rate the second goal
    # -----------------------
    send_message(client, "rate 2 2", sender=sender)  # Rate Meditate as partial

    # 6. Check 'journal now' again
    # -----------------------
    data = send_message(client, "journal now", sender=sender)
    # Now it should NOT ask about goals
    assert "Did you complete the goals?" not in data["message"]


def test_error_handling_flow(client: FlaskClient) -> None:
    """Test that invalid inputs don't crash the app."""
    # 1. Random garbage
    data = send_message(client, "kjsdhfkjsdhf")
    assert "Wrong command" in data["message"]

    # 2. Update non-existent goal
    data = send_message(client, "update 99 10pm")
    assert "Invalid goal number" in data["message"] or "goals" in data["message"]
