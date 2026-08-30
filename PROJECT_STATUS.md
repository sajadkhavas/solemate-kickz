# SOLE Project Status — Authoritative Chat Handoff

**Repository:** [sajadkhavas/solemate-kickz](https://github.com/sajadkhavas/solemate-kickz)  
**Status last reconciled:** 2026-08-29  
**Document baseline before P01 merge:** `main@c03f345071c6f7f34a67ebc63e9975233c45dd79`  
**P01 accepted frontend implementation:** `1248091fa5157e733d70120bb26ca9a07169263b`  
**Purpose:** a new contributor or AI chat must be able to continue SOLE without asking the owner to repeat project history.

## 1. Reading order and source of truth

Before any planning or change:

1. Read this file completely.
2. Read root [AGENTS.md](./AGENTS.md).
3. Read the selected phase in [SOLe Production Completion Program](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md).
4. Read [Production Engineering Constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md).
5. Read the relevant file under [docs/handoffs](./docs/handoffs/).
6. Verify the live default-branch SHA and dependency state on GitHub.
7. Treat [contracts/production-phase-registry.json](./contracts/production-phase-registry.json) as the machine-readable phase registry.

If a document and live GitHub history disagree, verified GitHub commit/PR/CI evidence wins and the document must be corrected in the next controlled phase change.

## 2. Product and architecture

SOLE is a sneaker commerce product.

- **Frontend:** TanStack Start + React, full-document SSR/streaming, Vite, Node production runtime.
- **Backend:** [`sajadkhavas/sole-backend`](https://github.com/sajadkhavas/sole-backend), Laravel 13 + PHP 8.3+ + Filament 5 + MySQL. P01 backend is merged to `main@c9e2f66bab300882e2306bcd52346a81fb1a2e6b` through [backend PR #2](https://github.com/sajadkhavas/sole-backend/pull/2).
- **Primary donor reference:** `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217` — read-only.
- **Selective media donor reference:** `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed` — read-only.
- **Truth rule:** the backend owns price, stock, publication and business truth. Donor data/secrets/history are never imported.

P01 production catalog safety is intentionally fail-closed. Development/browser QA may use deterministic fixtures, but production builds redirect `@/data/shoes` to `src/data/production-shoes.ts`, where `SHOES` is empty until P02 connects real ingestion.

## 3. Completed work

### Frontend F0–F18

All frontend phases F0 through F18 are completed and released. The cumulative frontend release merged through PR #23 at `6bb540d84ef3952937e03fee5b657b1446b02f47`. Their detailed accepted heads and evidence remain in `docs/handoffs/F*.md` and GitHub history.

### Production program

| Phase | Scope | Evidence | State |
|---|---|---|---|
| Program registration | P00–P14 roadmap/registry | frontend PR #24, merge `6566bdcb259cae3a853162f2072ce7a700f28845` | Completed |
| P00 | Immutable production foundation | accepted implementation `4a62f760ba4f4dee25075a9e9f39183d6b27d896`; frontend PR #25 | Completed |
| P01 | Backend, admin and product truth | frontend END_SHA `1248091fa5157e733d70120bb26ca9a07169263b`, CI `33261912130`; backend merge `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`, CI `33255041451`; frontend PR #31 | Accepted / merge pending |

### P01 accepted outcomes

- independent SOLE backend on Laravel 13 / Filament 5 / MySQL
- deny-by-default admin access, explicit RBAC and policies
- append-only privileged audit evidence
- fresh SOLE-owned schema with constraints/indexes/FKs/factories
- category/collection/product/variant/SKU/integer-price/settings truth
- transactional/idempotent inventory ledger with pessimistic locking and concurrency QA
- policy-protected Filament operational workflows
- published/sellable read-only catalog API and OpenAPI
- no production product/admin seed truth
- production frontend refuses development/demo product truth
- exact-head backend and frontend QA fully green
- no server activation or production data mutation in P01

## 4. Remaining production phases

P02–P14 remain: **13 phases and 80 planned steps**.

| Phase | Scope | Planned steps | Depends on | Server required? |
|---|---|---:|---|---|
| P02 | Media and catalog ingestion | 6 | P01 | No |
| P03 | Authentication and customer security | 6 | P01 | No |
| P04 | Size and fit intelligence | 5 | P02, P03 | No |
| P05 | Discovery and PDP conversion | 6 | P02, P04 | No |
| P06 | Cart, checkout and orders | 7 | P02, P03 | No |
| P07 | Payment, shipping and returns | 7 | P06 | No; gateways mocked only in non-production |
| P08 | Trust, support and post-purchase | 5 | P07 | No |
| P09 | Loyalty, CRM and notifications | 6 | P03, P07 | No |
| P10 | SEO, content and merchant feeds | 6 | P02, P08 | No |
| P11 | Observability, RUM and CRO | 6 | P07, P10 | No |
| P12 | Production readiness | 7 | P00–P11 | **Activate server here** |
| P13 | Staging acceptance | 6 | P12 | Yes |
| P14 | Production release | 7 | P13 | Yes |

### Remaining acceptance outcomes

- **P02:** secure media processing, catalog ingestion manifest/dry-run, idempotency/checksums, recovery and real frontend catalog/media adapter.
- **P03:** customer identity, Sanctum/session boundary, OTP lifecycle, throttling, authorization and security regression.
- **P04:** size charts, measurements, fit data and truthful recommendation boundary.
- **P05:** real discovery/PDP integration, URL state, stock/price truth, structured product data and conversion QA.
- **P06:** server-owned quote, inventory reservation, cart, checkout, order state machine and oversell/concurrency protection.
- **P07:** payment adapter/verified callback, shipping, returns/exchanges/refunds and reconciliation/audit.
- **P08:** truthful policies, support cases, order tracking and post-purchase operations.
- **P09:** consented notifications, loyalty/CRM, delivery idempotency/retry, preferences and privacy.
- **P10:** metadata/canonical/robots/schema/sitemap, content operations and merchant feeds.
- **P11:** logs/errors/metrics/traces/RUM, privacy-safe analytics, funnel and actionable alerts.
- **P12:** pinned server/runtime/secrets/backups, immutable deploy/rollback drill, health and full readiness gate.
- **P13:** production-like staging deployment, migrations, regression, visual/performance/security acceptance and sign-off.
- **P14:** exact-SHA production release, migration/deploy, public health evidence, monitoring and tested rollback target.

## 5. Cost and server strategy

Do **not** keep a paid VPS running during P02–P11. Use GitHub Actions and controlled local/CI services for application development and production-like MySQL/Redis/build validation. Activate the server at P12, then perform P13 staging and P14 production.

No prototype route, mock OTP, sandbox payment default, placeholder secret or fake product truth may cross into production.

## 6. Mandatory engineering rules

1. Never work directly on `main`.
2. Every phase uses `phase/sole-pNN-<slug>`.
3. Record exact `START_SHA` and accepted `END_SHA`.
4. Never force-push, rebase, amend or rewrite published history.
5. Development, preview/staging and production are separate environments.
6. Every deploy records exact SHA, release strategy and rollback target; QA is not production.
7. Production deploys use immutable `/var/www/sole/{releases,current,shared}` layout; never edit `current` directly.
8. Acceptance requires relevant typecheck/lint/format/build, browser regression, production-like runtime smoke and mobile/desktop visual QA.
9. Browser/runtime processes must be owned and terminated; port/process leaks are forbidden.
10. Routes own SEO metadata/canonical/robots/schema/sitemap behavior from development onward.
11. Performance/media budgets and Core Web Vitals must be verified before production.
12. Pin runtimes and validate environment/service/health contracts before deploy.
13. Deployment evidence includes `CURRENT_SHA`, `NEW_SHA`, `RELEASE_PATH`, `ROLLBACK_TARGET`, `HEALTH_CHECK_RESULT`, public reachability and timestamps/actor.
14. Use current official primary documentation for implementation decisions and record it in handoffs.
15. Never claim a gate passed without exact command/run evidence.

## 7. Mandatory phase close workflow

For every future phase:

- verify live GitHub dependency/baseline state
- create the controlled phase branch from exact START_SHA
- write scope/exclusions/acceptance/rollback before implementation
- keep implementation bounded and record out-of-scope findings
- run complete relevant gates
- capture END_SHA, CI run IDs, results and limitations
- update `PROJECT_STATUS.md`, registry and phase handoff in the same PR
- merge only after exact-head CI/review acceptance
- record final main merge SHA in issue/PR closure metadata

Mandatory handoff fields remain: `PHASE`, `STATUS`, `START_SHA`, `END_SHA`, `BRANCH`, `PR`, `SCOPE`, `EXCLUSIONS`, `FILES_CHANGED`, `DEPENDENCIES`, `COMMANDS`, `QA_RESULT`, `CI_RUN_IDS`, `ROUTES_VIEWPORTS`, `ACCESSIBILITY`, `PERFORMANCE`, `SECURITY`, `KNOWN_LIMITATIONS`, `OUT_OF_SCOPE_FINDINGS`, `ROLLBACK_IMPACT`, `OFFICIAL_REFERENCES`, `NEXT_PHASE`.

## 8. Next action

**P02 — Media & Catalog Ingestion** is the next dependency-ready phase after frontend P01 PR #31 is merged. Start P02 from the verified post-P01 frontend `main` SHA and the merged backend `main@c9e2f66bab300882e2306bcd52346a81fb1a2e6b`.

P02 must replace the intentional empty production catalog with secure, backend-owned ingested catalog/media truth; it must not re-enable development fixtures in production.

## 9. Official references

Use current official documentation for the selected phase. P01 specifically used current Laravel 13 transaction/pessimistic-lock guidance and current Filament 5 resource/action/panel-access guidance. GitHub CI evidence is the acceptance authority for committed code.
