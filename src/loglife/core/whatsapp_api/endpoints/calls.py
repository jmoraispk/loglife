"""Calls API endpoint."""

from typing import Any

from loglife.core.whatsapp_api.http import HttpClient


class CallsAPI:
    """API for handling WhatsApp calls."""

    def __init__(self, http: HttpClient, phone_number_id: str) -> None:
        """Initialize Calls API.

        Args:
            http: HTTP client instance.
            phone_number_id: WhatsApp Business phone number ID.
        """
        self._http = http
        self._phone_number_id = phone_number_id

    def pre_accept(
        self,
        *,
        call_id: str,
        sdp_answer: str,
    ) -> dict[str, Any]:
        """Send pre_accept action for a call.

        Args:
            call_id: The call ID.
            sdp_answer: The SDP answer string.

        Returns:
            Response JSON data.

        Raises:
            WhatsAppHTTPError: For HTTP errors.
            WhatsAppRequestError: For network/timeout errors.
        """
        path = f"/{self._phone_number_id}/calls"
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "call_id": call_id,
            "action": "pre_accept",
            "session": {
                "sdp_type": "answer",
                "sdp": sdp_answer,
            },
        }

        return self._http.request("POST", path, json=payload)

    def accept(
        self,
        *,
        call_id: str,
        sdp_answer: str,
    ) -> dict[str, Any]:
        """Send accept action for a call.

        Args:
            call_id: The call ID.
            sdp_answer: The SDP answer string.

        Returns:
            Response JSON data.

        Raises:
            WhatsAppHTTPError: For HTTP errors.
            WhatsAppRequestError: For network/timeout errors.
        """
        path = f"/{self._phone_number_id}/calls"
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "call_id": call_id,
            "action": "accept",
            "session": {
                "sdp_type": "answer",
                "sdp": sdp_answer,
            },
        }

        return self._http.request("POST", path, json=payload)

