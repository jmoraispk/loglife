<div align="center">
  <a href="https://loglife.co">
    <img src="docs/figures/svg/logo_dark.svg" alt="LogLife Logo" width="400" style="padding: 10px;" />
  </a>
  
  **Log life. Live better.**
 
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js Version" />
    <img src="https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node Version" />
    <img src="https://img.shields.io/badge/WhatsApp-Supported-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp Integration" />
    <img src="https://img.shields.io/badge/Telegram-Soon...-0088CC?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Integration" />
    <img src="https://img.shields.io/badge/iMessage-Soon...-0A84FF?style=flat-square&logo=apple&logoColor=white" alt="iMessage Integration" />
  </p>
</div>

> [!IMPORTANT]
> LogLife is in a pre-alpha state, and only suitable for use by developers

## 🌿 About LogLife

**LogLife** is an audio-first, chat-native tool for people who need a frictionless way to journal and think about their lives. Living inside your favorite chat app, LogLife helps you capture daily notes, see behavior patterns, and turn those insights into steady progress.

It combines a minimalist interface with powerful AI processing to help you **Capture** thoughts instantly, **Reflect** on your day, and **Grow** by tracking your goals without the guilt.

---

## ✨ Features

*   **🎙️ Audio-First Journaling:** Just talk. Send voice notes to capture thoughts instantly. We handle the transcription and summarization so you can focus on the moment.
*   **💬 Chat-Native:** Works in your favorite chat app (**WhatsApp** today; **Telegram** and **iMessage** soon).
*   **📈 Gentle Goal Tracking:** A minimalist system to rate your days and track habits. No streaks to break, just data to learn from.
*   **🌱 Pattern Recognition:** Turn scattered thoughts into progress. Our AI spots patterns in your logs to help you reflect and grow.
*   **🔔 Calm Nudges:** Smart, low-stress reminders that encourage consistency rather than demanding attention.
*   **🤝 Frictionless Sharing:** Invite others to the journey simply by sharing a contact card.

---

## 🏁 Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- [OpenClaw](https://github.com/openclaw/openclaw) (for the dashboard)

### Full development setup

#### 1. Clone the repos

```bash
git clone https://github.com/jmoraispk/loglife.git
git clone https://github.com/openclaw/openclaw.git ~/openclaw
```

#### 2. Build OpenClaw and install the plugin

```bash
cd ~/openclaw
pnpm install
pnpm build
./openclaw.mjs plugins install /path/to/loglife/plugin --link
./openclaw.mjs config set plugins.entries.loglife.config.apiKey "$(openssl rand -hex 32)"
```

#### 3. Start the OpenClaw gateway

```bash
cd ~/openclaw
./openclaw.mjs gateway --allow-unconfigured
```

#### 4. Set up and run the website

```bash
cd loglife/website
pnpm install
```

Copy `.env` and add your OpenClaw connection:

```
OPENCLAW_API_URL=http://localhost:18789
OPENCLAW_API_KEY=<your key from step 2>
```

```bash
pnpm dev
```

The site will be available at `http://localhost:3000`. The dashboard connects to the OpenClaw gateway to display session data.

### Website only (no dashboard)

If you only need the marketing site without the dashboard:

```bash
cd loglife/website
pnpm install
pnpm dev
```

### Production build

```bash
cd loglife/website
pnpm build
pnpm start
```

### Architecture

```
loglife/
├── website/     → Next.js app (Vercel) — marketing site + dashboard
├── plugin/      → OpenClaw plugin — serves session data over HTTP
├── docs/        → Mintlify documentation (docs.loglife.co)
├── multi-user/  → Multi-user infrastructure for OpenClaw
└── call_prompts/→ Voice call prompt templates
```

The website is hosted on Vercel. The plugin runs inside the OpenClaw gateway on your server. The dashboard proxies requests through Vercel to the plugin, keeping the server URL and API key private. See [`plugin/README.md`](plugin/README.md) for detailed setup and CI/CD instructions.

---

<div align="center">
  <sub>Built with 💚 for people who want to live better.</sub>
</div>
