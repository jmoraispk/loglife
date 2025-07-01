def process_message(message: str, sender: str) -> str:
    # Placeholder logic
    if message.lower().startswith("bot:"):
        content = message[4:].strip()
        return f"✅ Received: {content}"
    return "❌ Unrecognized message"
