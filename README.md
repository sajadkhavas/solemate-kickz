# SOLE — Solemate Kickz

Production-oriented sneaker commerce platform.

> **Start here:** Every contributor and AI chat must read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [AGENTS.md](./AGENTS.md) before planning or changing the project.

## Current state

- Frontend program **F0–F18: completed and released to `main`**
- Production program **P00–P08: completed/accepted**
- Remaining production phases **P09–P14: registered**
- P08 frontend accepted implementation: `941192bcb19d6cd157ab6ba89926a90595284209`; Frontend CI #1221 / run `33601208706` PASS; PR #51
- P08 backend accepted implementation: `a9ab4df60160963bb998cfc3be10cac54a774a87`; Backend Quality #50 / run `33601878601` PASS; PR #12 merged as `63409594be2b60083401c997fe71bbacb7209e5f`
- P07 frontend accepted implementation: `f9ecafa36065fc3349cb283889e0618b25c119d6`; Frontend CI #1214 / run `33555570220` PASS; PR #48
- P07 frontend closure head: `f17d96180c2248ccae1d1a617cf99a2307ca6376`; closure CI #1216 / run `33557739574` PASS; PR #48 merged as `caa1c0baf5a20f56251b87fab995cac4f508f1d0`; issue #47 closed as completed
- P07 backend accepted implementation: `63ce16267a489f56736419edeac3f683125dc2da`; Backend Quality #44 / run `33551751760` PASS; PR #11 merged as `0abe7ce7c6cea34107f15d0d67e046942e428fcb`
- P06 frontend accepted implementation: `cbb5c014a22878f0efde05fccbf3995e89c5570a`; full Frontend CI #1181 / run `33532454934` PASS; PR #45
- P06 frontend closure head: `b520b51fffb2fc020c21e66eb1cee8396dd3d726`; closure CI #1183 / run `33533963751` PASS; PR #45 merged as `93d145deac79aebcdfd406f44aefc0da170cb494`; issue #44 closed as completed
- P06 backend accepted implementation: `752e044337b24cbc4b3c1e84f72d466bc186a1ce`; Backend quality #36 / run `33530472189` PASS; PR #10 merged as `269616149acbd8977fd55c2bfde6fd65bffbe45a`
- P05 frontend accepted implementation: `395fd1bd3d683f3fa8633b9a58d2a67a5195af5b`; full Frontend CI #1160 / run `33497008084` PASS
- P05 frontend closure head: `3ce9f2ea4ff9703ac7960feb10a5c061746376ab`; exact-head Frontend CI #1168 / run `33498373681` PASS
- Frontend P05 final merged `main`: `48085b8f48574f7520eeda7c1b898320847b5bcc`; PR #42 merged with zero unresolved review threads and issue #41 closed as completed
- Backend: [`sajadkhavas/sole-backend`](https://github.com/sajadkhavas/sole-backend), Laravel 13 + Filament 5 + PHP 8.3+ + MySQL
- Backend P05 final merged `main`: `8be9f01223908eb3359512b213a0b835f43cadfa`; post-merge quality run `33494159795` PASS
- Frontend: TanStack Start / React full-document SSR / Node production runtime
- Production customer sign-in: Google OAuth through backend-owned secure session; normalized Iranian mobile required for account completion
- Retained OTP: production feature-gated and **OFF by default**
- P04 size guidance is source-backed, confidence-aware and never persists raw foot length
- P05 discovery/search/filter/sort/availability and PDP variant truth are backend-authoritative in Production; unsupported review/delivery/return claims fail closed
- P05 back-in-stock intent requires explicit purpose-specific consent; notification delivery remains deferred to P09
- P05 permanent source/browser/format enforcement is chained into the single cumulative Frontend CI production-program gate, and aggregate evidence requires the P05 report
- P06 guest cart capability, authoritative price/inventory/checkout, idempotent order creation, expiring reservation and real customer order history are complete
- P07 verified-payment, authoritative shipping, fulfillment, returns and refund-request lifecycle is complete; live providers remain fail-closed
- P08 governed trust content, owned support, authoritative tracking, truthful communications and moderated verified reviews are complete
- Next phase: **P09 — Loyalty, CRM & Notifications**

P02 established backend-authoritative catalog/media truth. P03 established backend-authoritative customer identity, profile/address ownership, consent and privacy workflows. P04 added source-backed size/fit guidance. P05 converted discovery and PDP decision surfaces to authoritative production catalog/variant truth. P06 established authoritative cart, checkout, reservation and orders. P07 added verified-payment, shipping quote, fulfillment, return and refund-request lifecycle boundaries. P08 adds governed trust facts, support ownership, post-purchase tracking/communications and moderated verified reviews while keeping live activation deferred.

Payment success requires Backend provider verification; shipping, returns and refund requests are durable and server-authoritative. Live charge/refund and carrier activation remain intentionally unavailable until controlled production readiness.

The authoritative progress matrix, exact SHAs, CI evidence, engineering rules and mandatory handoff procedure live in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

Detailed evidence remains in:

- [Frontend and production handoffs](./docs/handoffs/)
- [Production completion roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md)
- [Production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md)
- [Machine-readable production phase registry](./contracts/production-phase-registry.json)
