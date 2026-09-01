# SOLE Project Status — Authoritative Chat Handoff

**Repository:** `sajadkhavas/solemate-kickz`  
**Status last reconciled:** 2026-09-01  
**Current accepted frontend phase:** P03 — Authentication & Customer Security  
**P03 START_SHA:** `3a908fc6b7be87d7c0c06c85d7d2806be29b6fd1`  
**P03 accepted implementation END_SHA:** `7b4ca63494ec8d8f2557087f1d8d3b04707bf7c0`  
**P03 accepted implementation CI:** Frontend CI #1110 / run `33424062662` — PASS  
**P03 documentation-closure head:** `121f592a74748bd45cd008f7bde15f7419679365`  
**P03 closure CI:** Frontend CI #1118 / run `33475729167` — PASS  
**P03 frontend merge SHA:** `5da25a6faca25cc7b23f04efd7a779970afa66a5`  
**Backend final P03 main:** `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`

This file is the first handoff for a new contributor or AI chat. Live GitHub history/CI wins if any document becomes stale.

## 1. Read first

Before planning or changing SOLE:

1. Read this file.
2. Read root `AGENTS.md`.
3. Read `docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md`.
4. Read `docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md`.
5. Read the current phase handoff under `docs/handoffs/`.
6. Verify live frontend/backend default-branch SHAs and CI state.
7. Treat `contracts/production-phase-registry.json` as the machine-readable phase registry.

## 2. Architecture and truth

- Frontend: TanStack Start + React + TypeScript, SSR/streaming, Vite 8, pinned Node/Bun.
- Backend: `sajadkhavas/sole-backend`, Laravel 13 + PHP 8.3+ + Filament 5 + MySQL.
- Backend P03 final main: `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`.
- LBB donor: `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217` — read-only.
- Winimi donor: `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed` — read-only.
- Backend owns catalog, inventory, media, customer identity/session/profile/privacy truth.
- Development fixtures stay deterministic and development-only; fake product/customer/order truth must not enter production.

## 3. Completed work

Frontend F0–F18 are completed and released.

| Phase | Scope | Accepted evidence | State |
|---|---|---|---|
| P00 | Immutable production foundation | frontend `4a62f760ba4f4dee25075a9e9f39183d6b27d896` | Completed |
| P01 | Backend/admin/product truth | frontend PR #32; backend `c9e2f66bab300882e2306bcd52346a81fb1a2e6b` | Completed |
| P02 | Media/catalog ingestion | frontend `11c16357a846d01020f4774002ee11d8e63b2d2a`; backend `36eca2810495591b44f1f86c975f4ff287374e81` | Completed |
| P03 | Authentication/customer security | frontend END `7b4ca63494ec8d8f2557087f1d8d3b04707bf7c0`; CI `33424062662`; closure CI `33475729167`; merge `5da25a6faca25cc7b23f04efd7a779970afa66a5`; backend `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`; PR #37; issue #36 | Completed |

### P03 accepted outcomes

- first-party Sanctum customer session boundary
- Google OAuth customer sign-in with state/redirect hardening and session rotation
- admin/customer identity separation
- mandatory normalized Iranian mobile before account completion
- retained OTP security domain with TTL/attempt/replay/resend/rate limiting; production OFF by default
- Kavenegar adapter only behind explicit backend configuration
- backend-owned profile, address ownership and append-only consent history
- account export, deletion request/cancel and controlled pseudonymization
- privacy-safe User audit excluding customer name/email/password PII
- backend customer OpenAPI contract
- allow-listed same-origin TanStack auth BFF; no generic proxy
- production `/auth` and `/account` isolated from demo/local account authority
- lightweight production-only customer Navbar/Footer/mobile navigation without store/search/notification/demo authority
- Vite/Rolldown route-aware `entriesAware` shared splitting
- original F12 performance budgets retained; no budget increase
- full Frontend CI #1110 passed all cumulative source/behavior/visual/build/runtime/performance gates
- closure Frontend CI #1118 passed on exact documentation head
- frontend PR #37 merged; issue #36 closed completed
- no server activation, production data mutation or real provider credential enrollment in P03

## 4. Remaining production phases

P04–P14 remain: **11 phases / 68 planned steps**.

| Phase | Scope | Steps | Depends on | Server? |
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

Do not keep a paid VPS running during P04–P11. Use CI/local controlled services. P12 is the first production-server activation phase.

## 5. Mandatory engineering rules

1. Never work directly on `main`.
2. Every phase uses `phase/sole-pNN-<slug>`.
3. Record exact START_SHA and accepted END_SHA.
4. Never force-push, rebase, amend, squash or rewrite published history.
5. Keep development, preview/staging and production separate.
6. Every deploy records exact SHA, immutable release path and rollback target.
7. Never edit `/var/www/sole/current` directly; production uses `/var/www/sole/{releases,current,shared}`.
8. Acceptance includes relevant typecheck/lint/format/build, browser regression, production-like runtime smoke and mobile/desktop visual QA.
9. Own and terminate browser/runtime processes; port leaks are forbidden.
10. Routes own SEO metadata/canonical/robots/schema/sitemap behavior.
11. Performance/media budgets and Core Web Vitals are gates, not advisory targets.
12. Pin runtimes and validate env/service/health contracts before deploy.
13. Deployment evidence includes CURRENT_SHA, NEW_SHA, RELEASE_PATH, ROLLBACK_TARGET, health/public reachability and timestamps/actor.
14. Use current official primary documentation for implementation decisions and record it in handoffs.
15. Never claim a gate passed without exact run/command evidence.

## 6. Mandatory phase close workflow

For each future phase:

- verify dependency/baseline state on live GitHub
- branch from the exact START_SHA
- define scope/exclusions/acceptance/rollback before implementation
- keep work bounded and record out-of-scope findings
- run complete relevant gates
- record END_SHA, CI run IDs, results and limitations
- update `PROJECT_STATUS.md`, registry and phase handoff in the same PR
- merge only after exact-head CI/review acceptance
- record final main merge SHA in issue/PR closure metadata

Required handoff fields: `PHASE`, `STATUS`, `START_SHA`, `END_SHA`, `BRANCH`, `PR`, `SCOPE`, `EXCLUSIONS`, `FILES_CHANGED`, `DEPENDENCIES`, `COMMANDS`, `QA_RESULT`, `CI_RUN_IDS`, `ROUTES_VIEWPORTS`, `ACCESSIBILITY`, `PERFORMANCE`, `SECURITY`, `KNOWN_LIMITATIONS`, `OUT_OF_SCOPE_FINDINGS`, `ROLLBACK_IMPACT`, `OFFICIAL_REFERENCES`, `NEXT_PHASE`.

## 7. Next action

**P04 — Size & Fit Intelligence** is dependency-ready.

Start P04 only from the live verified post-P03 frontend and backend default-branch SHAs after this metadata reconciliation is merged. Preserve P02 catalog/media truth and P03 customer privacy/session boundaries. Fit recommendations must express uncertainty honestly rather than imply false certainty.

## 8. P03 acceptance baseline

P03 is fully closed. Frontend accepted implementation `7b4ca63494ec8d8f2557087f1d8d3b04707bf7c0` passed full CI #1110 / `33424062662` including unchanged F12 budgets. Documentation closure `121f592a74748bd45cd008f7bde15f7419679365` passed exact-head CI #1118 / `33475729167`. PR #37 merged as `5da25a6faca25cc7b23f04efd7a779970afa66a5`. Backend final P03 main is `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`. Issue #36 is closed as completed.