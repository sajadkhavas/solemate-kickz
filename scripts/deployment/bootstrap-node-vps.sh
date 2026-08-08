#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME="$ROOT/.runtime"
VERSION="22.23.1"

case "$(uname -m)" in
  x86_64) NODE_ARCH="x64" ;;
  aarch64|arm64) NODE_ARCH="arm64" ;;
  *)
    echo "ERROR: unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

mkdir -p "$RUNTIME"
ARCHIVE="node-v${VERSION}-linux-${NODE_ARCH}.tar.xz"
BASE_URL="https://nodejs.org/dist/v${VERSION}"
TMP="$(mktemp -d "$RUNTIME/node-bootstrap.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

echo "NODE_DOWNLOAD=$BASE_URL/$ARCHIVE"
curl --fail --location --silent --show-error "$BASE_URL/$ARCHIVE" --output "$TMP/$ARCHIVE"
curl --fail --location --silent --show-error "$BASE_URL/SHASUMS256.txt" --output "$TMP/SHASUMS256.txt"

(
  cd "$TMP"
  grep "  ${ARCHIVE}$" SHASUMS256.txt | sha256sum --check --status -
) || {
  echo "ERROR: Node archive checksum verification failed." >&2
  exit 1
}

tar -xJf "$TMP/$ARCHIVE" -C "$TMP"
rm -rf "$RUNTIME/node"
mv "$TMP/node-v${VERSION}-linux-${NODE_ARCH}" "$RUNTIME/node"

NODE="$RUNTIME/node/bin/node"
[[ -x "$NODE" ]] || {
  echo "ERROR: local Node executable was not created." >&2
  exit 1
}

ACTUAL="$($NODE -v)"
[[ "$ACTUAL" == "v${VERSION}" ]] || {
  echo "ERROR: expected Node v${VERSION}, got $ACTUAL" >&2
  exit 1
}

echo "LOCAL_NODE=$ACTUAL"
echo "LOCAL_NODE_PATH=$NODE"
