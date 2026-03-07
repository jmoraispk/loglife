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

echo "Restarting local OpenClaw gateway (force local mode)..."

# Force a clean local restart. Service manager restarts can keep stale runtime state.
"$OPENCLAW_BIN" gateway stop >/dev/null 2>&1 || true
pkill -f "openclaw-gateway" >/dev/null 2>&1 || true
pkill -f "openclaw.mjs gateway run" >/dev/null 2>&1 || true
sleep 1

mkdir -p "$(dirname "$OPENCLAW_LOG_PATH")"

# Ensure gateway uses the current workspace plugin source.
"$OPENCLAW_BIN" plugins install "$HOME/loglife/plugin" --link >/dev/null 2>&1 || true

nohup "$OPENCLAW_BIN" gateway run >"$OPENCLAW_LOG_PATH" 2>&1 &
sleep 2
echo "Gateway started in background from current workspace plugin."

# Basic probe
ready="false"
for _ in {1..10}; do
  if curl -sS "http://127.0.0.1:${OPENCLAW_PORT}/" >/dev/null 2>&1; then
    ready="true"
    break
  fi
  sleep 1
done

if [[ "$ready" == "true" ]]; then
  echo "Gateway is up: http://127.0.0.1:${OPENCLAW_PORT}/"
else
  echo "Gateway did not respond on port ${OPENCLAW_PORT} yet."
  echo "Check logs:"
  echo "  tail -n 80 \"$OPENCLAW_LOG_PATH\""
  exit 1
fi

echo ""
echo "Tip: after plugin edits, run this helper before testing routes."
