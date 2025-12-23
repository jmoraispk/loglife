<div align="center">
  <a href="https://loglife.co">
    <img src="docs/figures/svg/logo_dark.svg" alt="LogLife Logo" width="400" style="padding: 10px;" />
  </a>
  
  **Log life. Live better.**
 
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python Version" />
    <img src="https://img.shields.io/badge/Node.js-16+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node Version" />
    <img src="https://img.shields.io/badge/WhatsApp-Supported-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp Integration" />
    <img src="https://img.shields.io/badge/Telegram-Soon...-0088CC?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Integration" />
    <img src="https://img.shields.io/badge/iMessage-Soon...-0A84FF?style=flat-square&logo=apple&logoColor=white" alt="iMessage Integration" />
  </p>
</div>

> [!IMPORTANT]
> LogLife is in a pre-alpha state, and only suitable for use by developers

## 🌿 About LogLife

**LogLife** is an audio-first, chat-native tool for people who need a frictionless way to journal and think about their lives. Living inside your favorite chat app, LogLife helps you capture daily notes, see behavior patterns, and turn those insights into steady progress.

It combines a minimalist interface with powerful backend processing to help you **Capture** thoughts instantly, **Reflect** on your day, and **Grow** by tracking your goals without the guilt.

---

## ✨ Features

*   **🎙️ Audio-First Journaling:** Just talk. Send voice notes to capture thoughts instantly. We handle the transcription and summarization so you can focus on the moment.
*   **💬 Chat-Native:** Works in your favorite chat app (**WhatsApp** today; **Telegram** and **iMessage** soon).
*   **📈 Gentle Goal Tracking:** A minimalist system to rate your days and track habits. No streaks to break, just data to learn from.
*   **🌱 Pattern Recognition:** Turn scattered thoughts into progress. Our AI spots patterns in your logs to help you reflect and grow.
*   **🔔 Calm Nudges:** Smart, low-stress reminders that encourage consistency rather than demanding attention.
*   **🤝 Frictionless Sharing:** Invite others to the journey simply by sharing a contact card.

---

## 📂 Repository Structure

This repository acts as a **Monorepo** containing three distinct components:

| Component | Path | Description |
| :--- | :--- | :--- |
| **Core Framework** | `src/loglife/core` | A reusable, unopinionated Python library for building WhatsApp bots. It handles **Threading**, **Queues**, and **Transport Adapters**. Use this if you want to build *your own* bot. |
| **Reference App** | `src/loglife/app` | The "LogLife" product (Journaling & Goal Tracking) built *on top* of the Core Framework. It implements **Business Logic**, **Database Models**, and **AI Processing**. |
| **Website** | `website/` | The Next.js landing page (loglife.co) that showcases the product and hosts blogposts. |

```text
loglife/
├── src/loglife/
│   ├── core/               # The reusable Bot Framework
│   │   ├── messaging.py    # Threading Engine (Router & Sender)
│   │   ├── transports.py   # Transport Adapters (WhatsApp/Emulator)
│   │   ├── startup.py      # App Bootstrap Logic
│   │   └── interface.py    # Public API (recv_msg, send_msg)
│   └── app/                # The Journaling App Logic
│       ├── logic/          # Business Logic (Text/Audio handlers)
│       ├── db/             # SQLite Models & Schema
│       └── services/       # Background Workers (Reminders, UI)
├── website/                # The Next.js Landing Page
└── whatsapp-client/        # The Node.js WhatsApp Bridge
```

---

## 🚀 How It Works

### The User Experience (App)
This diagram shows the high-level flow of how a user interacts with the LogLife Journaling App:

<div align="center">
  <img src="docs/figures/png/user-flow.png" alt="LogLife User Flow" width="800" />
</div>

1.  **Chat:** You interact with the bot via text or audio.
2.  **Process:** The system processes your input (transcribing audio, updating database).
3.  **Respond:** LogLife replies with confirmations, summaries, or next steps.

### The Internals (Core)
This diagram shows how the `loglife.core` library handles the threading and message queues under the hood:

<div align="center">
  <img src="docs/figures/png/system-overview.png" alt="LogLife Architecture" width="800" />
</div>

*   **Producer-Consumer Architecture:** Ensures the web server (Webhook) is never blocked by slow processing tasks.
*   **Transport Layer:** Decouples logic from the specific delivery mechanism (WhatsApp vs. Emulator).

---

## 🏁 Getting Started

Follow these steps to set up LogLife on your local machine.

### Prerequisites
*   Python 3.11+ and Node.js 16+
*   A WhatsApp account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jmoraispk/life-bot.git
    cd loglife
    ```

2.  **Configure API Keys:**
    Copy the example environment file and add your keys:
    ```bash
    cp .env.example .env
    # Edit .env to add OPENAI_API_KEY and ASSEMBLYAI_API_KEY
    ```

3.  **Run the Backend (Python):**
    ```bash
    uv run src/loglife/main.py
    ```
    *The server will start at `http://localhost:8080`.*

4.  **Run the Client (Node.js):**
    Open a new terminal window:
    ```bash
    cd whatsapp-client
    npm install && node index.js
    ```
    *Scan the QR code with your WhatsApp mobile app (Linked Devices).*

---

## 📚 Documentation

For deep dives into specific topics, check the `docs/` folder:

| Section | Description |
| :--- | :--- |
| [**User Manual**](docs/usage/overview.md) | How to use the bot (Journaling, Goals, Reminders). |
| [**Developer Guide**](docs/developer/overview.md) | Detailed Setup, Tech Stack, and Testing. |
| [**Core Architecture**](docs/core/architecture.md) | Deep dive into Threads, Queues, and Transports. |
| [**Quickstart**](docs/core/quickstart.md) | Guide to building your own custom bot. |

---

<div align="center">
  <sub>Built with 💚 for people who want to live better.</sub>
</div>
