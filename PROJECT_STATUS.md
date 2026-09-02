# SOLE Project Status — Authoritative Chat Handoff

**Repository:** `sajadkhavas/solemate-kickz`  
**Status last reconciled:** 2026-09-02
**Current accepted frontend phase:** P08 — Trust, Support & Post-purchase
**P08 START_SHA:** `613af206925eafa68f847ad2ebe5e46d0fa1a17a`
**P08 accepted implementation END_SHA:** `941192bcb19d6cd157ab6ba89926a90595284209`
**P08 accepted implementation CI:** Frontend CI #1221 / run `33601208706` — PASS
**P08 documentation closure head:** `478fa70efca777e35e1703dd9a2cc12a621a1897`
**P08 documentation closure CI:** Frontend CI #1223 / run `33602638893` — PASS
**Frontend final P08 main:** `846101e7480d09903efd879c8db61b1b375b98e5`
**Backend final P08 main:** `63409594be2b60083401c997fe71bbacb7209e5f`
**P07 START_SHA:** `85557b3f2b34c49507c037dcd4a2a7596956b859`
**P07 accepted implementation END_SHA:** `f9ecafa36065fc3349cb283889e0618b25c119d6`
**P07 accepted implementation CI:** Frontend CI #1214 / run `33555570220` — PASS
**P07 documentation closure head:** `f17d96180c2248ccae1d1a617cf99a2307ca6376`
**P07 documentation closure CI:** Frontend CI #1216 / run `33557739574` — PASS
**Frontend final P07 main:** `caa1c0baf5a20f56251b87fab995cac4f508f1d0`
**Backend final P07 main:** `0abe7ce7c6cea34107f15d0d67e046942e428fcb`
**P06 START_SHA:** `1b7798e94dc4cb9b8b03972e26e8e9dcf8dafb0f`
**P06 accepted implementation END_SHA:** `cbb5c014a22878f0efde05fccbf3995e89c5570a`
**P06 accepted implementation CI:** Frontend CI #1181 / run `33532454934` — PASS
**P06 documentation closure head:** `b520b51fffb2fc020c21e66eb1cee8396dd3d726`
**P06 documentation closure CI:** Frontend CI #1183 / run `33533963751` — PASS
**Frontend final P06 main:** `93d145deac79aebcdfd406f44aefc0da170cb494`
**Backend final P06 main:** `269616149acbd8977fd55c2bfde6fd65bffbe45a`
**P05 START_SHA:** `aac48e32dec082a4e79ae9c703c2a214e8fa1a68`  
**P05 accepted implementation END_SHA:** `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`  
**P05 accepted implementation CI:** Frontend CI #1160 / run `33497008084` — PASS  
**P05 documentation closure head:** `3ce9f2ea4ff9703ac7960feb10a5c061746376ab`  
**P05 documentation closure CI:** Frontend CI #1168 / run `33498373681` — PASS  
**Frontend final P05 main:** `48085b8f48574f7520eeda7c1b898320847b5bcc`  
**Backend final P05 main:** `8be9f01223908eb3359512b213a0b835f43cadfa`  
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
- **Frontend P05 final main:** `48085b8f48574f7520eeda7c1b898320847b5bcc`, after accepted frontend PR #42.
- **Backend P05 final main:** `8be9f01223908eb3359512b213a0b835f43cadfa`, after accepted backend PR #9.
- **Primary donor reference:** `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217` — read-only.
- **Selective media donor reference:** `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed` — read-only.
- **Truth rule:** backend owns customer identity/session/profile/privacy truth as well as catalog/inventory/media/discovery truth. Donor data, donor secrets and donor history are never imported.

P02 established backend-authoritative catalog/media truth. P03 added backend-authoritative customer identity/profile/privacy and production route isolation for `/auth` and `/account`. P04 added source-backed fit guidance while raw foot length remains ephemeral. P05 makes Production search, filters/facets, sort, availability, pagination, related inventory and PDP variant decision truth backend-authoritative. Development fixtures remain deterministic and development-only.

Production does not fabricate order history, review counts/ratings, scarcity, delivery timing, return promises, payment success or notification delivery.

## 3. Completed work

### Frontend F0–F18

All frontend phases F0 through F18 are completed and released. Detailed accepted heads and evidence remain in `docs/handoffs/F*.md` and GitHub history.

### Production program

