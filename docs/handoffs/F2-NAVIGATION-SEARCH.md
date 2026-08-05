# F2 — Global Shell, Navigation and Search Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f2-navigation-search`

## Foundation SHA

`integration/sole-frontend-v2@a908b2723322dde27699fa4c92fa9c0de95e0c75`

## Final SHA

Validated final implementation SHA: `b778a599f263419a830988125395fbda11cd363f`.

The final branch-head SHA also contains this handoff document and is recorded in Draft PR #2 and the supervisor delivery response after exact-head CI completes. This avoids a self-referential documentation commit.

## Scope delivered

- Unified responsive global Header and navigation structure.
- Sticky Header with requestAnimationFrame-based scroll state and complete listener cleanup.
- Truthful demo disclosure replacing unsupported promotion, shipping, authenticity, discount-code, and contact-number claims in the Shell.
- Desktop primary navigation with real TanStack Router destinations.
- Desktop category dropdown using Radix Dropdown Menu.
- Semantic active-route state using `aria-current` plus a non-color underline.
- Mobile navigation Drawer using Radix Dialog.
- Mobile menu focus trap, Escape close, overlay dismissal, body scroll lock, trigger restoration, safe-area handling, and route-aware closing.
- Mobile category navigation using an Accordion.
- Mobile bottom navigation with real route state and non-color active indicators.
- Shared Search Dialog available from Desktop Header and Mobile Bottom Navigation.
- Search input with a programmatic label, initial focus, focus trap, Escape close, body scroll lock, and explicit trigger restoration.
- Frontend search over the real `SHOES` Dataset: brand, model name, colorway, category, SKU, and tags.
- Safe Persian/English normalization and mixed-direction isolation.
- Safe query highlighting with React text nodes and `<mark>`; no raw HTML injection.
- Keyboard suggestion navigation with Arrow Up, Arrow Down, `aria-activedescendant`, and Enter selection.
- Search submission to `/products?q=...&sort=newest` using TanStack Router.
- Product suggestion selection to `/product/$id`.
- Browser refresh, deep-link, Back, and Forward support through URL search state.
- Recent Searches persisted through the existing Zustand persistence layer.
- Removal of one Recent Search and clearing all Recent Searches.
- Honest empty, controlled loading, result, and no-result states.
- Search result count announcement through an `aria-live` region.
- Cart triggers remain native buttons and preserve the F0/F1 focus-restoration contract.
- Account entries link to the real `/auth` route without simulating successful authentication.

## Initial findings

- The previous Header mixed Desktop navigation, Mobile navigation, promotional copy, Search, account entry, and cart controls in one large component.
- Desktop categories depended on Hover and were not fully keyboard operable.
- The Mobile menu did not use a modal primitive and lacked a verified focus trap and focus-restoration contract.
- Search was a visual input without a programmatic label, URL workflow, recent persistence, result announcements, or keyboard selection.
- The Header included unsupported commercial claims, a demo discount code, and a placeholder phone number.
- Mobile scroll locking introduced a 15-pixel RTL width compensation at 320 pixels and caused document-level horizontal overflow.
- Search and Mobile Drawer exit animation could temporarily retain pointer capture and scroll lock after visual closure.

## Architecture decisions

- Kept TanStack Start, TanStack Router, Zustand, Radix, Tailwind, and the existing project architecture.
- Added no dependency.
- Used small navigation components rather than replacing the Router or global Store.
- Used Radix Dropdown Menu for Desktop categories and Radix Dialog for Mobile navigation and Search.
- Kept Search frontend-only and derived every suggestion from `src/data/shoes.ts`.
- Kept `/products` as the URL-backed search-results surface instead of introducing a new generated route.
- Did not manually edit `src/routeTree.gen.ts`.
- Stored only search-history data in the existing persisted Store; transient overlay state is not persisted.
- Added a hydrated Shell marker so browser acceptance waits for actual React interactivity rather than SSR markup visibility.
- Neutralized `react-remove-scroll` scrollbar compensation only below 768 pixels and only while a modal scroll lock is active.
- Disabled closing-state pointer capture while preserving opening motion and `prefers-reduced-motion` behavior.

## Components created or refactored

Created:

- `src/components/navigation/DesktopNavigation.tsx`
- `src/components/navigation/MobileNavigation.tsx`
- `src/components/navigation/SearchDialog.tsx`
- `src/components/navigation/SoleLogo.tsx`
- `src/components/navigation/search-utils.ts`
- `src/components/navigation/navigation.css`

Refactored:

- `src/components/Navbar.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/store/index.ts`
- `scripts/browser-harness.mjs`

Quality assets:

- `scripts/audit-f2-navigation-search.mjs`
- `scripts/f2-browser-runner.mjs`
- `scripts/test-f2-navigation-search.mjs`
- `scripts/visual-qa-f2-navigation-search.mjs`

## Files changed

- `package.json`
- `scripts/audit-f2-navigation-search.mjs`
- `scripts/browser-harness.mjs`
- `scripts/f2-browser-runner.mjs`
- `scripts/test-f2-navigation-search.mjs`
- `scripts/visual-qa-f2-navigation-search.mjs`
- `src/components/MobileBottomNav.tsx`
- `src/components/Navbar.tsx`
- `src/components/navigation/DesktopNavigation.tsx`
- `src/components/navigation/MobileNavigation.tsx`
- `src/components/navigation/SearchDialog.tsx`
- `src/components/navigation/SoleLogo.tsx`
- `src/components/navigation/navigation.css`
- `src/components/navigation/search-utils.ts`
- `src/store/index.ts`
- `docs/handoffs/F2-NAVIGATION-SEARCH.md`

Removed before final delivery:

- `.github/workflows/f2-acceptance-dev.yml`

## Dependency changes

