# WhatsApp Client API Reference

---

## Overview

The Node.js WhatsApp client provides HTTP endpoints for sending messages programmatically.

**Base URL:** `http://localhost:3000` (Development)

---

## Endpoints

### POST `/send-message`

Send a WhatsApp message to a specific number.

**Description:** Used for automated messaging including referral welcome messages, audio transcription status updates, and daily goal reminders.

**Request Format:**

```json
{
  "number": "923325727426",
  "message": "Welcome to LogLife! ..."
}
```

**Parameters:**

- `number` (string, required) — WhatsApp number in international format
- `message` (string, required) — Text message to send

**Example Request:**

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "923325727426",
    "message": "🎯 Daily reminder: Rate your goals for today!"
  }'
```

**Success Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "to": "923325727426@c.us"
}
```

**Error Response:**

```json
{
  "error": "WhatsApp client is not connected. Please scan QR code first.",
  "details": "Error details (if available)"
}
```

**Status Codes:**

- `200 OK` — Message sent successfully
- `400 Bad Request` — Missing number or message
- `500 Internal Server Error` — Client error or not connected
- `503 Service Unavailable` — Client not authenticated

**Used For:**

- Audio transcription status updates
- Automated referral welcome messages
- Daily goal reminders
- Programmatic messaging

---

## Authentication

The WhatsApp Client requires authentication via QR code on first run:

1. Start the client: `node index.js`
2. QR code appears in terminal
3. Scan with WhatsApp app (Settings → Linked Devices)
4. Session is stored locally for future use

**Reset Session:**

```bash
node index.js --reset-session
```

---

