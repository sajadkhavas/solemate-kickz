#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUN="$ROOT/.runtime/bun"
HOME_DIR="$ROOT/.home"
CACHE_DIR="$ROOT/.bun-cache"

[[ -x "$BUN" ]] || {
  echo "ERROR: Run scripts/deployment/bootstrap-bun-vps.sh first." >&2
  exit 1
}

mkdir -p "$HOME_DIR" "$CACHE_DIR"
cd "$ROOT"

if command -v systemd-run >/dev/null 2>&1; then
  UNIT="sole-deps-$(date +%s)"
  systemd-run \
    --quiet \
    --wait \
    --collect \
    --unit="$UNIT" \
    --working-directory="$ROOT" \
    --property=CPUQuota="${SOLE_INSTALL_CPU_QUOTA:-40%}" \
    --property=CPUWeight=10 \
    --property=MemoryHigh="${SOLE_INSTALL_MEMORY_HIGH:-320M}" \
    --property=MemoryMax="${SOLE_INSTALL_MEMORY_MAX:-420M}" \
    --property=MemorySwapMax="${SOLE_INSTALL_SWAP_MAX:-512M}" \
    --property=TasksMax=128 \
    --property=Nice=15 \
    --setenv="HOME=$HOME_DIR" \
    --setenv="BUN_INSTALL_CACHE_DIR=$CACHE_DIR" \
    "$BUN" install --frozen-lockfile --ignore-scripts
else
  echo "WARN: systemd-run unavailable; installing without cgroup limits."
  HOME="$HOME_DIR" BUN_INSTALL_CACHE_DIR="$CACHE_DIR" \
    "$BUN" install --frozen-lockfile --ignore-scripts
fi