| Phase                | Scope                                | Evidence                                                                                                                                                                                                                                                         | State     |
| -------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Program registration | P00–P14 roadmap/registry             | frontend PR #24                                                                                                                                                                                                                                                  | Completed |
| P00                  | Immutable production foundation      | accepted implementation `4a62f760ba4f4dee25075a9e9f39183d6b27d896`                                                                                                                                                                                               | Completed |
| P01                  | Backend, admin and product truth     | frontend PR #32; backend merge `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`                                                                                                                                                                                        | Completed |
| P02                  | Media and catalog ingestion          | frontend accepted `11c16357a846d01020f4774002ee11d8e63b2d2a`; backend merge `36eca2810495591b44f1f86c975f4ff287374e81`                                                                                                                                           | Completed |
| P03                  | Authentication and customer security | frontend accepted `7b4ca63494ec8d8f2557087f1d8d3b04707bf7c0`, CI `33424062662`; backend final main `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`; frontend PR #37                                                                                                   | Completed |
| P04                  | Size and fit intelligence            | frontend accepted `a59e859331308fbfcf90efb1b29b9f03dc1e7dbb`, CI `33480367490`; backend main `3bdfac22c1aebf6f218c786cfbe7805a0c496505`; frontend PR #38                                                                                                         | Completed |
| P05                  | Discovery and PDP conversion         | frontend accepted `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`, CI `33497008084`; closure CI `33498373681`; frontend merge `48085b8f48574f7520eeda7c1b898320847b5bcc`; backend merge `8be9f01223908eb3359512b213a0b835f43cadfa`; frontend PR #42; issue #41 closed | Completed |
| P06                  | Cart, checkout and orders            | frontend accepted `cbb5c014a22878f0efde05fccbf3995e89c5570a`, CI `33532454934`; backend exact-head CI `33530472189`; backend merge `269616149acbd8977fd55c2bfde6fd65bffbe45a`; frontend PR #45; backend PR #10; issue #44                                        | Completed |
| P07                  | Payment, shipping and returns        | frontend accepted `f9ecafa36065fc3349cb283889e0618b25c119d6`, CI `33555570220`; focused CI `33552361775`; backend CI `33551751760`; backend merge `0abe7ce7c6cea34107f15d0d67e046942e428fcb`; frontend PR #48; backend PR #11; issue #47                         | Completed |
| P08                  | Trust, support and post-purchase     | frontend accepted `941192bcb19d6cd157ab6ba89926a90595284209`, CI `33601208706`; backend CI `33601878601`; backend merge `63409594be2b60083401c997fe71bbacb7209e5f`; frontend PR #51; backend PR #12; issue #50                                                   | Completed |

### P03 accepted outcomes

- first-party Sanctum customer session boundary;
- Google OAuth active customer sign-in with state/redirect hardening and session rotation;
- privileged admin/customer identity separation;
- normalized Iranian mobile required for complete customer accounts;
- retained OTP domain with TTL, attempts, replay/resend/rate-limit protection; production default OFF;
- real Kavenegar adapter available only behind explicit backend configuration;
- backend-owned profile, address ownership, append-only consent history, export/deletion workflows and controlled pseudonymization;
- privacy-safe User audit excluding customer name/email/password PII;
- backend OpenAPI customer contract and allow-listed same-origin TanStack auth BFF;
- production `/auth` and `/account` use lightweight customer-only shells without demo/store authority;
- unchanged F12 performance budgets after route-aware Vite/Rolldown splitting;
- real orders remain deferred to P06.

### P04 accepted outcomes

- source-backed one-per-product size guides with draft/published state;
- Filament management for model-specific EU size ranges and provenance;
- ephemeral foot-length calculation; raw measurement never reaches storage or analytics;
- confidence-aware recommendation with explicit reason and non-guarantee disclosure;
- fail-closed PDP when a verified/source-backed chart is unavailable;
- authenticated fit feedback with product/variant ownership validation;
- allow-listed, idempotent, measurement-free fit instrumentation;
- accessible dialog/focus/live-announcement/44px controls;
- unchanged F12 performance budgets and no production/server activation.

### P05 accepted outcomes

