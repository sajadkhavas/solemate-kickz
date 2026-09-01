# P05 — Discovery & PDP Conversion Handoff

## Phase identity

- PHASE: `P05 — Discovery & PDP Conversion`
- STATUS: `COMPLETED / ACCEPTED IMPLEMENTATION`
- START_SHA: `aac48e32dec082a4e79ae9c703c2a214e8fa1a68`
- END_SHA: `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`
- BRANCH: `phase/sole-p05-discovery-pdp-conversion`
- PR: `sajadkhavas/solemate-kickz#42`
- Tracking issue: `sajadkhavas/solemate-kickz#41`
- Backend repository: `sajadkhavas/sole-backend`
- Backend START_SHA: `3bdfac22c1aebf6f218c786cfbe7805a0c496505`
- Backend accepted END_SHA: `5ebab6b3b48407a23f9d1736d32ca91accbb626c`
- Backend merge SHA: `8be9f01223908eb3359512b213a0b835f43cadfa`
- Backend PR: `sajadkhavas/sole-backend#9`

P05 depends on the accepted P02 media/catalog boundary and P04 size/fit boundary. It does not take ownership of cart/order authority, payment/shipping, verified review publication, or notification delivery.

## SCOPE

### P05.1 — Authoritative discovery

Production search, filters/facets, availability, price and size filters, sorting and pagination are server-owned. TanStack Router validated search state is passed through `loaderDeps`, so browser Back/Forward and deep links remain first-class state rather than hidden component state. Development fixtures stay available only outside Production.

Published products with active variants remain discoverable when sold out. Production does not replace a failed official catalog request with fixture product truth.

### P05.2 — Recovery and merchandising truth

No-result recovery may return a bounded spelling suggestion; it never silently changes the query or invents a product result. Merchandising priority is an explicit operator-controlled backend integer. The storefront labels this mode as store merchandising, never as popularity, customer demand, urgency or scarcity.

### P05.3 — PDP decision support

PDP product truth includes per-variant price and available quantity. Production add-to-cart enablement and quantity limits use the selected authoritative variant while retaining the accepted client safety ceiling.

Decision support fails closed where later phases own the evidence:

- social proof remains unavailable until verified P08 review evidence exists;
- delivery timing remains unverified until authoritative P07 fulfillment data exists;
- return conditions remain unverified until an authoritative P07/P08 policy and workflow exists.

No fabricated rating, review count, delivery promise, scarcity claim or return promise is rendered.

### P05.4 — Related inventory and interaction state

Related products are backend-ranked from published authoritative inventory in Production. Recently viewed products remain device-local and explicitly separate from ranking authority. Discovery filters, sort, pagination, mobile filter dialogs and PDP selection states retain accessible labels and keyboard-compatible controls.

### P05.5 — Back-in-stock intent

An unavailable selected variant may expose a purpose-specific back-in-stock form. The form requires an email and explicit consent for that exact variant. Backend storage normalizes the email, stores a SHA-256 hash for idempotency and uses Laravel encrypted casting for the contact value at rest. Variant ownership is verified and an already-available variant is rejected.

P05 records intent only. Notification delivery and orchestration remain deferred to P09, and the UI does not promise when a notification or restock will occur.

### P05.6 — Permanent quality gates

P05 is permanently chained into the single cumulative `Frontend CI` through `audit:production-program`. That gate executes the P05 source audit, browser behavior regression and locked Prettier check. The aggregate verifier also requires the `p05-discovery-pdp` report fragment, so P05 evidence cannot silently disappear from future cumulative acceptance runs.

The temporary standalone P05 workflow used during diagnosis was removed before acceptance; final CI topology retains the Foundation invariant of one permanent quality workflow.

## EXCLUSIONS

- Cart, checkout and order authority — P06.
- Payment, shipping and return workflows/providers — P07.
- Verified customer review publication and support/policy operations — P08.
- Notification delivery/orchestration, frequency caps and channels — P09.
- Production server activation, production data migration or provider credential enrollment — P12+.

## FILES_CHANGED

Primary frontend surfaces include the P05 discovery server/runtime mapper, catalog search state and filters, `/products`, `/product/$id`, `/api/catalog`, `ProductPurchasePanel`, P05 source/browser audits, cumulative production-program audit and cumulative evidence verifier. Historical F4/F5, F6, F7 and F13 audits were evolved only where P05 introduced stricter authoritative variant/catalog truth while retaining their original safety contracts.

Primary backend surfaces in PR #9 include authoritative catalog querying/facets/sort/recovery, per-variant decision-support resources, related products, `merchandising_priority`, back-in-stock intent capture/storage, Filament merchandising controls, OpenAPI 1.2 and permanent tests/migration coverage.

## DEPENDENCIES

- P02 — Media & Catalog Ingestion: completed.
- P04 — Size & Fit Intelligence: completed.
- Backend P05 PR #9: merged as `8be9f01223908eb3359512b213a0b835f43cadfa`.

## COMMANDS / PERMANENT GATES

