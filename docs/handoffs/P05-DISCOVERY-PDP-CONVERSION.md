# P05 — Discovery & PDP Conversion Handoff

## Phase identity

- Phase: `P05 — Discovery & PDP Conversion`
- Frontend repository: `sajadkhavas/solemate-kickz`
- Backend repository: `sajadkhavas/sole-backend`
- Frontend START_SHA: `aac48e32dec082a4e79ae9c703c2a214e8fa1a68`
- Backend START_SHA: `3bdfac22c1aebf6f218c786cfbe7805a0c496505`
- Tracking issue: `sajadkhavas/solemate-kickz#41`
- Backend PR: `sajadkhavas/sole-backend#9`
- Frontend branch: `phase/sole-p05-discovery-pdp-conversion`
- Backend branch: `phase/sole-p05-discovery-pdp-conversion`

P05 depends on the accepted P02 media/catalog boundary and P04 size/fit boundary. It does not take ownership of cart/order authority, payment/shipping, verified review publication, or notification delivery.

## P05.1 — Authoritative discovery

Production search, filters/facets, availability, price and size filters, sorting and pagination are server-owned. TanStack Router validated search state is passed through `loaderDeps`, so browser Back/Forward and deep links remain first-class state rather than hidden component state. Development fixtures stay available only outside Production.

Published products with active variants remain discoverable when sold out. Production does not replace a failed official catalog request with fixture product truth.

## P05.2 — Recovery and merchandising truth

No-result recovery may return a bounded spelling suggestion; it never silently changes the query or invents a product result. Merchandising priority is an explicit operator-controlled backend integer. The storefront labels this mode as store merchandising, never as popularity, customer demand, urgency or scarcity.

## P05.3 — PDP decision support

PDP product truth now includes per-variant price and available quantity. Production add-to-cart enablement and quantity limits use the selected authoritative variant rather than whole-product fixture state.

Decision support fails closed where later phases own the evidence:

- social proof remains unavailable until verified P08 review evidence exists;
- delivery timing remains unverified until authoritative fulfillment data exists;
- return conditions remain unverified until an authoritative policy/workflow exists.

No fabricated rating, review count, delivery promise or return promise is rendered.

## P05.4 — Related inventory and interaction state

Related products are backend-ranked from published authoritative inventory in Production. Recently viewed products remain device-local and are explicitly separate from ranking authority. Discovery filters, sort, pagination, mobile filter dialogs and PDP selection states retain accessible labels and keyboard-compatible controls.

## P05.5 — Back-in-stock intent

An unavailable selected variant may expose a purpose-specific back-in-stock form. The form requires an email and explicit consent for that exact variant. Backend storage normalizes the email, stores a SHA-256 hash only for idempotency and uses Laravel encrypted casting for the contact value at rest. Variant ownership is verified and an already-available variant is rejected.

P05 records intent only. Notification delivery and orchestration are explicitly deferred to P09, and the UI does not promise when a notification or restock will occur.

## P05.6 — Permanent quality gates

Permanent P05 evidence includes:

- backend OpenAPI 1.2 contract and feature regression tests;
- MySQL migration/rollback and full backend quality gate;
- frontend P05 source-contract audit;
- P05 browser behavior regression for URL-backed availability, merchandising truth and deep links;
- existing cumulative Frontend CI for typecheck, lint, build, browser, visual, SEO, performance-budget and VPS runtime regressions;
- exact-head review before merge and zero unresolved review threads at closure.

## Official references reviewed

- Laravel validation: `https://laravel.com/docs/13.x/validation`
- Laravel Eloquent encrypted casts: `https://laravel.com/docs/12.x/eloquent-mutators#encrypted-casting`
- Laravel encryption: `https://laravel.com/docs/12.x/encryption`
- TanStack Router search params: `https://tanstack.com/router/latest/docs/framework/react/guide/search-params`
- TanStack Router data loading / loader dependencies: `https://tanstack.com/router/latest/docs/framework/react/guide/data-loading`
- W3C WAI-ARIA Authoring Practices: `https://www.w3.org/WAI/ARIA/apg/patterns/`

## Rollback impact

Frontend rollback removes the P05 discovery mapper/BFF, backend-owned related inventory, per-variant decision UI and waitlist form while restoring the accepted P04 storefront. Backend rollback drops only `back_in_stock_intents` and `products.merchandising_priority`; it does not modify orders, payments, inventory ledger balances, media, authentication or P04 fit data.

## Closure evidence

Implementation is not considered accepted by this handoff until exact frontend/backend END_SHAs, successful workflow runs, merged PRs and the closed tracking issue are recorded in the closure commit.
