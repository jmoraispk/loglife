"""Webhook endpoint for inbound WhatsApp messages.

Receives POST requests, validates payloads, and enqueues messages for processing.
"""

import asyncio
import logging
import os
import threading
from typing import Any

from flask import Blueprint, current_app, g, request
from flask.typing import ResponseReturnValue
from flask.wrappers import Response

from loglife.core.messaging import Message, _get_whatsapp_client, enqueue_inbound_message

from .audio import RoboticHelloTrack
from .utils import error_response, success_response

# Try to import aiortc for WebRTC SDP answer generation
try:
    from aiortc import RTCPeerConnection, RTCSessionDescription

    AIORTC_AVAILABLE = True
except ImportError:
    AIORTC_AVAILABLE = False
    # Type stub for when aiortc is not available
    RTCPeerConnection = Any  # type: ignore[assignment,misc]

webhook_bp = Blueprint("webhook", __name__)

logger = logging.getLogger(__name__)

# Silence noisy aiortc packet logs
logging.getLogger("aiortc").setLevel(logging.WARNING)

# Webhook verification token for Meta webhook verification
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "")

# Track processed call IDs to deduplicate repeated connect events
_processed_call_ids: set[str] = set()


# Global background loop for handling calls
class _CallLoopManager:
    """Manages the global background event loop for calls."""

    def __init__(self) -> None:
        """Initialize the call loop manager."""
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None

    def get_loop(self) -> asyncio.AbstractEventLoop:
        """Get or create the global background event loop for calls."""
        if self._loop is None:
            self._loop = asyncio.new_event_loop()

            def run_loop() -> None:
                asyncio.set_event_loop(self._loop)
                if self._loop is not None:
                    self._loop.run_forever()

            self._thread = threading.Thread(target=run_loop, daemon=True)
            self._thread.start()
        return self._loop


_call_loop_manager = _CallLoopManager()
# Store active peer connections: call_id -> RTCPeerConnection
_active_calls: dict[str, Any] = {}


