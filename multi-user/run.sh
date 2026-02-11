#!/bin/bash
set -euo pipefail

# Multi-user convenience wrapper:
# 1. Regenerate OpenClaw config from users.json
# 2. Set up per-user auth profiles
# 3. Start the gateway

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Generating OpenClaw config from users.json..."
node --experimental-strip-types "$SCRIPT_DIR/src/generate.ts"

echo "==> Setting up per-user auth profiles..."
node --experimental-strip-types "$SCRIPT_DIR/src/auth-setup.ts"

echo "==> Starting OpenClaw gateway..."
openclaw gateway run "$@"
