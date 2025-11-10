"""API configuration helpers.

This module centralizes configuration for external API integrations, keeping
keys and base URLs in one place.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

ASSEMBLYAI_BASE_URL: str = "https://api.assemblyai.com"
ASSEMBLYAI_HEADERS: dict[str, str] = {"authorization": os.getenv("ASSEMBLYAI_API_KEY")}