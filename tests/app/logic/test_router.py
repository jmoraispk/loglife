"""Tests for the central router logic."""

from collections.abc import Generator
from unittest.mock import MagicMock, patch

import pytest

from loglife.app.logic.router import route_message
from loglife.core.messaging import Message


@pytest.fixture
def mock_queue() -> Generator[MagicMock, None, None]:
    """Mock the outbound queue function."""
    with patch("loglife.app.logic.router.queue_async_message") as mock:
        yield mock


@pytest.fixture
def mock_db() -> Generator[MagicMock, None, None]:
    """Mock the database client."""
    with patch("loglife.app.logic.router.db") as mock:
        yield mock


@pytest.fixture
def mock_timezone() -> Generator[MagicMock, None, None]:
    """Mock timezone utility."""
    with patch("loglife.app.logic.router.get_timezone_from_number") as mock:
        yield mock


def _make_message(
    sender: str = "+123",
    msg_type: str = "chat",
    payload: str = "hi",
    client: str = "whatsapp",
) -> Message:
    return Message(sender, msg_type, payload, client)


def test_route_message_existing_user(
    mock_db: MagicMock,
    mock_queue: MagicMock,  # noqa: ARG001
    mock_timezone: MagicMock,  # noqa: ARG001
) -> None:
    """Existing users are retrieved and not re-created."""
    mock_user = MagicMock()
    mock_db.users.get_by_phone.return_value = mock_user

    msg = _make_message()
    route_message(msg)

    mock_db.users.get_by_phone.assert_called_once_with("+123")
    mock_db.users.create.assert_not_called()


def test_route_message_creates_user(
    mock_db: MagicMock,
    mock_timezone: MagicMock,
    mock_queue: MagicMock,  # noqa: ARG001
) -> None:
    """New users are created with detected timezone."""
    mock_db.users.get_by_phone.return_value = None
    mock_timezone.return_value = "UTC"

    msg = _make_message()
    route_message(msg)

    mock_db.users.create.assert_called_once_with("+123", "UTC")


def test_route_message_audio_with_tuple(
    mock_db: MagicMock,
    mock_queue: MagicMock,
) -> None:
    """Audio processor returning a tuple (file, summary) works."""
    mock_db.users.get_by_phone.return_value = MagicMock()

    with patch("loglife.app.logic.router.process_audio") as mock_proc:
        mock_proc.return_value = ("file_data", "summary text")
        route_message(_make_message(msg_type="audio"))

    # Should queue ONE message with attachments
    assert mock_queue.call_count == 1
    args, kwargs = mock_queue.call_args
    # Verify arguments (sender, response)
    assert args[1] == "summary text"
    # Verify attachments kwarg
    attachments = kwargs.get("attachments")
    assert attachments is not None
    assert attachments["transcript_file"] == "file_data"


def test_route_message_unknown_type(mock_queue: MagicMock) -> None:
    """Unsupported message types return a fallback response."""
    route_message(_make_message(msg_type="gif"))
    args, _kwargs = mock_queue.call_args
    assert "Can't process this type of message" in args[1]
    assert "Recognized types: chat, audio, ptt, vcard" in args[1]


def test_route_message_handles_processing_exception(mock_queue: MagicMock) -> None:
    """Router should catch exceptions from processors."""
    # We patch process_text to raise an exception
    with (
        patch("loglife.app.logic.router.process_text", side_effect=ValueError("Boom")),
        patch("loglife.app.logic.router.db.users.get_by_phone", return_value=MagicMock()),
    ):
        route_message(_make_message(msg_type="chat"))

    args, _ = mock_queue.call_args
    assert "Sorry, something went wrong" in args[1]
