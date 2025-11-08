# WhatsApp Client Documentation

> **Runtime:** Node.js
> **Library:** `whatsapp-web.js`

---

## Overview

This WhatsApp client bridges WhatsApp to the Life Bot backend. It provides two main functions:

1. **Message Relay**: Listens for incoming WhatsApp messages (text, audio, VCARD), downloads audio media when needed, forwards to the Python backend `/process` endpoint, and replies to the user with the backend's response.
2. **Automated Messaging API**: Exposes HTTP endpoints to send WhatsApp messages programmatically (used by the referral system and audio journaling status updates).

---

## Architecture

- `whatsapp-web.js` for WhatsApp Web automation
- `express` for HTTP server and API endpoints
- `node-fetch` to call the Python backend
- `dotenv` for environment configuration
- `LocalAuth` session persisting QR-auth on disk
- `qrcode-terminal` for QR code display in terminal

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

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `PY_BACKEND_URL` | none | Yes | Backend endpoint for message processing |
| `PORT` | `3000` | No | Express server port |
| `KEEPALIVE_MS` | `120000` | No | Connection keep-alive interval (ms) |

---

## Running

Start the client:
```sh
node index.js
```

- On first run, a QR code appears in the terminal. Scan it with your WhatsApp app (Linked devices) to authenticate.
- Session is stored locally via `LocalAuth` so subsequent runs won’t require scanning again.

To force a fresh QR login, clear the session:
```sh
node index.js --reset-session
```

---

## How It Works

### Message Relay (Incoming)

1. Subscribe to WhatsApp `message` events
2. **Extract phone number:** Remove `@c.us` suffix from `msg.from` (e.g., `923325727426@c.us` → `923325727426`)
3. **Build payload:** Include `from`, `message`, and `messageType` (e.g., `chat`, `ptt`, `audio`)
4. **Audio detection:** Check if `msg.hasMedia` and `msg.type` is `ptt` or `audio`
   - Download media using `msg.downloadMedia()`
   - Extract audio data (base64), mimetype, duration, filename
   - Add to payload as `audio` object
5. Forward to backend `/process` endpoint (see payload examples below)
6. **Error handling:** Check response status → Send user-friendly error if backend fails
7. Receive backend response
8. Send reply back to WhatsApp chat (using original `msg.from` with `@c.us` suffix)

**Payload Examples:**

Text/VCARD message:
```json
{
  "from": "923325727426",
  "message": "goals",
  "messageType": "chat"
}
```

Audio message:
```json
{
  "from": "923325727426",
  "message": null,
  "messageType": "ptt",
  "audio": {
    "mimetype": "audio/ogg; codecs=opus",
    "filename": null,
    "data": "<base64 encoded audio>",
    "filesize": 15840,
    "duration": 15,
    "isVoiceNote": true
  }
}
```

### API Endpoints (Outgoing)

#### POST `/send-message`

Send WhatsApp messages programmatically.

**Request:**
```json
{
  "number": "923325727426",
  "message": "Welcome to Life Bot! ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "to": "923325727426@c.us"
}
```

**Features:**

- **Auto phone formatting:** Adds `@c.us` suffix automatically if not present (outgoing only)
- Client readiness check
- Retry on frame detachment
- **Number format:** Expects full phone number with country code (e.g., `923325727426`)

**Notes:** 
- Incoming messages have `@c.us` removed before forwarding to backend
- Outgoing messages have `@c.us` added automatically
- Phone numbers must include country code (no automatic country code addition)
- Used for status updates during audio transcription/summarization

#### GET `/health`

Monitor client status.

**Response:**
```json
{
  "status": "OK",
  "whatsappReady": true,
  "state": "CONNECTED",
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

---

## Message Types

The client handles three types of incoming messages:

| Type | `messageType` | Description | Has Media |
|------|---------------|-------------|-----------|
| **Text** | `chat` | Regular text messages | No |
| **Voice Note** | `ptt` | Push-to-talk voice recordings | Yes |
| **Audio File** | `audio` | Audio file attachments | Yes |
| **Contact** | `vcard` | Contact sharing (VCARD format) | No |

**Audio Processing:**
- Automatically detects voice notes (`ptt`) and audio files (`audio`)
- Downloads media using `whatsapp-web.js` `downloadMedia()` method
- Encodes audio as base64 for transmission to backend
- Includes metadata: mimetype, duration, filesize, filename
- Identifies voice notes with `isVoiceNote: true`

---

## Error Handling

**Backend Response Errors:**
- Checks HTTP response status from backend
- Logs error details (status code, response text up to 500 chars)
- Sends user-friendly message: "Sorry, I encountered an error processing your message. Please try again."

**Media Download Errors:**
- Catches and logs media download failures
- Continues processing without audio data
- Backend handles missing audio gracefully

**General Errors:**
- Catches all fetch/network errors
- Logs to console for debugging
- Sends fallback error message to user
- Prevents client crash on individual message failures