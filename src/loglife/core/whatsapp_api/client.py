"""WhatsApp API client."""

from .endpoints.calls import CallsAPI
from .endpoints.messages import MessagesAPI
from .http import HttpClient


class WhatsAppClient:
    """Main client for interacting with WhatsApp Business API."""

    def __init__(  # noqa: PLR0913
        self,
        *,
        access_token: str,
        phone_number_id: str,
        base_url: str = "https://graph.facebook.com/v24.0",
        timeout: float = 15.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        """Initialize WhatsApp client.

        Args:
            access_token: WhatsApp Business API access token.
            phone_number_id: WhatsApp Business phone number ID.
            base_url: Base URL for the API. Defaults to v20.0.
            timeout: Request timeout in seconds. Defaults to 15.0.
            max_retries: Maximum number of retry attempts. Defaults to 3.
            backoff_factor: Backoff factor for retries. Defaults to 0.5.
        """
        self._http = HttpClient(
            base_url=base_url,
            access_token=access_token,
            timeout=timeout,
            max_retries=max_retries,
            backoff_factor=backoff_factor,
        )
        self.messages = MessagesAPI(self._http, phone_number_id)
        self.calls = CallsAPI(self._http, phone_number_id)
