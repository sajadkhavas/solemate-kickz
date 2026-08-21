#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${SOLE_ROOT:-/var/www/sole}"
TARGET="${1:-}"
SERVICE="${SOLE_SERVICE:-sole-frontend.service}"

[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || { echo "ERROR: rollback target must be a full SHA" >&2; exit 1; }
RELEASE="$ROOT/releases/$TARGET"
[[ -f "$RELEASE/.output/server/index.mjs" ]] || { echo "ERROR: rollback release is incomplete" >&2; exit 1; }

NEXT="$ROOT/.current.$$.next"
ln -s "$RELEASE" "$NEXT"
mv -Tf "$NEXT" "$ROOT/current"
systemctl restart "$SERVICE"
node "$RELEASE/scripts/deployment/health-check-release.mjs" "${SOLE_LOOPBACK_ORIGIN:-http://127.0.0.1:4173}" ${SOLE_PUBLIC_ORIGIN:+"$SOLE_PUBLIC_ORIGIN"}
echo "ROLLBACK_SHA=$TARGET"