- Production discovery search, filters/facets, availability, price/size filters, sorting and pagination are backend-authoritative.
- URL search state is validated and routed through TanStack `loaderDeps`; browser Back/Forward, refresh and deep links preserve discovery state.
- Published products with active variants remain discoverable when sold out; Production fails closed on official catalog failure instead of substituting fixture products.
- Bounded spelling recovery never silently changes the query or fabricates results.
- `merchandising_priority` is explicit operator-controlled ranking; UI labels it as store merchandising, never popularity, demand, urgency or scarcity.
- PDP uses authoritative selected-variant price, availability and quantity while retaining the existing client safety ceiling.
- Social proof, delivery timing and return claims fail closed until later phases provide authoritative evidence.
- Related products are backend-ranked in Production; recently viewed state remains device-local and separate from ranking authority.
- Back-in-stock intent requires explicit purpose-specific consent, verifies product/variant ownership and unavailability, encrypts the contact email at rest and uses a SHA-256 hash for idempotency; delivery remains deferred to P09.
- P05 is permanently chained into the single cumulative `Frontend CI` via the production-program audit: source contract, browser regression and locked Prettier check all run there.
- The cumulative verifier requires the `p05-discovery-pdp` report, preventing future removal of P05 behavior evidence.
- Legacy F7/F13 quantity audits were evolved to allow authoritative variant inventory to further restrict the unchanged maximum client safety cap.
- Temporary diagnostic/write-enabled workflows were removed before acceptance; Foundation's one-permanent-quality-workflow invariant is restored.
- Frontend CI #1160 / run `33497008084` passed the complete cumulative gate including P05 enforcement, typecheck, lint, all format gates, production build, unchanged F12 budgets, VPS build/runtime smoke, every visual QA suite, Foundation completion, aggregate evidence and clean-tree verification.
- Frontend closure CI #1168 / run `33498373681` passed on exact closure head `3ce9f2ea4ff9703ac7960feb10a5c061746376ab` before PR #42 merged as `48085b8f48574f7520eeda7c1b898320847b5bcc`.
- Backend exact-head quality #34 / run `33489508558` passed; PR #9 merged as `8be9f01223908eb3359512b213a0b835f43cadfa`; post-merge quality #35 / run `33494159795` also passed.
- Review threads were zero unresolved at frontend merge and tracking issue #41 was closed as completed.
- No production server activation, production data mutation or provider credential enrollment occurred.

### P06 accepted outcomes

- Guest carts use an opaque capability cookie and can be adopted by an authenticated customer; backend price, availability, quantity and totals are authoritative.
- Checkout requires an authenticated customer and owned address, fails closed without valid operator shipping policy, and creates the order once through UUID idempotency/fingerprint enforcement.
- Inventory is allocated across locations under deterministic transaction locks, reserved until expiry and released atomically on expiry/cancellation.
- Order lines and address/pricing snapshots are durable, state changes are controlled and events append-only; Production account order history is real rather than fixture-backed.
- The same-origin commerce BFF is exact-route allow-listed, forwards secure session/cart authority and stores the cart UUID only in an HttpOnly SameSite cookie.
- P06 is permanently chained into cumulative CI; accepted backend run `33530472189` and frontend run `33532454934` passed without changing performance budgets.
- Payment, shipping-provider fulfillment, refunds and returns remain P07; no production activation, data mutation or credential enrollment occurred.

## 4. Remaining production phases

### P07 accepted outcomes

- Payment initiation is idempotent and adapter-backed; browser callback parameters are untrusted and `paid` requires exact Backend server-to-server verification under locks.
- Ambiguous timeouts, duplicate callbacks and provider/local mismatches remain unresolved or manual-review rather than fabricating capture.
- Shipping quotes are server-owned, address/cart-bound, expiring and consumed once; checkout snapshots provider/service/amount.
- Signed idempotent fulfillment events drive controlled shipment state, commit reserved inventory on dispatch and prevent cancellation after dispatch.
- Returns require ownership and confirmed delivery; refund amount is derived only by Backend from verified payment and prior refunds.
- Live gateway refund, external carrier activation and credentials remain fail-closed; no Production charge/refund/deploy/data mutation occurred.
- P07 is permanently chained into the single cumulative quality workflow and its report is required by aggregate evidence; Backend run `33551751760` and Frontend run `33555570220` passed with unchanged F12 budgets.

P09–P14 remain: **6 phases and 38 planned steps**.

| Phase | Scope                           | Planned steps | Depends on | Server required?         |
| ----- | ------------------------------- | ------------: | ---------- | ------------------------ |
| P09   | Loyalty, CRM and notifications  |             6 | P03, P07   | No                       |
| P10   | SEO, content and merchant feeds |             6 | P02, P08   | No                       |
| P11   | Observability, RUM and CRO      |             6 | P07, P10   | No                       |
| P12   | Production readiness            |             7 | P00–P11    | **Activate server here** |
| P13   | Staging acceptance              |             6 | P12        | Yes                      |
| P14   | Production release              |             7 | P13        | Yes                      |

