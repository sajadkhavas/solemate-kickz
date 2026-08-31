# P02 — Media & Catalog Ingestion

## PHASE

P02 — Media & Catalog Ingestion

## STATUS

**COMPLETED / ACCEPTED — merge closure PR #35**

## START_SHA

- Frontend: `9423700cc8197d69a14a19e5cc29f092f51da115`
- Backend: `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`

## END_SHA

- Frontend accepted functional END_SHA: `11c16357a846d01020f4774002ee11d8e63b2d2a`
- Backend accepted functional END_SHA: `447af1a341a1d09eef79b754f5b009fa93064fa7`
- Backend final merge SHA: `36eca2810495591b44f1f86c975f4ff287374e81`

The frontend closure commit intentionally records the accepted functional END_SHA rather than self-referencing its own documentation SHA. Final frontend merge SHA is recorded externally in PR #35 and tracking issue #34 after merge.

## BRANCH

- Frontend: `phase/sole-p02-media-catalog-ingestion`
- Backend: `phase/sole-p02-media-catalog-ingestion`

## PR

- Frontend merge closure: `sajadkhavas/solemate-kickz#35`
- Superseded frontend Draft wrapper: `sajadkhavas/solemate-kickz#33`
- Backend accepted/merged PR: `sajadkhavas/sole-backend#4`
- Superseded backend Draft wrapper: `sajadkhavas/sole-backend#3`
- Tracking issue: `sajadkhavas/solemate-kickz#34`

Draft wrappers were superseded only because the connected Draft→Ready GitHub GraphQL mutation fails against a removed schema field. Branches, accepted heads and history were not rewritten.

## SCOPE

### P02.1 — Secure media intake

- private quarantine storage
- signed upload intent/ownership boundary
- server-side byte count and MIME verification
- actual image decode validation
- width/height and pixel bounds
- animation/frame rejection policy
- client metadata is never accepted as final truth

### P02.2 — Secure deterministic processing

- fail-closed malware scan boundary
- deterministic responsive WebP derivative recipes
- focal-point aware processing
- immutable content-addressed derivative paths
- originals/quarantine remain private
- only server-verified derivatives are public

### P02.3 — Catalog manifest and dry-run

- versioned ingestion manifest
- preview/dry-run validation before mutation
- duplicate detection
- SKU and slug uniqueness/reference validation
- media references must resolve to eligible ready assets

### P02.4 — Idempotent apply

- idempotent ingestion/application boundary
- checksum and size truth
- ready-media attachment
- import cannot publish or set `published_at`
- retry/replay cannot silently duplicate catalog truth

### P02.5 — Review, publication and recovery

- draft → review → publish workflow
- publication requires active sellable variant and accessible ready media
- append-only publication revisions/journal
- stale-aware rollback/recovery
- storefront catalog API exposes responsive ready media
- OpenAPI upgraded to v1.1

### P02.6 — Frontend production adapter and acceptance

- production catalog is read from backend through `SOLE_API_URL`
- production rejects non-HTTPS backend URLs
- backend payloads are schema-validated and fail closed
- no production fallback to development/demo fixtures
- IRR minor units map exactly to frontend toman values
- SSR loads server-only adapter code
- client navigation calls the same-origin TanStack server route `/api/catalog`
- cards/PDP gallery use ready responsive WebP `srcset`
- generated `src/routeTree.gen.ts` is committed exactly as produced by the pinned TanStack build
- legacy cumulative gates were updated only where required to recognize P02 runtime catalog truth and the controlled generated route
- exact functional head passed complete cumulative frontend acceptance
- registry, project status, OpenAPI and this handoff are closed in the same merge PR

## EXCLUSIONS

P03 customer identity/session/OTP, P04 fit intelligence, P05 discovery/ranking/facets/PDP conversion intelligence, P06 cart/order server truth, P07 payment/shipping/returns, and all server activation are outside P02.

P02 does not claim production catalog population on a live server. It establishes the secure ingestion/media and application boundaries. P12 remains the first server-activation phase.

## FILES_CHANGED

Backend P02 owns secure media domain/services/jobs/commands, quarantine and derivative storage contracts, manifest ingestion, publication/revision logic, migrations, tests, storefront media resources, OpenAPI and CI evidence.

Frontend P02 owns:

- `src/catalog/production-catalog.server.ts`
- `src/catalog/production-catalog.ts`
- `src/catalog/responsive-media.ts`
- `src/components/catalog/ResponsiveCatalogImage.tsx`
- `src/routes/api.catalog.ts`
- production catalog/PDP loader integration
- responsive card/PDP media rendering
- controlled regression-audit compatibility changes
- exact generated `src/routeTree.gen.ts`
- `openapi/sole-catalog-v1.yaml` v1.1
- P02 registry/status/handoff closure evidence

A temporary route-tree diagnostic workflow used to expose the generator diff was removed before acceptance and is not present in the final tree.

## DEPENDENCIES

- P00 — completed
- P01 — completed and merged
- Backend P01 main baseline: `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`
- Frontend P01 merge baseline: `9423700cc8197d69a14a19e5cc29f092f51da115`
- Donor repositories remained read-only references; no donor data, secrets or history were imported.

## COMMANDS

