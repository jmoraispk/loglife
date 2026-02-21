# LogLife Plugin for OpenClaw

Exposes session data over HTTP so the LogLife dashboard (hosted on Vercel) can display it.

## Install

```bash
# From the loglife repo root:
openclaw plugins install ./plugin --link
```

This registers the plugin and adds the path to your OpenClaw config. No files are copied — the plugin loads directly from the repo.

## Configure

1. Add the config include to your `openclaw.json`:

```json
{
  "$include": ["~/loglife/plugin/openclaw-config.json"]
}
```

2. Set your API key (one-time, stays out of git):

```bash
openclaw config set plugins.entries.loglife.config.apiKey "$(openssl rand -hex 32)"
```

3. Add the same key to your Vercel project settings as `OPENCLAW_API_KEY`, along with `OPENCLAW_API_URL` (your server's address, e.g. `https://your-server.com:18789`).

4. Restart the gateway:

```bash
openclaw gateway restart
```

## CI/CD

Two independent deploy paths:

- **Website** — Deploys to Vercel automatically on every push to `main`. No server involvement.
- **Plugin** — GitHub Actions triggers on pushes to `main` that change `plugin/**`. The workflow SSHes into the server and runs `git pull`. Restart the gateway manually via `/restart` in WhatsApp or `openclaw gateway restart`.

## Development

Run OpenClaw locally for development and testing. The server is production only.

```bash
# Local setup:
openclaw plugins install ./plugin --link
cd website && pnpm dev
```

Edit `plugin/index.ts`, restart your local gateway, and test. Push to `main` when ready.
