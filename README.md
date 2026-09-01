# SOLE — Solemate Kickz

Production-oriented sneaker commerce platform.

> **Start here:** Every contributor and AI chat must read [PROJECT_STATUS.md](./PROJECT_STATUS.md) and [AGENTS.md](./AGENTS.md) before planning or changing the project.

## Current state

- Frontend program **F0–F18: completed and released to `main`**
- Production program **P00–P03: completed/accepted**
- Remaining production phases **P04–P14: registered**
- P03 frontend accepted implementation: `7b4ca63494ec8d8f2557087f1d8d3b04707bf7c0` in [PR #37](https://github.com/sajadkhavas/solemate-kickz/pull/37); full Frontend CI #1110 / run `33424062662` PASS
- Backend: [`sajadkhavas/sole-backend`](https://github.com/sajadkhavas/sole-backend), Laravel 13 + Filament 5 + PHP 8.3+ + MySQL
- Backend P03 final merged `main`: `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`
- Frontend: TanStack Start / React full-document SSR / Node production runtime
- Production customer sign-in: Google OAuth through backend-owned secure session; normalized Iranian mobile required for account completion
- Retained OTP: production feature-gated and **OFF by default**
- P03 production auth/account use an isolated lightweight customer shell; Vite/Rolldown route-aware code splitting preserves the accepted F12 performance budgets without raising limits
- Next phase: **P04 — Size & Fit Intelligence**

P02 established backend-authoritative catalog/media truth. P03 establishes backend-authoritative customer identity, profile/address ownership, consent and privacy workflows. Development demo auth/account state remains available only to deterministic development regression QA; production route isolation replaces it with the real customer/session boundary. Production order history is intentionally not fabricated and remains deferred to P06.

The authoritative progress matrix, exact SHAs, CI evidence, engineering rules and mandatory handoff procedure live in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

Detailed evidence remains in:

- [Frontend and production handoffs](./docs/handoffs/)
- [Production completion roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md)
- [Production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md)
- [Machine-readable production phase registry](./contracts/production-phase-registry.json)