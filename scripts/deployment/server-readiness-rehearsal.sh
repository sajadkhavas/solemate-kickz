#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

[[ "${SOLE_P12_REHEARSAL:-}" == 'INACTIVE_ONLY' ]] || { echo 'ERROR=SOLE_P12_REHEARSAL_INACTIVE_ONLY_REQUIRED' >&2; exit 1; }
[[ "${EXPECTED_FRONTEND_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || { echo 'ERROR=EXPECTED_FRONTEND_SHA_REQUIRED' >&2; exit 1; }
[[ "${EXPECTED_BACKEND_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || { echo 'ERROR=EXPECTED_BACKEND_SHA_REQUIRED' >&2; exit 1; }
BACKEND_SOURCE="${SOLE_BACKEND_SOURCE:-}"
[[ -d "$BACKEND_SOURCE/.git" ]] || { echo 'ERROR=SOLE_BACKEND_SOURCE_REQUIRED' >&2; exit 1; }
[[ "$(git -C "$BACKEND_SOURCE" rev-parse HEAD)" == "$EXPECTED_BACKEND_SHA" ]] || { echo 'ERROR=BACKEND_SOURCE_SHA_MISMATCH' >&2; exit 1; }
[[ -n "${MYSQL_DEFAULTS_FILE:-}" && -f "$MYSQL_DEFAULTS_FILE" ]] || { echo 'ERROR=MYSQL_DEFAULTS_FILE_REQUIRED' >&2; exit 1; }
[[ "${DB_DATABASE:-}" =~ ^[A-Za-z0-9_]+$ ]] || { echo 'ERROR=DB_DATABASE_REQUIRED' >&2; exit 1; }

printf 'REHEARSAL_MODE=INACTIVE_ONLY\n'
printf 'PUBLIC_ACTIVATION=NO\n'

NEW_SHA="$EXPECTED_FRONTEND_SHA" bash "$(dirname "$0")/prepare-immutable-release.sh"
NEW_SHA="$EXPECTED_BACKEND_SHA" bash "$BACKEND_SOURCE/scripts/production/prepare-release.sh"

BACKUP_OUTPUT="$(MYSQL_DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE" DB_DATABASE="$DB_DATABASE" bash "$BACKEND_SOURCE/scripts/production/mysql-backup.sh")"
printf '%s\n' "$BACKUP_OUTPUT"
BACKUP_FILE="$(awk -F= '/^BACKUP_FILE=/{print substr($0,index($0,"=")+1)}' <<<"$BACKUP_OUTPUT")"
[[ -f "$BACKUP_FILE" ]] || { echo 'ERROR=BACKUP_OUTPUT_MISSING' >&2; exit 1; }
MYSQL_DEFAULTS_FILE="$MYSQL_DEFAULTS_FILE" SOLE_RESTORE_BACKUP="$BACKUP_FILE" bash "$BACKEND_SOURCE/scripts/production/mysql-restore-drill.sh"

SANDBOX="$(mktemp -d /var/tmp/sole-p12-symlink.XXXXXX)"
cleanup() { rm -rf "$SANDBOX"; }
trap cleanup EXIT INT TERM
mkdir -p "$SANDBOX/releases/a" "$SANDBOX/releases/b"
ln -s "$SANDBOX/releases/a" "$SANDBOX/current"
NEXT="$SANDBOX/.next"
ln -s "$SANDBOX/releases/b" "$NEXT"
mv -Tf "$NEXT" "$SANDBOX/current"
[[ "$(readlink -f "$SANDBOX/current")" == "$SANDBOX/releases/b" ]] || { echo 'ERROR=ATOMIC_SWITCH_FAILED' >&2; exit 1; }
NEXT="$SANDBOX/.rollback"
ln -s "$SANDBOX/releases/a" "$NEXT"
mv -Tf "$NEXT" "$SANDBOX/current"
[[ "$(readlink -f "$SANDBOX/current")" == "$SANDBOX/releases/a" ]] || { echo 'ERROR=ROLLBACK_SWITCH_FAILED' >&2; exit 1; }

printf 'ATOMIC_SWITCH_REHEARSAL=PASS\n'
printf 'BACKUP_RESTORE_REHEARSAL=PASS\n'
printf 'PUBLIC_ACTIVATION=NO\n'
