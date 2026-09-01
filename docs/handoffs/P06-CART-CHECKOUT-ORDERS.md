# P06 — Cart, Checkout & Orders Handoff

## Phase record

- PHASE: P06
- STATUS: IN PROGRESS
- START_SHA: `1b7798e94dc4cb9b8b03972e26e8e9dcf8dafb0f`
- END_SHA: pending exact accepted implementation
- BRANCH: `phase/sole-p06-cart-checkout-orders`
- PR: pending
- BACKEND_START_SHA: `8be9f01223908eb3359512b213a0b835f43cadfa`
- BACKEND_END_SHA: pending

## Scope

- P06.1 capability-scoped guest cart with authenticated ownership adoption
- P06.2 server-authoritative variant price, availability, quantity and cart totals
- P06.3 authenticated checkout with owned address and authoritative shipping policy
- P06.4 UUID idempotency fingerprint and deterministic checkout recovery
- P06.5 transactional multi-location inventory reservation and automatic expiry release
- P06.6 durable append-only order state/events plus customer order history
- P06.7 production-only cart/checkout/account integration, permanent gates and closure evidence

## Exclusions

P07 owns payment providers, payment success, shipping quotes/adapters, fulfillment, refunds and returns. P06 does not activate a production server, mutate production data, enroll credentials, fabricate discounts or claim payment success.

## Acceptance evidence

Pending exact-head backend/frontend CI. Existing F7 visual baseline remains cumulative; P06 adds production source/contract gates and production build/runtime coverage without increasing performance budgets.

## Official references

- https://laravel.com/docs/13.x/database#database-transactions
- https://laravel.com/docs/13.x/queries#pessimistic-locking
- https://laravel.com/docs/13.x/sanctum
- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/

## Rollback impact

Frontend rollback target is START_SHA. Backend rollback target is BACKEND_START_SHA. No production activation or production data mutation occurs in P06.

## Next phase

P07 — Payment, Shipping & Returns after P06 exact-head acceptance and merge.
