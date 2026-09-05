#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

ROOT="${SOLE_ROOT:-/var/www/sole}"
REPOSITORY="${SOLE_REPOSITORY:-https://github.com/sajadkhavas/solemate-kickz.git}"
NEW_SHA="${NEW_SHA:-}"
ENVIRONMENT="${SOLE_ENVIRONMENT:-production}"
ENV_FILE="${SOLE_ENV_FILE:-$ROOT/shared/env/$ENVIRONMENT.env}"

fail() { printf 'ERROR=%s\n' "$1" >&2; exit 1; }
[[ "$NEW_SHA" =~ ^[0-9a-f]{40}$ ]] || fail FULL_NEW_SHA_REQUIRED
[[ "$ENVIRONMENT" =~ ^(preview|production)$ ]] || fail INVALID_ENVIRONMENT
[[ -f "$ENV_FILE" ]] || fail ENVIRONMENT_FILE_REQUIRED
command -v git >/dev/null || fail GIT_REQUIRED

RELEASE_PATH="$ROOT/releases/$NEW_SHA"
[[ ! -e "$RELEASE_PATH" ]] || fail IMMUTABLE_RELEASE_ALREADY_EXISTS
install -d -m 0755 "$ROOT/releases"
mkdir "$RELEASE_PATH"

git -C "$RELEASE_PATH" init >/dev/null
git -C "$RELEASE_PATH" remote add origin "$REPOSITORY"
git -C "$RELEASE_PATH" fetch --depth=1 origin "$NEW_SHA"
[[ "$(git -C "$RELEASE_PATH" rev-parse FETCH_HEAD)" == "$NEW_SHA" ]] || fail REMOTE_SHA_MISMATCH
git -C "$RELEASE_PATH" checkout --detach FETCH_HEAD >/dev/null
[[ "$(git -C "$RELEASE_PATH" rev-parse HEAD)" == "$NEW_SHA" ]] || fail CHECKOUT_SHA_MISMATCH

node "$RELEASE_PATH/scripts/deployment/validate-environment.mjs" "$ENVIRONMENT" "$ENV_FILE"
bash "$RELEASE_PATH/scripts/deployment/bootstrap-node-vps.sh"
bash "$RELEASE_PATH/scripts/deployment/bootstrap-bun-vps.sh"
bash "$RELEASE_PATH/scripts/deployment/install-vps-safe.sh"
bash "$RELEASE_PATH/scripts/deployment/build-vps-safe.sh"
[[ -f "$RELEASE_PATH/.output/server/index.mjs" ]] || fail SERVER_ARTIFACT_MISSING
find "$RELEASE_PATH" -type d -exec chmod go-w {} +
find "$RELEASE_PATH" -type f -exec chmod go-w {} +

printf 'PREPARE_RESULT=PASS\n'
printf 'NEW_SHA=%s\n' "$NEW_SHA"
printf 'RELEASE_PATH=%s\n' "$RELEASE_PATH"
printf 'PUBLIC_ACTIVATION=NO\n'
