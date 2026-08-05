# F3 Homepage Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f3-homepage`

## Foundation SHA

`a908b2723322dde27699fa4c92fa9c0de95e0c75`

## Final SHA

The exact documentation head is reported in the supervisor delivery after the immutable exact-head CI run. The validated implementation SHA and exact command evidence are recorded below after CI completion.

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

Pending immutable exact-head CI evidence. The implemented contract includes one `h1`, ordered `h2`/`h3` headings, semantic links/buttons/regions, visible focus inherited from Foundation, 44×44 declared F3 controls, keyboard-operable product rail, meaningful image alt text, decorative hiding, reduced-motion behavior, and 200% zoom checks.

## Performance observations

- Hero poster is eager, high priority, dimensioned, and never waits for the 3D module.
- The 3D module remains idle-loaded and optional; reduced-motion does not load it.
- Below-fold media uses lazy loading and explicit dimensions/aspect ratios.
- Homepage featured media is restricted to stable local overrides.
- Deep 3D compression and route-level bundle optimization remain F9/F11 ownership.

## Audit results

Pending immutable exact-head CI evidence from `scripts/audit-f3-homepage.mjs`.

## Behavior test results

Pending immutable exact-head CI evidence from `scripts/test-f3-homepage.mjs`.

## Build results

Pending immutable exact-head CI evidence for install, typecheck, lint, format, build, and aggregate Foundation gate.

## Visual QA summary

Pending immutable exact-head CI evidence from `scripts/visual-qa-f3-homepage.mjs`.

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

Expected clean after connector commits and exact-head CI verification; final evidence is reported in supervisor delivery.

## Ready for supervisor review

Pending immutable exact-head CI completion.
