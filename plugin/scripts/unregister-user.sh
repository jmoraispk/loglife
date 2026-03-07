#!/usr/bin/env bash
set -euo pipefail

# Remove a user from LogLife/OpenClaw multi-user config via plugin endpoint.
#
# Usage:
#   bash plugin/scripts/unregister-user.sh --phone 15551234567
#   bash plugin/scripts/unregister-user.sh --all
#
# Optional env vars:
#   OPENCLAW_API_URL (default: http://127.0.0.1:18789)
#   OPENCLAW_API_KEY (overrides auto-resolved key)
#   OPENCLAW_CONFIG_PATH (default: ~/.openclaw/openclaw.json)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=plugin/scripts/lib.sh
source "$SCRIPT_DIR/lib.sh"

PHONE=""
REMOVE_ALL="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phone)
      PHONE="${2:-}"
      shift 2
      ;;
    --all)
      REMOVE_ALL="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ "$REMOVE_ALL" != "true" && -z "$PHONE" ]]; then
  echo "Missing required option: --phone (or use --all)"
  exit 1
fi

OPENCLAW_API_URL="${OPENCLAW_API_URL:-http://127.0.0.1:18789}"
if ! OPENCLAW_API_KEY="$(resolve_openclaw_api_key)"; then
  echo "Could not resolve LogLife API key."
  echo "Set OPENCLAW_API_KEY or ensure plugins.entries.loglife.config.apiKey exists in:"
  echo "  ${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
  exit 1
fi

if [[ "$REMOVE_ALL" == "true" ]]; then
  echo "Unregistering ALL users ..."
  payload='{"all":true}'
else
  # Accept numbers with or without + (plugin normalizes internally too).
  normalized="$(echo "$PHONE" | tr -cd '0-9')"
  echo "Unregistering +$normalized ..."
  payload="{\"phone\":\"$normalized\"}"
fi

curl -sS -X POST "$OPENCLAW_API_URL/loglife/unregister" \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$payload"
echo
