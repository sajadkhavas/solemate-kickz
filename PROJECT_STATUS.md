# SOLE Project Status — Authoritative Chat Handoff

**Repository:** `sajadkhavas/solemate-kickz`  
**Status last reconciled:** 2026-08-31  
**Current accepted frontend phase:** P02 — Media & Catalog Ingestion  
**P02 START_SHA:** `9423700cc8197d69a14a19e5cc29f092f51da115`  
**P02 accepted functional END_SHA:** `11c16357a846d01020f4774002ee11d8e63b2d2a`  
**Purpose:** a new contributor or AI chat must be able to continue SOLE without asking the owner to repeat project history.

## 1. Reading order and source of truth

Before any planning or change:

1. Read this file completely.
2. Read root `AGENTS.md`.
3. Read the selected phase in `docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md`.
4. Read `docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md`.
5. Read the relevant file under `docs/handoffs/`.
6. Verify the live default-branch SHA and dependency state on GitHub.
7. Treat `contracts/production-phase-registry.json` as the machine-readable phase registry.

If a document and live GitHub history disagree, verified GitHub commit/PR/CI evidence wins and the document must be corrected in the next controlled phase change.

## 2. Product and architecture

SOLE is a sneaker commerce product.

- **Frontend:** TanStack Start + React, SSR/streaming, Vite and the repository's pinned Node/Bun toolchain.
- **Backend:** `sajadkhavas/sole-backend`, Laravel 13 + PHP 8.3+ + Filament 5 + MySQL.
- **Backend P02 main:** `36eca2810495591b44f1f86c975f4ff287374e81`, merged through backend PR #4.
- **Primary donor reference:** `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217` — read-only.
- **Selective media donor reference:** `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed` — read-only.
- **Truth rule:** backend owns product publication, SKU, price, stock, media processing and business truth. Donor data, donor secrets and donor history are never imported.

Production catalog data now enters the frontend through the P02 backend adapter. Development/browser QA fixtures remain deterministic and development-only. Production rejects missing/invalid backend configuration or invalid catalog payloads by failing closed; it never falls back to demo product truth.

## 3. Completed work

### Frontend F0–F18

All frontend phases F0 through F18 are completed and released. Their detailed accepted heads and evidence remain in `docs/handoffs/F*.md` and GitHub history.

### Production program

| Phase | Scope | Evidence | State |
|---|---|---|---|
| Program registration | P00–P14 roadmap/registry | frontend PR #24 | Completed |
| P00 | Immutable production foundation | accepted implementation `4a62f760ba4f4dee25075a9e9f39183d6b27d896` | Completed |
| P01 | Backend, admin and product truth | frontend PR #32 merged at `9423700cc8197d69a14a19e5cc29f092f51da115`; backend merge `c9e2f66bab300882e2306bcd52346a81fb1a2e6b` | Completed |
| P02 | Media and catalog ingestion | frontend accepted END `11c16357a846d01020f4774002ee11d8e63b2d2a`, CI `33405521318`; backend merge `36eca2810495591b44f1f86c975f4ff287374e81`, backend CI `33367224392` and `33371334406`; frontend merge closure PR #35 | Completed |

### P02 accepted outcomes

- private quarantine and signed upload intent
- server-side byte/MIME/decode/dimension/animation validation
- fail-closed malware scanning
- deterministic responsive WebP derivatives and content-addressed delivery
- versioned catalog manifests with preview/dry-run validation
- duplicate, SKU, slug and reference validation
- idempotent catalog apply and ready-media attachment
- import cannot publish or set publication timestamps
- draft → review → publish workflow with append-only publication revisions and stale-aware rollback
- storefront API/OpenAPI v1.1 exposes backend-authoritative ready media
- production frontend consumes backend catalog truth through `SOLE_API_URL`
- browser navigation uses the same-origin TanStack server route `/api/catalog`
- responsive product cards/PDP gallery consume backend-generated WebP `srcset`
- generated TanStack route tree is committed exactly as produced by the pinned build
- complete cumulative frontend CI, production build, VPS runtime smoke, performance budgets, visual QA, aggregate evidence and clean-tree all pass on the accepted functional head
- no server activation and no production data mutation occurred in P02

## 4. Remaining production phases

P03–P14 remain: **12 phases and 74 planned steps**.

| Phase | Scope | Planned steps | Depends on | Server required? |
|---|---|---:|---|---|
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

## 5. Cost and server strategy

Do **not** keep a paid VPS running during P03–P11. Use GitHub Actions and controlled local/CI services for application development and production-like validation. Activate the server at P12, then perform P13 staging and P14 production.

No prototype route, mock OTP, sandbox payment default, placeholder secret, fake product truth or donor secret may cross into production.

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

**P03 — Authentication & Customer Security** is the next dependency-ready phase.

Start P03 only from the verified post-P02 frontend `main` SHA and backend `main@36eca2810495591b44f1f86c975f4ff287374e81`. P03 owns customer identity/session/OTP/security; it must not weaken the P02 catalog/media truth boundary.

## 9. Official-reference baseline

P02 implementation was checked against current official TanStack Start server-route/file-routing documentation and Laravel 13 filesystem, validation and pessimistic-locking documentation. Exact committed GitHub CI remains the acceptance authority.
