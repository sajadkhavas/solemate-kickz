# SOLE Production Completion Program

Program baseline: `main@6bb540d84ef3952937e03fee5b657b1446b02f47`
Registry: `contracts/production-phase-registry.json`
Rulebook: `docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md`

The frontend program F0-F18 is accepted as the visual and interaction baseline. The phases below turn that baseline into a truthful, operable commerce product. They are numbered `P00-P14` so frontend history remains intact.

## Execution order

| Phase | Branch                                       | Outcome                                                                                              | Depends on |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| P00   | `phase/sole-p00-production-foundation`       | Immutable delivery, environment validation, controlled Playwright, release ledger and rollback drill | F18        |
| P01   | `phase/sole-p01-backend-admin-product-truth` | Backend foundation, database, admin RBAC, audit trail and authoritative catalog/inventory            | P00        |
| P02   | `phase/sole-p02-media-catalog-ingestion`     | Secure image pipeline, product import, validation, variants and merchandising workflow               | P01        |
| P03   | `phase/sole-p03-auth-customer-security`      | OTP/session/customer accounts, consent, rate limits, privacy and recovery                            | P01        |
| P04   | `phase/sole-p04-size-fit-intelligence`       | Size chart, fit guidance, returns-informed sizing and honest uncertainty                             | P02, P03   |
| P05   | `phase/sole-p05-discovery-pdp-conversion`    | Real search/facets, ranking, PDP decision support, related products and waitlist                     | P02, P04   |
| P06   | `phase/sole-p06-cart-checkout-orders`        | Server-authoritative cart, inventory reservation, addresses, checkout and order state machine        | P02, P03   |
| P07   | `phase/sole-p07-payment-shipping-returns`    | Gateway, webhook verification, shipping quotes, fulfillment, returns and reconciliation              | P06        |
| P08   | `phase/sole-p08-trust-support-postpurchase`  | Verified policies, support operations, order tracking and transactional communications               | P07        |
| P09   | `phase/sole-p09-loyalty-crm-notifications`   | Consent-aware wishlist, back-in-stock, push/email/SMS orchestration and loyalty ledger               | P03, P07   |
| P10   | `phase/sole-p10-seo-content-merchant`        | CMS/editorial workflow, route SEO matrix, schema, sitemap and merchant-feed readiness                | P02, P08   |
| P11   | `phase/sole-p11-observability-rum-cro`       | Logs, metrics, traces, RUM, analytics taxonomy, funnel dashboards and experiment guardrails          | P07, P10   |
| P12   | `phase/sole-p12-production-readiness`        | Portable security/performance, backup/restore, runbook and deploy/rollback readiness                 | P00-P11    |
| P13   | `phase/sole-p13-admin-operations-acceptance` | Complete order/payment/shipping/returns/support/review/notification/loyalty admin operations and QA  | P12        |
| P14   | `phase/sole-p14-demo-vps-final-acceptance`   | Exact-SHA demo VPS deployment, full-system acceptance, recovery and portable release evidence        | P13        |

## Phase definitions

### P00 — Production foundation

Build the immutable release script, environment schemas for all three environments, release ledger, preview/production workflow separation, systemd process-group behavior, production-like Playwright server, port-leak detection, internal/public health checks and automatic rollback. Prove it on staging with two releases and a rollback. No commerce feature work is allowed in this phase.

### P01 — Backend, admin and product truth

Choose and register the backend/database architecture, migrations and ownership. Implement least-privilege admin authentication, RBAC, audit logs, products, variants, prices, inventory ledger and settings. The storefront must stop reading demo catalog data in production. Product truth, inventory truth and business configuration each have one authoritative source.

### P02 — Media and catalog ingestion

Implement signed upload, MIME/content validation, malware controls, image derivatives, alt-text workflow, import preview, duplicate detection, SKU/slug constraints, draft-review-publish states and safe rollback of catalog publications. Validate responsive image output and CDN/cache behavior.

### P03 — Authentication and customer security

Implement real OTP delivery, expiration, replay protection, rate limiting, secure sessions, customer profile/address data, consent history, account recovery and deletion/export workflows. Preview providers and test credentials are impossible to enable in production.

### P04 — Size and fit intelligence

Create brand/model size data, foot-measurement guidance, confidence-aware recommendations and fit feedback. Do not present an algorithm as certainty. Instrument size-guide usage and size-related returns without exposing personal measurements improperly.

