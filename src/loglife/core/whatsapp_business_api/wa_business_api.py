"""WhatsApp Business API client.

Consolidated client with HTTP handling, exceptions, and message sending capabilities.
"""

import time
from dataclasses import dataclass
from typing import Any

import requests

from .buttons import (
    ListSection,
    ReplyButton,
    URLButton,
)

# Constants
HTTP_BAD_REQUEST = 400
_MAX_RETRIES_EXCEEDED_MSG = "Max retries exceeded"

MAX_BUTTONS = 3
MIN_BUTTONS = 1
MAX_LIST_SECTIONS = 10
MAX_LIST_ROWS_TOTAL = 10
MAX_LIST_BUTTON_TEXT_LENGTH = 20
MAX_LIST_HEADER_TEXT_LENGTH = 60
MAX_LIST_FOOTER_TEXT_LENGTH = 60
MAX_LIST_BODY_TEXT_LENGTH = 1024


# --- Exceptions ---


class WhatsAppSDKError(Exception):
    """Base error for the SDK."""


class WhatsAppHTTPError(WhatsAppSDKError):
    """HTTP error from WhatsApp API."""

    def __init__(self, status_code: int, message: str, details: dict | None = None) -> None:
        """Initialize HTTP error.

        Args:
            status_code: HTTP status code.
            message: Error message.
            details: Optional error details dictionary.
        """
        super().__init__(f"HTTP {status_code}: {message}")
        self.status_code = status_code
        self.details = details or {}


class WhatsAppRequestError(WhatsAppSDKError):
    """Network/timeout/etc."""


@dataclass
class HTTPConfig:
    """Configuration for HTTP client."""

    timeout: float = 15.0
    max_retries: int = 3
    backoff_factor: float = 0.5


# --- HTTP Client ---


class HttpClient:
    """HTTP client with retry logic and error handling."""

    def __init__(
        self,
        base_url: str,
        access_token: str,
        config: HTTPConfig | None = None,
        session: requests.Session | None = None,
    ) -> None:
        """Initialize HTTP client.

        Args:
            base_url: Base URL for API requests.
            access_token: Bearer token for authentication.
            config: Optional HTTP configuration.
            session: Optional requests session. Creates new if None.
        """
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token
        self.config = config or HTTPConfig()
        self.session = session or requests.Session()

    def request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        """Make HTTP request with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: API endpoint path.
            json: Optional JSON payload.
            params: Optional query parameters.

        Returns:
            Response JSON data.

        Raises:
            WhatsAppHTTPError: For HTTP errors (status >= 400).
            WhatsAppRequestError: For network/timeout errors.
        """
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        for attempt in range(self.config.max_retries + 1):
            try:
                resp = self.session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json,
                    params=params,
                    timeout=self.config.timeout,
                )
            except (requests.Timeout, requests.ConnectionError) as e:
                if attempt < self.config.max_retries:
                    time.sleep(self.config.backoff_factor * (2**attempt))
                    continue
                error_msg = f"Network error: {e}"
                raise WhatsAppRequestError(error_msg) from e

            if resp.status_code >= HTTP_BAD_REQUEST:
                try:
                    data = resp.json()
                except (ValueError, requests.JSONDecodeError):
                    data = {"raw": resp.text}
                msg = data.get("error", {}).get("message", "Request failed")
                raise WhatsAppHTTPError(resp.status_code, msg, data)

            return resp.json()

        # This should never be reached, but satisfies RET503
        raise WhatsAppRequestError(_MAX_RETRIES_EXCEEDED_MSG)


# --- Response Models ---


@dataclass(frozen=True)
class SendTextResponse:
    """Response from sending a text message."""

    message_id: str


# --- WhatsApp Client ---


class WhatsAppClient:
    """Main client for interacting with WhatsApp Business API."""

    def __init__(
        self,
        *,
        access_token: str,
        phone_number_id: str,
        base_url: str = "https://graph.facebook.com/v24.0",
        http_config: HTTPConfig | None = None,
    ) -> None:
        """Initialize WhatsApp client.

        Args:
            access_token: WhatsApp Business API access token.
            phone_number_id: WhatsApp Business phone number ID.
            base_url: Base URL for the API. Defaults to v24.0.
            http_config: Optional HTTP configuration (timeout, retries, etc.).
        """
        self._http = HttpClient(
            base_url=base_url,
            access_token=access_token,
            config=http_config,
        )
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

    def send_list(
        self,
        *,
        to: str,
        button_text: str,
        body: str,
        sections: list[ListSection],
        options: dict[str, str] | None = None,
    ) -> SendTextResponse:
        """Send an interactive list message.

        Args:
            to: Recipient phone number.
            button_text: Text displayed on the action button (max 20 characters).
            body: Message body text (max 1024 characters).
            sections: List of sections (max 10 sections, max 10 total rows across all sections).
            options: Optional dictionary containing 'header' and 'footer' text.

        Returns:
            SendTextResponse with message ID.

        Raises:
            ValueError: If validation fails (sections count, rows count, or text length limits).
        """
        options = options or {}
        header = options.get("header")
        footer = options.get("footer")

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

    def send_cta_url(
        self,
        *,
        to: str,
        body: str,
        button: URLButton,
    ) -> SendTextResponse:
        """Send an interactive message with a CTA URL button (simplified, body only).

        Args:
            to: Recipient phone number.
            body: Message body text (max 1024 characters).
            button: URL button with display_text and url.

        Returns:
            SendTextResponse with message ID.

        Raises:
            ValueError: If validation fails (text length limits).
        """
        # Validate body text length
        if len(body) > MAX_LIST_BODY_TEXT_LENGTH:
            msg = f"Body text must not exceed {MAX_LIST_BODY_TEXT_LENGTH} characters"
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

        data = self._http.request("POST", path, json=payload)
        msg_id = (data.get("messages") or [{}])[0].get("id", "")
        return SendTextResponse(message_id=msg_id)
