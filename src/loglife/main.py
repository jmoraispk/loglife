"""Flask entry point for the LogLife backend."""

import logging
import os

from loglife.app import create_app

app = create_app()
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))  # default for dev
    logger.info("🚀 App running at http://127.0.0.1:%s", port)
    app.run(port=port)
