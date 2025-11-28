"""Logging configuration for the Flask app.

Sets up console logging for development and rotating file handlers for
production access/error logs with environment-aware levels and filters.
"""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from .paths import ACCESS_LOG, ERROR_LOG, LOGS
from .settings import FLASK_ENV


def _allow_up_to_info(record: logging.LogRecord) -> bool:
    """Filter so the access handler only logs INFO-level entries (no error logs)."""
    return record.levelno <= logging.INFO


def setup_logging() -> None:
    """Set up logging for the Flask app."""
    log_level: int = logging.DEBUG if FLASK_ENV == "development" else logging.INFO

    # The global logger all other loggers inherit from.
    # Assigning it to root lets us configure the default handlers, level, etc.,
    # so every logger in the app follows those settings unless overridden.
    root = logging.getLogger()

    # Because default root logger level is WARNING, we need to set it to debug
    # and then custom handlers will block irrelevant logs automatically
    root.setLevel(logging.DEBUG)

    # Clean default handlers, so we can add our own.
    root.handlers.clear()

    # Setup for development
    if FLASK_ENV == "development":
        console: logging.StreamHandler = logging.StreamHandler()
        console.setLevel(log_level)
        console.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"),
        )
        root.addHandler(console)
        return

    # Setup for production
    # exist_ok=True tells mkdir not to raise an error if LOGS already exists.
    # It creates the directory only if needed.
    Path(LOGS).mkdir(parents=True, exist_ok=True)

    # Configure rotating access log handler for INFO-level logs
    access_handler: RotatingFileHandler = RotatingFileHandler(
        ACCESS_LOG,
        maxBytes=10 * 1024 * 1024,
        backupCount=1,
    )  # max file size 10MB, keep only 1 backup
    access_handler.setLevel(logging.INFO)
    access_handler.addFilter(
        _allow_up_to_info,
    )  # only INFO logs will be processed by the access handler
    access_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s]: %(message)s"),
    )

    # Configure rotating error log handler for ERROR-level logs
    error_handler: RotatingFileHandler = RotatingFileHandler(
        ERROR_LOG,
        maxBytes=10 * 1024 * 1024,
        backupCount=1,
    )  # max file size 10MB, keep only 1 backup
    error_handler.setLevel(
        logging.ERROR,
    )  # only ERROR logs will be processed by the error handler
    error_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s]: %(message)s"),
    )

    # root receives everything at or above INFO that is not ERROR
    root.addHandler(access_handler)

    # root also receives ERROR logs
    root.addHandler(error_handler)
