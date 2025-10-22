# WhatsApp Client Documentation

> **Runtime:** Node.js
> **Library:** `whatsapp-web.js`

---

## Overview

This WhatsApp client bridges WhatsApp to the Life Bot backend. It listens for incoming WhatsApp messages, forwards them to the Python backend `/process` endpoint, and replies to the user with the backend's response.

---

## Architecture

- `whatsapp-web.js` for WhatsApp Web automation
- `node-fetch` to call the Python backend
- `dotenv` for environment configuration
- `LocalAuth` session persisting QR-auth on disk

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
```

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

- Subscribes to `message` events from WhatsApp
- Sends the received message and sender to the backend:
  - Body: `{ message: <text>, from: <whatsapp-number-or-chat-id> }`
- Forwards backend response back to the same chat

Key file: `whatsapp-client/index.js`.

---

## Environment & Configuration

- **PY_BACKEND_URL**: Full URL of the Python backend `/process` endpoint
- Puppeteer runs headless with `--no-sandbox --disable-setuid-sandbox` (tuned for Linux servers)
- Session path managed by `whatsapp-web.js` LocalAuth (`clientId: "goal-bot-session"`)

---

## Troubleshooting

- QR not showing properly: enlarge your terminal or use a different terminal emulator.
- Session/auth issues: run with `--reset-session` to clear and rescan.
- Backend not responding: verify the backend is running at `PY_BACKEND_URL` and reachable from the machine.
- Puppeteer errors on Linux: ensure dependencies for Chromium are installed or run Chrome/Chromium via environment configuration.