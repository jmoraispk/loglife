# WhatsApp Client Documentation

---

## Overview

This WhatsApp client bridges WhatsApp to the Life Bot backend.

**Main functions:**

1. **Message Relay**: Listens for incoming WhatsApp messages (text, audio, VCARD), downloads audio media when needed, forwards to the Python backend, and replies to the user.
2. **Automated Messaging API**: Sends WhatsApp messages programmatically (used by the referral system and audio journaling status updates).

---

## Technology Stack

Built with Node.js using:

- `whatsapp-web.js` for WhatsApp Web automation
- `express` for HTTP server and API endpoints
- `node-fetch` to call the Python backend
- `LocalAuth` session persisting QR-auth on disk

---

## Setup

### Installation

```bash
cd whatsapp-client
npm install
```

### Environment Configuration

Create `.env` in `whatsapp-client/`:

```ini
PY_BACKEND_URL=http://localhost:5000/process
PORT=3000
KEEPALIVE_MS=120000
```

### Running

Start the client:

```sh
node index.js
```

**First run:**

- A QR code appears in the terminal
- Scan it with your WhatsApp app (Linked devices) to authenticate
- Session is stored locally so you won't need to scan again

**Reset session:**

```sh
node index.js --reset-session
```

---

## How It Works

### Incoming Messages

1. Listen for WhatsApp messages
2. Download audio media if it's a voice note
3. Forward message to backend
4. Send backend's response back to user

### Outgoing Messages

The client exposes API endpoints to send messages programmatically. See the [API Documentation](../api/overview.md) for endpoint details.

---

## Message Types

The client handles different types of messages:

| Type | Description |
|------|-------------|
| **Text** | Regular text messages |
| **Voice Note** | Push-to-talk voice recordings |
| **Audio File** | Audio file attachments |
| **Contact** | Contact sharing (VCARD format) |

**Audio handling:**

- Automatically detects voice notes and audio files
- Downloads and encodes as base64
- Forwards to backend for transcription

---

## Error Handling

The client handles errors gracefully:

- Backend failures → Sends user-friendly error message
- Media download failures → Logs error and continues
- Network errors → Sends fallback message without crashing

---
