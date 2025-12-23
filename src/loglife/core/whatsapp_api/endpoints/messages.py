"""Messages API endpoint."""

from dataclasses import dataclass
from typing import Any

from loglife.core.whatsapp_api.http import HttpClient

MAX_BUTTON_ID_LENGTH = 256
MAX_BUTTON_TITLE_LENGTH = 20
MAX_BUTTONS = 3
MIN_BUTTONS = 1
MAX_LIST_SECTIONS = 10
MAX_LIST_ROWS_TOTAL = 10
MAX_LIST_BUTTON_TEXT_LENGTH = 20
MAX_LIST_HEADER_TEXT_LENGTH = 60
MAX_LIST_FOOTER_TEXT_LENGTH = 60
MAX_LIST_BODY_TEXT_LENGTH = 1024
MAX_LIST_ROW_TITLE_LENGTH = 24
MAX_LIST_ROW_DESCRIPTION_LENGTH = 72
MAX_LIST_SECTION_TITLE_LENGTH = 24


@dataclass(frozen=True)
class SendTextResponse:
    """Response from sending a text message."""

    message_id: str


@dataclass(frozen=True)
class ReplyButton:
    """Reply button definition."""

    id: str
    title: str

    def __post_init__(self) -> None:
        """Validate button parameters."""
        if len(self.id) > MAX_BUTTON_ID_LENGTH:
            msg = f"Button ID must not exceed {MAX_BUTTON_ID_LENGTH} characters"
            raise ValueError(msg)
        if len(self.title) > MAX_BUTTON_TITLE_LENGTH:
            msg = f"Button title must not exceed {MAX_BUTTON_TITLE_LENGTH} characters"
            raise ValueError(msg)


@dataclass(frozen=True)
class ListRow:
    """List row definition for interactive list messages."""

    id: str
    title: str
    description: str | None = None

    def __post_init__(self) -> None:
        """Validate list row parameters."""
        if len(self.id) > MAX_BUTTON_ID_LENGTH:
            msg = f"Row ID must not exceed {MAX_BUTTON_ID_LENGTH} characters"
            raise ValueError(msg)
        if len(self.title) > MAX_LIST_ROW_TITLE_LENGTH:
            msg = f"Row title must not exceed {MAX_LIST_ROW_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if self.description and len(self.description) > MAX_LIST_ROW_DESCRIPTION_LENGTH:
            msg = f"Row description must not exceed {MAX_LIST_ROW_DESCRIPTION_LENGTH} characters"
            raise ValueError(msg)


@dataclass(frozen=True)
class ListSection:
    """List section definition for interactive list messages."""

    title: str
    rows: list[ListRow]

    def __post_init__(self) -> None:
        """Validate list section parameters."""
        if len(self.title) > MAX_LIST_SECTION_TITLE_LENGTH:
            msg = f"Section title must not exceed {MAX_LIST_SECTION_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if not self.rows:
            msg = "Section must have at least one row"
            raise ValueError(msg)


@dataclass(frozen=True)
class URLButton:
    """URL button definition for interactive messages."""

    display_text: str
    url: str

    def __post_init__(self) -> None:
        """Validate URL button parameters."""
        if len(self.display_text) > MAX_BUTTON_TITLE_LENGTH:
            msg = f"Display text must not exceed {MAX_BUTTON_TITLE_LENGTH} characters"
            raise ValueError(msg)
        if not self.url:
            msg = "URL is required"
            raise ValueError(msg)


