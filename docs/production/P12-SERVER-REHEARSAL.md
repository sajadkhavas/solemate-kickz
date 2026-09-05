# P12 server rehearsal contract

P12 is server-required but is not the public release. The sequence is deliberately split into read-only inventory and controlled inactive rehearsal.

The required evidence invariant is `PUBLIC_ACTIVATION=NO`.

## 1. Read-only inventory

Run `scripts/deployment/server-readiness-evidence.sh` with the exact frontend/backend candidate SHAs. It records only versions, capacity summaries, service state, path ownership/modes, active Git SHAs, listener addresses, nginx syntax, selected systemd hardening properties and the boolean/enum output of the Backend readiness command. It does not print `.env`, service environment, process environment, database credentials, provider credentials, request bodies or customer data.

The production app listener on port 4173 must be loopback-only. MySQL and Redis may use loopback or Unix sockets but may not bind a wildcard public address. nginx must pass `nginx -t`. Queue and scheduler supervision must be installed and active/enabled as appropriate before final P12 evidence.

## 2. Controlled inactive rehearsal

`server-readiness-rehearsal.sh` requires the literal guard `SOLE_P12_REHEARSAL=INACTIVE_ONLY`. It may:

- prepare the exact frontend candidate under `/var/www/sole/releases/<sha>` without touching `current`;
- prepare the exact backend candidate under `/var/www/sole-backend/releases/<sha>` without touching `current`;
- create a protected logical MySQL backup and checksum;
- restore that backup only into a disposable `sole_restore_*` database and remove it afterward;
- rehearse atomic symlink switch and rollback inside `/var/tmp`, never against the public `current` symlink.

It may not restart the public frontend, reload public PHP-FPM for a candidate, switch either production `current`, run a payment/provider action or change customer/business data.

## 3. Evidence acceptance

The final evidence must include exact candidate SHAs, PASS for nginx syntax, loopback frontend ownership, no public MySQL/Redis bind, required service supervision, backend production invariant/connection checks, backup checksum, disposable restore success, inactive candidate preparation and atomic symlink rollback rehearsal. Evidence is hashed and stored outside Git; only the sanitized result summary and hash are registered in GitHub.

P13 later deploys an exact candidate to staging through the real activation path. P14 alone can authorize the public production switch.
