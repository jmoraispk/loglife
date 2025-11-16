from flask import Flask
from app.routes import emulator_bp
from app.config import setup_logging

def create_app():
    app = Flask(__name__)

    setup_logging()

    app.register_blueprint(emulator_bp)

    return app