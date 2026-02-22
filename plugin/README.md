# LogLife Plugin for OpenClaw

Exposes session data over HTTP so the LogLife dashboard (hosted on Vercel) can display it. The plugin runs inside the OpenClaw gateway process — no separate service needed.

## Setup from scratch

### 1. Install OpenClaw

```bash
git clone https://github.com/openclaw/openclaw.git ~/openclaw
cd ~/openclaw
pnpm install
pnpm build
```

### 2. Install the plugin

```bash
cd ~/openclaw
./openclaw.mjs plugins install /path/to/loglife/plugin --link
```

This registers the plugin in your OpenClaw config and loads it directly from the repo (no copy). Updates arrive via `git pull`.

### 3. Set the API key

Generate a key and store it in your OpenClaw config:

```bash
cd ~/openclaw
./openclaw.mjs config set plugins.entries.loglife.config.apiKey "$(openssl rand -hex 32)"
```

Note the key — you'll need it for the website in step 5.

To see the current key:

```bash
cat ~/.openclaw/openclaw.json | grep apiKey
```

### 4. Start the gateway

```bash
cd ~/openclaw

# Foreground (development):
./openclaw.mjs gateway --allow-unconfigured

# Or as a background service (production):
./openclaw.mjs gateway install
./openclaw.mjs gateway start
```

Verify the plugin loaded by testing the endpoint:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:18789/loglife/sessions?sessionId=test"
```

You should get a JSON response (either session data or `{"error":"Session not found"}`).

### 5. Set up the website

```bash
cd loglife/website
pnpm install
```

Add the OpenClaw connection to your `.env`:

```
OPENCLAW_API_URL=http://localhost:18789
OPENCLAW_API_KEY=<the key from step 3>
```

Start the dev server:

```bash
pnpm dev
```

The dashboard at `http://localhost:3000/dashboard` will now fetch session data through the plugin.

## Production deployment

### Website (Vercel)

The website deploys to Vercel automatically on push to `main`. Set these environment variables in your Vercel project settings:

- `OPENCLAW_API_URL` — your server's public address (e.g. `https://your-server.com:18789`)
- `OPENCLAW_API_KEY` — the same key from step 3

### Plugin (server)

GitHub Actions triggers on pushes to `main` that change `plugin/**`. The workflow SSHes into the server and runs `git pull`. Restart the gateway manually afterwards:

- Send `/restart` from WhatsApp (or any connected channel)
- Or run `openclaw gateway restart` via SSH

### Config reference

The plugin accepts two config values in `openclaw.json` under `plugins.entries.loglife.config`:

| Key | Required | Default | Description |
|---|---|---|---|
| `apiKey` | Yes | — | Shared secret for authenticating dashboard requests |
| `agentId` | No | `"main"` | Which agent's sessions to serve |

See `openclaw-config.json` for a template.

## Development workflow

All development happens locally. The production server is for deployment only.

1. Run OpenClaw gateway locally (step 4 above)
2. Run the website dev server (step 5 above)
3. Edit `plugin/index.ts`, restart the local gateway, and test
4. Push to `main` when ready — Vercel deploys the website, GitHub Actions deploys the plugin
