# P01 — Backend, Admin and Product Truth

## Phase record

- PHASE: P01
- STATUS: ACCEPTED — MERGE PENDING
- FRONTEND_REPOSITORY: `sajadkhavas/solemate-kickz`
- BACKEND_REPOSITORY: `sajadkhavas/sole-backend`
- BRANCH: `phase/sole-p01-backend-admin-product-truth`
- START_SHA: `c03f345071c6f7f34a67ebc63e9975233c45dd79`
- END_SHA: `1248091fa5157e733d70120bb26ca9a07169263b`
- FRONTEND_PR: [solemate-kickz#32](https://github.com/sajadkhavas/solemate-kickz/pull/32)
- SUPERSEDED_FRONTEND_DRAFT_PR: [solemate-kickz#31](https://github.com/sajadkhavas/solemate-kickz/pull/31)
- FRONTEND_CI: Frontend CI run 1027 / `33261912130` — PASS
- FRONTEND_CLOSURE_CI: Frontend CI run 1029 / `33262459382` — PASS
- BACKEND_START_SHA: `c0a1426b4e5ec818cdedce75490e2bcc7b9689c6`
- BACKEND_ACCEPTED_END_SHA: `e60df1050aa051703ca470b036815d970ff9648b`
- BACKEND_MERGE_HEAD: `00141144b7173c1d27c410ce39e8b176ee26aa86`
- BACKEND_MERGE_SHA: `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`
- BACKEND_PR: [sole-backend#2](https://github.com/sajadkhavas/sole-backend/pull/2) — MERGED
- BACKEND_CI: Backend quality gate run 9 / `33255041451` — PASS
- STARTED_AT: 2026-08-28
- ACCEPTED_AT: 2026-08-29
- SERVER_REQUIRED: no
- NEXT_PHASE: P02 — Media & Catalog Ingestion

## Outcome

P01 establishes the independent SOLE backend and the authoritative source of product, variant, SKU, integer price, inventory and business-setting truth. It also establishes deny-by-default administration, policy-based operations, append-only privileged audit, a versioned read-only storefront catalog API, and a production frontend boundary that refuses development/demo product truth.

## Execution parts

| Part | Result | Acceptance evidence |
|---|---|---|
| P01.1 | Complete | Laravel 13 / Filament 5 / MySQL baseline, locked dependencies, release/env contract and CI |
| P01.2 | Complete | active-admin boundary, explicit RBAC, policies, audited grant/revoke and deny-by-default panel access |
| P01.3 | Complete | fresh SOLE-owned MySQL migrations, constraints, indexes, FKs and factories |
| P01.4 | Complete | category/collection/product/variant/SKU/integer pricing/settings plus transactional inventory ledger |
| P01.5 | Complete | policy-protected Filament operational resources; inventory adjustment is ledger-only |
| P01.6 | Complete | `/api/v1/catalog/products`, product detail, readiness, OpenAPI and production demo-data prohibition |
| P01.7 | Complete | MySQL migration/rollback, concurrency, security, static/format, production boot/build, browser and visual acceptance gates |

## SCOPE

- Laravel 13 + PHP 8.3+ + Filament 5 + MySQL backend
- explicit admin access and least-privilege RBAC
- append-only privileged audit evidence
- categories, collections, products, variants and unique SKUs
- integer minor-unit pricing and three-character currency
- versioned business settings
- inventory locations, balances and append-only movements
- transactional inventory service with idempotency, `lockForUpdate()` and negative-stock prevention
- policy-protected Filament workflows
- read-only published/sellable catalog API and readiness endpoint
- frontend OpenAPI contract
- production catalog fail-closed boundary
- exact-head CI, runtime smoke, visual QA and closure evidence

## EXCLUSIONS

P02 media/catalog ingestion, P03 customer auth/OTP, P04 fit, P05 discovery/PDP integration, P06 cart/orders, P07 payment/shipping/returns, production server activation, donor data, donor secrets and any production seed truth are outside P01.

## FILES_CHANGED

Backend owns the Laravel application, migrations, domain models/services/policies, Filament resources, commands, API routes/resources, tests, OpenAPI and quality workflow. Frontend P01 owns `src/data/production-shoes.ts`, the production catalog Vite guard, catalog OpenAPI, production-program audit updates, hydration/3D reliability fixes, registry/status/handoff evidence and PR closure metadata.

## DEPENDENCIES

- P00 — completed
- LBB donor baseline and Winimi donor baseline were read-only references only; no donor repository was mutated and no donor data/secrets/history were imported.

## COMMANDS / QA gates

Backend exact-head run `33255041451` passed locked Composer installation/validation, Pint, PHP syntax, MySQL 8.4 migrate/fresh, RBAC sync, rollback/re-migrate, SQLite regression, full MySQL integration, real two-process inventory concurrency, route/operator boot, dependency audit and production config cache.

Frontend implementation run `33261912130` passed the cumulative F0–F18 source/browser gates, P00/P01 production-program contract, TypeScript, ESLint, every registered Prettier gate, production build, F12 performance budgets, VPS Node build, production runtime/port-leak smoke, all desktop/mobile visual QA suites, cumulative evidence verification and clean-tree verification.

Exact closure head `0767ff2655e658ed97cebcbbd48971574b561d43` independently passed the same Frontend CI as run `33262459382` before the merge-wrapper workaround. PR #31 was superseded solely because the connected Draft→Ready GraphQL mutation failed on a GitHub schema field; no code or acceptance criteria changed.

## QA_RESULT

**PASS.** Accepted frontend implementation END_SHA is `1248091fa5157e733d70120bb26ca9a07169263b`; accepted backend implementation is `e60df1050aa051703ca470b036815d970ff9648b`; backend is merged at `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`.

## ROUTES_VIEWPORTS

Cumulative browser and visual suites cover homepage, navigation/search, content pages, catalog, PDP, cart/checkout, wishlist/account/orders and motion/3D behaviors across the repository's registered desktop/mobile viewport contracts. Production Node runtime smoke also passed.

## ACCESSIBILITY

Existing accessibility contracts remain green: keyboard/focus semantics, reduced motion, dialog focus containment, mobile filter behavior, minimum target contracts and static fallbacks for optional 3D remain enforced by cumulative QA.

## PERFORMANCE

Production build and F12 deterministic performance/media budgets passed. VPS Node-server build and runtime smoke passed. The P01 catalog boundary does not ship development product rows into production.

## SECURITY

- admin access is deny-by-default and requires active user + explicit `admin.access`
- catalog mutation is policy-protected
- role grant/revoke uses explicit audited operator flows
- audit logs and inventory movements are append-only
- direct inventory balance edits are prohibited
- inventory writes are transactional and lock race-prone rows
- public catalog exposes only published/sellable truth
- price and stock are server-owned
- production seeding creates no admin/product truth
- no donor secret/data import occurred

## KNOWN_LIMITATIONS

P02 has not connected real media/catalog ingestion to the frontend yet. Therefore production intentionally resolves the development `@/data/shoes` import to a safe module with `SHOES: []`. An empty production catalog is the intended fail-closed state until P02 provides the real backend ingestion/media adapter.

## OUT_OF_SCOPE_FINDINGS

Real product media processing, import manifests/dry-runs and frontend consumption of ingested backend catalog truth belong to P02. Customer identity/OTP belongs to P03. No work from those phases is claimed here.

## ROLLBACK_IMPACT

Frontend rollback target is P01 `START_SHA` `c03f345071c6f7f34a67ebc63e9975233c45dd79`. Backend rollback target is pre-P01 `main@c0a1426b4e5ec818cdedce75490e2bcc7b9689c6`. P01 performed no production server activation and no production data mutation.

## OFFICIAL_REFERENCES

Implementation decisions were checked against current official Laravel 13 documentation for database transactions/pessimistic locking and current Filament 5 documentation for resources/actions and production panel access. Repository CI is the acceptance authority for the exact committed implementation.

## NEXT_PHASE

**P02 — Media & Catalog Ingestion** is the next dependency-ready phase after P01 merges to frontend `main`.
