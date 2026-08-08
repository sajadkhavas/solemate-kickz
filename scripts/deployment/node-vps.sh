#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE="$ROOT/.runtime/node/bin/node"
REQUIRED="v22.23.1"

[[ -x "$NODE" ]] || {
  echo "ERROR: Local Node is missing. Run scripts/deployment/bootstrap-node-vps.sh first." >&2
  exit 1
}

ACTUAL="$($NODE -v)"
[[ "$ACTUAL" == "$REQUIRED" ]] || {
  echo "ERROR: Local Node must be $REQUIRED; found $ACTUAL." >&2
  exit 1
}

exec "$NODE" "$@"
