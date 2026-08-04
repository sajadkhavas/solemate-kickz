# F0/F1 Foundation Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f0-f1-foundation`

## Baseline

`137344f1d89373a55e3bf4bb4d82b48d8247b45f`

## Final implementation commit

Pending final validation. The exact validated implementation SHA and final branch-head SHA will be recorded after the aggregate gate completes.

## Baseline findings

- Baseline matched the required `main` SHA before the branch was created.
- Toolchain captured by GitHub Actions: Node `v22.23.1`, Bun `1.3.14`, lockfile `bun.lock`.
- Frozen-lockfile install passed.
- Baseline TypeScript check passed.
- Baseline production build passed.
- Baseline lint failed because `eslint-plugin-prettier/recommended` treated formatting differences across the prototype as lint errors. The repository-wide formatting rewrite was intentionally not performed.
- Root document used `lang="en"` and did not declare `dir="rtl"`.
- Root loaded Google Fonts through a render-blocking external stylesheet.
- Global focus-visible and reduced-motion contracts were incomplete.
- Cart drawer was a manually animated overlay without a complete modal focus contract.
- The repository contains an approximately 8 MB `public/models/shoe.glb`; it must remain optional and lazy.

Baseline evidence is stored under `artifacts/bootstrap/`.

## Constitution decisions

- Product-first, Persian RTL-first sneaker commerce.
- Cinematic treatment is limited to storytelling surfaces.
- Transactional routes remain fast and low-friction.
- Semantic color, typography, layout, motion, accessibility, performance, SEO, and truthfulness rules are normative.
- Demo commercial facts must not be presented as verified business truth.

## Design-system decisions

- Existing Radix/Shadcn primitives remain the foundation; no framework migration or dependency addition.
- Semantic tokens coexist temporarily with legacy visual aliases to avoid page-phase regressions.
- Commerce primitives are centralized in `src/components/ui/commerce-primitives.tsx`.
- Radix Dialog owns the cart drawer modal contract.
- Formatting is separated from ESLint code-quality checks.

## Files changed

- `.github/workflows/f0-f1-bootstrap.yml`
- `docs/frontend/SOLE_FRONTEND_CONSTITUTION.md`
- `docs/frontend/SOLE_DESIGN_SYSTEM.md`
- `docs/handoffs/F0-F1-FOUNDATION.md`
- `eslint.config.js`
- `package.json`
- `scripts/audit-f0-f1-foundation.mjs`
- `scripts/test-f0-f1-primitives.mjs`
- `src/components/CartDrawer.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/commerce-primitives.tsx`
- `src/routes/__root.tsx`
- `src/styles.css`

## Components created or changed

Created:

- IconButton
- TextLink
- SearchInput
- Price
- DiscountPrice
- StockState
- QuantityStepper
- Spinner
- EmptyState
- ErrorState
- VisuallyHidden

Changed:

- Button
- CartDrawer
- Root document and route accessibility manager

## Dependencies changed

None. `package.json` dependency versions and `bun.lock` remain unchanged.

## Commands executed

Baseline:

- `bun install --frozen-lockfile`
- `bun run lint`
- `bunx tsc --noEmit`
- `bun run build`

Final commands are pending the aggregate validation run.

## Audit results

Pending final run. Expected report path:

`artifacts/audits/f0-f1-foundation.json`

## Unit-test results

Pending final run.

## Typecheck result

Baseline: pass. Final: pending.

## Lint result

Baseline: fail due to repository-wide Prettier rule violations. Final: pending after separating formatting from lint.

## Production build result

Baseline: pass. Final: pending.

## Routes visually inspected

Automated visual-browser inspection is pending. The execution environment currently provides repository and GitHub Actions access but no interactive browser session.

Required routes for supervisor/browser QA:

- `/`
- `/products`
- one valid `/product/$id`
- `/cart`
- `/auth`
- `/brands`
- `/about`
- invalid route

## Viewports inspected

Browser evidence is pending for:

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

## Accessibility verification

- Keyboard: source contracts added; browser traversal pending.
- Focus: root focus-visible, skip link, modal focus trap, and route focus manager implemented; browser verification pending.
- Reduced motion: global CSS foundation implemented; browser verification pending.
- Zoom: responsive token contract implemented; 200% browser verification pending.
- Screen-reader semantics: route announcer, modal title/description, labels, and commerce primitive semantics added; assistive-technology verification pending.

## Performance observations

- Remote render-blocking font stylesheet removed.
- Existing 3D model is approximately 8 MB and remains a later-phase optimization/routing concern.
- Custom cursor already gates coarse pointers and reduced motion and cleans up listeners/RAF.
- Product media and page-level performance require route-specific measurement in later phases.

## Known limitations

- Full visual QA requires a browser-capable execution path and must not be claimed complete without screenshots/console/hydration inspection.
- Existing page-specific copy and demo commerce data remain for later phases; the truthfulness policy prevents treating them as verified production facts.
- The bootstrap workflow is temporary evidence infrastructure and will be converted to current-branch validation before final handoff.

## Out-of-scope findings for later phases

- F2: navigation architecture, full search overlay behavior, mobile menu interaction audit.
- F3: homepage section storytelling, repetitive reveal-motion cleanup, truthfulness of marketing claims.
- F4/F5: catalog controls, product-card integrity, product-detail media/variant behavior, filtered URL SEO.
- F6: cart page business rules and checkout-adjacent states.
- F7: authentication flows and form validation.
- F8: wishlist and account persistence.
- F9: brand editorial data and canonical ownership.
- F10: about/contact trust content and verified business details.
- F11: route-level performance, image delivery, 3D optimization, Core Web Vitals measurement.
- F12: final cross-route visual, accessibility, hydration, and production readiness audit.

## Ready for supervisor review

No. Final aggregate checks and browser visual QA evidence are not yet complete.
