# Backend API Reference

---

## Overview

The Python/Flask backend provides HTTP endpoints for message processing and testing.

**Base URL:** `http://localhost:5000` (Development)

---

## Endpoints

### POST `/webhook`

Main endpoint for processing incoming messages from WhatsApp.

**Description:** Handles all incoming message types including text messages, audio messages, and VCARD contacts.

**Request Format:**

**For Text Messages:**

```json
{
  "sender": "923325727426",
  "msg_type": "chat",
  "raw_msg": "help"
}
```

**For Audio Messages:**

```json
{
  "sender": "923325727426",
  "msg_type": "audio",
  "raw_msg": "base64_encoded_audio_data"
}
```

**For VCARD Messages:**

```json
{
  "sender": "923325727426",
  "msg_type": "vcard",
  "raw_msg": "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD"
}
```

**Parameters:**

- `sender` (string, required) — WhatsApp number in international format
- `msg_type` (string, required) — Message type: "chat", "audio", "ptt", or "vcard"
- `raw_msg` (string, required) — Message content (text, base64 audio, or VCARD data)

**Success Response:**

```json
{
  "success": true,
  "message": null,
  "data": {
    "message": "📋 *Available Commands:*\n\nhelp - Show all commands\ngoals - List your goals\nadd goal [goal] - Add a new goal\nweek - Show current week summary\n..."
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Invalid payload: missing sender",
  "data": null
}
```

**Response Fields:**

- `success` (boolean) — Request processing status
- `message` (string|null) — Error message for client (not for end user)
- `data.message` (string) — Response message for end user

**Status Codes:**

- `200 OK` — Message processed successfully
- `400 Bad Request` — Invalid JSON or missing required fields

---

### GET `/`

Web-based testing interface for the bot.

**Description:** Provides a simple web UI to test bot commands without needing WhatsApp.

**Usage:** Open `http://localhost:5000/` in your browser.

**Features:**

- Send text commands
- View bot responses in real-time
- Test without WhatsApp authentication
- Useful for development and debugging

---

## Integration

The backend is designed to work with the WhatsApp Client:

1. WhatsApp Client forwards incoming messages to `/webhook`
2. Backend processes the message
3. Backend returns response text
4. WhatsApp Client sends response to user

For automated messages (reminders, status updates), the backend calls the WhatsApp Client's `/send-message` endpoint.

