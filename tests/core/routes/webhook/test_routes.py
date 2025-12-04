"""Tests for webhook route."""

from unittest.mock import MagicMock, patch

import pytest
from flask import Flask
from flask.testing import FlaskClient

from loglife.core.routes.webhook import webhook_bp


@pytest.fixture
def client() -> FlaskClient:
    """Flask client fixture."""
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    with app.test_client() as client:
        yield client


@patch("loglife.core.routes.webhook.routes.enqueue_inbound_message")
def test_webhook_delegates_to_router(mock_enqueue: MagicMock, client: FlaskClient) -> None:
    """Ensure the route forwards payloads to the inbound queue."""
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
    assert response.json["message"] == ""
    mock_enqueue.assert_called_once()


@patch(
    "loglife.core.routes.webhook.routes.enqueue_inbound_message",
    side_effect=RuntimeError("boom"),
)
def test_webhook_enqueue_error(mock_enqueue: MagicMock, client: FlaskClient) -> None:
    """Errors while enqueueing should return error responses."""
    response = client.post(
        "/webhook",
        json={
            "sender": "1234567890",
            "msg_type": "unknown",
            "raw_msg": "Hello",
            "client_type": "whatsapp",
        },
    )

    assert response.status_code == 400
    assert response.json["success"] is False
    assert "boom" in response.json["message"]
    mock_enqueue.assert_called_once()


def test_webhook_error_handling(client: FlaskClient) -> None:
    """Invalid payloads should return an error."""
    response = client.post("/webhook", json={})
    assert response.status_code == 400
    assert response.json["success"] is False
