import pytest
import sqlite3
from flask import Flask
from app.logic import process_message

@pytest.fixture(autouse=True, scope="function")
def test_db(monkeypatch):
    """Create an isolated test database for each test function.
    
    This fixture automatically runs for each test function and provides
    a clean, in-memory SQLite database. It sets up the database schema
    and creates a Flask application context to ensure proper database
    connection handling during tests.
    
    Args:
        monkeypatch: Pytest fixture for patching objects during tests
        
    Yields:
        sqlite3.Connection: Database connection for the test
    """
    # Create in-memory DB
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row

    # Load schema
    with open("db/schema.sql", "r") as f:
        conn.executescript(f.read())

    # Create a test Flask app
    app = Flask(__name__)

    # Set up application context for tests
    with app.app_context():
        # Set the Flask g object to use our test connection
        from flask import g
        g.db = conn
        
        yield conn
    
    conn.close()