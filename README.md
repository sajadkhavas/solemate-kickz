# SOLE — Solemate Kickz

Production-oriented sneaker commerce platform.

> **Start here:** Every contributor and AI chat must read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [AGENTS.md](./AGENTS.md) before planning or changing the project.

## Current state

- Frontend program **F0–F18: completed and released to `main`**
- Production program **P00–P01: completed/accepted**
- Remaining production phases **P02–P14: registered**
- P01 frontend accepted implementation: `1248091fa5157e733d70120bb26ca9a07169263b` in [PR #31](https://github.com/sajadkhavas/solemate-kickz/pull/31)
- Backend: [`sajadkhavas/sole-backend`](https://github.com/sajadkhavas/sole-backend), Laravel 13 + Filament 5 + PHP 8.3+ + MySQL
- Backend P01 merged to `main@c9e2f66bab300882e2306bcd52346a81fb1a2e6b`
- Frontend: TanStack Start / React full-document SSR / Node production runtime
- Next phase: **P02 — Media & Catalog Ingestion**

P01 deliberately fails closed in production until P02 connects real catalog/media ingestion: development product fixtures remain available to controlled development/browser QA, while production resolves product truth to an empty safe catalog instead of shipping fake SKUs, prices or stock.

The authoritative progress matrix, phase definitions, donor decisions, engineering rules and mandatory handoff procedure live in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

Detailed evidence remains in:

- [Frontend and production handoffs](./docs/handoffs/)
- [Production completion roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md)
- [Production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md)
- [Machine-readable production phase registry](./contracts/production-phase-registry.json)