class MessagesAPI:
    """API for sending WhatsApp messages."""

    def __init__(self, http: HttpClient, phone_number_id: str) -> None:
        """Initialize Messages API.

        Args:
            http: HTTP client instance.
            phone_number_id: WhatsApp Business phone number ID.
        """
        self._http = http
        self._phone_number_id = phone_number_id

    def send_text(self, *, to: str, text: str, preview_url: bool = False) -> SendTextResponse:
        """Send a text message.

        Args:
            to: Recipient phone number.
            text: Message text content.
            preview_url: Enable URL preview. Defaults to False.

        Returns:
            SendTextResponse with message ID.
        """
        path = f"/{self._phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text, "preview_url": preview_url},
        }
        data = self._http.request("POST", path, json=payload)
        msg_id = (data.get("messages") or [{}])[0].get("id", "")
        return SendTextResponse(message_id=msg_id)

    def send_reply_buttons(
        self,
        *,
        to: str,
        text: str,
        buttons: list[ReplyButton],
    ) -> SendTextResponse:
        """Send an interactive message with reply buttons.

        Args:
            to: Recipient phone number.
            text: Message body text (displayed above buttons).
            buttons: List of reply buttons (1-3 buttons allowed).

        Returns:
            SendTextResponse with message ID.

        Raises:
            ValueError: If number of buttons is not between 1 and 3.
        """
        if not MIN_BUTTONS <= len(buttons) <= MAX_BUTTONS:
            msg = f"Must provide between {MIN_BUTTONS} and {MAX_BUTTONS} buttons"
            raise ValueError(msg)

        path = f"/{self._phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": text},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {
                                "id": button.id,
                                "title": button.title,
                            },
                        }
                        for button in buttons
                    ],
                },
            },
        }
        data = self._http.request("POST", path, json=payload)
        msg_id = (data.get("messages") or [{}])[0].get("id", "")
        return SendTextResponse(message_id=msg_id)

    def send_list(  # noqa: PLR0913
        self,
        *,
        to: str,
        button_text: str,
        body: str,
        sections: list[ListSection],
        header: str | None = None,
        footer: str | None = None,
    ) -> SendTextResponse:
        """Send an interactive list message.

        Args:
            to: Recipient phone number.
            button_text: Text displayed on the action button (max 20 characters).
            body: Message body text (max 1024 characters).
            sections: List of sections (max 10 sections, max 10 total rows across all sections).
            header: Optional header text (max 60 characters). Defaults to None.
            footer: Optional footer text (max 60 characters). Defaults to None.

        Returns:
            SendTextResponse with message ID.

        Raises:
            ValueError: If validation fails (sections count, rows count, or text length limits).
        """
        # Validate sections count
        if len(sections) > MAX_LIST_SECTIONS:
            msg = f"Must provide at most {MAX_LIST_SECTIONS} sections"
            raise ValueError(msg)

        # Validate total rows count
        total_rows = sum(len(section.rows) for section in sections)
        if total_rows > MAX_LIST_ROWS_TOTAL:
            msg = f"Total rows across all sections must not exceed {MAX_LIST_ROWS_TOTAL}"
            raise ValueError(msg)

        # Validate button text length
        if len(button_text) > MAX_LIST_BUTTON_TEXT_LENGTH:
            msg = f"Button text must not exceed {MAX_LIST_BUTTON_TEXT_LENGTH} characters"
            raise ValueError(msg)

        # Validate body text length
        if len(body) > MAX_LIST_BODY_TEXT_LENGTH:
            msg = f"Body text must not exceed {MAX_LIST_BODY_TEXT_LENGTH} characters"
            raise ValueError(msg)

        # Validate header text length if provided
        if header and len(header) > MAX_LIST_HEADER_TEXT_LENGTH:
            msg = f"Header text must not exceed {MAX_LIST_HEADER_TEXT_LENGTH} characters"
            raise ValueError(msg)

        # Validate footer text length if provided
        if footer and len(footer) > MAX_LIST_FOOTER_TEXT_LENGTH:
            msg = f"Footer text must not exceed {MAX_LIST_FOOTER_TEXT_LENGTH} characters"
            raise ValueError(msg)

        path = f"/{self._phone_number_id}/messages"
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": body},
                "action": {
                    "button": button_text,
                    "sections": [
                        {
                            "title": section.title,
                            "rows": [
                                {
                                    "id": row.id,
                                    "title": row.title,
                                    **({"description": row.description} if row.description else {}),
                                }
                                for row in section.rows
                            ],
                        }
                        for section in sections
                    ],
                },
            },
        }

        # Add optional header if provided
        if header:
            payload["interactive"]["header"] = {"type": "text", "text": header}

        # Add optional footer if provided
        if footer:
            payload["interactive"]["footer"] = {"text": footer}

        data = self._http.request("POST", path, json=payload)
        msg_id = (data.get("messages") or [{}])[0].get("id", "")
        return SendTextResponse(message_id=msg_id)

    def send_url_button(
        self,
        *,
        to: str,
        body: str,
        button: URLButton,
        header: dict[str, Any] | None = None,
        footer: str | None = None,
    ) -> SendTextResponse:
        """Send an interactive message with a URL button (CTA URL).

        Args:
            to: Recipient phone number.
            body: Message body text (max 1024 characters).
            button: URL button with display_text and url.
            header: Optional header dict with type and content (text/image/video/document).
                   For text: {"type": "text", "text": "..."}
                   For image: {"type": "image", "image": {"link": "..."}}
                   For video: {"type": "video", "video": {"link": "..."}}
                   For document: {"type": "document", "document": {"link": "..."}}
            footer: Optional footer text (max 60 characters). Defaults to None.

        Returns:
            SendTextResponse with message ID.

        Raises:
            ValueError: If validation fails (text length limits).
        """
        # Validate body text length
        if len(body) > MAX_LIST_BODY_TEXT_LENGTH:
            msg = f"Body text must not exceed {MAX_LIST_BODY_TEXT_LENGTH} characters"
            raise ValueError(msg)

        # Validate footer text length if provided
        if footer and len(footer) > MAX_LIST_FOOTER_TEXT_LENGTH:
            msg = f"Footer text must not exceed {MAX_LIST_FOOTER_TEXT_LENGTH} characters"
            raise ValueError(msg)

        path = f"/{self._phone_number_id}/messages"
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "cta_url",
                "body": {"text": body},
                "action": {
                    "name": "cta_url",
                    "parameters": {
                        "display_text": button.display_text,
                        "url": button.url,
                    },
                },
            },
        }

        # Add optional header if provided
        if header:
            payload["interactive"]["header"] = header

        # Add optional footer if provided
        if footer:
            payload["interactive"]["footer"] = {"text": footer}

        data = self._http.request("POST", path, json=payload)
        msg_id = (data.get("messages") or [{}])[0].get("id", "")
        return SendTextResponse(message_id=msg_id)
