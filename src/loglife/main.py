"""Flask entry point for the LogLife backend."""

from loglife.app import create_app

app = create_app()


if __name__ == "__main__":
    app.run()
