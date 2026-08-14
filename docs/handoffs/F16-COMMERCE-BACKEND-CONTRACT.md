# F16 Handoff — Commerce Backend Contract

- Baseline: `integration/sole-frontend-v2@30326e736c7c823f594a691255bb3f6f4175bdba`
- Branch: `phase/sole-f16-commerce-backend-contract`
- Scope: canonical contract only; no backend success is implemented or claimed.

Delivered: domain authority and invariants, seven explicit state machines, transaction/outbox/audit rules, stable errors, session/CSRF/idempotency/version contracts, and OpenAPI operations for catalog, cart, checkout/reservation, payment, orders and returns.

Implementation remains blocked on the selected runtime/database, approved business policies, providers and production secrets. It must pass concurrency, replay, reconciliation, redaction, backup and recovery gates before frontend integration.
