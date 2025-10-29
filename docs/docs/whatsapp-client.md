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

1) Install dependencies:
```sh
cd whatsapp-client
npm install
```

2) Create `.env` in `whatsapp-client/`:
```ini
PY_BACKEND_URL=http://localhost:5000/process
PORT=3000
KEEPALIVE_MS=120000
```

Environment variables:
- `PY_BACKEND_URL`: Python backend endpoint for processing messages
- `PORT`: Port for Express server (default: 3000)
- `KEEPALIVE_MS`: Interval for connection keep-alive checks (default: 120000ms)

Optionally pin proxy/puppeteer settings as needed for your environment.

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

### Message Relay (Incoming Messages)

- Subscribes to `message` events from WhatsApp
- Sends the received message and sender to the backend:
  - Regular messages: `{ message: <text>, from: <whatsapp-number-or-chat-id> }`
  - Contact sharing: `{ message: <VCARD data>, from: <whatsapp-number-or-chat-id> }`
- Forwards backend response back to the same chat

### API Endpoints (Outgoing Messages)

The client runs an Express server exposing HTTP endpoints:

#### POST `/send-message`
Sends WhatsApp messages programmatically (used by referral system).

**Request:**
```json
{
  "number": "923325727426",
  "message": "Welcome to Life Bot! ..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "to": "923325727426@c.us"
}
```

**Response (Error):**
```json
{
  "error": "WhatsApp client is not connected. Please scan QR code first.",
  "details": "..."
}
```

**Features:**
- Automatic phone number formatting (adds `@c.us` suffix)
- Client readiness check before sending
- Automatic retry on detached frame errors
- Country code handling (adds `92` prefix if needed for 10-digit numbers)

#### GET `/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "OK",
  "whatsappReady": true,
  "state": "CONNECTED",
  "lastReadyAt": 1234567890,
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

### Connection Management

- **Keep-Alive**: Periodic checks (default: 2 minutes) monitor connection state
- **Auto-Restart**: Automatically restarts client on disconnection or errors
- **Frame Detachment Recovery**: Handles WhatsApp Web frame detachment issues

Key file: `whatsapp-client/index.js`.

---

## Environment & Configuration

### Environment Variables

- **PY_BACKEND_URL**: Full URL of the Python backend `/process` endpoint (default: none, required)
- **PORT**: Express server port for API endpoints (default: `3000`)
- **KEEPALIVE_MS**: Keep-alive check interval in milliseconds (default: `120000`)

### WhatsApp Configuration

- Puppeteer runs headless with `--no-sandbox --disable-setuid-sandbox` (tuned for Linux servers)
- Session path managed by `whatsapp-web.js` LocalAuth (`clientId: "goal-bot-session"`)
- Session data stored in `./session` directory

### Server Configuration

- Express server listens on configured PORT (default: 3000)
- JSON body parser enabled for API requests
- CORS not configured (add if needed for browser access)

---

## Integration with Referral System

The WhatsApp client's `/send-message` endpoint is used by the Python backend for automated onboarding:

1. User shares a contact with Life Bot (VCARD format)
2. Backend detects contact sharing and extracts WhatsApp ID (WAID)
3. Backend calls `POST http://localhost:3000/send-message` with:
   ```json
   {
     "number": "923325727426",
     "message": "🎯 Welcome to Life Bot! ..."
   }
   ```
4. WhatsApp client sends the welcome message to the referred contact
5. Backend confirms referral to the original user

**Configuration:**
- Backend uses `WHATSAPP_API_URL` environment variable (default: `http://localhost:3000`)
- Ensure WhatsApp client is running and authenticated before backend sends messages

---

## Troubleshooting

### WhatsApp Connection Issues

- **QR not showing properly**: Enlarge your terminal or use a different terminal emulator.
- **Session/auth issues**: Run with `--reset-session` to clear and rescan.
- **Auto-disconnect**: Keep-alive mechanism should handle this, check logs for restart attempts.
- **"detached Frame" errors**: Client automatically restarts; if persistent, restart the process.

### Backend Integration Issues

- **Backend not responding**: Verify the backend is running at `PY_BACKEND_URL` and reachable from the machine.
- **Message sending fails**: 
  - Check if WhatsApp client is ready: `curl http://localhost:3000/health`
  - Verify phone number format (should be digits only, e.g., `923325727426`)
  - Check logs for specific error messages

### System Issues

- **Puppeteer errors on Linux**: Ensure dependencies for Chromium are installed or run Chrome/Chromium via environment configuration.
- **Port already in use**: Change `PORT` in `.env` or stop conflicting process.
- **Memory issues**: WhatsApp Web can be memory-intensive; monitor system resources.

### Testing Endpoints

Test the `/send-message` endpoint:
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number":"923325727426","message":"Test message"}'
```

Check health status:
```bash
curl http://localhost:3000/health
```