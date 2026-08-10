# Homepage Commercial Upgrade Handoff

## Repository

`sajadkhavas/solemate-kickz`

## Baseline

- Branch: `integration/sole-frontend-v2`
- SHA: `728b2eb67eb6e3bbf79ee2eb3f89e1298140e832`

## Phase branch

`phase/sole-homepage-commercial-upgrade`

## Objective

Upgrade the SOLE homepage with stronger commercial discovery inspired by proven sneaker-store merchandising patterns while preserving the existing premium visual language, truth-safe demo boundaries, RTL behavior, accessibility, SEO contracts, and deployment architecture.

The implementation intentionally borrows **commercial logic, not visual identity**. No external storefront layout, copy, branding, or proprietary asset is reproduced.

## What changed

### Quick Shop Paths

A new `QuickShopPaths` section appears directly after the hero and provides four direct catalog paths:

- New products → `quick=new`
- Verified price drops → `quick=sale`
- Limited-tagged products → `quick=limited`
- Lifestyle category → `category=lifestyle`

All counts are calculated from the repository dataset at render time.

### Merchandising Showcase

A new `MerchandisingShowcase` section adds accessible tabs for:

- New
- Price drop
- Limited

The panel reuses the same repository dataset and never derives ordering from fake sales, ratings, reviews, customer counts, or popularity. Price-drop percentages are calculated only when `sale_price > 0`, `price > 0`, and `sale_price < price`.

The price-drop mode orders eligible records by the mathematically derived percentage reduction in the current project data. This is presented as a dataset property, not a real-time promotion or urgency claim.

### Homepage composition

The homepage order is now:

1. Hero
2. Quick Shop Paths
3. Featured Drops
4. Merchandising Showcase
5. Categories
6. Brand Wall
7. Editorial/Hype
8. Trust information
9. Final CTA
10. Footer

This keeps the existing premium hero and editorial identity while moving useful shopping paths closer to the top of the page.

## Truth-safety decisions

The upgrade does **not** add:

- bestseller claims;
- live inventory claims;
- countdowns or artificial urgency;
- fake reviews or ratings;
- customer/order counts;
- fake free-shipping, returns, authenticity, payment, or support guarantees.

Product and pricing information remains explicitly demo/project data.

## Accessibility

- Quick Shop cards remain semantic links.
- Merchandising uses `tablist`, `tab`, `tabpanel`, `aria-selected`, and `aria-controls`.
- Interactive targets retain the existing 44×44 homepage touch contract.
- Motion is limited to small hover transitions and respects the global reduced-motion contract.
- Existing single-`h1` and section-heading hierarchy remains intact.

## SEO and routing

All new discovery links route to `/products` with existing validated catalog search parameters. No new route is created, no new indexable landing page is invented, and F11 canonical/noindex query policy remains unchanged.

## Performance scope

- No dependency was added.
- No new binary asset was added.
- Existing `HomeImage` lazy loading and failure fallback are reused for below-fold merchandising media.
- Hero/LCP behavior is unchanged.
- Deep bundle/media optimization remains F12 ownership.

## Permanent QA coverage

The existing F3 homepage gates were extended so the upgrade is not untested UI:

- source audit includes both new components;
- truthfulness checks cover verified sale guards and forbid bestseller/countdown-style claims;
- product-first order now includes Quick Shop and Merchandising;
- browser behavior validates the price-drop quick path and interactive merchandising tab state;
- visual QA checks presence of both sections at all required viewports and adds dedicated quick-shop/merchandising captures;
- CI format coverage includes the new component files.

## Files changed

- `.github/workflows/frontend-ci.yml`
- `docs/handoffs/HOMEPAGE-COMMERCIAL-UPGRADE.md`
- `scripts/audit-f3-homepage.mjs`
- `scripts/test-f3-homepage.mjs`
- `scripts/visual-qa-f3-homepage.mjs`
- `src/components/sections/MerchandisingShowcase.tsx`
- `src/components/sections/QuickShopPaths.tsx`
- `src/routes/index.tsx`

## Release rule

This upgrade is acceptable only after the exact final branch head passes the inherited cumulative Frontend CI, including homepage source/behavior/visual QA, F11 SEO runtime/safety, typecheck, lint, format, production build, VPS Node-server build, all inherited visual suites, cumulative evidence verification, and clean-tree verification.
