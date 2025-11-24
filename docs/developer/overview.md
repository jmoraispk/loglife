# Developer Documentation

---

## Overview

Welcome to the LogLife developer documentation! This section provides technical details for developers who want to understand, deploy, or contribute to the LogLife system.

![Architecture Diagram](../figures/png/system-overview.png)

<small>_Tip: Click the image to zoom._</small>

---

## System Architecture

LogLife uses a **microservices architecture** with loosely coupled services that communicate via HTTP APIs:

### 1. Backend Service (Python Flask)

Internally monolithic service handling core business logic:

- Goal tracking and rating system
- Audio transcription and summarization
- Database management (SQLite)
- Reminder scheduling service

### 2. WhatsApp Service (Node.js)

Independent service for WhatsApp integration:

- WhatsApp Web automation
- Message relay between WhatsApp and backend
- Media download and handling
- Automated messaging API

### 3. External Services

Third-party APIs:

- **AssemblyAI** — Audio transcription
- **OpenAI GPT** — Text summarization
- **Twilio** (optional) — Production WhatsApp integration

**Communication:** Services communicate via HTTP REST APIs, enabling independent deployment and scaling.

---

## Technology Stack

**Backend:**

- Python 3.11+
- Flask
- SQLite

**WhatsApp Client:**

- Node.js
- whatsapp-web.js
- Express
- node-fetch

**AI Services:**

- AssemblyAI API
- OpenAI GPT API

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 16+
- WhatsApp account for client authentication

### Setup Steps

1. **Start the Backend:**
```bash
uv run backend/main.py
```

2. **Start the WhatsApp Client:**
```bash
cd whatsapp-client
npm install
node index.js
```

3. **Scan QR Code:** Use your WhatsApp app to scan the QR code displayed in the terminal.

---

## Development Workflow

### Testing

Run backend tests:
```bash
uv run pytest backend/tests
```

### Local Development

- Backend runs on `http://localhost:5000`
- WhatsApp Client runs on `http://localhost:3000`
- Use `/emulator` endpoint for testing without WhatsApp

---

## Documentation Sections

- **[Backend](backend.md)** — Python/Flask backend details, features, and database schema
- **[WhatsApp Client](whatsapp-client.md)** — Node.js client setup, message handling, and integration
- **[Twilio Setup](twilio-whatsapp-number-setup.md)** — Production WhatsApp number configuration

---
