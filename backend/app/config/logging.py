import os
import logging
from logging.handlers import RotatingFileHandler
from app.config import FLASK_ENV, LOGS, ACCESS_LOG, ERROR_LOG

def allow_up_to_info(record):
    return record.levelno <= logging.INFO

def setup_logging():
    log_level = logging.DEBUG if FLASK_ENV == "development" else logging.INFO

    root = logging.getLogger()
    werkzeug = logging.getLogger("werkzeug")

    # Because default root logger level is WARNING, we need to set it to debug and then custom handlers will block irrelevant logs automatically
    root.setLevel(logging.DEBUG)

    # Clean defaults
    root.handlers.clear()
    werkzeug.handlers.clear()

    # Development
    if FLASK_ENV == "development":
        console = logging.StreamHandler()
        console.setLevel(log_level)
        console.setFormatter(
            logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            )
        )
        root.addHandler(console)
        werkzeug.addHandler(console)
        return

    # Production
    os.makedirs(LOGS, exist_ok=True)

    access_handler = RotatingFileHandler(
        ACCESS_LOG, maxBytes=10 * 1024 * 1024, backupCount=1
    )
    access_handler.setLevel(logging.INFO)
    # So now only info logs will be processed by the access handler
    access_handler.addFilter(allow_up_to_info)
    access_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s]: %(message)s")
    )

    error_handler = RotatingFileHandler(
        ERROR_LOG, maxBytes=10 * 1024 * 1024, backupCount=1
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s]: %(message)s")
    )

    # root receives everything at or above INFO that is not ERROR
    root.addHandler(access_handler)

    # root also receives ERROR logs
    root.addHandler(error_handler)

    # werkzeug traffic goes to access log because Werkzeug logs HTTP requests, not the app errors
    werkzeug.addHandler(access_handler)