- `node scripts/audit-p05-discovery-pdp.mjs`
- `node scripts/qa/retry-gate.mjs -- node scripts/test-p05-discovery-pdp.mjs`
- locked `prettier --check` over the P05 source/handoff set
- `bun run audit:production-program`
- `bun run typecheck`
- `bun run lint`
- cumulative format checks
- `bun run build`
- `bun run qa:perf:f12`
- `bun run build:vps`
- `bun run qa:production-runtime`
- cumulative browser and visual QA suites
- `bun run audit:f0-f1`
- `bun run verify:cumulative`
- final clean-tree verification

## QA_RESULT

PASS.

- Frontend accepted implementation: `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`.
- Frontend CI #1160 / run `33497008084`: PASS across the complete cumulative job, including permanent P05 source/browser/format enforcement, TypeScript, lint, all format gates, production build, unchanged F12 budgets, VPS build, production runtime smoke, all visual QA suites, Foundation completion, aggregate verification requiring P05 evidence and clean-tree verification.
- Backend exact-head quality #34 / run `33489508558`: PASS.
- Backend post-merge main quality #35 / run `33494159795`: PASS.
- Closure exact-head Frontend CI is recorded on PR #42 and issue #41 after this self-referential documentation closure commit.

## CI_RUN_IDS

- Frontend accepted implementation: `33497008084`.
- Backend exact head: `33489508558`.
- Backend post-merge main: `33494159795`.
- Frontend documentation closure: recorded on PR #42 and issue #41.

## ROUTES_VIEWPORTS

P05 browser regression covers `/products` URL-backed availability, merchandising state and deep links plus PDP decision/variant behavior. The accepted cumulative CI additionally passed all existing mobile/desktop visual suites for Foundation, navigation/search, content, homepage, catalog, PDP, cart/checkout, account/wishlist and motion/3D surfaces.

## ACCESSIBILITY

- Search/filter/sort state remains URL-backed and keyboard-compatible.
- Mobile filtering retains an accessible dialog pattern.
- Filter buttons expose pressed state and shared touch-target contracts.
- PDP selection and back-in-stock controls retain explicit labels and consent semantics.
- Existing forced-colors, reduced-motion and 44px interaction foundations remain green in cumulative QA.

## PERFORMANCE

The accepted F12 limits were not raised. Frontend CI #1160 passed the unchanged deterministic build budgets; P05 did not move model-viewer into non-3D routes and introduced no production performance-budget exception.

## SECURITY / PRIVACY

- Production product/search/availability authority remains backend-owned and fails closed rather than falling back to fixture truth.
- Back-in-stock variant ownership and current availability are verified server-side.
- Back-in-stock email is purpose-specific, consented and encrypted at rest; a SHA-256 normalized-email hash provides idempotency.
- No notification is sent in P05.
- No production secrets, provider credentials or production server/data mutation occurred.

## KNOWN_LIMITATIONS

- Verified social proof is intentionally unavailable until P08.
- Authoritative fulfillment timing and return workflow remain deferred to P07/P08.
- Back-in-stock delivery remains deferred to P09.
- Cart/order authority remains deferred to P06.

## OUT_OF_SCOPE_FINDINGS

The cumulative CI exposed legacy F7/F13 source-contract assumptions that required a literal client-only quantity cap. Those audits were updated to accept either the legacy contract or P05's stricter `min(client safety ceiling, authoritative available quantity)` contract without weakening the maximum quantity safeguard. The cumulative Foundation audit also exposed that a second permanent workflow violated the one-quality-workflow invariant; P05 was therefore integrated into the existing production-program gate and the temporary standalone workflow was removed.

## ROLLBACK_IMPACT

Frontend rollback target is `aac48e32dec082a4e79ae9c703c2a214e8fa1a68`. Backend rollback target is pre-P05 main `3bdfac22c1aebf6f218c786cfbe7805a0c496505`. Frontend rollback removes the P05 discovery mapper/BFF, backend-owned related inventory, per-variant decision UI and waitlist form while restoring the accepted P04 storefront. Backend rollback removes P05 merchandising/back-in-stock additions; it does not alter orders, payments, inventory ledger balances, media, authentication or P04 fit data.

## OFFICIAL_REFERENCES

- Laravel 13 validation: `https://laravel.com/docs/13.x/validation`
- Laravel 13 Eloquent encrypted casts: `https://laravel.com/docs/13.x/eloquent-mutators#encrypted-casting`
- Laravel 13 encryption: `https://laravel.com/docs/13.x/encryption`
- TanStack Router search params: `https://tanstack.com/router/latest/docs/guide/search-params`
- TanStack Router data loading / `loaderDeps`: `https://tanstack.com/router/latest/docs/guide/data-loading`
- W3C WAI-ARIA Authoring Practices: `https://www.w3.org/WAI/ARIA/apg/patterns/`

## NEXT_PHASE

`P06 — Cart, Checkout & Orders` is next in the registered execution order. P06 starts only from verified post-P05 frontend/backend `main` SHAs after PR #42 is merged and issue #41 is closed.
