import requests
import os
from app.config import OPENAI_API_URL, OPENAI_CHAT_MODEL, OPENAI_SUMMARIZATION_SYSTEM_PROMPT, OPENAI_API_KEY

def summarize_transcript(transcript: str) -> str:
    payload = {
        "model": OPENAI_CHAT_MODEL,
        "messages": [
            {"role": "developer", "content": OPENAI_SUMMARIZATION_SYSTEM_PROMPT},
            {"role": "user", "content": "Hello!"}
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }

    response = requests.post(OPENAI_API_URL, json=payload, headers=headers)

    data = response.json()

    return data["choices"][0]["message"]["content"]