# SOLE — Solemate Kickz

Production-oriented sneaker commerce platform.

> **Start here:** Every contributor and AI chat must read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [AGENTS.md](./AGENTS.md) before planning or changing the project.

## Current state

- Frontend program **F0–F18: completed and released to `main`**
- Production program **P00–P13: implementation accepted; P13 closure in progress**
- P13 frontend implementation `20d804b07cd81262c48f4cbc0bd0731571e4c8d6` passed all 137 steps in Frontend CI #1317 / `33979524608`; PR #68 owns closure
- P13 backend `915510e6d599e86fb7dba5082a9ebcc658b3ae70` passed Backend Quality #76 / `33979809586`; PR #17 merged as `c65830c6eeae24ef42989feadffd8f4b22e99230`
- P12 frontend PR #65 merged as `19228db8999c8e27c140ba4d56081246db3aad80`; closure CI #1311 / `33975276629` passed all 137 steps
- P12 backend PR #16 merged as `8d865cfe6ef7e533badc4bfa16aef6d0cd5c397c`; post-merge Backend Quality #73 / `33975335840` passed
- Remaining technical phase after P13 closure: **P14 Demo VPS Deployment & Final Acceptance**
- P11 frontend accepted implementation: `aac9ebd657b406b47e15ce259d97d13136dc76ae`; Frontend CI #1284 / run `33730146775` PASS on all 137 steps; PR #62 merged as `782f49c026e245044d889ab2d98583649b323afc`
- P11 backend accepted implementation: `d1f10f60977f4b007e3bd2950082c28b4873f221`; Backend Quality #67 / run `33729120674` PASS; PR #15 merged as `88283eff2237a4cbc6f36f3e20960329420e64c0`; post-merge Quality #68 / run `33729319234` PASS
- P11 delivers W3C request correlation, privacy-safe RED/error telemetry, explicit-consent first-party RUM, server-authoritative funnel evidence and governed CRO experiments
- P11 performed no production activation, production-data mutation or provider credential enrollment
- P10 frontend accepted implementation: `3eace6accffc0d50cfa355ef0fc75361aab40869`; Frontend CI #1263 / run `33649237103` PASS on the exact head; PR #59 merged as `8f5f5de1c001bb7d659119cb67ccda95fb0e143b`
- P10 backend accepted implementation: `cb2a0173e16cb26a30639bf8cfe0cb4b7ab97620`; Backend Quality #60 / run `33649233597` PASS; PR #14 merged as `d06e4922a7aad1aac17f34c3315e0694f35bc42c`
- P10 delivers governed draft/review/publish/rollback content, backend-owned SEO route/redirect policy, SSR canonical/robots/schema, segmented published-truth sitemaps and readiness-only merchant output
- P10 performed no production activation, production-data mutation, credential enrollment or merchant-provider submission
- P09 frontend accepted implementation: `11e84a91da8c516504389f4f3374eb014cb707a7`; Frontend CI #1247 / run `33636810572` PASS on the exact head; PR #56 merged as `2a0802624ebd2e477d6c0cf89dce27bf25d8e6ed`
- P09 backend accepted implementation: `293f6432e790a9874b979ae30961fb9cd258bad7`; Backend Quality #54 / run `33611927354` PASS; PR #13 merged as `6b9fef79ee0585423b7f763974f87c82a67c9cf1`
- P09 delivers backend-owned durable wishlist and safe legacy migration, explicit notification preferences/unsubscribe/quiet-hours/frequency caps, durable lifecycle signal/outbox and delivery audit with fail-closed adapters, and a server-authoritative idempotent loyalty ledger with read-only production UI
- P09 live provider credentials/activation, fabricated delivery evidence, client-authoritative loyalty balances and production-data mutation remain forbidden
- P08 frontend accepted implementation: `941192bcb19d6cd157ab6ba89926a90595284209`; Frontend CI #1221 / run `33601208706` PASS; PR #51 merged as `846101e7480d09903efd879c8db61b1b375b98e5`
- P08 backend accepted implementation: `a9ab4df60160963bb998cfc3be10cac54a774a87`; Backend Quality #50 / run `33601878601` PASS; PR #12 merged as `63409594be2b60083401c997fe71bbacb7209e5f`
- P07 frontend accepted implementation: `f9ecafa36065fc3349cb283889e0618b25c119d6`; Frontend CI #1214 / run `33555570220` PASS; PR #48 merged as `caa1c0baf5a20f56251b87fab995cac4f508f1d0`
- P07 backend accepted implementation: `63ce16267a489f56736419edeac3f683125dc2da`; Backend Quality #44 / run `33551751760` PASS; PR #11 merged as `0abe7ce7c6cea34107f15d0d67e046942e428fcb`
- P06 frontend accepted implementation: `cbb5c014a22878f0efde05fccbf3995e89c5570a`; Frontend CI #1181 / run `33532454934` PASS; PR #45 merged as `93d145deac79aebcdfd406f44aefc0da170cb494`
- P06 backend accepted implementation: `752e044337b24cbc4b3c1e84f72d466bc186a1ce`; Backend Quality #36 / run `33530472189` PASS; PR #10 merged as `269616149acbd8977fd55c2bfde6fd65bffbe45a`
- P05 frontend accepted implementation: `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`; Frontend CI #1160 / run `33497008084` PASS; final frontend main `48085b8f48574f7520eeda7c1b898320847b5bcc`
- P05 backend final merged `main`: `8be9f01223908eb3359512b213a0b835f43cadfa`; post-merge quality run `33494159795` PASS
- Backend: [`sajadkhavas/sole-backend`](https://github.com/sajadkhavas/sole-backend), Laravel 13 + Filament 5 + PHP 8.3+ + MySQL
- Frontend: TanStack Start / React full-document SSR / Node production runtime
- Production customer sign-in: Google OAuth through backend-owned secure session; normalized Iranian mobile required for account completion
- Retained OTP: production feature-gated and **OFF by default**
- P04 size guidance is source-backed, confidence-aware and never persists raw foot length
- P05 discovery/search/filter/sort/availability and PDP variant truth are backend-authoritative in Production
- P06 guest cart capability, authoritative price/inventory/checkout, idempotent order creation, expiring reservation and real customer order history are complete
- P07 verified-payment, authoritative shipping, fulfillment, returns and refund-request lifecycle is complete; live providers remain fail-closed
- P08 governed trust content, owned support, authoritative tracking, truthful communications and moderated verified reviews are complete
- P09 loyalty/CRM/notification policy is complete with server authority and fail-closed delivery adapters
- P10 SEO/content/merchant readiness is complete with published-truth authority and fail-closed indexing/feed behavior
- P13 completes the least-privilege manager operations surface; real-server execution remains intentionally preserved for P14

P02 established backend-authoritative catalog/media truth. P03 established backend-authoritative customer identity, profile/address ownership, consent and privacy workflows. P04 added source-backed size/fit guidance. P05 converted discovery and PDP decision surfaces to authoritative production catalog/variant truth. P06 established authoritative cart, checkout, reservation and orders. P07 added verified-payment, shipping quote, fulfillment, return and refund-request lifecycle boundaries. P08 added governed trust facts, support ownership, post-purchase tracking/communications and moderated verified reviews. P09 added durable customer engagement, policy-governed notification orchestration and server-authoritative loyalty. P10 added governed content publication, backend-owned SEO policy, segmented sitemaps and verified merchant-feed readiness. P11 adds privacy-safe first-party observability, consented RUM, authoritative funnel evidence and governed CRO without production activation.

Payment success requires Backend provider verification; shipping, returns and refund requests are durable and server-authoritative. Live charge/refund, carrier and notification-provider activation remain intentionally unavailable until controlled production readiness.

The authoritative progress matrix, exact SHAs, CI evidence, engineering rules and mandatory handoff procedure live in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

Detailed evidence remains in:

- [Frontend and production handoffs](./docs/handoffs/)
- [Production completion roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md)
- [Production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md)
- [Machine-readable production phase registry](./contracts/production-phase-registry.json)
