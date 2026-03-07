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

ensure_whatsapp_linking_workspace_rules() {
  local openclaw_home="$HOME/.openclaw"
  local begin_marker="<!-- LOGLIFE_LINKING_RULES:BEGIN -->"
  local end_marker="<!-- LOGLIFE_LINKING_RULES:END -->"
  local rule_block
  local updated_count=0

  rule_block="$(cat <<'EOF'
<!-- LOGLIFE_LINKING_RULES:BEGIN -->
## WhatsApp Linking Codes (LogLife)

Treat `LF-####` messages as linking handshakes, not conversation.

- If inbound text is exactly `LF-` followed by 4 digits, respond with exactly `NO_REPLY`.
- Do not ask what the code means.
- Do not store linking-code messages in long-term memory notes.
- Resume normal behavior on the next non-linking message.
<!-- LOGLIFE_LINKING_RULES:END -->
EOF
)"

  if ! command -v python3 >/dev/null 2>&1; then
    echo "  Skipped workspace AGENTS rule sync (python3 not found)."
    return 0
  fi

  # Update all known OpenClaw workspace variants (default + per-agent workspaces).
  for workspace_dir in "$openclaw_home/workspace" "$openclaw_home"/workspace-*; do
    [[ -d "$workspace_dir" ]] || continue
    local agents_file="$workspace_dir/AGENTS.md"

    if [[ ! -f "$agents_file" ]]; then
      printf "# AGENTS.md\n\n%s\n" "$rule_block" > "$agents_file"
      updated_count=$((updated_count + 1))
      continue
    fi

    BEGIN_MARKER="$begin_marker" END_MARKER="$end_marker" RULE_BLOCK="$rule_block" \
      python3 - "$agents_file" <<'PY'
import os
import re
import sys

path = sys.argv[1]
begin = os.environ["BEGIN_MARKER"]
end = os.environ["END_MARKER"]
block = os.environ["RULE_BLOCK"]

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(re.escape(begin) + r".*?" + re.escape(end), re.DOTALL)
if pattern.search(content):
    updated = pattern.sub(block, content, count=1)
else:
    sep = "\n" if content.endswith("\n") else "\n\n"
    updated = content + sep + block + "\n"

if updated != content:
    with open(path, "w", encoding="utf-8") as f:
        f.write(updated)
PY

    updated_count=$((updated_count + 1))
  done

  echo "  Synced linking rules in ${updated_count} workspace AGENTS.md file(s)."
}

# --- 1. Clone LogLife if not present ---
if [ -d "$LOGLIFE_DIR/plugin" ]; then
  echo "[1/7] LogLife repo already exists at $LOGLIFE_DIR — pulling latest..."
  git -C "$LOGLIFE_DIR" pull --ff-only 2>/dev/null || echo "  (pull skipped — may have local changes)"
else
  echo "[1/7] Cloning LogLife..."
  git clone https://github.com/jmoraispk/loglife.git "$LOGLIFE_DIR"
fi

# --- 2. Install the plugin ---
echo "[2/7] Installing LogLife plugin (--link)..."
"$OPENCLAW_BIN" plugins install "$LOGLIFE_DIR/plugin" --link

# --- 3. Generate API key if not already set ---
EXISTING_KEY=$(grep -o '"apiKey"[[:space:]]*:[[:space:]]*"[^"]*"' ~/.openclaw/openclaw.json 2>/dev/null \
  | head -1 | sed 's/.*"apiKey"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "" ]; then
  echo "[3/7] API key already configured — keeping existing key."
  API_KEY="$EXISTING_KEY"
else
  echo "[3/7] Generating new API key..."
  API_KEY=$(openssl rand -hex 32)
  "$OPENCLAW_BIN" config set plugins.entries.loglife.config.apiKey "$API_KEY"
fi

# --- 4. Wire up multi-user config include ---
echo "[4/7] Wiring multi-user config into openclaw.json..."
OPENCLAW_JSON="$HOME/.openclaw/openclaw.json"
node -e '
const fs = require("fs");
const cfgPath = process.argv[1];
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

if (!cfg["$include"]) cfg["$include"] = [];
const inc = "multi-user/generated.json";
if (!cfg["$include"].includes(inc)) cfg["$include"].push(inc);

// Let the generated config manage dmPolicy and allowFrom
if (cfg.channels?.whatsapp) {
  delete cfg.channels.whatsapp.dmPolicy;
  delete cfg.channels.whatsapp.allowFrom;
}

fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
' "$OPENCLAW_JSON"
echo "  Added \$include for multi-user/generated.json"

# --- 5. Restart the gateway ---
echo "[5/7] Syncing workspace memory rules..."
ensure_whatsapp_linking_workspace_rules

# --- 6. Restart the gateway ---
echo "[6/7] Restarting gateway..."
"$OPENCLAW_BIN" gateway restart 2>/dev/null || "$OPENCLAW_BIN" gateway start 2>/dev/null || true
sleep 5

# --- 7. Health check ---
echo "[7/7] Running health check..."
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
