#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

FRONTEND_ROOT="${SOLE_ROOT:-/var/www/sole}"
BACKEND_ROOT="${SOLE_BACKEND_ROOT:-/var/www/sole-backend}"
EXPECTED_FRONTEND_SHA="${EXPECTED_FRONTEND_SHA:-}"
EXPECTED_BACKEND_SHA="${EXPECTED_BACKEND_SHA:-}"
FRONTEND_CANDIDATE="${SOLE_FRONTEND_CANDIDATE:-}"
BACKEND_CANDIDATE="${SOLE_BACKEND_CANDIDATE:-}"
EVIDENCE_DIR="${SOLE_EVIDENCE_DIR:-/var/tmp/sole-p12-evidence}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="$EVIDENCE_DIR/readiness-$STAMP.txt"
FAILURES=0

[[ "$EXPECTED_FRONTEND_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'ERROR=EXPECTED_FRONTEND_SHA_REQUIRED' >&2; exit 1; }
[[ "$EXPECTED_BACKEND_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'ERROR=EXPECTED_BACKEND_SHA_REQUIRED' >&2; exit 1; }
install -d -m 0700 "$EVIDENCE_DIR"

emit() { printf '%s\n' "$*" | tee -a "$REPORT"; }
pass() { emit "$1=PASS"; }
fail() { emit "$1=FAIL"; FAILURES=$((FAILURES + 1)); }
value() { emit "$1=$2"; }

emit 'SOLE_P12_SERVER_READINESS_EVIDENCE_V1'
value GENERATED_AT_UTC "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
value HOST_KERNEL "$(uname -srmo | tr '\n' ' ')"
if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  value OS "${PRETTY_NAME:-unknown}"
fi

for command in git node php composer mysql nginx systemctl systemd-analyze ss curl sha256sum; do
  if command -v "$command" >/dev/null 2>&1; then pass "COMMAND_${command^^}"; else fail "COMMAND_${command^^}"; fi
done

MEM_KB="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
SWAP_KB="$(awk '/SwapTotal:/ {print $2}' /proc/meminfo)"
DISK_FREE_KB="$(df -Pk / | awk 'NR==2 {print $4}')"
value MEMORY_TOTAL_MB "$((MEM_KB / 1024))"
value SWAP_TOTAL_MB "$((SWAP_KB / 1024))"
value CPU_COUNT "$(getconf _NPROCESSORS_ONLN)"
value LOAD_AVERAGE "$(cut -d' ' -f1-3 /proc/loadavg)"
value ROOT_DISK "$(df -Pk / | awk 'NR==2 {print $2":"$3":"$4":"$5}')"
value ROOT_INODES "$(df -Pi / | awk 'NR==2 {print $2":"$3":"$4":"$5}')"
value OPEN_FILE_LIMIT "$(ulimit -n)"
(( MEM_KB >= 786432 )) && pass MEMORY_P00_MINIMUM || fail MEMORY_P00_MINIMUM
(( DISK_FREE_KB >= 2097152 )) && pass DISK_P00_MINIMUM || fail DISK_P00_MINIMUM

if [[ -x "$FRONTEND_ROOT/current/.runtime/node/bin/node" ]]; then
  NODE_PINNED="$($FRONTEND_ROOT/current/.runtime/node/bin/node --version)"
  value FRONTEND_PINNED_NODE "$NODE_PINNED"
  [[ "$NODE_PINNED" == 'v22.23.1' ]] && pass FRONTEND_PINNED_NODE_VERSION || fail FRONTEND_PINNED_NODE_VERSION
else
  fail FRONTEND_PINNED_NODE_VERSION
fi
if [[ -x "$FRONTEND_ROOT/current/.runtime/bun" ]]; then
  BUN_PINNED="$($FRONTEND_ROOT/current/.runtime/bun --version)"
  value FRONTEND_PINNED_BUN "$BUN_PINNED"
  [[ "$BUN_PINNED" == '1.3.14' ]] && pass FRONTEND_PINNED_BUN_VERSION || fail FRONTEND_PINNED_BUN_VERSION
else
  fail FRONTEND_PINNED_BUN_VERSION
fi
value PHP_VERSION "$(php -r 'echo PHP_VERSION;' 2>/dev/null || true)"
value MYSQL_CLIENT_VERSION "$(mysql --version 2>/dev/null | sed 's/[[:space:]]\+/ /g')"

check_release() {
  local label="$1" root="$2" current target sha
  current="$root/current"
  if [[ ! -L "$current" ]]; then fail "${label}_CURRENT_SYMLINK"; return; fi
  target="$(readlink -f "$current" 2>/dev/null || true)"
  if [[ -z "$target" || ! -d "$target" ]]; then fail "${label}_CURRENT_TARGET"; return; fi
  [[ "$target" == "$root/releases/"* ]] && pass "${label}_CURRENT_INSIDE_RELEASES" || fail "${label}_CURRENT_INSIDE_RELEASES"
  sha="$(git -c safe.directory="$target" -C "$target" rev-parse HEAD 2>/dev/null || true)"
  value "${label}_CURRENT_SHA" "$sha"
  value "${label}_CURRENT_PERMS" "$(stat -c '%U:%G:%a' "$target")"
  value "${label}_SHARED_PERMS" "$(stat -c '%U:%G:%a' "$root/shared" 2>/dev/null || echo MISSING)"
}
check_release FRONTEND "$FRONTEND_ROOT"
check_release BACKEND "$BACKEND_ROOT"

check_candidate() {
  local label="$1" candidate="$2" expected="$3" sha
  if [[ -z "$candidate" ]]; then value "${label}_CANDIDATE" NOT_REQUESTED; return; fi
  [[ -d "$candidate" ]] || { fail "${label}_CANDIDATE_EXISTS"; return; }
  sha="$(git -c safe.directory="$candidate" -C "$candidate" rev-parse HEAD 2>/dev/null || true)"
  value "${label}_CANDIDATE_SHA" "$sha"
  [[ "$sha" == "$expected" ]] && pass "${label}_CANDIDATE_EXACT_SHA" || fail "${label}_CANDIDATE_EXACT_SHA"
}
check_candidate FRONTEND "$FRONTEND_CANDIDATE" "$EXPECTED_FRONTEND_SHA"
check_candidate BACKEND "$BACKEND_CANDIDATE" "$EXPECTED_BACKEND_SHA"

for unit in nginx.service php8.3-fpm.service mysql.service redis-server.service sole-frontend.service sole-backend-queue.service sole-backend-scheduler.timer; do
  safe="${unit//[^A-Za-z0-9]/_}"
  value "SERVICE_${safe}_ACTIVE" "$(systemctl is-active "$unit" 2>/dev/null || true)"
  value "SERVICE_${safe}_ENABLED" "$(systemctl is-enabled "$unit" 2>/dev/null || true)"
done

if nginx -t >/dev/null 2>&1; then pass NGINX_CONFIG_TEST; else fail NGINX_CONFIG_TEST; fi
for unit in sole-frontend.service sole-backend-queue.service sole-backend-scheduler.service; do
  if systemctl cat "$unit" >/dev/null 2>&1; then
    value "SECURITY_${unit//[^A-Za-z0-9]/_}" "$(systemd-analyze security "$unit" --no-pager 2>/dev/null | tail -n 1 | sed 's/[[:space:]]\+/ /g' || true)"
    value "UNIT_${unit//[^A-Za-z0-9]/_}" "$(systemctl show "$unit" -p User -p Group -p KillMode -p NoNewPrivileges --value 2>/dev/null | tr '\n' ':' | sed 's/:$//')"
  fi
done

LISTENERS="$(ss -lntH | awk '{print $4}')"
if grep -Eq '^(127\.0\.0\.1|\[::1\]):4173$' <<<"$LISTENERS" && ! grep -Eq '^(0\.0\.0\.0|\*|\[::\]):4173$' <<<"$LISTENERS"; then pass FRONTEND_LOOPBACK_4173; else fail FRONTEND_LOOPBACK_4173; fi
for port in 3306 6379; do
  if grep -Eq "^(0\\.0\\.0\\.0|\\*|\\[::\\]):${port}$" <<<"$LISTENERS"; then fail "PORT_${port}_NOT_PUBLIC"; else pass "PORT_${port}_NOT_PUBLIC"; fi
done

if [[ -n "$BACKEND_CANDIDATE" && -d "$BACKEND_CANDIDATE" ]]; then
  if (cd "$BACKEND_CANDIDATE" && php artisan sole:production:check --json --connections) >>"$REPORT" 2>&1; then pass BACKEND_RUNTIME_CONNECTIONS; else fail BACKEND_RUNTIME_CONNECTIONS; fi
else
  value BACKEND_RUNTIME_CONNECTIONS NOT_REQUESTED_NO_CANDIDATE
fi

if git config --system --get-all safe.directory 2>/dev/null | grep -Fxq '*'; then fail GIT_SAFE_DIRECTORY_WILDCARD_ABSENT; else pass GIT_SAFE_DIRECTORY_WILDCARD_ABSENT; fi

if (( FAILURES > 0 )); then
  value READINESS_RESULT FAIL
  RESULT=1
else
  value READINESS_RESULT PASS
  RESULT=0
fi
sha256sum "$REPORT" > "$REPORT.sha256"
chmod 0600 "$REPORT" "$REPORT.sha256"
printf 'EVIDENCE_REPORT=%s\n' "$REPORT"
printf 'EVIDENCE_SHA256_FILE=%s\n' "$REPORT.sha256"
exit "$RESULT"
