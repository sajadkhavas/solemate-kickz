#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="$ROOT/.runtime/node/bin/node"
HOME_DIR="$ROOT/.home"
cd "$ROOT"

[[ -x "$NODE" ]] || {
  echo "ERROR: Run scripts/deployment/bootstrap-node-vps.sh first." >&2
  exit 1
}

[[ "$($NODE -v)" == "v22.23.1" ]] || {
  echo "ERROR: Local Node must be v22.23.1." >&2
  exit 1
}

mkdir -p "$HOME_DIR"

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
    --setenv="HOME=$HOME_DIR" \
    "$NODE" scripts/deployment/build-node-server.mjs
else
  echo "WARN: systemd-run unavailable; building without cgroup limits."
  HOME="$HOME_DIR" "$NODE" scripts/deployment/build-node-server.mjs
fi
