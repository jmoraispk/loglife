#!/usr/bin/env bash

# Shared helpers for LogLife scripts.

resolve_openclaw_api_key() {
  if [[ -n "${OPENCLAW_API_KEY:-}" ]]; then
    printf "%s" "$OPENCLAW_API_KEY"
    return 0
  fi

  local config_path
  config_path="${OPENCLAW_CONFIG_PATH:-$HOME/.openclaw/openclaw.json}"

  if [[ ! -f "$config_path" ]]; then
    return 1
  fi

  # Prefer jq when available.
  if command -v jq >/dev/null 2>&1; then
    local key
    key="$(jq -r '.plugins.entries.loglife.config.apiKey // empty' "$config_path" 2>/dev/null || true)"
    if [[ -n "$key" ]]; then
      printf "%s" "$key"
      return 0
    fi
  fi

  # Fallback to Python (usually available in servers).
  if command -v python3 >/dev/null 2>&1; then
    local key
    key="$(python3 - "$config_path" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    key = (
        data.get("plugins", {})
            .get("entries", {})
            .get("loglife", {})
            .get("config", {})
            .get("apiKey", "")
    )
    if isinstance(key, str):
        print(key.strip())
except Exception:
    pass
PY
)"
    if [[ -n "$key" ]]; then
      printf "%s" "$key"
      return 0
    fi
  fi

  return 1
}
