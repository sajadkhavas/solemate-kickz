# P12 Working Handoff — Production Readiness

- PHASE: `P12 — Production Readiness`
- STATUS: `IN PROGRESS / NOT ACCEPTED / NOT MERGED / NOT CLOSED`
- FRONTEND START_SHA: `91b4b121603ff3496d680f4dd9e38ce47a89049a`
- BACKEND START_SHA: `88283eff2237a4cbc6f36f3e20960329420e64c0`
- BRANCH: `phase/sole-p12-production-readiness` in both repositories
- TRACKING ISSUE: `sajadkhavas/solemate-kickz#64`
- SERVER_REQUIRED: `true`
- Started: 2026-09-03

## Acceptance map

- P12.1 — Threat/security readiness: backend production invariant command, config boundary, threat model, secret rotation and severity-1/2 release blockers.
- P12.2 — Database/data recovery: single-transaction logical backup, SHA-256 evidence, protected credentials and disposable restore proof.
- P12.3 — Queue/scheduler/retry: 60s worker timeout below 90s retry-after, bounded attempts/backoff, failed-job persistence, systemd supervision and deploy restart semantics.
- P12.4 — Capacity/performance: accepted F12 budgets remain exactly unchanged; server capacity is measured, not guessed.
- P12.5 — Alerts/incidents/operations: severity/owner/action matrix and evidence/runbook sources without fake paging-provider activation.
- P12.6 — Release/rollback: frontend/backend inactive candidate preparation, exact SHA, shared writable state, guarded later activation and code-only rollback.
- P12.7 — nginx/systemd/Git ownership: reviewed templates, loopback application listener, safe PHP entrypoint, security headers, least privilege and immutable current releases.
- P12.8 — Server rehearsal: real read-only inventory followed only by explicitly gated inactive candidate + backup/restore + isolated symlink rehearsal evidence.
- P12.9 — Permanent QA/closure: exact-head backend/frontend CI, no unresolved review threads, merged implementation, reconciled registry/status/README/final handoff and completed Issue #64.

## Non-negotiable exclusions

- No P14 public production activation.
- No direct edit under active `current` releases.
- No credential or `.env` content in repository/CI/evidence.
- No destructive database restore or automatic database rollback.
- No increase to F12 budgets.
- No severity-1/2 waiver.

This handoff remains Working until every acceptance item has real evidence.
