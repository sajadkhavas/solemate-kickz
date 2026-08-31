# SOLE Project Status — Authoritative Chat Handoff

**Repository:** `sajadkhavas/solemate-kickz`  
**Status last reconciled:** 2026-08-31  
**Current accepted frontend phase:** P03 — Authentication & Customer Security  
**P03 START_SHA:** `3a908fc6b7be87d7c0c06c85d7d2806be29b6fd1`  
**P03 accepted implementation END_SHA:** `d67b82236ac9d28741ac6336895f70c5aa046082`  
**Backend final P03 main:** `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`  
**Purpose:** a new contributor or AI chat must be able to continue SOLE without asking the owner to repeat project history.

## 1. Reading order and source of truth

Before any planning or change:

1. Read this file completely.
2. Read root `AGENTS.md`.
3. Read the selected phase in `docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md`.
4. Read `docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md`.
5. Read the relevant file under `docs/handoffs/`.
6. Verify live default-branch SHAs and dependency state on GitHub.
7. Treat `contracts/production-phase-registry.json` as the machine-readable phase registry.

If a document and live GitHub history disagree, verified GitHub commit/PR/CI evidence wins and the document must be corrected in the next controlled phase change.

## 2. Product and architecture

SOLE is a sneaker commerce product.

- **Frontend:** TanStack Start + React, SSR/streaming, Vite and pinned Node/Bun toolchain.
- **Backend:** `sajadkhavas/sole-backend`, Laravel 13 + PHP 8.3+ + Filament 5 + MySQL.
- **Backend P03 final main:** `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`, after PR #5 plus privacy/API-contract PR #6.
- **Primary donor reference:** `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217` — read-only.
- **Selective media donor reference:** `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed` — read-only.
- **Truth rule:** backend owns customer identity/session/profile/privacy truth as well as catalog/inventory/media truth. Donor data, donor secrets and donor history are never imported.

Production catalog remains backend-authoritative from P02. P03 adds backend-authoritative customer identity/profile/privacy and production route isolation for `/auth` and `/account`. Development fixtures remain deterministic and development-only.

## 3. Completed work

### Frontend F0–F18

All frontend phases F0 through F18 are completed and released. Detailed accepted heads and evidence remain in `docs/handoffs/F*.md` and GitHub history.

### Production program

| Phase | Scope | Evidence | State |
|---|---|---|---|
| Program registration | P00–P14 roadmap/registry | frontend PR #24 | Completed |
| P00 | Immutable production foundation | accepted implementation `4a62f760ba4f4dee25075a9e9f39183d6b27d896` | Completed |
| P01 | Backend, admin and product truth | frontend PR #32; backend merge `c9e2f66bab300882e2306bcd52346a81fb1a2e6b` | Completed |
| P02 | Media and catalog ingestion | frontend accepted `11c16357a846d01020f4774002ee11d8e63b2d2a`; backend merge `36eca2810495591b44f1f86c975f4ff287374e81` | Completed |
| P03 | Authentication and customer security | frontend accepted implementation `d67b82236ac9d28741ac6336895f70c5aa046082`; backend final main `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`; frontend PR #37 | Completed / merge closure pending |

### P03 accepted outcomes

- first-party Sanctum customer session boundary
- Google OAuth as active customer sign-in path with state/redirect hardening and session rotation
- privileged admin/customer identity separation
- normalized Iranian mobile required for complete customer accounts
- retained OTP domain with TTL, attempts, replay/resend/rate-limit protection; production default OFF
- real Kavenegar adapter available only behind explicit backend configuration
- backend-owned profile, address ownership and append-only consent history
- account export, deletion request/cancel and controlled pseudonymization
- privacy-safe User audit that excludes customer name/email/password PII
- backend OpenAPI contract at `docs/openapi/sole-customer-v1.yaml`
- allow-listed same-origin TanStack auth BFF; no generic proxy
- production `/auth` and `/account` replace development demo authority only in production builds
- production account exposes real session/profile/address/consent/privacy controls
- real orders are not fabricated; order integration is deferred to P06
- generated `/api/auth/$` route is registered in exact cumulative route gates
- P03 security audit is permanently chained into the production-program gate
- all temporary synchronization workflows are removed before acceptance
- no server activation, production data mutation or production provider credential enrollment occurred

## 4. Remaining production phases

P04–P14 remain: **11 phases and 68 planned steps**.

| Phase | Scope | Planned steps | Depends on | Server required? |
|---|---|---:|---|---|
| P04 | Size and fit intelligence | 5 | P02, P03 | No |
| P05 | Discovery and PDP conversion | 6 | P02, P04 | No |
| P06 | Cart, checkout and orders | 7 | P02, P03 | No |
| P07 | Payment, shipping and returns | 7 | P06 | No; provider activation deferred |
| P08 | Trust, support and post-purchase | 5 | P07 | No |
| P09 | Loyalty, CRM and notifications | 6 | P03, P07 | No |
| P10 | SEO, content and merchant feeds | 6 | P02, P08 | No |
| P11 | Observability, RUM and CRO | 6 | P07, P10 | No |
| P12 | Production readiness | 7 | P00–P11 | **Activate server here** |
| P13 | Staging acceptance | 6 | P12 | Yes |
| P14 | Production release | 7 | P13 | Yes |

## 5. Cost and server strategy

Do **not** keep a paid VPS running during P04–P11. Use GitHub Actions and controlled local/CI services for application development and production-like validation. Activate server infrastructure at P12, then perform P13 staging and P14 production.

No prototype route, mock provider default, placeholder secret, fake product/customer/order truth or donor secret may cross into production.

## 6. Mandatory engineering rules

1. Never work directly on `main`.
2. Every phase uses `phase/sole-pNN-<slug>`.
3. Record exact `START_SHA` and accepted `END_SHA`.
4. Never force-push, rebase, amend or rewrite published history.
5. Development, preview/staging and production are separate environments.
6. Every deploy records exact SHA, release strategy and rollback target; QA is not production.
7. Production deploys use immutable `/var/www/sole/{releases,current,shared}`; never edit `current` directly.
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

**P04 — Size & Fit Intelligence** is the next dependency-ready phase after frontend PR #37 closure is merged.

Start P04 only from the verified post-P03 frontend and backend `main` SHAs. P04 must preserve P02 catalog/media truth and P03 customer privacy/session boundaries, and must represent fit recommendations with honest confidence/uncertainty.

## 9. Acceptance baseline

P03 backend evidence is green across functional exact-head, initial post-merge, privacy-contract exact-head and final post-merge gates. Frontend security audit is wired into the permanent production-program gate. Exact closure-head Frontend CI and final frontend merge SHA are recorded externally on PR #37 and issue #36 because those values are created only after this closure document exists.
