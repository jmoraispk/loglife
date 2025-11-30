"""Tests for webhook utilities."""

from flask import Flask

from loglife.app.routes.webhook.utils import error_response, success_response


def test_success_response() -> None:
    app = Flask(__name__)
    with app.app_context():
        response, status = success_response(message="ok", foo="bar")
    assert status == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["message"] == "ok"
    assert payload["data"]["foo"] == "bar"


def test_error_response() -> None:
    app = Flask(__name__)
    with app.app_context():
        response, status = error_response("boom", status_code=418)
    assert status == 418
    payload = response.get_json()
    assert payload["success"] is False
    assert payload["message"] == "boom"
