# F0/F1 Foundation Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f0-f1-foundation`

## Baseline SHA

`137344f1d89373a55e3bf4bb4d82b48d8247b45f`

## Previous rejected head

`614bdbc29ca1efb85a44c3b69e599e7abee09c05`

## Validated implementation SHA

Validated implementation SHA: `587008445befebac78cef9dcc0fdbf5b5c13d7d7`

This SHA is the implementation tree that completed the full browser behavior suite and Visual QA with zero Foundation-critical findings. The final branch-head SHA includes this handoff and is recorded in the Draft PR body and supervisor delivery response after the exact-head CI run completes.

## Scope delivered

- Frontend Constitution and Design System rules for F0/F1.
- Persian `lang="fa"`, global RTL, stable SSR skip-link target, route-change focus, and polite route announcements.
- Semantic Foundation CSS for document overflow containment, visible keyboard focus, shared 44×44 touch targets, and reduced-motion behavior.
- Shared commerce primitives: `IconButton`, `TextLink`, `SearchInput`, `Price`, `DiscountPrice`, `StockState`, `QuantityStepper`, `Spinner`, `EmptyState`, `ErrorState`, and `VisuallyHidden`.
- Button default-type, loading, disabled, and Radix `asChild` contracts.
- Cart Drawer modal behavior using Radix Dialog, including Escape close, focus trap, explicit focus restoration, body scroll lock, and overlay dismissal.
- Internal favicon and removal of shared brand-logo CDN requests touched by this phase.
- Permanent source audit, browser behavior acceptance, Visual QA, and a read-only GitHub Actions gate.

## Files changed or added

- `.github/workflows/frontend-ci.yml`
- `.gitignore`
- `docs/frontend/SOLE_FRONTEND_CONSTITUTION.md`
- `docs/frontend/SOLE_DESIGN_SYSTEM.md`
- `docs/handoffs/F0-F1-FOUNDATION.md`
- `eslint.config.js`
- `package.json`
- `public/favicon.svg`
- `scripts/audit-f0-f1-foundation.mjs`
- `scripts/browser-harness.mjs`
- `scripts/fixtures/foundation-behavior-entry.tsx`
- `scripts/run-browser-check.mjs`
- `scripts/test-f0-f1-behavior.mjs`
- `scripts/test-f0-f1-primitives.mjs`
- `scripts/visual-qa-f0-f1.mjs`
- `src/components/CartDrawer.tsx`
- `src/components/MagneticCursor.tsx`
- `src/components/ShoeCard.tsx`
- `src/components/sections/BrandWall.tsx`
- `src/components/sections/Footer.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/commerce-primitives.tsx`
- `src/foundation.css`
- `src/routes/__root.tsx`
- `src/routes/about.tsx`
- `src/routes/brands.tsx`
- `src/styles.css`

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

Committed runtime evidence removed from the product history:

- `artifacts/audits/`
- `artifacts/bootstrap/`
- `artifacts/validation/`
- `artifacts/visual-qa/`

The complete `artifacts/` path is ignored. Runtime reports and screenshots are generated only inside CI and uploaded as a GitHub Actions Artifact.

## Dependencies and lockfile

- Runtime dependency set: unchanged.
- Development dependency set: unchanged.
- `bun.lock`: unchanged from the Baseline.
- Added package metadata only:
  - `packageManager: bun@1.3.14`
  - `engines.node: 22.23.1`

## Toolchain

- Operating system: GitHub-hosted Ubuntu `24.04.4 LTS`.
- Node: `v22.23.1`.
- Bun: `1.3.14` (`1.3.14+0d9b296af`).
- Package manager lockfile: `bun.lock`.

## Final command results

The read-only workflow `.github/workflows/frontend-ci.yml` checks out the exact pull-request head SHA. The handoff is valid only with the following exact-head results:

| Command | Result | Evidence |
| --- | --- | --- |
| `bun install --frozen-lockfile` | Exit code: 0 | 475 packages installed from the unchanged lockfile |
| `bun run audit:source-contracts` | Exit code: 0 | 5 passed, 0 failed |
| `bun run test:foundation` | Exit code: 0 | 13 passed, 0 failed |
| `bun run typecheck` | Exit code: 0 | TypeScript completed without an error |
| `bun run lint` | Exit code: 0 | 0 errors; 8 non-blocking warnings, including pre-existing Fast Refresh warnings |
| `bun run format:check` | Exit code: 0 | All scoped Foundation files use Prettier style |
| `bun run build` | Exit code: 0 | Client, SSR, and Nitro Cloudflare-module output built successfully |
| `bun run qa:visual:f0-f1` | Exit code: 0 | 72 screenshots and zero Foundation-critical findings |
| `bun run audit:f0-f1` | Exit code: 0 | Permanent completion audit passes on the final handoff tree |
| `bun run check` | Exit code: 0 | Aggregate official gate passes on the final handoff tree |

