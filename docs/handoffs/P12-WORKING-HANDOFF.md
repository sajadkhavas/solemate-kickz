# P12 Final Handoff — Pre-server Production Readiness

- PHASE: `P12 — Pre-server Production Readiness`
- STATUS: `ACCEPTED IMPLEMENTATION / CLOSURE IN PROGRESS`
- FRONTEND START_SHA: `91b4b121603ff3496d680f4dd9e38ce47a89049a`
- BACKEND START_SHA: `88283eff2237a4cbc6f36f3e20960329420e64c0`
- BRANCH: `phase/sole-p12-production-readiness` in both repositories
- TRACKING ISSUE: `sajadkhavas/solemate-kickz#64`
- FRONTEND END_SHA: `4ea42bf297db343e76e6c540470abbe1468e56ff`
- BACKEND END_SHA: `fdc4bba9fd53ae5f009daeb17a24c10d026f5bb7`
- FRONTEND CI: Frontend CI #1309 / run `33765790987` — PASS, all 137 steps
- BACKEND CI: Backend Quality #72 / run `33766011186` — PASS
- FRONTEND PR: `sajadkhavas/solemate-kickz#65`
- BACKEND PR: `sajadkhavas/sole-backend#16`
- SERVER_REQUIRED: `false` — real server rehearsal is transferred intact to P14
- Started: 2026-09-03

## Acceptance map

- P12.1 — Threat/security readiness: backend production invariant command, config boundary, threat model, secret rotation and severity-1/2 release blockers.
- P12.2 — Database/data recovery: single-transaction logical backup, SHA-256 evidence, protected credentials and disposable restore proof.
- P12.3 — Queue/scheduler/retry: 60s worker timeout below 90s retry-after, bounded attempts/backoff, failed-job persistence, systemd supervision and deploy restart semantics.
- P12.4 — Capacity/performance: accepted F12 budgets remain exactly unchanged; deployable runtime limits are documented. Real host capacity measurement is a P14 acceptance requirement and may not be guessed in P12.
- P12.5 — Alerts/incidents/operations: severity/owner/action matrix and evidence/runbook sources without fake paging-provider activation.
- P12.6 — Release/rollback: frontend/backend inactive candidate preparation, exact SHA, shared writable state, guarded later activation and code-only rollback.
- P12.7 — nginx/systemd/Git ownership: reviewed templates, loopback application listener, safe PHP entrypoint, security headers, least privilege and immutable current releases.
- P12.8 — Portable rehearsal contract: read-only inventory, explicitly gated inactive candidate preparation, backup/restore and isolated symlink rehearsal tooling are implemented and permanently tested. Their real-host execution evidence is transferred intact to P14.
- P12.9 — Permanent QA/closure: exact-head backend/frontend CI, no unresolved review threads, merged implementation, reconciled registry/status/README/final handoff and completed Issue #64.

## Non-negotiable exclusions

- No P14 public production activation.
- No direct edit under active `current` releases.
- No credential or `.env` content in repository/CI/evidence.
- No destructive database restore or automatic database rollback.
- No increase to F12 budgets.
- No severity-1/2 waiver.

## Scope re-baseline

The owner selected a portable product model on 2026-09-05: complete the application and operational admin surface before renting the low-cost integration VPS, then deploy the accepted exact SHAs to that VPS only in the final technical phase. P12 therefore closes the pre-server readiness contract; P13 owns Admin Operations & Complete Platform Acceptance; P14 owns Demo VPS Deployment & Final Acceptance. This is a dependency relocation, not a waiver: every real-host inventory, capacity, backup/restore, release/rollback, process/port and public-health proof formerly required by P12.8 remains mandatory in P14.

Customer-specific production onboarding occurs after a commercial contract as `C01`; it repeats exact-SHA deployment, provider/domain enrollment and production acceptance on the customer's infrastructure and is not fabricated before a customer exists.

## QA result

- Backend exact head `fdc4bba9fd53ae5f009daeb17a24c10d026f5bb7` passed Backend Quality #72 / run `33766011186`.
- Frontend exact head `4ea42bf297db343e76e6c540470abbe1468e56ff` passed all 137 steps in Frontend CI #1309 / run `33765790987`.
- The accepted F12 budgets were not increased. Production build, VPS build, runtime smoke, cumulative browser/visual suites, P12 contracts, aggregate evidence and clean-tree verification passed.
- No VPS was accessed; no production activation, credential enrollment, provider action or production-data mutation occurred.

## Next phase

`P13 — Admin Operations & Complete Platform Acceptance`, starting only from the merged P12 frontend and backend main SHAs.
