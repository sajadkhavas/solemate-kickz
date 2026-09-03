#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

[[ "${SOLE_P12_BOOTSTRAP:-}" == 'APPLY_OWNERSHIP' ]] || { echo 'ERROR=SOLE_P12_BOOTSTRAP_APPLY_OWNERSHIP_REQUIRED' >&2; exit 1; }
[[ "$(id -u)" == '0' ]] || { echo 'ERROR=ROOT_REQUIRED' >&2; exit 1; }

if ! id sole >/dev/null 2>&1; then
  useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin sole
fi

install -d -o root -g sole -m 0750 /var/www/sole /var/www/sole/releases /var/www/sole/shared /var/www/sole/shared/env
install -d -o root -g sole -m 0750 /var/www/sole-backend /var/www/sole-backend/releases /var/www/sole-backend/shared
install -d -o sole -g sole -m 0750 /var/www/sole-backend/shared/storage /var/www/sole-backend/shared/bootstrap-cache

if [[ -f /var/www/sole-backend/shared/.env ]]; then
  chown root:sole /var/www/sole-backend/shared/.env
  chmod 0640 /var/www/sole-backend/shared/.env
fi
find /var/www/sole/shared/env -maxdepth 1 -type f -exec chown root:sole {} + -exec chmod 0640 {} +

if git config --system --get-all safe.directory 2>/dev/null | grep -Fxq '*'; then
  echo 'ERROR=GLOBAL_GIT_SAFE_DIRECTORY_WILDCARD_FORBIDDEN' >&2
  exit 1
fi

printf 'OWNERSHIP_BOOTSTRAP=PASS\n'
printf 'SERVICE_USER=sole\n'
printf 'GIT_SAFE_DIRECTORY_WILDCARD=ABSENT\n'
