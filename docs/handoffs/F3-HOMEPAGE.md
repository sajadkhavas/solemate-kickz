# F3 Homepage Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f3-homepage`

## Foundation SHA

`a908b2723322dde27699fa4c92fa9c0de95e0c75`

## Final SHA

Validated implementation SHA: `2e1be0684a12318797df39a559ddb2ec4818a178`

The documentation commit cannot contain its own SHA. The exact final branch head and its immutable CI run are reported in the supervisor delivery after this handoff is committed.

## Homepage findings

The accepted Foundation homepage presented several F3 blockers:

- metadata claimed an unsupported `۲۳۲+` product count;
- the hero displayed unsupported brand and inventory counts and depended on continuous motion;
- the page used a continuously moving brand marquee and repeated reveal wrappers;
- the urgency section claimed limited stock without an authoritative inventory source;
- the trust section claimed free shipping, unconditional seven-day returns, authenticity, and an official payment gateway without verified policy or backend evidence;
- the newsletter form implied a subscription workflow without a connected backend;
- discovery order favored visual effects over a short path to real project routes and product records;
- remote product media remained present in the general dataset, so F3 restricts homepage selections to records with stable local overrides.

## Information architecture before and after

Before:

1. Hero
2. Infinite brand marquee
3. Featured products
4. Categories
5. Urgency/limited-stock campaign
6. Brand wall
7. Unsupported trust claims
8. Non-functional newsletter form
9. Footer

After:

1. Product-first hero with explicit demo disclosure
2. Featured project products with stable local media
3. Valid category discovery
4. Text-first brand discovery
5. Editorial sneaker/streetwear story
6. Truthful storefront and commerce information
7. Final catalog/about CTA
8. Footer transition

## Visual decisions

- One dominant hero and one controlled lime focal accent per viewport.
- Persian-first headline and copy, with isolated LTR brand/model fragments.
- Shorter, responsive hero composition with bounded media ratio and stable poster.
- Editorial spacing and clear section hierarchy instead of repeated glow/card treatment.
- Horizontal product rail on mobile and a four-column grid on large screens.
- Category media remains local and readable without hover.
- Brand discovery uses stable text labels instead of missing or remote logos.
- Continuous marquee and page-wide reveal choreography were removed from the homepage route.

## Content decisions

- All visible products, categories, brands, prices, and routes originate from the repository dataset.
- Current product and price records are explicitly labelled as demo/project data.
- No popularity, review, customer, order, delivery, authenticity, stock-pressure, or payment claims are rendered.
- The newsletter form was replaced by navigation to real frontend destinations.
- Editorial copy describes the interface and sneaker/streetwear selection without unsupported commercial history.

## Truthfulness checks

- Unsupported product and brand counts removed.
- Unsupported free-shipping, return, authenticity, payment, and limited-stock claims removed.
- Sale treatment is rendered only when `sale_price > 0`, `price > 0`, and `sale_price < price`.
- Demo storefront, price, inventory, and checkout limitations are visible.
- No fake Review, rating, countdown, urgency, or social-proof content remains in F3 components.

## Component changes

- `Hero`: rebuilt as a Persian-first, product-led composition with real destinations and explicit demo disclosure.
- `ShoeViewer3D`: poster-first progressive enhancement; reduced-motion and unsupported/error states keep the static image available; idle callbacks and listeners clean up.
- `FeaturedDrops`: repository-backed stable local selection, verified sale guard, RTL horizontal rail, keyboard controls, empty state, image fallback, and demo price labels.
- `Categories`: valid category queries, local responsive media, counts derived from the repository dataset, and no hover-only action.
- `BrandWall`: stable text fallback, valid brand queries, repository-derived counts, and mobile-safe grid.
- `HypeSection`: rewritten as a truthful editorial story with local media and valid navigation.
- `TrustBadges`: rewritten as storefront status and honest commerce guidance rather than unsupported trust promises.
- `Newsletter`: replaced by a final CTA using valid frontend routes.
- `HomeImage`: added as a resilient image-failure boundary for homepage media.
- Homepage route: product-first order, honest metadata, one main landmark, no marquee, and no repeated reveal wrappers.

## Files changed

- `.github/workflows/frontend-ci.yml`
- `docs/handoffs/F3-HOMEPAGE.md`
- `scripts/audit-f3-homepage.mjs`
- `scripts/test-f3-homepage.mjs`
- `scripts/visual-qa-f3-homepage.mjs`
- `src/components/ShoeViewer3D.tsx`
- `src/components/sections/BrandWall.tsx`
- `src/components/sections/Categories.tsx`
- `src/components/sections/FeaturedDrops.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/HomeImage.tsx`
- `src/components/sections/HypeSection.tsx`
- `src/components/sections/Newsletter.tsx`
- `src/components/sections/TrustBadges.tsx`
- `src/routes/index.tsx`

## Assets changed

No binary asset was added, removed, or modified. F3 reuses the repository-local hero, hype, and category images.

## Dependencies

No runtime or development dependency was added. `package.json` and `bun.lock` remain unchanged.

