"""Tests for webhook route."""

from unittest.mock import patch

import pytest
from flask import Flask
from flask.testing import FlaskClient
from loglife.core.routes.webhook import webhook_bp
from loglife.core.messaging import Message


@pytest.fixture
def client() -> FlaskClient:
    """Flask client fixture."""
    app = Flask(__name__)
    app.register_blueprint(webhook_bp)
    with app.test_client() as client:
        yield client


@patch("loglife.core.routes.webhook.routes.submit_message")
def test_webhook_delegates_to_router(mock_publish, client: FlaskClient) -> None:
    """Ensure the route forwards payloads to the message bus."""
    mock_publish.return_value = Message(
        sender="1234567890",
        msg_type="chat",
        raw_payload="ok",
        client_type="whatsapp",
        attachments={"foo": "bar"},
    )

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
    assert response.json["message"] == "ok"
    assert response.json["data"]["foo"] == "bar"
    mock_publish.assert_called_once()


@patch("loglife.core.routes.webhook.routes.submit_message", side_effect=RuntimeError("boom"))
def test_webhook_router_error(mock_publish, client: FlaskClient) -> None:
    """Router errors should map to HTTP 400 responses."""
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
    mock_publish.assert_called_once()


def test_webhook_error_handling(client: FlaskClient) -> None:
    """Invalid payloads should return an error."""
    response = client.post("/webhook", json={})
    assert response.status_code == 400
    assert response.json["success"] is False
