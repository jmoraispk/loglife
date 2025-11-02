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
2. Forward to backend `/process` endpoint:
   ```json
   { "message": "<text or VCARD>", "from": "<phone>" }
   ```
3. Receive backend response
4. Send reply back to WhatsApp chat

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
- Auto phone formatting (`@c.us` suffix)
- Client readiness check
- Retry on frame detachment
- Country code handling

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

### Connection Management

| Feature | Description |
|---------|-------------|
| Keep-Alive | Periodic checks every 2 minutes |
| Auto-Restart | Restart on disconnection/errors |
| Frame Recovery | Handle WhatsApp Web detachment |
| Session Persist | LocalAuth saves QR authentication |

---

## Referral System Integration

The `/send-message` endpoint enables automated onboarding:

**Flow:**
1. User shares contact → Backend detects VCARD
2. Backend extracts WAID → Calls `/send-message`
3. Client sends welcome message → New user receives onboarding
4. Backend confirms → Original user gets success message

**Configuration:**
- Backend env: `WHATSAPP_API_URL=http://localhost:3000`
- Client must be running and authenticated
- See [Backend Documentation](index.md#referral-system) for details

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| QR not showing | Enlarge terminal or use different emulator |
| Session/auth problems | Run `node index.js --reset-session` |
| Auto-disconnect | Check logs for restart attempts (keep-alive handles this) |
| "detached Frame" errors | Automatic restart; if persistent, manually restart |
| Backend not responding | Verify backend is running at `PY_BACKEND_URL` |
| Message sending fails | Check client status: `curl http://localhost:3000/health` |
| Port already in use | Change `PORT` in `.env` |
| Puppeteer errors (Linux) | Install Chromium dependencies |
| Memory issues | Monitor resources (WhatsApp Web is memory-intensive) |

### Testing Commands

**Test message sending:**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number":"923325727426","message":"Test"}'
```

**Check health:**
```bash
curl http://localhost:3000/health
```

**View logs:**
```bash
# Check console output for detailed error messages
```