Backend acceptance evidence includes its locked dependency installation, formatting/static checks, MySQL-backed integration and media/catalog security/regression suite under Backend quality CI.

Frontend acceptance is the repository's complete Frontend CI workflow, including:

- F0–F18 source/behavior regression gates
- F11 SSR/SEO safety
- P00/production-program audits
- TypeScript typecheck
- ESLint
- all registered Prettier checks
- production build
- F12 deterministic performance budgets
- VPS Node-server build
- production runtime/port-leak smoke
- all desktop/mobile visual QA suites
- cumulative evidence verification
- final clean-tree verification

## QA_RESULT

**PASS.**

Accepted frontend functional head `11c16357a846d01020f4774002ee11d8e63b2d2a` passed Frontend CI run #1071 / `33405521318`, including final clean-tree verification after the generated TanStack route tree was synchronized exactly.

Backend accepted implementation `447af1a341a1d09eef79b754f5b009fa93064fa7` passed Backend quality run `33367224392`; merged backend `main@36eca2810495591b44f1f86c975f4ff287374e81` passed post-merge quality run `33371334406`.

The closure head carrying registry/status/handoff/OpenAPI evidence must independently pass the same frontend workflow before PR #35 is merged; its run ID is recorded in PR #35 and issue #34 because a commit cannot self-record the CI run created by that same commit.

## CI_RUN_IDS

- Frontend functional exact-head: `33405521318` / run #1071 — PASS
- Backend functional exact-head: `33367224392` — PASS
- Backend post-merge main: `33371334406` — PASS
- Frontend closure exact-head: recorded on PR #35 and issue #34 after this closure commit runs

## ROUTES_VIEWPORTS

Cumulative frontend browser/visual suites cover homepage, navigation/search, content pages, catalog, PDP, cart/checkout, wishlist/account/orders and motion/3D behavior across the repository's registered desktop/mobile viewport matrix. P02 also adds the same-origin server endpoint `/api/catalog`; it is an application data endpoint, not an indexable product page.

## ACCESSIBILITY

- responsive media preserves meaningful backend alt text and explicit dimensions where available
- cards and PDP retain existing keyboard/focus/touch-target contracts
- no P02 change weakens dialog, reduced-motion, static fallback or navigation accessibility gates
- full cumulative visual/behavior acceptance remained green

## PERFORMANCE

- deterministic WebP derivative recipes and responsive `srcset` prevent the storefront from requiring original uploads
- content-addressed media supports immutable caching
- production build and F12 client budgets pass
- model-viewer remains isolated under existing F12 budgets
- VPS Node build/runtime smoke passes and leaves no port leak

## SECURITY

- quarantine/originals are private
- public media derives only from server-verified, re-encoded ready assets
- malware scanner failure is fail-closed; no production bypass is accepted
- byte/MIME/decode/dimension checks are server-owned
- production frontend rejects invalid/missing backend configuration and payloads instead of falling back to demo truth
- production backend URL must be HTTPS
- import cannot publish products
- publication requires review + sellable variant + accessible ready media
- publication revisions are append-only and rollback rejects stale state
- donor data/secrets/history were not imported

## KNOWN_LIMITATIONS

P02 intentionally does not implement final discovery ranking, availability facet semantics or PDP conversion intelligence; those belong to P05. It also does not activate a production server or populate live production catalog records; P12–P14 own readiness/staging/release.

Current frontend product URLs remain compatible with the accepted application model while P05 owns deeper discovery/PDP evolution. Production failure of the catalog API is intentionally represented as an empty/fail-closed catalog rather than development fixtures.

## OUT_OF_SCOPE_FINDINGS

- customer session/OTP and identity security → P03
- size/fit truth → P04
- server-authoritative discovery semantics and PDP conversion → P05
- cart/order/oversell lifecycle → P06
- payments/shipping/returns → P07
- production observability/release activation → later registered phases

## ROLLBACK_IMPACT

- Frontend rollback target: `9423700cc8197d69a14a19e5cc29f092f51da115`
- Backend rollback target: `c9e2f66bab300882e2306bcd52346a81fb1a2e6b`
- Backend P02 has already merged at `36eca2810495591b44f1f86c975f4ff287374e81`; operational rollback must respect any P02 schema/data migration policy at deployment time.
- P02 itself performed no production server activation and no production data mutation, so no live rollback was executed in this phase.

## OFFICIAL_REFERENCES

Implementation and acceptance decisions were checked against current primary documentation:

- TanStack Start — Server Routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- TanStack Router — File-Based Routing: https://tanstack.com/router/latest/docs/routing/file-based-routing
- TanStack Router — File-Based Routing API / generatedRouteTree: https://tanstack.com/router/latest/docs/api/file-based-routing
- Laravel 13 — File Storage: https://laravel.com/framework/docs/filesystem
- Laravel 13 — Validation: https://laravel.com/framework/docs/validation
- Laravel 13 — Query Builder / Pessimistic Locking: https://laravel.com/framework/docs/13.x/queries

Repository exact-head CI remains the final acceptance authority for committed behavior.

## NEXT_PHASE

**P03 — Authentication & Customer Security**.

P03 must start from the verified post-P02 frontend `main` SHA and backend `main@36eca2810495591b44f1f86c975f4ff287374e81`, and must preserve the P02 media/catalog truth boundary.
