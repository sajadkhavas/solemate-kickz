# P01 — Backend, Admin and Product Truth

## Phase record

- STATUS: IN_PROGRESS — repository creation gate
- FRONTEND_REPOSITORY: `sajadkhavas/solemate-kickz`
- BACKEND_TARGET: `sajadkhavas/sole-backend`
- BRANCH: `phase/sole-p01-backend-admin-product-truth`
- START_SHA: `c03f345071c6f7f34a67ebc63e9975233c45dd79`
- END_SHA: pending
- PR: pending
- STARTED_AT: 2026-08-28
- SERVER_REQUIRED: no
- ROLLBACK_IMPACT: documentation/contract changes roll back to START_SHA; backend rollback target will be its initial accepted SHA

## Outcome

Create an independent, current, production-oriented backend and one authoritative source for product, variant, price, inventory and business configuration truth. Provide least-privilege Filament administration, mutation auditing, database integrity and a read-only storefront catalog contract.

## Seven execution parts

| Part | Deliverable | Acceptance |
|---|---|---|
| P01.1 | Architecture, repository and reproducible baseline | independent repository, pinned runtime/dependencies, CI, env example without secrets, exact initial SHA |
| P01.2 | Admin identity, RBAC and audit | production panel access deny-by-default, roles/permissions, policies, audit evidence, security tests |
| P01.3 | Fresh database ownership | one ordered migration history, MySQL constraints/indexes/FKs, factories, migration tests |
| P01.4 | Catalog, price and inventory truth | product/variant/SKU/price/settings models plus append-only inventory ledger and transactional services |
| P01.5 | Filament operational admin | policy-protected resources, validation, safe status transitions, no secret/unsafe bulk actions |
| P01.6 | Storefront API contract | versioned read-only catalog endpoints/resources, published/sellable scoping, OpenAPI/frontend contract, production demo-data prohibition |
| P01.7 | Full QA and closure | unit/integration/MySQL concurrency, static analysis, formatting, security audit, build/boot, exact-head CI, handoff/registry/status update |

## Scope

- architecture and ownership ADR
- Laravel 13 / PHP 8.3+ / Filament 5 / MySQL baseline
- admin panel authentication boundary
- roles, permissions, policies and mutation audit
- categories, collections, products, variants and integer prices
- inventory locations, ledger movements and balances
- versioned business settings
- public read-only catalog API and health/readiness
- frontend production guard against demo catalog truth
- tests, CI and official-reference evidence

## Exclusions

P02 media/import, P03 customer auth/OTP, P04 fit, P05 ranking/conversion, P06 cart/orders, P07 payment/shipping/returns, production server activation and all donor data/secrets.

## Current blocker

The connected GitHub capability can inspect and mutate existing repositories but cannot create a new repository. `sajadkhavas/sole-backend` does not currently exist. The owner must create one empty public repository (no template files required) or provide an existing empty repository. After it exists, execution resumes at P01.1 without changing this START_SHA.

## QA plan

- Composer dependency/security audit
- Laravel test suite on MySQL
- migration fresh/rollback verification
- policy-denial and panel-access tests
- model/service validation tests
- inventory transaction and concurrency tests
- API schema/response tests
- Pint plus static analysis
- production environment validation and application boot
- frontend typecheck/lint/build/contracts after API integration
- exact-head GitHub Actions evidence

## Official references

See `docs/backend/P01-ARCHITECTURE-ADR.md`. Decisions were checked against current official Laravel 13 and Filament 5 documentation before implementation.

## Known limitations

No backend repository or backend SHA exists yet. No implementation, test or CI pass is claimed. The phase remains open.
