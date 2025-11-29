"""Tests for webhook route."""

from unittest.mock import patch

import pytest
from app.routes.webhook import webhook_bp
from flask import Flask
from flask.testing import FlaskClient


@pytest.fixture
def client() -> FlaskClient:
    """Flask test client fixture."""
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    with app.test_client() as client:
        yield client


def test_webhook_text_message(client: FlaskClient) -> None:
    """Test handling a text message via webhook."""
    # Mock user lookup/creation
    with patch("app.routes.webhook.routes.get_user_by_phone_number") as mock_get_user:
        mock_get_user.return_value = {"id": 1, "phone_number": "1234567890", "timezone": "UTC"}

        with patch("app.routes.webhook.routes.process_text") as mock_process:
            mock_process.return_value = "Response message"

            response = client.post(
                "/webhook",
                json={
                    "sender": "1234567890",
                    "msg_type": "chat",
                    "raw_msg": "Hello",
                    "client_type": "whatsapp",
                },
            )

            assert response.status_code == 200
            assert response.json["success"] is True
            assert response.json["message"] == "Response message"


def test_webhook_new_user(client: FlaskClient) -> None:
    """Test handling a message from a new user."""
    with (
        patch("app.routes.webhook.routes.get_user_by_phone_number") as mock_get_user,
        patch("app.routes.webhook.routes.create_user") as mock_create_user,
        patch("app.routes.webhook.routes.process_text") as mock_process,
    ):
        mock_get_user.return_value = None
        mock_create_user.return_value = {"id": 1, "phone_number": "1234567890", "timezone": "UTC"}
        mock_process.return_value = "Welcome"

        response = client.post(
            "/webhook",
            json={
                "sender": "1234567890",
                "msg_type": "chat",
                "raw_msg": "Hello",
                "client_type": "whatsapp",
            },
        )

        assert response.status_code == 200
        mock_create_user.assert_called_once()


def test_webhook_audio_message(client: FlaskClient) -> None:
    """Test handling an audio message."""
    with (
        patch("app.routes.webhook.routes.get_user_by_phone_number") as mock_get_user,
        patch("app.routes.webhook.routes.process_audio") as mock_process,
    ):
        mock_get_user.return_value = {"id": 1}
        mock_process.return_value = "Audio processed"

        response = client.post(
            "/webhook",
            json={
                "sender": "1234567890",
                "msg_type": "audio",
                "raw_msg": "base64audio",
                "client_type": "whatsapp",
            },
        )

        assert response.status_code == 200
        assert response.json["message"] == "Audio processed"


def test_webhook_error_handling(client: FlaskClient) -> None:
    """Test error handling in webhook."""
    # Sending invalid JSON (missing fields) should raise KeyError
    response = client.post("/webhook", json={})

    # The exception is caught and error_response is called
    # error_response defaults to status_code=400
    assert response.status_code == 400
    assert response.json["success"] is False
