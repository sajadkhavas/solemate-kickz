# P12 incident runbooks

These runbooks preserve evidence first. They never authorize a payment/refund/provider action, destructive database operation or secret disclosure.

## Severity 1 — outage, checkout integrity, data loss or security compromise

1. Stop any ongoing promotion. Record `CURRENT_SHA`, candidate SHA, UTC time and operator.
2. Capture bounded evidence: `systemctl status` for SOLE/nginx/PHP-FPM, recent `journalctl -u <unit>`, nginx syntax result, health status and P11 RED/error evidence. Do not dump process environments or `.env`.
3. If the failure is code-only and the prior release remains data-compatible, use the reviewed code rollback procedure. Do not run `migrate:rollback` automatically.
4. For payment/order divergence, freeze further release work and reconcile against backend/provider truth before any customer-facing correction.
5. For suspected credential compromise, restrict access, rotate the affected credential through the shared secret boundary, rebuild config cache, verify health, then revoke the prior credential. Preserve audit evidence.

## Severity 2 — elevated 5xx or degraded application

1. Correlate nginx status, P11 RED metrics and structured backend errors by route template/status class, not raw customer identifiers.
2. Check CPU/load, memory/swap, filesystem/inodes, service resource limits and PHP-FPM state.
3. If capacity pressure is real, stop promotion and mitigate the bottleneck; do not raise F12 budgets or system resource caps merely to clear the gate.
4. Re-run secret-safe health/readiness evidence after remediation.

## Queue backlog or failed jobs

1. Check `systemctl status sole-backend-queue.service` and recent queue worker journal entries.
2. Inspect `php artisan queue:failed` without exposing payloads in public evidence.
3. Fix the root cause before retry. Retry only identified safe failed-job UUIDs with `php artisan queue:retry <uuid>`; do not bulk retry unknown payment/provider work.
4. Use `php artisan queue:restart` or the supervised service restart to load new code. Confirm the configured worker timeout remains lower than queue `retry_after`.

## Scheduler failure

1. Check `sole-backend-scheduler.timer` and `sole-backend-scheduler.service` status and journal.
2. Verify there is one enabled persistent timer per host and scheduled application commands retain overlap protection.
3. A manual `php artisan schedule:run` is diagnostic only; do not create a second continuous scheduler process.

## Database or Redis degradation

1. Use `sole:production:check --json --connections` for a secret-safe connectivity result and capture server capacity evidence.
2. Do not restart MySQL/Redis blindly during active commerce. Identify saturation, lock, disk or memory cause first.
3. If database integrity is uncertain, stop release/payment progression and preserve a backup before repair.

## Backup or restore failure

1. A missing/empty backup, checksum mismatch or disposable restore failure is a release blocker.
2. Do not delete the last known-good backup while investigating.
3. Repair the backup path/permissions/tooling and repeat backup + checksum + `sole_restore_*` drill. P14 cannot proceed until restore evidence passes.

## Rollback decision

Code rollback is permitted only when the previous release is known, immutable, healthy and compatible with current schema/data. Database recovery is a separate incident decision based on backup/restore and transaction reconciliation; it is never coupled automatically to a code symlink switch.
