# SOLE — Solemate Kickz

Production-oriented sneaker commerce platform.

> **Start here:** Every contributor and AI chat must read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [AGENTS.md](./AGENTS.md) before planning or changing the project.

## Current state

- Frontend program **F0–F18: completed and released to `main`**
- Production program **P00–P05: completed/accepted/merged**
- Remaining production phases **P06–P14: registered**
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
- Next phase: **P06 — Cart, Checkout & Orders**

P02 established backend-authoritative catalog/media truth. P03 established backend-authoritative customer identity, profile/address ownership, consent and privacy workflows. P04 added source-backed size/fit guidance. P05 converts discovery and PDP decision surfaces to authoritative production catalog/variant truth while retaining development fixtures only outside Production and preventing fabricated popularity, scarcity, social proof, fulfillment or return claims.

Production order creation is intentionally not fabricated and remains the responsibility of P06.

The authoritative progress matrix, exact SHAs, CI evidence, engineering rules and mandatory handoff procedure live in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

Detailed evidence remains in:

- [Frontend and production handoffs](./docs/handoffs/)
- [Production completion roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md)
- [Production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md)
- [Machine-readable production phase registry](./contracts/production-phase-registry.json)