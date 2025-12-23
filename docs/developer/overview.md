# 👩‍💻 Developer Overview

This guide explains how to set up the LogLife development environment and run the full stack locally.

---

## 🏗️ System Architecture

LogLife is built with a microservices architecture to ensure scalability and separation of concerns:

<div align="center">
  <img src="../figures/png/system-overview.png" alt="LogLife Architecture" width="800" />
</div>

*   **Backend:** Python (Flask) handling business logic, database operations (SQLite), and AI integration.
*   **WhatsApp Client:** Node.js service using `whatsapp-web.js` to interface with the WhatsApp network.
*   **AI Services:** Integration with **AssemblyAI** (transcription) and **OpenAI** (summarization).

---

## 🛠️ Tech Stack

*   **Backend:** Python 3.11+, Flask, SQLite
*   **Client:** Node.js, whatsapp-web.js, Express
*   **AI:** OpenAI GPT-4 (or similar), AssemblyAI
*   **Tools:** `uv` (Python package manager), `pytest`, `ruff`

---

## 🏁 Getting Started

Follow these steps to set up LogLife on your local machine.

### Prerequisites

*   Python 3.11 or higher
*   Node.js 16 or higher
*   A WhatsApp account (to act as the bot)
*   API Keys for OpenAI and AssemblyAI

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jmoraispk/life-bot.git
    cd loglife
    ```

2.  **Set up the Backend:**
    ```bash
    # Install dependencies and run the backend
    uv run src/loglife/main.py
    ```

3.  **Set up the WhatsApp Client:**
    Open a new terminal window:
    ```bash
    cd whatsapp-client
    npm install
    node index.js
    ```

4.  **Connect WhatsApp:**
    *   The Node.js client will generate a QR code in the terminal.
    *   Open WhatsApp on your phone (Linked Devices) and scan the QR code.

### 🧪 Running Tests

To ensure everything is working correctly, run the backend tests:

```bash
uv run pytest tests
```
