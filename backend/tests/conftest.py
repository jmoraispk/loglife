"""Pytest configuration and test fixtures.

This module provides shared test fixtures and configuration for all tests,
including database setup and Flask application context management.
"""
import sqlite3
from pathlib import Path
from typing import Generator

import pytest
from flask import Flask, g

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "db" / "schema.sql"

@pytest.fixture(autouse=True, scope="function")
def test_db(monkeypatch: pytest.MonkeyPatch) -> Generator[sqlite3.Connection, None, None]:
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
    conn: sqlite3.Connection = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row

    # Load schema
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    # Create a test Flask app
    app: Flask = Flask(__name__)

    # Set up application context for tests
    with app.app_context():
        # Set the Flask g object to use our test connection
        g.db = conn
        
        yield conn
    
    conn.close()