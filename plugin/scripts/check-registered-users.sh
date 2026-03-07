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
#   OPENCLAW_API_KEY (default: test-key-for-local-dev)

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
OPENCLAW_API_KEY="${OPENCLAW_API_KEY:-test-key-for-local-dev}"

cmd="curl -s \"$OPENCLAW_API_URL/loglife/users\" -H \"Authorization: Bearer $OPENCLAW_API_KEY\""

if [[ "$WATCH_MODE" == "true" ]]; then
  watch -n "$INTERVAL" "$cmd"
else
  eval "$cmd"
  echo
fi
