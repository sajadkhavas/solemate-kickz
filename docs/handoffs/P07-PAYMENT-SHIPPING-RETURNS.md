# P07 — Payment, Shipping & Returns

## Phase identity

- Frontend START_SHA: `85557b3f2b34c49507c037dcd4a2a7596956b859`
- Backend START_SHA: `269616149acbd8977fd55c2bfde6fd65bffbe45a`
- Frontend branch: `phase/sole-p07-payment-shipping-returns`
- Backend branch: `phase/sole-p07-payment-shipping-returns`
- Tracking issue: `#47`
- Backend PR: `sajadkhavas/sole-backend#11`
- Frontend implementation PR: recorded after exact-head acceptance
- Status during implementation: `IN PROGRESS`

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

Permanent acceptance includes:

- Backend Pint and PHP syntax;
- MySQL migrate/fresh, rollback and re-migrate;
- SQLite and MySQL regression suites;
- inventory concurrency and production config cache;
- P07 source audit and P07 safety-contract tests;
- evolved P06 cart/checkout/payment-truth regression;
- Frontend TypeScript, lint and selected-file Prettier gates;
- production/VPS build and runtime gates;
- unchanged F12 performance budgets and cumulative browser/visual/SEO/PWA gates;
- exact implementation SHAs and CI evidence recorded before closure;
- zero unresolved review discussion before merge.

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
