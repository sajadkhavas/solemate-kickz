#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME="$ROOT/.runtime"
PACKAGE_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$ROOT/package.json','utf8')).packageManager.split('@')[1]")"
BASELINE_FALLBACK_VERSION="${SOLE_BUN_BASELINE_FALLBACK_VERSION:-1.3.13}"

mkdir -p "$RUNTIME"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)
    FLAGS="$(lscpu | awk -F: '/^Flags:/ {print $2}')"
    if grep -qw avx2 <<<"$FLAGS"; then
      FLAVOR="x64"
    else
      grep -qw sse4_2 <<<"$FLAGS" || {
        echo "ERROR: CPU does not expose SSE4.2; Bun baseline is unsupported." >&2
        exit 1
      }
      FLAVOR="x64-baseline"
    fi
    ;;
  aarch64|arm64)
    FLAVOR="aarch64"
    ;;
  *)
    echo "ERROR: unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

install_bun() {
  local version="$1"
  local zip="$RUNTIME/bun-$version.zip"
  local extract="$RUNTIME/extract-$version"
  local url="https://github.com/oven-sh/bun/releases/download/bun-v${version}/bun-linux-${FLAVOR}.zip"

  rm -rf "$extract"
  mkdir -p "$extract"

  echo "BUN_DOWNLOAD=$url"
  curl --fail --location --silent --show-error "$url" --output "$zip"

  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$zip" -d "$extract"
  else
    python3 -m zipfile -e "$zip" "$extract"
  fi
  rm -f "$zip"

  local candidate="$extract/bun-linux-${FLAVOR}/bun"
  [[ -x "$candidate" ]] || return 1

  cp "$candidate" "$RUNTIME/bun"
  chmod 0755 "$RUNTIME/bun"
  rm -rf "$extract"

  "$RUNTIME/bun" --version
}

echo "BUN_PACKAGE_VERSION=$PACKAGE_VERSION"
echo "BUN_FLAVOR=$FLAVOR"

set +e
VERSION_OUTPUT="$(install_bun "$PACKAGE_VERSION" 2>&1)"
STATUS=$?
set -e

if (( STATUS != 0 )); then
  if [[ "$FLAVOR" == "x64-baseline" && "$PACKAGE_VERSION" != "$BASELINE_FALLBACK_VERSION" ]]; then
    echo "WARN: Bun $PACKAGE_VERSION baseline did not execute on this CPU."
    echo "WARN: Falling back to VPS-validated baseline $BASELINE_FALLBACK_VERSION."
    install_bun "$BASELINE_FALLBACK_VERSION" >/dev/null
  else
    printf '%s\n' "$VERSION_OUTPUT" >&2
    exit "$STATUS"
  fi
fi

echo "LOCAL_BUN=$("$RUNTIME/bun" --version)"
echo "LOCAL_BUN_PATH=$RUNTIME/bun"
