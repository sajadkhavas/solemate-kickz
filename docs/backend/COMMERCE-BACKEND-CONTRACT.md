# SOLE Commerce Backend Contract v1

Status: design contract only. No backend, inventory, payment, shipment or order success is implemented by this file.

## Authority and invariants

The backend is the sole authority for product publication, variant identity, price, currency, discount validity, stock, sellability, reservation, cart totals, checkout, order, payment, shipment, return and refund. Clients may cache presentation data but must revalidate every commercial decision.

- Money is integer minor units plus ISO-4217 currency. Currency, tax, shipping and rounding policy are configuration; never inferred by clients.
- Every sellable unit has immutable `variantId` and unique SKU. Product slugs and labels are not identifiers.
- Inventory uses an append-only ledger. `available = onHand - activeReservations`; direct client stock writes are forbidden.
- Cart and checkout responses contain server-calculated line and total snapshots plus a revision. Mutations require the expected revision.
- Checkout creates a bounded reservation. Expiry releases it exactly once.
- Order creation and payment initiation require `Idempotency-Key`; the same key and same request returns the original result, while a changed payload returns `IDEMPOTENCY_KEY_REUSED`.
- Provider unavailable, ambiguous callback or signature failure is fail-closed. Browser redirects never prove payment.
- All state transitions are allowlisted, actor-authorized, transactional and audit logged.
- PII and payment secrets never appear in logs, analytics, push payloads or idempotency records.

## Identity and session

Production authentication uses an opaque server-side session in `HttpOnly; Secure; SameSite=Lax` cookies. Mutations require CSRF protection, origin validation and authorization. Session IDs, OTPs and provider secrets are never stored in localStorage. Guest carts use an opaque signed cart token and merge through a server transaction after login.

## Canonical resources

| Resource  | Required truth                                                                          |
| --------- | --------------------------------------------------------------------------------------- |
| Product   | id, slug, title, brandId, categoryIds, status, publishedAt                              |
| Variant   | id, productId, SKU, size system/value, color, media, status                             |
| Price     | variantId, amountMinor, currency, compareAtMinor nullable, effective interval, revision |
| Inventory | variantId, onHand, reserved, available, revision                                        |
| Cart      | id, owner/guest token, lines, server totals, currency, revision, expiresAt              |
| Checkout  | id, cart revision, address snapshot, shipping quote, reservation, totals, state         |
| Order     | immutable commercial/address snapshots, totals, state, version                          |
| Payment   | provider reference, amount/currency, state, attempt, verifiedAt                         |
| Shipment  | carrier/service references, state, public tracking projection                           |
| Return    | eligible order lines, reason, evidence references, state                                |
| Refund    | payment/return references, amount, state, provider reference                            |

## State machines

### Reservation

`pending -> active -> consumed | expired | released`. Only checkout service activates; order transaction consumes; expiry worker expires; authorized cancellation releases. Terminal states cannot transition.

### Checkout

`draft -> validated -> reserved -> payment_pending -> completed`. Failure branches: `expired`, `cancelled`, `failed`. Validation must reprice and recheck inventory. `completed` requires a committed order; it is not set by the browser.

### Order

`pending_payment -> paid -> processing -> ready_to_ship -> shipped -> delivered`. Controlled exits: `payment_failed`, `cancelled`, `partially_refunded`, `refunded`. Paid orders cannot be deleted. Cancellation/refund eligibility is policy-driven and returned by the API.

### Payment

`created -> pending_provider -> authorized -> captured`. Failure branches: `failed`, `expired`, `cancelled`; post-capture: `partially_refunded -> refunded`. Only verified provider webhooks/callback verification may authorize/capture. Duplicate events are deduplicated by provider event ID.

### Shipment

`pending -> preparing -> handed_to_carrier -> in_transit -> delivered`. Exception states: `delivery_failed`, `returned_to_sender`, `cancelled`. Customer-facing tracking is a redacted projection.

### Return and refund

Return: `requested -> under_review -> approved | rejected -> received -> inspected -> resolved`. Refund: `requested -> pending_provider -> succeeded | failed`. Approval does not mean refunded. Exchange is a new fulfillment/reservation linked to the return, not a silent variant mutation.

## Transition contract

Every transition command declares resource version, actor, reason where required, idempotency key, and request correlation ID. The service validates current state, role, policy, financial/inventory preconditions and version; writes domain data, outbox event and audit record in one transaction; then returns the updated resource. Side effects run from the outbox and are idempotent.

## Error envelope

All non-2xx responses use:

```json
{
  "error": {
    "code": "INVENTORY_UNAVAILABLE",
    "message": "Human-safe localized message",
    "requestId": "req_...",
    "retryable": false,
    "fieldErrors": []
  }
}
```

Required stable codes include `UNAUTHENTICATED`, `FORBIDDEN`, `CSRF_INVALID`, `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_KEY_REUSED`, `PRICE_CHANGED`, `INVENTORY_UNAVAILABLE`, `RESERVATION_EXPIRED`, `CART_EMPTY`, `CHECKOUT_NOT_PAYABLE`, `PAYMENT_PROVIDER_UNAVAILABLE`, `PAYMENT_VERIFICATION_FAILED`, `TRANSITION_NOT_ALLOWED`, `RETURN_NOT_ELIGIBLE`, `RATE_LIMITED`, and `INTERNAL_ERROR`. Stack traces and provider payloads are never returned.

## Audit and events

Audit records contain immutable ID, timestamp, actor type/ID, action, resource type/ID, before/after state names, reason code, request ID, idempotency key hash and safe metadata. Sensitive fields are redacted. Domain events use an outbox with event ID, aggregate/version, schema version and occurredAt. Consumers deduplicate event IDs.

## Operational acceptance

Implementation is not production-ready until migrations, authorization tests, concurrency tests, idempotency replay tests, webhook signature/replay tests, reservation expiry tests, ledger reconciliation, OpenAPI conformance, audit redaction, backup/restore and failure-recovery runbooks pass against the exact deployment artifact.