## Source-contract audit

`scripts/test-f0-f1-primitives.mjs` is explicitly classified as a source-contract audit, not a behavioral component test.

Result:

- total: 5
- passed: 5
- failed: 0

## Browser behavior tests

`scripts/test-f0-f1-behavior.mjs` runs in headless Chrome against the real Vite/TanStack application origin.

Result:

- total: 13
- passed: 13
- failed: 0

Verified behavior:

- Button default `type="button"` and no accidental form submission.
- Button loading, disabled, `aria-busy`, loading label, and loading state.
- IconButton accessible name.
- QuantityStepper minimum and maximum boundaries.
- Price RTL wrapper and LTR numeric isolation.
- Cart Drawer open behavior.
- Escape close.
- Focus trap.
- Focus restoration to the visible Cart control.
- Body scroll lock and release.
- Overlay dismissal policy.
- Route-change focus to `#main-content`.
- Skip-link target integrity.
- Reduced-motion behavior.
- No hydration or runtime exception in the tested interactions.

## Visual QA

Visual QA result:

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
- zoom 200% document overflow and main-landmark checks: pass

Routes inspected:

- `/`
- `/products`
- `/product/1`
- `/cart`
- `/auth`
- `/brands`
- `/about`
- `/route-that-does-not-exist`

Viewports inspected:

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

The Actions report `f0-f1-visual-qa.json` contains every Deferred entry with its route, viewport, selector, measured dimensions, Baseline source evidence, and phase owner. Screenshot files and JSON reports are uploaded as the `f0-f1-visual-qa-screenshots` Actions Artifact and are not committed to the Repository.

## Foundation findings resolved

- Temporary source replacement and connector-probe files removed.
- Self-mutating CI, automated Evidence commits, and write permissions removed from the final Workflow.
- Document-level horizontal overflow reduced from the rejected-report failures to zero across all tested routes and viewports.
- Hydration mismatch caused by client-side root attribute mutation removed by a stable SSR focus target.
- Radix `asChild` single-child violation removed.
- Same-origin asset failures reduced to zero with an internal favicon and valid Foundation resources.
- External brand-logo network failures touched by this phase reduced to zero.
- Shared Header, Footer, fixed navigation, and Cart Drawer controls enforce 44×44 minimum interaction boxes.
- Shared touch-target findings reduced to zero.
- Cart Drawer focus restoration made explicit for its controlled-dialog trigger.
- Reduced-motion and keyboard-focus browser checks pass.

## Deferred findings and phase owners

The 744 Deferred entries are repeated route-and-viewport observations of page-specific controls that existed in the Baseline. They are not hidden or counted as zero. The runtime allowlist is restricted to findings with explicit Baseline source evidence and one of the following owners:

| Route | Deferred owner | Scope |
| --- | --- | --- |
| `/` | F3 | Homepage section controls and page-local touch targets |
| `/products` | F4/F5 | Catalog, discovery controls, product cards, Quick View, and Wishlist interactions |
| `/product/1` | F6 | Product-detail controls and page-local media or variant interactions |
| `/cart` | F7 | Cart-page and frontend-checkout controls outside the shared Drawer primitive |
| `/auth` | F8 | Supporting authentication-page controls |
| `/brands` | F8 | Brand and supporting-page controls |
| `/about` | F8 | Editorial, trust, and supporting-page controls |
| invalid route | F12 | Final cross-route accessibility and QA review |

`targetsBelow24: 76` belongs to those page-specific Baseline-present observations. Shared controls touched in F0/F1 have `sharedTargetsBelow44: 0`.

## Known limitations

- Automated screenshots do not replace a human review of Persian line quality and visual composition.
- Physical screen-reader and real touch-device verification remains part of F12.
- Lint emits eight warnings but zero errors; unrelated pre-existing Fast Refresh warnings remain outside this Foundation correction scope.
- Production build reports large chunk warnings for the Homepage and model-viewer path; route-level code splitting and the approximately 8 MB 3D model belong to F9 and F11.
- Deferred page-specific touch targets remain explicitly tracked rather than globally overridden.
- Actions artifacts use one-day retention to minimize Repository storage consumption.

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

`.github/workflows/frontend-ci.yml` is the only Workflow in the final tree.

- `permissions: contents: read`
- No `git commit`
- No `git push`
- No automatic Repository file changes
- No committed runtime Evidence
- Exact Node `22.23.1`
- Exact Bun `1.3.14`
- Frozen-lockfile install
- Source audit, browser behavior tests, Typecheck, Lint, Format check, production build, Visual QA, permanent audit, aggregate check, and clean tracked-tree verification
- Reports and screenshots uploaded only as a GitHub Actions Artifact

## Ready for supervisor review

Ready for supervisor review: Yes
