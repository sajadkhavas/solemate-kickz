# F0/F1 Foundation Handoff

## Repository and refs

- Repository: `sajadkhavas/solemate-kickz`
- Branch: `phase/sole-f0-f1-foundation`
- Baseline SHA: `137344f1d89373a55e3bf4bb4d82b48d8247b45f`
- Previous rejected head: `614bdbc29ca1efb85a44c3b69e599e7abee09c05`
- Validated implementation SHA: `587008445befebac78cef9dcc0fdbf5b5c13d7d7`
- Latest exact-head quality run SHA before this blocker-status commit: `b8b3e69185ca6f556b1f1d691fb00b0ad112547f`

The implementation and all code-quality checks pass. Final delivery is blocked only because GitHub rejects creation of a new Actions Artifact at the account-quota layer. This document deliberately does not mark the phase ready while the exact-head workflow is red.

## Scope delivered

- Frontend Constitution and Design System rules for F0/F1.
- Persian `lang="fa"`, global RTL, stable SSR skip-link target, route-change focus, and polite route announcements.
- Foundation CSS for document overflow containment, visible keyboard focus, shared 44×44 touch targets, and reduced-motion behavior.
- Shared commerce primitives: `IconButton`, `TextLink`, `SearchInput`, `Price`, `DiscountPrice`, `StockState`, `QuantityStepper`, `Spinner`, `EmptyState`, `ErrorState`, and `VisuallyHidden`.
- Button default-type, loading, disabled, and Radix `asChild` contracts.
- Cart Drawer modal behavior: Escape close, focus trap, focus restoration, body scroll lock, and overlay dismissal.
- Internal favicon and removal of shared brand-logo CDN requests touched by this phase.
- Permanent source audit, browser behavior acceptance, Visual QA, and a read-only GitHub Actions gate.

## Files removed

Temporary and probe files:

- `src/routes/__root.next.tsx`
- `tmp-test-do-not-use`

Temporary or self-mutating workflows:

- `.github/workflows/f0-f1-baseline-visual.yml`
- `.github/workflows/f0-f1-bootstrap.yml`
- `.github/workflows/f0-f1-finalize-corrected.yml`
- `.github/workflows/f0-f1-finalize-once.yml`
- `.github/workflows/f0-f1-handoff-once.yml`
- `.github/workflows/f0-f1-artifact-maintenance.yml`
- `.github/workflows/f0-f1-artifact-inventory.yml`
- `.github/workflows/f0-f1-format-handoff.yml`

Committed runtime evidence removed and ignored:

- `artifacts/audits/`
- `artifacts/bootstrap/`
- `artifacts/validation/`
- `artifacts/visual-qa/`

## Dependencies and toolchain

- Runtime dependencies: unchanged.
- Development dependencies: unchanged.
- `bun.lock`: unchanged from Baseline.
- Node: `v22.23.1`.
- Bun: `1.3.14`.
- `packageManager`: `bun@1.3.14`.
- Workflow uses `oven-sh/setup-bun@v2` with `no-cache: true`.

## Exact command results

On exact head `b8b3e69185ca6f556b1f1d691fb00b0ad112547f`:

| Command | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Exit code: 0 |
| `bun run audit:source-contracts` | Exit code: 0 — 5 passed, 0 failed |
| `bun run test:foundation` | Exit code: 0 — 13 passed, 0 failed |
| `bun run typecheck` | Exit code: 0 |
| `bun run lint` | Exit code: 0 — 0 errors, 8 non-blocking warnings |
| `bun run format:check` | Exit code: 0 |
| `bun run build` | Exit code: 0 |
| `bun run qa:visual:f0-f1` | Exit code: 0 |
| `bun run audit:f0-f1` | Exit code: 0 — 46 passed, 0 failed |
| `bun run check` | Exit code: 0 |
| tracked working-tree verification | Exit code: 0 |
| `actions/upload-artifact@v4` | Exit code: 1 — account Actions artifact storage quota |

GitHub error:

`Failed to CreateArtifact: Artifact storage quota has been hit. Unable to upload any new artifacts. Usage is recalculated every 6-12 hours.`

Repository-side inventory and cleanup completed before the last run:

- Stored Repository Artifacts: `0`
- Stored Repository Actions caches after cleanup: `0`
- Bun executable caching disabled for future runs.

## Browser behavior tests

Result: 13 passed, 0 failed.

Verified:

- Button default type and no accidental form submission.
- Button loading and disabled behavior.
- IconButton accessible name.
- QuantityStepper minimum and maximum behavior.
- Price direction rendering.
- Cart Drawer open, Escape close, focus trap, focus restoration, body scroll lock, and overlay dismissal.
- Route-change focus.
- Skip-link target.
- Reduced-motion behavior.
- No hydration or runtime error in tested interactions.

## Visual QA

- screenshots: 72
- routes: 8
- viewports: 9
- horizontalOverflowCases: 0
- hydrationWarningCases: 0
- runtimeErrorCases: 0
- sameOriginNetworkErrorCases: 0
- externalNetworkErrorCases: 0
- targetsBelow24: 76
- sharedTargetsBelow44: 0
- deferredFindings: 744
- foundationCriticalFindings: 0
- reduced-motion: pass
- keyboard-focus visibility: pass
- zoom 200% checks: pass

The 744 Deferred entries are Baseline-present page-specific observations with route, viewport, selector, dimensions, source evidence, and phase owner. They are not reported as zero.

## Deferred ownership

- `/` → F3
- `/products` → F4/F5
- `/product/1` → F6
- `/cart` → F7
- `/auth` → F8
- `/brands` → F8
- `/about` → F8
- invalid route → F12

## Out-of-scope phase map

- F2 — Global Shell, Navigation and Search
- F3 — Homepage
- F4/F5 — Catalog, Discovery, Product Cards, Quick View and Wishlist interactions
- F6 — Product Detail
- F7 — Cart and Frontend Checkout
- F8 — Brand, Editorial, Trust and Supporting Pages
- F9 — Motion and 3D
- F10 — Technical SEO
- F11 — Performance
- F12 — Accessibility and Final QA

## Final workflow contract

`.github/workflows/frontend-ci.yml` is the only Workflow in the Product Tree.

- `permissions: contents: read`
- exact pull-request head checkout
- Node `22.23.1`
- Bun `1.3.14`
- `no-cache: true`
- no `git commit` or `git push`
- no automatic file mutation
- frozen-lockfile install
- source audit, behavior tests, Typecheck, Lint, Format check, production build, Visual QA, permanent audit, aggregate check, and tracked clean-tree verification
- reports and screenshots configured for GitHub Actions Artifact upload with one-day retention

## Known limitations and blocker

- Human Persian typography review, physical screen-reader testing, and real touch-device verification remain F12 work.
- Page-specific Deferred findings remain assigned to their owning phases.
- Final exact-head GitHub Actions status cannot become green until GitHub recalculates or increases the account Actions Artifact storage quota.

## Ready for supervisor review

Ready for supervisor review: No
