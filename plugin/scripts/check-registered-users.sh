#!/usr/bin/env bash
set -euo pipefail

# Check currently registered users via plugin endpoint.
#
# Usage:
#   bash plugin/scripts/check-registered-users.sh
#   bash plugin/scripts/check-registered-users.sh --watch
#   bash plugin/scripts/check-registered-users.sh --watch --interval 2
#
# Optional env vars:
#   OPENCLAW_API_URL (default: http://127.0.0.1:18789)
#   OPENCLAW_API_KEY (overrides auto-resolved key)
#   OPENCLAW_CONFIG_PATH (default: ~/.openclaw/openclaw.json)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=plugin/scripts/lib.sh
source "$SCRIPT_DIR/lib.sh"

WATCH_MODE="false"
INTERVAL="2"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch)
      WATCH_MODE="true"
      shift
      ;;
    --interval)
      INTERVAL="${2:-2}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

OPENCLAW_API_URL="${OPENCLAW_API_URL:-http://127.0.0.1:18789}"
if ! OPENCLAW_API_KEY="$(resolve_openclaw_api_key)"; then
  echo "Could not resolve LogLife API key."
  echo "Set OPENCLAW_API_KEY or ensure plugins.entries.loglife.config.apiKey exists in:"
  echo "  ${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"
  exit 1
fi

cmd="curl -s \"$OPENCLAW_API_URL/loglife/users\" -H \"Authorization: Bearer $OPENCLAW_API_KEY\""

if [[ "$WATCH_MODE" == "true" ]]; then
  watch -n "$INTERVAL" "$cmd"
else
  eval "$cmd"
  echo
fi
