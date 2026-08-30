# ADR-P01-001 — SOLE Backend Foundation

- Status: Accepted for P01 implementation
- Date: 2026-08-28
- Frontend repository: `sajadkhavas/solemate-kickz`
- Frontend START_SHA: `c03f345071c6f7f34a67ebc63e9975233c45dd79`
- Backend target: `sajadkhavas/sole-backend`
- Phase branch: `phase/sole-p01-backend-admin-product-truth`

## Decision

Build SOLE Backend as an independent modular monolith:

- Laravel 13
- PHP 8.3 or newer within Laravel 13 support
- Filament 5 admin panel
- MySQL as the authoritative transactional database
- Redis only where cache, queue or lock behavior requires it
- HTTP JSON API for the TanStack Start SSR storefront
- Laravel policies plus explicit role/permission mapping
- append-only business audit evidence for privileged mutations
- fresh SOLE-owned migrations

The public storefront remains TanStack Start SSR. Laravel owns commerce data and administrative operations; it does not replace frontend SSR.

## Why the registered stack changed

The earlier planning note named Laravel 12 and Filament 3 to match donor applications. Official documentation now identifies Laravel 12 as an old major with bug-fix support ended on 2026-08-13 and security fixes ending 2027-02-24. Laravel 13 is the current major with security support through 2028-03-17. Filament 3 documentation identifies itself as a previous version; Filament 5 is current.

Because SOLE Backend is a fresh application—not an in-place donor upgrade—starting on current supported majors avoids creating immediate upgrade debt. Donor code is ported selectively at the domain level and adapted to current APIs.

## Authoritative ownership

| Truth | Owner | Rule |
|---|---|---|
| Product identity and publication | Backend database | No production demo catalog |
| Variant/SKU identity | Backend database | SKU uniqueness enforced by database |
| Price | Backend database | Integer minor units; never client supplied |
| Inventory | Inventory ledger | Balances derived/verified from ledger movements |
| Business settings | Versioned backend settings | No hidden frontend defaults |
| Admin authorization | Policies and permissions | Navigation hiding is never authorization |
| Mutation audit | Backend audit records | Actor, action, subject, before/after metadata and request correlation |

## Donor boundary

### LBB primary donor

Reference only: `sajadkhavas/lbb-backend@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217`.

Candidate domain concepts: Category, Collection, Product, ProductVariant, Size, price representation, inventory ledger/reservation patterns and apparel admin workflows.

### Winimi selective donor

Reference only: `sajadkhavas/winimi-bakery-backend@19d294d8dd835571ee73b9330dff830ed1dda0ed`.

P01 may reuse only generally applicable operational patterns. Media processing/import is deferred to P02.

### Forbidden carry-over

- donor Git history, production data, credentials or `.env`
- bakery or ToolMaster domain models
- duplicate/legacy migrations
- prototype/mock/test routes or seed truth
- exposed 2FA secrets
- sandbox payment defaults
- client-authoritative price or stock
- permission checks implemented only by hiding Filament navigation

## P01 domain boundary

Included:

- admin users and panel access
- roles, permissions and model policies
- privileged mutation audit trail
- categories, collections, products, variants, prices
- inventory locations, ledger movements and verified balances
- versioned business settings
- read-only catalog API contract and health/readiness surfaces

Deferred:

- media pipeline/import (P02)
- customer authentication/OTP (P03)
- fit recommendation (P04)
- discovery ranking/PDP conversion (P05)
- cart, reservations for checkout and orders (P06)
- payment/shipping/returns (P07)

## Required integrity rules

- monetary amounts use integers in the declared minor unit and a currency code
- stock mutations are ledger entries; direct balance edits are forbidden
- inventory-changing writes use database transactions and row locking where races are possible
- public API exposes only published products and sellable variants
- admin mutations require both panel access and policy authorization
- destructive catalog operations are restricted; published or referenced truth is archived/disabled rather than casually deleted
- production configuration rejects debug, placeholder, mock and sandbox values

## Official references

- https://laravel.com/docs/13.x/releases
- https://laravel.com/docs/13.x/installation
- https://laravel.com/docs/13.x/authorization
- https://laravel.com/docs/13.x/database
- https://laravel.com/docs/13.x/migrations
- https://laravel.com/docs/13.x/queries#pessimistic-locking
- https://laravel.com/docs/13.x/eloquent-resources
- https://filamentphp.com/docs/5.x/introduction/installation
- https://filamentphp.com/docs/5.x/resources/overview
- https://filamentphp.com/docs/5.x/users/overview
