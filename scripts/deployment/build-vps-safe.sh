#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if command -v systemd-run >/dev/null 2>&1; then
  UNIT="sole-build-$(date +%s)"
  systemd-run \
    --quiet \
    --wait \
    --collect \
    --unit="$UNIT" \
    --working-directory="$ROOT" \
    --property=CPUQuota="${SOLE_BUILD_CPU_QUOTA:-50%}" \
    --property=CPUWeight=10 \
    --property=MemoryHigh="${SOLE_BUILD_MEMORY_HIGH:-420M}" \
    --property=MemoryMax="${SOLE_BUILD_MEMORY_MAX:-520M}" \
    --property=MemorySwapMax="${SOLE_BUILD_SWAP_MAX:-768M}" \
    --property=TasksMax=128 \
    --property=Nice=15 \
    /usr/bin/env node scripts/deployment/build-node-server.mjs
else
  echo "WARN: systemd-run unavailable; building without cgroup limits."
  node scripts/deployment/build-node-server.mjs
fi
