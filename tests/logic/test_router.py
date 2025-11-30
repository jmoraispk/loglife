"""Unit tests for the central message router."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from loglife.app.logic.router import route_message
from loglife.core.messaging import Message


def _make_message(**overrides: str) -> Message:
    payload = {
        "sender": "+1234567890",
        "msg_type": "chat",
        "raw_payload": "hi",
        "client_type": "whatsapp",
    }
    payload.update(overrides)
    return Message(**payload)


@patch("loglife.app.logic.router.queue_async_message")
@patch("loglife.app.logic.router.process_text", return_value="hello back")
@patch("loglife.app.logic.router.db")
def test_route_message_existing_user(
    mock_db: MagicMock,
    _: MagicMock,
    mock_queue: MagicMock,
) -> None:
    """Route chat messages using an existing user record."""
    mock_user = MagicMock()
    mock_db.users.get_by_phone.return_value = mock_user

    route_message(_make_message())

    mock_db.users.get_by_phone.assert_called_once()
    mock_queue.assert_called_with(
        "+1234567890",
        "hello back",
        client_type="whatsapp",
        metadata={},
        attachments={},
    )


@patch("loglife.app.logic.router.queue_async_message")
@patch("loglife.app.logic.router.get_timezone_from_number", return_value="UTC")
@patch("loglife.app.logic.router.process_text", return_value="welcome")
@patch("loglife.app.logic.router.db")
def test_route_message_creates_user(
    mock_db: MagicMock,
    _: MagicMock,
    mock_timezone: MagicMock,
    mock_queue: MagicMock,
) -> None:
    """Ensure new users are created when missing."""
    mock_db.users.get_by_phone.return_value = None
    mock_user = MagicMock()
    mock_db.users.create.return_value = mock_user

    route_message(_make_message())

    mock_db.users.create.assert_called_once()
    mock_timezone.assert_called_once()
    mock_queue.assert_called_with(
        "+1234567890",
        "welcome",
        client_type="whatsapp",
        metadata={},
        attachments={},
    )


@patch("loglife.app.logic.router.queue_async_message")
@patch("loglife.app.logic.router.process_audio", return_value=("file", "done"))
@patch("loglife.app.logic.router.db")
def test_route_message_audio_with_tuple(
    mock_db: MagicMock,
    _: MagicMock,
    mock_queue: MagicMock,
) -> None:
    """Audio responses with transcript metadata should be surfaced."""
    mock_user = MagicMock()
    mock_db.users.get_by_phone.return_value = mock_user

    route_message(_make_message(msg_type="audio"))

    mock_queue.assert_called_with(
        "+1234567890",
        "done",
        client_type="whatsapp",
        metadata={},
        attachments={"transcript_file": "file"},
    )


@patch("loglife.app.logic.router.queue_async_message")
def test_route_message_unsupported_type(mock_queue: MagicMock) -> None:
    """Unsupported message types return a fallback response."""
    route_message(_make_message(msg_type="gif"))
    args, kwargs = mock_queue.call_args
    assert "Can't process" in args[1]


