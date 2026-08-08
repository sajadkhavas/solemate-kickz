#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${SOLE_PORT:-4173}"
REQUIRED_NODE="v22.23.1"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

echo "===== SOLE VPS PREFLIGHT (READ-ONLY) ====="
echo "ROOT=$ROOT"

for command in node git curl; do
  command -v "$command" >/dev/null 2>&1 || fail "$command is required"
done

NODE_VERSION="$(node -v)"
echo "NODE=$NODE_VERSION"
[[ "$NODE_VERSION" == "$REQUIRED_NODE" ]] ||
  fail "Node $REQUIRED_NODE is required; found $NODE_VERSION"

ARCH="$(uname -m)"
echo "ARCH=$ARCH"

if [[ "$ARCH" == "x86_64" ]]; then
  FLAGS="$(lscpu | awk -F: '/^Flags:/ {print $2}')"
  grep -qw sse4_2 <<<"$FLAGS" || fail "x86_64 CPU must expose SSE4.2 for Bun baseline"
  if grep -qw avx2 <<<"$FLAGS"; then
    echo "BUN_BINARY=standard-x64"
  else
    echo "BUN_BINARY=baseline-x64"
  fi
elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  echo "BUN_BINARY=arm64"
else
  fail "Unsupported architecture: $ARCH"
fi

MEM_KB="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
MEM_MB="$((MEM_KB / 1024))"
echo "MEM_TOTAL_MB=$MEM_MB"
(( MEM_MB >= 768 )) || fail "At least 768 MiB RAM is required for safe build tooling"

FREE_KB="$(df -Pk "$ROOT" | awk 'NR==2 {print $4}')"
FREE_MB="$((FREE_KB / 1024))"
echo "DISK_FREE_MB=$FREE_MB"
(( FREE_MB >= 2048 )) || fail "At least 2 GiB free disk space is required"

if ss -lnt 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)$PORT$"; then
  fail "Port $PORT is already listening"
fi
echo "PORT_${PORT}=FREE"

if command -v systemd-run >/dev/null 2>&1; then
  echo "SYSTEMD_RUN=AVAILABLE"
else
  echo "SYSTEMD_RUN=NOT_AVAILABLE"
fi

if command -v unzip >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1; then
  echo "ZIP_EXTRACTOR=AVAILABLE"
else
  fail "unzip or python3 is required for local Bun bootstrap"
fi

echo "PREFLIGHT=PASS"