## Routes and viewports

Primary route: `/`

Validated destinations:

- `/products`
- `/products?sort=newest`
- `/products?category=<repository-category>`
- `/products?brand=<repository-brand>&sort=newest`
- `/product/$id`
- `/brands`
- `/about`

Visual QA viewports:

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

## Accessibility results

Passed on validated implementation SHA `2e1be0684a12318797df39a559ddb2ec4818a178` in CI run `31002728771`:

- exactly one `h1` and complete section heading hierarchy;
- semantic links, buttons, landmarks, and named regions;
- route focus restoration after SPA navigation;
- keyboard-operable RTL product rail;
- visible 44×44 minimum F3 touch targets on mobile;
- meaningful image alternatives and resilient image-failure labels;
- reduced-motion poster fallback with the optional 3D viewer absent;
- 200% zoom retained hero and final CTA content;
- no hydration mismatch, runtime exception, fixed-navigation overlap, or horizontal document overflow.

## Performance observations

- Hero poster is eager, high priority, dimensioned, and never waits for the 3D module.
- The 3D module remains idle-loaded and optional; reduced-motion does not load it.
- Below-fold media uses lazy loading and explicit dimensions/aspect ratios.
- Homepage featured media is restricted to stable local overrides.
- Deep 3D compression and route-level bundle optimization remain F9/F11 ownership.

## Audit results

`scripts/audit-f3-homepage.mjs`: **17/17 checks passed, 0 failed** on validated implementation SHA `2e1be0684a12318797df39a559ddb2ec4818a178`.

Evidence includes Foundation ancestry, one `h1`, heading hierarchy, valid CTA destinations, truthfulness and sale guards, alt policy, dimensioned non-lazy LCP media, reduced-motion hooks, touch-target contract, resilient states, product-first IA, stable homepage media, handoff presence, and absence of committed runtime artifacts.

## Behavior test results

`scripts/test-f3-homepage.mjs`: **13/13 tests passed, 0 failed** on validated implementation SHA `2e1be0684a12318797df39a559ddb2ec4818a178`.

Covered hero and secondary CTA navigation, route focus, product-rail keyboard behavior, RTL horizontal scrolling, category and brand links, image fallback, reduced motion, mobile touch targets, hydration, runtime exceptions, and same-origin network failures.

## Build results

CI run `31002728771`, job `92295236319`, completed successfully on the validated implementation SHA:

- `bun install --frozen-lockfile`: passed;
- Foundation source-contract and browser behavior gates: passed;
- `bun run typecheck`: passed;
- `bun run lint`: passed with zero errors; the stale F3 suppression warning was removed in the subsequent cleanup commit;
- Foundation and F3 Prettier checks: passed;
- `bun run build`: passed for client and SSR bundles;
- Foundation completion audit: 19/19 passed;
- aggregate `bun run check`: passed;
- exact-head working-tree verification: clean.

The build reports an existing large-chunk advisory and the current `shoe.glb` remains approximately 8 MB; both are deferred to F11 rather than hidden or weakened in F3.

## Visual QA summary

`scripts/visual-qa-f3-homepage.mjs`: **passed with 56 screenshots and 0 critical findings** on validated implementation SHA `2e1be0684a12318797df39a559ddb2ec4818a178`.

All nine required viewports were captured at fold, hero, products, brands, editorial, and page end, plus dedicated 200% zoom and reduced-motion captures. Automated checks found no RTL direction failure, missing section, multiple `h1`, horizontal overflow, undersized declared F3 target, hidden/overlapped hero CTA, missing hero poster, hydration/runtime error, or reduced-motion regression.

## Limitations

- The repository product records are demo data and still include remote Unsplash images outside the local F3 featured subset.
- ProductCard architecture and catalog semantics are intentionally not broadly rewritten in F3.
- The approximately 8 MB 3D model is still present and optional; compression belongs to F9/F11.
- Automated visual checks do not replace physical screen-reader and real-device review in F12.
- No real ordering, inventory, payment, newsletter, shipping, return, or support backend exists in this frontend phase.

## Findings referred to later phases

- **F4/F5:** audit ProductCard/Quick View/Wishlist, catalog sort semantics, demo popularity/review fields, remote media strategy, URL-state ownership, and complete catalog states.
- **F9:** consolidate motion grammar, evaluate remaining Framer Motion usage, and optimize 3D interaction/presentation.
- **F10:** finalize homepage canonical, Open Graph metadata, structured-data eligibility, and indexing decisions.
- **F11:** compress/replace the 3D model, measure route bundle and Core Web Vitals, and finalize media budgets.
- **F12:** physical keyboard, touch, screen-reader, forced-colors, Persian typography, and release-candidate visual review.

## Working tree

Clean on validated implementation SHA `2e1be0684a12318797df39a559ddb2ec4818a178`; runtime reports and screenshots were generated only inside CI and were not committed.

## Ready for supervisor review

Yes, subject to the final immutable exact-head CI run triggered by this documentation commit. The exact final SHA and run result are reported in the supervisor delivery.