- Runtime dependencies: unchanged.
- Development dependencies: unchanged.
- `bun.lock`: unchanged.
- Node remains `22.23.1`.
- Bun remains `1.3.14`.

## Routes reviewed

- `/`
- `/products`
- `/product/1`
- `/cart`
- `/auth`

Navigation destinations also verified:

- `/brands`
- `/about`

## Viewports reviewed

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

## Keyboard, Touch and Search behavior tests

Browser behavior result:

- Total: 21
- Passed: 21
- Failed: 0

Verified behavior:

1. Desktop menu pointer open.
2. Desktop menu Arrow navigation.
3. Desktop Escape close.
4. Desktop focus restoration.
5. Mobile menu open.
6. Mobile focus trap.
7. Mobile body scroll lock.
8. Mobile Escape close.
9. Mobile trigger focus restoration.
10. Search initial focus and modal scroll lock.
11. Real Dataset suggestions.
12. Arrow suggestion navigation.
13. Enter suggestion selection.
14. Clear Search.
15. URL query submission.
16. Recent Search persistence.
17. Single Recent Search removal.
18. Honest no-result state.
19. Search Escape close and focus restoration.
20. Browser Back/Forward query behavior.
21. Route navigation closes the Mobile overlay.
22. No hydration or runtime error was observed; this assertion is included in the same 21-case report grouping.

The test runs against the real Vite/TanStack application origin in headless Chrome. It does not classify source-text Regex checks as component behavior tests.

## Command results

Validated implementation results:

| Command                                           | Result                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `bun install --frozen-lockfile`                   | Exit code 0 — 475 packages installed from the unchanged lockfile        |
| `node scripts/test-f2-navigation-search.mjs`      | Exit code 0 — 21 passed, 0 failed                                       |
| `bun run typecheck`                               | Exit code 0                                                             |
| `bun run lint`                                    | Exit code 0 — 0 errors and 8 non-blocking warnings                      |
| `bun run build`                                   | Exit code 0 — client, SSR, and Nitro Cloudflare-module builds completed |
| `node scripts/visual-qa-f2-navigation-search.mjs` | Exit code 0 — 89 screenshots and 0 critical findings                    |
| Foundation source-contract tests                  | Exit code 0 — 5 passed, 0 failed                                        |
| Foundation browser behavior tests                 | Exit code 0 — 16 passed, 0 failed                                       |
| Foundation Visual QA                              | Exit code 0 — 72 screenshots and 0 Foundation-critical findings         |

The final exact-head workflow additionally executes:

- `node scripts/audit-f2-navigation-search.mjs`
- `bun run format:check`
- `bun run check`
- tracked Working Tree verification

All F2 commands are wired into the permanent `package.json` aggregate gate.

## Visual QA

Permanent F2 Visual QA result:

- Screenshots: 89
- Routes: 5
- Viewports: 9
- Horizontal overflow cases: 0
- Hydration warning cases: 0
- Runtime error cases: 0
- Shared touch-target cases: 0
- Critical findings: 0
- Reduced-motion check: pass
- Zoom 200% checks: pass

Captured states:

- Header closed across all routes and viewports.
- Header after scroll.
- Desktop category menu open.
- Mobile menu open.
- Search empty.
- Search with real results.
- Search with no result.

Runtime reports and screenshots are generated under ignored `artifacts/` paths and are not committed to the Repository.

## Accessibility findings

Resolved in F2:

- Native and named triggers.
- Programmatic Search label.
- Visible focus behavior.
- Modal focus traps.
- Escape close.
- Explicit focus restoration.
- Body scroll lock and release.
- Non-color active-route indicators.
- Safe 44×44 shared controls.
- RTL alignment and `bdi` isolation for English brand/model data.
- Screen-reader result-count announcement.
- Keyboard suggestion selection.
- Removal of Hover-only Desktop menu access.

Deferred:

- Physical screen-reader testing and real-device assistive-technology certification remain F12.

## Performance observations

- No new remote font, blocking asset, or dependency was introduced.
- Search filtering uses the current in-memory Dataset and a deferred query value.
- Header scroll state uses one passive listener and requestAnimationFrame coalescing with full cleanup.
- Production build still reports large Homepage and model-viewer chunks inherited from the accepted Foundation.
- Bundle splitting and the large 3D model remain F9 and F11 work.

## Known limitations

- Search is frontend-only and uses `src/data/shoes.ts`; no backend Search API exists in this scope.
- There is no artificial network error state because no Search data layer or request exists. A fake error state was not introduced.
- Product availability, delivery, user-account state, and commercial guarantees are not asserted by the Shell.
- Automated screenshots do not replace human Persian typography review.
- Lint reports eight non-blocking warnings, primarily existing Fast Refresh warnings and one existing namespace-disable warning.
- GitHub Actions Artifact upload remains governed by the shared account storage quota and the accepted Foundation workflow policy.

## Out-of-scope findings and owners

- Homepage section composition and homepage-local navigation details → F3.
- Catalog filters, result-grid behavior, Product Cards, Quick View, and Wishlist interactions → F4/F5.
- Product Detail controls and gallery behavior → F6.
- Cart page and Checkout behavior outside the shared Cart trigger/Drawer connection → F7.
- Content-page design and copy → F8.
- Heavy Motion and 3D optimization → F9.
- Full canonical, metadata, and Technical SEO policy → F10.
- Bundle and model optimization → F11.
- Final physical accessibility certification and assistive-technology testing → F12.

## Working Tree

The final CI gate requires the tracked Working Tree to remain clean after Audit, Behavior, Typecheck, Lint, Format, Build, Foundation Visual QA, and F2 Visual QA. Generated reports remain untracked under ignored `artifacts/` paths.

## Ready for supervisor review

Ready for supervisor review: Yes