## 5. Cost and server strategy

Do **not** keep a paid VPS running during P06–P11. Use GitHub Actions and controlled local/CI services for application development and production-like validation. Activate server infrastructure at P12, then perform P13 staging and P14 production.

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
16. Keep the cumulative frontend quality topology to the accepted single permanent quality workflow unless the Foundation contract is intentionally changed in a controlled phase.

## 7. Mandatory phase close workflow

For every future phase:

- verify live GitHub dependency/baseline state;
- create the controlled phase branch from exact START_SHA;
- write scope/exclusions/acceptance/rollback before implementation;
- keep implementation bounded and record out-of-scope findings;
- run complete relevant gates;
- capture END_SHA, CI run IDs, results and limitations;
- update `PROJECT_STATUS.md`, registry and phase handoff in the same PR;
- merge only after exact-head CI/review acceptance;
- record final main merge SHA in issue/PR closure metadata.

Mandatory handoff fields remain: `PHASE`, `STATUS`, `START_SHA`, `END_SHA`, `BRANCH`, `PR`, `SCOPE`, `EXCLUSIONS`, `FILES_CHANGED`, `DEPENDENCIES`, `COMMANDS`, `QA_RESULT`, `CI_RUN_IDS`, `ROUTES_VIEWPORTS`, `ACCESSIBILITY`, `PERFORMANCE`, `SECURITY`, `KNOWN_LIMITATIONS`, `OUT_OF_SCOPE_FINDINGS`, `ROLLBACK_IMPACT`, `OFFICIAL_REFERENCES`, `NEXT_PHASE`.

## 8. Next action

**P09 — Loyalty, CRM & Notifications** is the next registered phase.

Start P09 from frontend `main` SHA `846101e7480d09903efd879c8db61b1b375b98e5` and backend `main` SHA `63409594be2b60083401c997fe71bbacb7209e5f` as exact baselines. P09 owns consent-aware wishlist, back-in-stock delivery orchestration and loyalty ledger work; Production activation remains deferred.

## 9. Acceptance baseline

P05 backend exact head `5ebab6b3b48407a23f9d1736d32ca91accbb626c` passed Backend quality #34 / run `33489508558`, merged through PR #9 as `8be9f01223908eb3359512b213a0b835f43cadfa`, and post-merge main passed quality #35 / run `33494159795`.

Frontend accepted implementation `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b` passed full Frontend CI #1160 / run `33497008084`, including the permanent P05 source/browser/format gate, unchanged F12 budgets, all cumulative browser/visual/SEO suites, production and VPS builds, runtime smoke, Foundation completion, P05-required aggregate evidence and clean-tree verification. Documentation closure head `3ce9f2ea4ff9703ac7960feb10a5c061746376ab` passed exact-head Frontend CI #1168 / run `33498373681`; frontend PR #42 then merged as `48085b8f48574f7520eeda7c1b898320847b5bcc` with zero unresolved review threads and issue #41 closed as completed.

P06 backend exact head `752e044337b24cbc4b3c1e84f72d466bc186a1ce` passed Backend quality #36 / run `33530472189` and merged through PR #10 as `269616149acbd8977fd55c2bfde6fd65bffbe45a`. Frontend accepted implementation `cbb5c014a22878f0efde05fccbf3995e89c5570a` passed full Frontend CI #1181 / run `33532454934`; closure head `b520b51fffb2fc020c21e66eb1cee8396dd3d726` passed CI #1183 / run `33533963751`, PR #45 merged as `93d145deac79aebcdfd406f44aefc0da170cb494`, and issue #44 closed as completed.

P07 backend exact head `63ce16267a489f56736419edeac3f683125dc2da` passed Backend Quality #44 / run `33551751760` and merged through PR #11 as `0abe7ce7c6cea34107f15d0d67e046942e428fcb`. Focused Frontend P07 Gate #11 / run `33552361775` passed before its temporary workflow was retired; final frontend implementation `f9ecafa36065fc3349cb283889e0618b25c119d6` passed permanent cumulative Frontend CI #1214 / run `33555570220`. Closure head `f17d96180c2248ccae1d1a617cf99a2307ca6376` passed CI #1216 / run `33557739574`; PR #48 merged as `caa1c0baf5a20f56251b87fab995cac4f508f1d0`, and issue #47 closed as completed.
