#!/usr/bin/env bash
set -euo pipefail

# LogLife setup script
# Run this on a server where OpenClaw is already built and installed.
# Usage: bash setup.sh [--loglife-dir DIR] [--openclaw-dir DIR]

LOGLIFE_DIR="${LOGLIFE_DIR:-$HOME/loglife}"
OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/openclaw}"
OPENCLAW_BIN="$OPENCLAW_DIR/openclaw.mjs"

while [[ $# -gt 0 ]]; do
  case $1 in
    --loglife-dir) LOGLIFE_DIR="$2"; shift 2 ;;
    --openclaw-dir) OPENCLAW_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "=== LogLife Production Setup ==="
echo "  LogLife dir:  $LOGLIFE_DIR"
echo "  OpenClaw dir: $OPENCLAW_DIR"
echo ""

# --- 1. Clone LogLife if not present ---
if [ -d "$LOGLIFE_DIR/plugin" ]; then
  echo "[1/5] LogLife repo already exists at $LOGLIFE_DIR — pulling latest..."
  git -C "$LOGLIFE_DIR" pull --ff-only 2>/dev/null || echo "  (pull skipped — may have local changes)"
else
  echo "[1/5] Cloning LogLife..."
  git clone https://github.com/jmoraispk/loglife.git "$LOGLIFE_DIR"
fi

# --- 2. Install the plugin ---
echo "[2/5] Installing LogLife plugin (--link)..."
"$OPENCLAW_BIN" plugins install "$LOGLIFE_DIR/plugin" --link

# --- 3. Generate API key if not already set ---
EXISTING_KEY=$(grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' ~/.openclaw/openclaw.json 2>/dev/null \
  | head -1 | sed 's/.*"apiKey"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "" ]; then
  echo "[3/5] API key already configured — keeping existing key."
  API_KEY="$EXISTING_KEY"
else
  echo "[3/5] Generating new API key..."
  API_KEY=$(openssl rand -hex 32)
  "$OPENCLAW_BIN" config set plugins.entries.loglife.config.apiKey "$API_KEY"
fi

# --- 4. Restart the gateway ---
echo "[4/5] Restarting gateway..."
"$OPENCLAW_BIN" gateway restart 2>/dev/null || "$OPENCLAW_BIN" gateway start 2>/dev/null || true
sleep 5

# --- 5. Health check ---
echo "[5/5] Running health check..."
SESSIONS_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  "http://localhost:18789/loglife/sessions?phone=healthcheck" 2>/dev/null || echo "000")

VERIFY_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0","code":"000000"}' \
  "http://localhost:18789/loglife/verify/check" 2>/dev/null || echo "000")

if [ "$SESSIONS_STATUS" = "404" ] || [ "$SESSIONS_STATUS" = "200" ]; then
  echo "  Sessions endpoint: OK ($SESSIONS_STATUS)"
else
  echo "  Sessions endpoint: FAILED ($SESSIONS_STATUS)"
  echo "  The gateway may still be starting. Wait a moment and try:"
  echo "    curl -H 'Authorization: Bearer YOUR_KEY' http://localhost:18789/loglife/sessions?phone=test"
fi

if [ "$VERIFY_STATUS" = "200" ]; then
  echo "  Verify endpoint:   OK ($VERIFY_STATUS)"
else
  echo "  Verify endpoint:   FAILED ($VERIFY_STATUS)"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Your API key:"
echo "  $API_KEY"
echo ""
echo "Next steps:"
echo "  1. Set up Caddy reverse proxy (see docs: https://docs.loglife.co/networking)"
echo "  2. Add to Vercel environment variables:"
echo "       OPENCLAW_API_URL = https://api.yourdomain.com"
echo "       OPENCLAW_API_KEY = $API_KEY"
echo "  3. Add to GitHub Actions secrets (for CI/CD):"
echo "       SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY, LOGLIFE_API_KEY"
echo ""
