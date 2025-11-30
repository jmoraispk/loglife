"""Tests for webhook route."""

from unittest.mock import MagicMock

import pytest
from flask import Flask
from flask.testing import FlaskClient
from loglife.app.logic.router import RouterError, RouterResult
from loglife.app.routes.webhook import webhook_bp


@pytest.fixture
def client_with_router() -> tuple[FlaskClient, MagicMock]:
    """Flask client fixture with a mocked router extension."""
    app = Flask(__name__)
    router_mock: MagicMock = MagicMock()
    app.extensions["router"] = router_mock
    app.extensions["router_errors"] = (RouterError,)
    app.register_blueprint(webhook_bp)
    with app.test_client() as client:
        yield client, router_mock


def test_webhook_delegates_to_router(client_with_router: tuple[FlaskClient, MagicMock]) -> None:
    """Ensure the route forwards payloads to the router."""
    client, router = client_with_router
    router.return_value = RouterResult(message="ok", extras={"foo": "bar"})

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
    router.assert_called_once()


def test_webhook_router_error(client_with_router: tuple[FlaskClient, MagicMock]) -> None:
    """Router errors should map to HTTP 400 responses."""
    client, router = client_with_router
    router.side_effect = RouterError("boom")

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


def test_webhook_error_handling(client_with_router: tuple[FlaskClient, MagicMock]) -> None:
    """Invalid payloads should return an error."""
    client, _ = client_with_router
    response = client.post("/webhook", json={})
    assert response.status_code == 400
    assert response.json["success"] is False
