#!/usr/bin/env bash
set -euo pipefail

# Restart local OpenClaw gateway after plugin code changes.
#
# Usage:
#   bash plugin/scripts/restart-local-gateway.sh
#
# Optional env vars:
#   OPENCLAW_DIR (default: ~/openclaw)
#   OPENCLAW_PORT (default: 18789)
#   OPENCLAW_LOG_PATH (default: ~/.openclaw/gateway-local.log)

OPENCLAW_DIR="${OPENCLAW_DIR:-$HOME/openclaw}"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"
OPENCLAW_LOG_PATH="${OPENCLAW_LOG_PATH:-$HOME/.openclaw/gateway-local.log}"
OPENCLAW_BIN="$OPENCLAW_DIR/openclaw.mjs"

if [[ ! -f "$OPENCLAW_BIN" ]]; then
  echo "OpenClaw binary not found at: $OPENCLAW_BIN"
  echo "Set OPENCLAW_DIR if your install is elsewhere."
  exit 1
fi

echo "Restarting local OpenClaw gateway..."

# Try service-style restart first (works if gateway service is installed).
if "$OPENCLAW_BIN" gateway restart >/dev/null 2>&1; then
  echo "Gateway restarted via service manager."
else
  # Fallback for foreground/local runs.
  "$OPENCLAW_BIN" gateway stop >/dev/null 2>&1 || true
  pkill -f "openclaw-gateway" >/dev/null 2>&1 || true
  pkill -f "openclaw.mjs gateway run" >/dev/null 2>&1 || true
  sleep 1

  mkdir -p "$(dirname "$OPENCLAW_LOG_PATH")"
  nohup "$OPENCLAW_BIN" gateway run >"$OPENCLAW_LOG_PATH" 2>&1 &
  sleep 2
  echo "Gateway started in background (fallback mode)."
fi

# Basic probe
if curl -sS "http://127.0.0.1:${OPENCLAW_PORT}/" >/dev/null 2>&1; then
  echo "Gateway is up: http://127.0.0.1:${OPENCLAW_PORT}/"
else
  echo "Gateway did not respond on port ${OPENCLAW_PORT} yet."
  echo "Check logs:"
  echo "  tail -n 80 \"$OPENCLAW_LOG_PATH\""
  exit 1
fi

echo ""
echo "Tip: after plugin edits, run this helper before testing routes."