def _get_call_loop() -> asyncio.AbstractEventLoop:
    """Get or create the global background event loop for calls."""
    return _call_loop_manager.get_loop()


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handle inbound WhatsApp messages."""
    try:
        data: dict = request.get_json()

        message = Message.from_payload(data)
        g.client_type = message.client_type  # expose client type to sender service

        enqueue_inbound_message(message)

        logger.info("Queued message type %s for %s", message.msg_type, message.sender)
        # For emulator, we don't need an explicit "queued" response message in the UI
        # We return an empty message so the emulator doesn't show "Message queued"
        return success_response(message="")
    except Exception as e:
        error = f"Error processing webhook > {e}"
        logger.exception(error)
        return error_response(error)


def _handle_webhook_verification() -> ResponseReturnValue:
    """Handle webhook verification (GET request).

    Returns:
        Response with challenge if verification succeeds, error response otherwise.
    """
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        # Return the challenge as plain text (not JSON)
        return Response(challenge, mimetype="text/plain"), 200

    logger.warning(
        "Webhook verification failed: mode=%s, token_match=%s", mode, token == VERIFY_TOKEN
    )
    return error_response("Verification failed", status_code=403)


def _extract_webhook_entry(data: dict) -> dict | None:
    """Extract entry from Meta webhook payload.

    Args:
        data: The JSON payload from Meta webhook.

    Returns:
        The first entry if found, None otherwise.
    """
    entry = data.get("entry", [])
    if not entry:
        logger.warning("No entry found in Meta webhook payload")
        return None
    return entry[0]


def _extract_webhook_change(entry: dict) -> dict | None:
    """Extract change from Meta webhook entry.

    Args:
        entry: The entry object from Meta webhook.

    Returns:
        The first change if found, None otherwise.
    """
    changes = entry.get("changes", [])
    if not changes:
        logger.warning("No changes found in Meta webhook payload")
        return None
    return changes[0]


def _extract_message_content(message: dict, sender: str) -> str | None:
    """Extract message content from message object.

    Args:
        message: The message object from Meta webhook.
        sender: The sender phone number.

    Returns:
        The extracted message content, or None if extraction fails.
    """
    message_type = message.get("type")

    if message_type == "text":
        text_data = message.get("text", {})
        raw_msg = text_data.get("body", "")
        if not raw_msg:
            logger.warning("Missing message body in text message")
            return None
        return raw_msg

    if message_type == "interactive":
        return _extract_interactive_content(message, sender)

    logger.debug("Ignoring non-text/non-interactive message type: %s", message_type)
    return None


def _handle_missing_message_content(message: dict) -> ResponseReturnValue:
    """Handle case when message content extraction fails.

    Args:
        message: The message object from Meta webhook.

    Returns:
        Appropriate response based on message type.
    """
    message_type = message.get("type")
    if message_type == "interactive":
        interactive_data = message.get("interactive", {})
        interactive_type = interactive_data.get("type")
        return success_response(message=f"Ignored interactive type: {interactive_type}")
    if message_type != "text":
        return success_response(message=f"Ignored message type: {message_type}")
    return error_response("Missing message body")


def _extract_interactive_content(message: dict, sender: str) -> str | None:
    """Extract content from interactive message.

    Args:
        message: The message object from Meta webhook.
        sender: The sender phone number.

    Returns:
        The extracted message content, or None if extraction fails.
    """
    interactive_data = message.get("interactive", {})
    interactive_type = interactive_data.get("type")

    if interactive_type == "list_reply":
        list_reply = interactive_data.get("list_reply", {})
        raw_msg = list_reply.get("id", "")
        if not raw_msg:
            logger.warning("Missing list reply ID in interactive message")
            return None
        logger.info("Processing list reply: %s from %s", raw_msg, sender)
        return raw_msg

    if interactive_type == "button_reply":
        button_reply = interactive_data.get("button_reply", {})
        raw_msg = button_reply.get("id", "")
        if not raw_msg:
            logger.warning("Missing button reply ID in interactive message")
            return None
        logger.info("Processing button reply: %s from %s", raw_msg, sender)
        return raw_msg

    logger.debug("Ignoring unsupported interactive message type: %s", interactive_type)
    return None


def _process_message_payload(value: dict, message: dict, sender: str) -> ResponseReturnValue:
    """Process a message payload and forward to webhook.

    Args:
        value: The value object from the webhook change.
        message: The message object.
        sender: The sender phone number.

    Returns:
        Response from webhook processing.
    """
    raw_msg = _extract_message_content(message, sender)
    if raw_msg is None:
        return _handle_missing_message_content(message)

    # Extract profile name from contacts if available
    contacts = value.get("contacts", [])
    profile_name: str | None = None
    if contacts:
        contact = contacts[0]
        profile = contact.get("profile", {})
        profile_name = profile.get("name")

    # Create custom payload matching the expected format
    custom_payload = {
        "sender": sender,
        "raw_msg": raw_msg,
        "msg_type": "chat",
        "client_type": "whatsapp",
    }

    # Add profile name to metadata if available
    if profile_name:
        custom_payload["metadata"] = {"profile_name": profile_name}

    # Forward to /webhook route internally
    # Create a new request context with the custom payload and call webhook directly
    with current_app.test_request_context("/webhook", method="POST", json=custom_payload):
        # Call the webhook function directly with the modified request context
        return webhook()


def _process_meta_message(data: dict) -> ResponseReturnValue:
    """Process incoming Meta webhook message (POST request).

    Args:
        data: The JSON payload from Meta webhook.

    Returns:
        Response after processing the message or forwarding to webhook.
    """
    # Extract message from Meta webhook payload structure
    # Meta webhook format: {"entry": [{"changes": [{"value": {"messages": [...]}}]}]}
    entry = _extract_webhook_entry(data)
    if entry is None:
        return success_response(message="No entry found")

    change = _extract_webhook_change(entry)
    if change is None:
        return success_response(message="No changes found")

    field = change.get("field", "")

    # Handle call events
    if field == "calls":
        return _process_call_event(change.get("value", {}))

    value = change.get("value", {})
    messages = value.get("messages", [])

    if not messages:
        # This might be a status update or other non-message event
        # Only log if it's not a call-related field
        if field != "calls":
            logger.debug("No messages in webhook payload, likely a status update")
        return success_response(message="No messages to process")

    message = messages[0]
    sender = message.get("from")

    if not sender:
        logger.warning("Missing sender in message")
        return error_response("Missing sender")

    return _process_message_payload(value, message, sender)


def _handle_call_connect(call: dict) -> ResponseReturnValue:
    """Handle call connect event.

    Args:
        call: The call object from the event.

    Returns:
        Response after processing the connect event.
    """
    call_id = call.get("id")
    sdp_type = call.get("session", {}).get("sdp_type", "")

    # Deduplicate repeated connect events by call_id
    # Meta may retry if we don't successfully pre_accept quickly
    if call_id in _processed_call_ids:
        logger.info("Ignoring duplicate connect event for call_id=%s", call_id)
        return success_response(message="Duplicate connect event ignored")

    # Extract SDP offer
    session = call.get("session", {})
    sdp_offer = session.get("sdp", "")

    if not call_id or not sdp_offer:
        logger.warning("Missing call_id or SDP offer in connect event")
        return error_response("Missing call_id or SDP offer")

    # Mark call as processed immediately to prevent race conditions
    _processed_call_ids.add(call_id)

    try:
        logger.info("Processing call connect: call_id=%s, sdp_type=%s", call_id, sdp_type)

        # Generate WebRTC SDP answer from SDP offer using aiortc on global loop
        sdp_answer = _generate_sdp_answer(call_id, sdp_offer)

        # Send pre_accept and accept
        _send_call_pre_accept(call_id, sdp_answer)
        logger.info("Sent pre_accept for call_id=%s", call_id)

        _send_call_accept(call_id, sdp_answer)
        logger.info("Sent accept for call_id=%s", call_id)

    except (ValueError, RuntimeError, TimeoutError) as e:
        # Remove from processed set on failure so we can retry
        _processed_call_ids.discard(call_id)
        return error_response(str(e))
    else:
        return success_response(message="Call accepted")


def _generate_sdp_answer(call_id: str, sdp_offer: str) -> str:
    """Generate SDP answer from SDP offer.

    Args:
        call_id: The call ID.
        sdp_offer: The SDP offer string.

    Returns:
        The SDP answer string.

    Raises:
        ValueError: If SDP answer generation fails.
        RuntimeError: If there's a runtime error.
        TimeoutError: If the operation times out.
    """
    try:
        loop = _get_call_loop()
        # Run the setup coroutine in the background thread loop
        # This keeps the PC alive on that loop
        future = asyncio.run_coroutine_threadsafe(
            _create_and_configure_pc(call_id, sdp_offer), loop
        )
        # Wait for the result (pc, sdp_answer) - sync wait here is fine as it's quick
        _, sdp_answer = future.result(timeout=10)  # 10s timeout safety
    except TimeoutError as exc:
        logger.exception("Timeout generating SDP answer")
        error_msg = "Failed to generate SDP answer: timeout"
        raise TimeoutError(error_msg) from exc
    except (ValueError, RuntimeError) as exc:
        logger.exception("Failed to generate SDP answer")
        error_msg = f"Failed to generate SDP answer: {exc}"
        raise ValueError(error_msg) from exc
    else:
        return sdp_answer


def _handle_call_terminate(call: dict) -> ResponseReturnValue:
    """Handle call terminate event.

    Args:
        call: The call object from the event.

    Returns:
        Response after processing the terminate event.
    """
    call_id = call.get("id")
    status = call.get("status", "")
    logger.info("Call terminated: call_id=%s, status=%s", call_id, status)

    # Cleanup active call resources
    if call_id in _active_calls:
        logger.info("Cleaning up resources for call_id=%s", call_id)
        pc = _active_calls.pop(call_id)
        loop = _get_call_loop()
        asyncio.run_coroutine_threadsafe(pc.close(), loop)

    # Remove from processed set when call terminates
    if call_id:
        _processed_call_ids.discard(call_id)
    return success_response(message="Call terminated")


def _process_call_event(value: dict) -> ResponseReturnValue:
    """Process incoming call event from WhatsApp.

    Args:
        value: The value object containing calls data.

    Returns:
        Response after processing the call event.
    """
    calls = value.get("calls", [])
    if not calls:
        logger.debug("No calls found in call event payload")
        return success_response(message="No calls to process")

    call = calls[0]
    event = call.get("event")
    call_id = call.get("id")
    from_number = call.get("from")

    logger.info(
        "Call event received: event=%s, call_id=%s, from=%s",
        event,
        call_id,
        from_number,
    )

    if event == "connect":
        return _handle_call_connect(call)

    if event == "terminate":
        return _handle_call_terminate(call)

    logger.debug("Unhandled call event: event=%s", event)
    return success_response(message=f"Unhandled call event: {event}")


async def wait_for_ice_complete(pc: RTCPeerConnection) -> None:
    """Wait for ICE gathering to complete."""
    if pc.iceGatheringState == "complete":
        return

    fut = asyncio.get_running_loop().create_future()

    @pc.on("icegatheringstatechange")
    def on_state_change() -> None:
        if pc.iceGatheringState == "complete" and not fut.done():
            fut.set_result(True)

    await fut


def _raise_sdp_generation_error() -> None:
    """Raise error for failed SDP generation.

    Raises:
        ValueError: Always raised to indicate SDP generation failure.
    """
    error_msg = "Failed to generate SDP answer"
    raise ValueError(error_msg)


def _sanitize_whatsapp_sdp(sdp: str) -> str:
    """Sanitize SDP for WhatsApp requirements.

    WhatsApp requires:
    1. a=fingerprint:SHA-256 ... (uppercase SHA-256)
    2. No other fingerprint algorithms (sha-384, sha-512)
    """
    out = []
    for line in sdp.splitlines():
        if line.startswith("a=fingerprint:"):
            # keep only SHA-256 and normalize casing
            if line.lower().startswith("a=fingerprint:sha-256 "):
                hash_part = line.split(" ", 1)[1]
                out.append(f"a=fingerprint:SHA-256 {hash_part}")
            # drop sha-384 / sha-512 etc
            continue
        out.append(line)
    return "\r\n".join(out) + "\r\n"


async def _create_and_configure_pc(call_id: str, sdp_offer: str) -> tuple[Any, str]:
    """Create and configure RTCPeerConnection for a call.

    Args:
        call_id: The call ID.
        sdp_offer: The SDP offer string.

    Returns:
        Tuple of (RTCPeerConnection, sdp_answer_string).

    Raises:
        ImportError: If aiortc is not installed.
        ValueError: If SDP answer generation fails.
    """
    if not AIORTC_AVAILABLE:
        error_msg = "aiortc is not installed. Install it with: uv pip install aiortc"
        logger.exception(error_msg)
        raise ImportError(error_msg)

    pc = RTCPeerConnection()
    _active_calls[call_id] = pc

    try:
        # Add a generated audio track (beep) to make the call 2-way
        # This confirms audio is flowing Bot -> User
        track = RoboticHelloTrack()
        pc.addTrack(track)

        # Set remote description (SDP offer from WhatsApp)
        await pc.setRemoteDescription(RTCSessionDescription(sdp_offer, "offer"))

        # Create answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        # Wait for ICE gathering to complete so candidates are included in SDP
        await wait_for_ice_complete(pc)

        sdp_answer = pc.localDescription.sdp
        if not sdp_answer:
            _raise_sdp_generation_error()

        # Sanitize SDP for WhatsApp
        sdp_answer = _sanitize_whatsapp_sdp(sdp_answer)

        logger.info("Generated SDP answer successfully for call_id=%s", call_id)
    except Exception:
        # Cleanup if setup fails
        logger.exception("Failed to setup call %s", call_id)
        await pc.close()
        _active_calls.pop(call_id, None)
        raise


def _send_call_pre_accept(call_id: str, sdp_answer: str) -> None:
    """Send pre_accept action for a call.

    Args:
        call_id: The call ID.
        sdp_answer: The SDP answer string.
    """
    client = _get_whatsapp_client()
    client.calls.pre_accept(call_id=call_id, sdp_answer=sdp_answer)


def _send_call_accept(call_id: str, sdp_answer: str) -> None:
    """Send accept action for a call.

    Args:
        call_id: The call ID.
        sdp_answer: The SDP answer string.
    """
    client = _get_whatsapp_client()
    client.calls.accept(call_id=call_id, sdp_answer=sdp_answer)


@webhook_bp.route("/whatsapp-incoming", methods=["GET", "POST"])
def whatsapp_incoming() -> ResponseReturnValue:
    """Handle incoming messages from Meta WhatsApp Cloud API.

    GET: Webhook verification (Meta sends verification challenge)
    POST: Processes text and interactive list messages, creates a custom payload,
          and forwards to /webhook. List selections are sent as text commands.
    """
    if request.method == "GET":
        return _handle_webhook_verification()

    # POST method - handle incoming messages
    try:
        data: dict = request.get_json()
        return _process_meta_message(data)
    except Exception:
        logger.exception("Error processing Meta webhook")
        return error_response("Error processing Meta webhook")
