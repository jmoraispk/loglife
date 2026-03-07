#!/usr/bin/env bash
set -euo pipefail

# Remove a user from LogLife/OpenClaw multi-user config via plugin endpoint.
#
# Usage:
#   bash plugin/scripts/unregister-user.sh --phone +15551234567
#
# Optional env vars:
#   OPENCLAW_API_URL (default: http://127.0.0.1:18789)
#   OPENCLAW_API_KEY (default: test-key-for-local-dev)

PHONE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phone)
      PHONE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$PHONE" ]]; then
  echo "Missing required option: --phone"
  exit 1
fi

OPENCLAW_API_URL="${OPENCLAW_API_URL:-http://127.0.0.1:18789}"
OPENCLAW_API_KEY="${OPENCLAW_API_KEY:-test-key-for-local-dev}"

echo "Unregistering $PHONE ..."
curl -sS -X POST "$OPENCLAW_API_URL/loglife/unregister" \
  -H "Authorization: Bearer $OPENCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}"
echo
