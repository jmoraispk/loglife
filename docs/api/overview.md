# API Documentation

---

## Overview

This documentation covers all HTTP endpoints available in the LogLife system, including the Python backend API and the WhatsApp Client API.

---

## API Components

LogLife provides two main API surfaces:

### Backend API

The Python/Flask backend handles message processing, goal tracking, and business logic.

**Key Endpoints:**

- `POST /webhook` — Process incoming messages
- `GET /emulator` — Web-based testing interface

[View Backend API Reference →](backend/index.md)

### WhatsApp Client API

The Node.js WhatsApp client enables programmatic message sending and health monitoring.

**Key Endpoint:**

- `POST /send-message` — Send messages

[View WhatsApp Client API Reference →](whatsapp-client.md)

---

## Base URLs

**Development:**

- **Backend:** `http://localhost:5000`
- **WhatsApp Client:** `http://localhost:3000`

**Note:** Both services must be running for full functionality.

---

