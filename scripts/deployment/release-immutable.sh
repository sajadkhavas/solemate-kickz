#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${SOLE_ROOT:-/var/www/sole}"
REPOSITORY="${SOLE_REPOSITORY:-https://github.com/sajadkhavas/solemate-kickz.git}"
NEW_SHA="${NEW_SHA:-}"
ENVIRONMENT="${SOLE_ENVIRONMENT:-production}"
SERVICE="${SOLE_SERVICE:-sole-frontend.service}"
ENV_FILE="${SOLE_ENV_FILE:-$ROOT/shared/env/$ENVIRONMENT.env}"
LEDGER="${SOLE_RELEASE_LEDGER:-$ROOT/shared/releases.jsonl}"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ACTOR="${SOLE_RELEASE_ACTOR:-$(id -un)}"

fail() { echo "ERROR: $*" >&2; exit 1; }
[[ "$NEW_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "NEW_SHA must be a full Git SHA"
[[ "$ENVIRONMENT" =~ ^(preview|production)$ ]] || fail "release environment must be preview or production"
[[ -f "$ENV_FILE" ]] || fail "environment file not found: $ENV_FILE"

mkdir -p "$ROOT/releases" "$ROOT/shared"
CURRENT_PATH="$(readlink -f "$ROOT/current" 2>/dev/null || true)"
CURRENT_SHA="NONE"
if [[ -n "$CURRENT_PATH" ]]; then
  [[ "$CURRENT_PATH" == "$ROOT/releases/"* ]] || fail "current points outside releases"
  CURRENT_SHA="$(basename "$CURRENT_PATH")"
  [[ "$CURRENT_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "active release path is not SHA-keyed"
fi
ROLLBACK_TARGET="$CURRENT_SHA"
RELEASE_PATH="$ROOT/releases/$NEW_SHA"
[[ ! -e "$RELEASE_PATH" ]] || fail "release path already exists; immutable releases are never repaired"

rollback() {
  local status=$?
  trap - ERR INT TERM
  if [[ "$ROLLBACK_TARGET" != "NONE" && -d "$ROOT/releases/$ROLLBACK_TARGET" ]]; then
    "$ROOT/releases/$ROLLBACK_TARGET/scripts/deployment/rollback-release.sh" "$ROLLBACK_TARGET" || true
  fi
  journalctl -u "$SERVICE" -n 100 --no-pager >&2 || true
  exit "$status"
}
trap rollback ERR INT TERM

mkdir "$RELEASE_PATH"
git -C "$RELEASE_PATH" init
git -C "$RELEASE_PATH" remote add origin "$REPOSITORY"
git -C "$RELEASE_PATH" fetch --depth=1 origin "$NEW_SHA"
REMOTE_SHA="$(git -C "$RELEASE_PATH" rev-parse FETCH_HEAD)"
[[ "$REMOTE_SHA" == "$NEW_SHA" ]] || fail "remote SHA equality check failed"
git -C "$RELEASE_PATH" checkout --detach FETCH_HEAD
[[ "$(git -C "$RELEASE_PATH" rev-parse HEAD)" == "$NEW_SHA" ]] || fail "candidate checkout mismatch"

node "$RELEASE_PATH/scripts/deployment/validate-environment.mjs" "$ENVIRONMENT" "$ENV_FILE"
bash "$RELEASE_PATH/scripts/deployment/bootstrap-node-vps.sh"
bash "$RELEASE_PATH/scripts/deployment/bootstrap-bun-vps.sh"
bash "$RELEASE_PATH/scripts/deployment/install-vps-safe.sh"
bash "$RELEASE_PATH/scripts/deployment/build-vps-safe.sh"
[[ -f "$RELEASE_PATH/.output/server/index.mjs" ]] || fail "server artifact missing"
find "$RELEASE_PATH" -type d -exec chmod a+rx {} +

NEXT="$ROOT/.current.$$.next"
ln -s "$RELEASE_PATH" "$NEXT"
mv -Tf "$NEXT" "$ROOT/current"
systemctl restart "$SERVICE"
node "$RELEASE_PATH/scripts/deployment/health-check-release.mjs" "${SOLE_LOOPBACK_ORIGIN:-http://127.0.0.1:4173}" ${SOLE_PUBLIC_ORIGIN:+"$SOLE_PUBLIC_ORIGIN"}

export ENVIRONMENT RELEASE_STRATEGY="immutable-sha-symlink" CURRENT_SHA NEW_SHA RELEASE_PATH ROLLBACK_TARGET
export HEALTH_CHECK_RESULT="PASS" PUBLIC_REACHABILITY_RESULT="${SOLE_PUBLIC_ORIGIN:+PASS}"
export PUBLIC_REACHABILITY_RESULT="${PUBLIC_REACHABILITY_RESULT:-NOT_REQUESTED}"
export STARTED_AT FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)" ACTOR
node "$RELEASE_PATH/scripts/deployment/release-ledger.mjs" "$LEDGER"
trap - ERR INT TERM
echo "RELEASE_SHA=$NEW_SHA"
