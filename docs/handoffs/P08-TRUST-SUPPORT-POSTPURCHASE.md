# P08 — Trust, Support & Post-purchase

Status: IMPLEMENTED — closure evidence pending exact-head CI and merge.

Frontend START_SHA: `613af206925eafa68f847ad2ebe5e46d0fa1a17a`

Backend START_SHA: `0abe7ce7c6cea34107f15d0d67e046942e428fcb`

## P08.1 Governed trust content

Production surfaces consume only Backend content that is published, approved and linked to provenance. Missing approval or provenance fails closed.

## P08.2 Owned support cases

Authenticated customers can create and inspect only their own cases. Initial and follow-up messages are durable append-only events. SLA disclosure is absent unless an authoritative `support_policy` is configured.

## P08.3 Authoritative tracking

The order detail retrieves owner-scoped order and shipment events from Backend; it does not infer delivery from browser state.

## P08.4 Transactional communication truth

Transactional messages are durable outbox records. The storefront displays `pending`, `sent` or `failed` as stored and never labels a pending message delivered.

## P08.5 Verified moderated reviews

Only an owned item from a fulfilled order is reviewable. A unique review starts `pending`; the storefront explicitly says it is not public before moderation.

## P08.6 Permanent verification

`audit:p08`, `test:p08`, format, typecheck, lint, production build and cumulative CI cover the P08 boundary. Backend feature tests cover fail-closed publication, cross-account access, policy-backed SLA, truthful communications and review eligibility.

## P08.7 Safety and operations

This phase does not activate a production server, mutate production data, enroll credentials, send an external notification, publish unmoderated reviews, or invent legal/SLA commitments.

Closure fields remain pending until the implementation and closure commits pass exact-head CI and their PRs merge.
