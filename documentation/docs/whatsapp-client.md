# WhatsApp Client Documentation

> **Runtime:** Node.js
> **Library:** `whatsapp-web.js`

---

## Overview

This WhatsApp client bridges WhatsApp to the Life Bot backend. It provides two main functions:

1. **Message Relay**: Listens for incoming WhatsApp messages, forwards them to the Python backend `/process` endpoint, and replies to the user with the backend's response.
2. **Automated Messaging API**: Exposes HTTP endpoints to send WhatsApp messages programmatically (used by the referral system for automated onboarding).

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
3. Forward to backend `/process` endpoint:
   ```json
   { "message": "<text or VCARD>", "from": "<phone>" }
   ```
4. Receive backend response
5. Send reply back to WhatsApp chat (using original `msg.from` with `@c.us` suffix)

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

**Note:** 
- Incoming messages have `@c.us` removed before forwarding to backend
- Outgoing messages have `@c.us` added automatically
- Phone numbers must include country code (no automatic country code addition)

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