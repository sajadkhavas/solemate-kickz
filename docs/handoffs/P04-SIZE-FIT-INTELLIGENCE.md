# P04 — Size & Fit Intelligence Handoff

## Phase record

- PHASE: P04
- STATUS: COMPLETED / ACCEPTED IMPLEMENTATION / CLOSURE MERGE PENDING
- START_SHA: `5da25a6faca25cc7b23f04efd7a779970afa66a5`
- END_SHA: `a59e859331308fbfcf90efb1b29b9f03dc1e7dbb`
- BRANCH: `phase/sole-p04-size-fit-intelligence`
- PR: https://github.com/sajadkhavas/solemate-kickz/pull/38
- TRACKING: https://github.com/sajadkhavas/solemate-kickz/issues/39
- BACKEND_START_SHA: `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`
- BACKEND_END_SHA: `445596ac316176ac74e5dc854f67820e7fa693b3`
- BACKEND_MAIN: `3bdfac22c1aebf6f218c786cfbe7805a0c496505`
- BACKEND_PR: https://github.com/sajadkhavas/sole-backend/pull/8

## Scope

- P04.1 product/model size-guide schema, source provenance and Filament workflow
- P04.2 accessible foot-measurement guidance and authoritative PDP rendering
- P04.3 confidence-aware, reasoned recommendations with honest uncertainty
- P04.4 authenticated fit feedback and future P07 return-signal boundary
- P04.5 privacy-minimised instrumentation, permanent audit and cumulative QA

## Exclusions

- No claim that a size recommendation is certain.
- No unverified brand conversion data or fabricated return evidence.
- No raw foot measurement persistence, profile enrichment or analytics payload.
- No P05 ranking, P06 order authority, P07 returns provider or production activation.

## Files changed

Frontend: production catalog schema/mapping, Shoe domain, PDP purchase panel, accessible Size Guide dialog, F6 truth gates, permanent P04 audit, CI and closure records. Backend: migration, size/fit models, recommendation service, controllers/routes, catalog resource, Filament resource, tests and OpenAPI/operator docs.

## Dependencies

P02 catalog/media truth and P03 customer/session/privacy boundaries are preserved. Backend ownership remains `sajadkhavas/sole-backend`.

## Commands and QA result

- `bun run audit:p04` — PASS
- `bun run audit:production-program` — PASS
- `bun run typecheck` — PASS
- `bun run lint` — PASS with inherited warnings only
- `bun run build` — PASS
- Frontend CI #1128 / run `33480367490` exact-head rerun — PASS
- Backend quality gate #29 / run `33480441245` — PASS
- Backend gate covered Pint, syntax, MySQL migration/rollback, SQLite/MySQL suites, concurrency, route boot, dependency audit and production config cache.

## Routes and viewports

P04 changes the existing `/product/$id` dialog experience and backend `/api/v1/catalog/products/{product}/fit/*` endpoints. Existing mobile/desktop F6 and cumulative visual suites passed. No new SEO route was introduced.

## Accessibility

Radix Dialog retains focus trap, Escape and opener focus restoration. The recommendation result uses `aria-live`; fields are labelled; controls retain minimum touch targets. Missing source data fails closed with plain guidance.

## Performance

No dependency was added and no F12 limit was increased. Full CI passed production build, deterministic build budgets and VPS runtime smoke.

## Security and privacy

Inputs are allow-listed and rate-limited. Authenticated feedback validates that the variant belongs to the product. Raw foot length exists only during calculation and is never stored. Instrumentation stores only product, event, confidence bucket, recommended size and optional idempotency UUID.

## Known limitations

Fit feedback is customer-reported, not purchase-verified until order truth exists in P06. Size-related return evidence is intentionally deferred to P07. Recommendations cannot cover products without a published source-backed guide.

## Out-of-scope findings

The inherited F10 3D browser gate reproduced its known timing flake on the first CI attempt; an exact-head rerun passed without code, timeout or gate weakening.

## Rollback impact

Frontend rollback target is START_SHA `5da25a6faca25cc7b23f04efd7a779970afa66a5`. Backend rollback target is pre-P04 main `3d97a73aa193e7d53fa4f7beb45abf4b591bf968`. Rollback removes only P04 schema/API/UI; no production data or server was activated.

## Official references

- https://laravel.com/docs/13.x/validation
- https://laravel.com/docs/13.x/rate-limiting
- https://laravel.com/docs/13.x/http-tests
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/
- https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en

## Next phase

P05 — Discovery & PDP Conversion, from verified post-P04 frontend/backend main SHAs after closure merge.
