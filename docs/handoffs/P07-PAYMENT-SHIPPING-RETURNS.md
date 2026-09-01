# P07 — Payment, Shipping & Returns

## Phase identity

- Frontend START_SHA: `85557b3f2b34c49507c037dcd4a2a7596956b859`
- Backend START_SHA: `269616149acbd8977fd55c2bfde6fd65bffbe45a`
- Frontend branch: `phase/sole-p07-payment-shipping-returns`
- Backend implementation branch: `phase/sole-p07-payment-shipping-returns`
- Tracking issue: `#47`
- Backend implementation END_SHA: `63ce16267a489f56736419edeac3f683125dc2da`
- Backend Quality: run `#44` / `33551751760` — PASS
- Backend PR: `sajadkhavas/sole-backend#11` — MERGED
- Backend merge SHA: `0abe7ce7c6cea34107f15d0d67e046942e428fcb`
- Backend review threads before merge: `0`
- Frontend implementation PR: `#48`
- Frontend implementation END_SHA: `f9ecafa36065fc3349cb283889e0618b25c119d6`
- Frontend implementation CI: Frontend CI `#1214` / `33555570220` — PASS
- Frontend status: `COMPLETED / ACCEPTED / CLOSURE PENDING`

## P07.1 — Payment gateway adapter

- Payment provider is selected only through a Backend `PaymentGateway` contract.
- The default provider remains `disabled`.
- The implemented ZarinPal adapter uses documented request/verify fields and HTTPS provider handoff.
- No merchant credential is committed or enrolled by P07.

## P07.2 — Payment initiation and verification

- A durable payment attempt exists before provider initiation.
- UUID idempotency plus an immutable order/amount/currency/provider fingerprint prevents replay with changed input.
- Browser return parameters are validated but never treated as payment truth.
- `paid` requires Backend server-to-server verification, matching authority, exact amount/currency, live reservation and valid order state under locks.
- Duplicate verified callbacks are idempotent.

## P07.3 — Reconciliation and partial failure

- Provider timeouts and ambiguous verification never fabricate payment success.
- Reconciliation evidence is durable and append-only.
- Provider `already verified` without matching local paid evidence remains unresolved/manual-review rather than silently capturing an order.

## P07.4 — Authoritative shipping quote

- The storefront requests server-owned shipping quotes for the authenticated customer, active cart and owned address.
- Checkout consumes one unexpired, unconsumed quote and snapshots provider/service/amount on the order.
- No undocumented carrier API is invented. The first-party `configured` shipping adapter derives eligible services from audited Backend policy until an official carrier contract and credentials are available.

## P07.5 — Fulfillment lifecycle

- Provider shipment events enter only through the signed Backend boundary; they are not proxied through the storefront BFF.
- Exact raw body HMAC and idempotent event keys protect fulfillment mutation.
- Shipment state changes are controlled and auditable.
- Inventory remains reserved after payment and is committed atomically on first valid dispatch by decrementing both `on_hand` and `reserved`.
- A dispatched order cannot use the cancellation path; delivered orders progress to fulfilled.

## P07.6 — Returns and refunds

- Return requests require customer ownership and confirmed delivery.
- Return transitions are durable and controlled by Backend state machine.
- The Client never supplies a refund amount. Backend derives remaining refundable value from verified payment minus active/completed refund requests.
- Refund request UUID idempotency prevents duplicate reservation of refundable value.
- P07 does not claim or execute a live monetary provider refund. Provider refund execution stays deferred until controlled production provider activation.

## P07.7 — QA and closure

Backend acceptance is complete on exact implementation head `63ce16267a489f56736419edeac3f683125dc2da`; its Quality run `#44` / `33551751760` passed Pint, PHP syntax, MySQL migrate/fresh, rollback/re-migrate, SQLite and MySQL suites, inventory concurrency, route/operator boot, dependency audit and production config cache. Backend PR #11 was merged only after review-thread count was confirmed as zero.

Frontend acceptance is complete on exact implementation head `f9ecafa36065fc3349cb283889e0618b25c119d6`. Dedicated P07 Gate #11 / `33552361775` first passed the focused source, safety, regression, TypeScript, lint, format, production-build and performance checks. The temporary dedicated workflow was then removed and P07 was permanently chained into the single cumulative quality workflow. Frontend CI #1214 / `33555570220` passed all 72 steps on the final implementation head, including P07 audit/contracts, required P07 cumulative evidence, P06 regressions, production/VPS builds, runtime smoke, unchanged F12 budgets, all browser/visual/SEO/PWA suites, Foundation completion and clean-tree verification.

## Files, dependencies and commands

- Backend: payment/shipping adapters, attempts, reconciliation/events, shipment lifecycle, returns/refunds, migrations, command/operator surface, OpenAPI contract and feature/concurrency tests.
- Frontend: exact allow-listed commerce BFF extensions, typed commerce schemas/client, verified payment callback UI, authoritative shipping selection, lifecycle orders/returns/refunds and permanent P07 quality scripts.
- No new provider credential, production secret or live carrier dependency was added.
- Local and CI commands covered P07/P06 source and safety contracts, TypeScript, lint, Prettier, production build, F12 budgets, Laravel Pint/PHP syntax, SQLite/MySQL suites, migration rollback/re-migrate, inventory concurrency, routes, dependency audit and production configuration cache.

## Routes, accessibility and performance

- Production `/checkout` owns shipping quote selection, payment initiation and Backend verification of validated callback input.
- Production `/account?section=orders` owns shipment, tracking, return and refund lifecycle display/actions.
- Loading/error/status messages remain textual and keyboard-operable; the Browser never announces paid from query parameters alone.
- Accepted F12 budgets are unchanged. Exact-head CI kept the 3D module isolated and passed production/VPS build and all mobile/desktop visual gates.

## Known limitations and out-of-scope findings

- ZarinPal and external carrier credentials remain unenrolled and providers remain fail-closed until controlled production readiness.
- Live refund execution is intentionally deferred; P07 records the guarded refund request/reconciliation boundary without claiming monetary completion.
- Public support/SLA, customer communication and verified review workflows remain P08.

## Official references

- https://docs.zarinpal.com/paymentGateway/
- https://github.com/ZarinPal/zarinpal-php-sdk
- https://laravel.com/docs/13.x/database#database-transactions
- https://laravel.com/docs/13.x/queries#pessimistic-locking
- https://laravel.com/docs/13.x/http-client
- https://www.rfc-editor.org/rfc/rfc2104

## Security and truth boundaries

- The Browser cannot mark an order paid.
- Provider webhook credentials/secrets are Backend-only.
- Shipping provider webhook is not exposed through `/api/commerce/*`.
- The Browser never chooses refund amount.
- No live production charge, live refund, carrier activation, provider credential enrollment, production deployment or production-data mutation is permitted in P07.

## Rollback

- Frontend rollback target: `85557b3f2b34c49507c037dcd4a2a7596956b859`
- Backend rollback target: `269616149acbd8977fd55c2bfde6fd65bffbe45a`

Rollback removes P07 payment/shipping/return/refund lifecycle extensions while preserving the accepted P06 cart, checkout, reservation and order-history baseline. Database rollback is covered by the Backend migration rollback gate.

## Next phase

P08 — Trust, Support & Post-purchase, after P07 closure CI, zero unresolved review threads and merge.