### P05 — Discovery and PDP conversion

Connect search, filters, sort and availability to authoritative data. Add typo tolerance, no-result recovery, merchandising controls, comparison-ready product facts, verified social proof, delivery/return clarity, related inventory and consent-aware back-in-stock. Fake urgency, fabricated reviews and unsupported claims are prohibited.

### P06 — Cart, checkout and orders

Move price, discounts, shipping eligibility and totals to the server. Add idempotency, inventory reservation/expiry, address validation, checkout recovery and a durable order state machine. The client must never be the authority for money or stock.

### P07 — Payment, shipping and returns

Integrate the selected payment and shipping providers behind adapters. Verify signed webhooks, prevent duplicate capture, reconcile payment/order states, define refund and return state machines, create fulfillment events and test timeout, retry and partial-failure paths.

### P08 — Trust, support and post-purchase

Publish legally reviewed policies and verified business facts. Implement order tracking, transactional status communications, support case ownership, SLA and escalation. Product reviews become public only with a verified and moderated evidence model.

### P09 — Loyalty, CRM and notifications

Implement durable wishlist, back-in-stock, price/drop signals and lifecycle messaging with channel consent, frequency caps, unsubscribe, quiet hours and delivery audit. Loyalty uses a ledger with explicit earn/redeem/expire rules; it is not a cosmetic point counter.

### P10 — SEO, content and merchant readiness

Provide a governed CMS workflow and enforce SEO during every route/content change. Validate SSR metadata, canonicals, robots, schema, pagination/facets, sitemap segmentation, redirects and invalid states. Add product-feed readiness only from verified catalog/price/availability data.

### P11 — Observability, RUM and CRO

Create a versioned event taxonomy, privacy-aware analytics, server correlation IDs, structured logs, error monitoring, RED metrics, Core Web Vitals RUM and funnel dashboards. Experiments require a hypothesis, guardrails, sample plan and rollback; analytics must not block rendering or violate consent.

### P12 — Pre-server production readiness

Complete threat review, secret rotation plan, dependency/security gates, portable database backup/restore tooling, queue/retry policy, bundle/SSR limits, alert ownership, incident runbooks, release/rollback scripts, Nginx/systemd review and Git ownership bootstrap. Resolve every severity-1/2 readiness finding. Real-host execution evidence is mandatory in P14 and is not waived by pre-server acceptance.

### P13 — Admin Operations & Complete Platform Acceptance

Complete the Filament operational surface for orders, payments/reconciliation, shipments/tracking, returns/refunds, support, review moderation, notification delivery evidence and loyalty ledger operations. Enforce least privilege, explicit state transitions, immutable financial truth and append-only audit. Run backend authorization/state-machine/concurrency tests plus complete frontend cumulative acceptance without requiring a paid server.

### P14 — Demo VPS deployment & final acceptance

Deploy the exact accepted candidate to the low-cost integration/demo VPS through the real release mechanism. Run real-host inventory, capacity-envelope measurement, desktop/mobile E2E, provider-safe flows, webhook replay, process/port ownership, backup plus disposable restore, atomic activation/rollback, failure recovery, loopback/public health and observation. Record `CURRENT_SHA`, `NEW_SHA`, `RELEASE_PATH` and `ROLLBACK_TARGET`. Customer-specific production onboarding follows later as `C01` after a commercial contract.

## Definition of Done for every phase

- scope and exclusions approved before implementation;
- `START_SHA` recorded before the first change and `END_SHA` after the last change;
- branch and PR follow the registered name;
- environment, migration, rollback, SEO, performance, observability and security impacts are explicitly answered;
- unit/integration/browser/visual evidence matches the risk introduced;
- the exact head passes typecheck, lint, format, build and production-like preview;
- no mock, prototype, test provider, fake claim or secret reaches production code/config;
- docs, runbooks, API/schema contracts and acceptance evidence are updated;
- worktree stays unchanged during the final gate;
- downstream phases receive an exact accepted SHA, not an unverified branch name.

## Intentionally deferred

Do not prioritize a generic AI chatbot, forced account creation, decorative loyalty, fake scarcity, unverified reviews, excessive animation or a premature microservice split. They add operational and trust cost before product truth, checkout reliability and measurement exist.
