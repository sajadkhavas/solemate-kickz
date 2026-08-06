# F4/F5 — Catalog and Product Card Experience

## Repository

`sajadkhavas/solemate-kickz`

## Branch

`phase/sole-f4-f5-catalog-product-card`

## Accepted Integration baseline

`f51bd1b110491887da6007a25ec3bfd30e3ed06b`

This baseline contains the accepted F0/F1 Foundation, F3 Homepage, F2 Global Shell/Search and F8 Content Pages phases.

## Scope delivered

- `/products` catalog information architecture
- URL-backed search, brand, category, size, maximum-price and quick filters
- URL-backed sorting and grid/list view
- Browser Back/Forward, refresh and deep-link restoration
- Desktop filter panel
- Accessible mobile filter dialog
- Active-filter chips and truthful empty state
- Responsive product cards
- Persistent Wishlist interactions
- Accessible Quick View
- Explicit size selection before cart insertion
- Sold-out and image-failure states
- Permanent source audit, browser behavior suite and Visual QA

## Initial findings

The inherited implementation stored only `brand`, `category`, `q` and `sort` in the URL. Size, price, quick filter and view state were local React state and were lost on refresh or browser-history navigation.

The inherited Product Card inserted the middle item of `shoe.sizes` into the cart without customer selection. The mobile filter experience was a fixed aside without an accessible modal contract. Several controls relied heavily on Hover and some color-preview targets were below the 44×44 interaction contract.

## Architecture decisions

### URL as catalog state

`src/catalog/catalog-state.ts` owns validation, parsing, serialisation, filtering and sorting. The URL stores:

- `brand`
- `category`
- `q`
- `sort`
- `sizes`
- `priceMax`
- `quick`
- `view`

This makes refresh, deep links and Back/Forward deterministic.

### Product selection boundary

Product Cards no longer add any arbitrary size. They link to Product Detail or open Quick View. Quick View requires an explicit size and refuses cart insertion for sold-out products.

### Truthfulness

The UI describes the records as project/demo data. Popular sorting uses the existing Dataset review count and is not presented as live sales popularity. No live stock, verified authenticity, customer reviews or commercial availability is claimed.

### Dialog behavior

Mobile filters and Quick View use Radix Dialog for Escape close, focus containment, focus restoration, overlay semantics and body scroll locking.

## Files changed

- `src/catalog/catalog-state.ts`
- `src/components/catalog/CatalogFilters.tsx`
- `src/components/catalog/QuickViewDialog.tsx`
- `src/components/ShoeCard.tsx`
- `src/routes/products.tsx`
- `scripts/audit-f4-f5-catalog-product-card.mjs`
- `scripts/f4-f5-browser-runner.mjs`
- `scripts/test-f4-f5-catalog-product-card.mjs`
- `scripts/visual-qa-f4-f5-catalog-product-card.mjs`
- `package.json`
- `.github/workflows/frontend-ci.yml`
- `docs/handoffs/F4-F5-CATALOG-PRODUCT-CARD.md`

## Dependency changes

None.

## Expected browser behavior coverage

- Real Dataset cards render
- Search persists in URL
- Quick filter persists in URL
- Size filter persists in URL
- Sorting persists in URL
- Browser Back/Forward restores state
- Refresh/deep-link restores filters and view
- Quick View opens with focus containment
- Cart action remains disabled until size selection
- Wishlist pressed state changes and persists
- Escape closes Quick View and restores focus
- Mobile filter dialog traps focus and locks scroll
- Mobile filters update URL and close through Apply
- Sold-out products cannot be added
- No hydration mismatch
- No runtime exception

## Visual QA matrix

Default catalog state is checked at:

- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Additional states:

- filtered list deep link
- empty results
- mobile filter dialog
- Quick View dialog
- Reduced Motion

Critical criteria include horizontal document overflow, invalid H1 count, unnamed buttons, F4/F5 targets below 44×44, hydration failures and runtime errors.

## Accessibility expectations

- One H1 on `/products`
- Semantic labels for search and sort
- Live result count
- `aria-pressed` for filters, view, previews and Wishlist
- 44×44 minimum owned interaction targets
- Dialog title and description
- Escape close, focus containment and focus restoration
- No required Hover-only action
- Reduced Motion support
- RTL and mixed-direction isolation

## SEO boundary

The unfiltered catalog declares `/products` as canonical. Final index/noindex policy for arbitrary filtered combinations remains owned by F10 Technical SEO.

## Performance boundary

Product images remain remote Dataset media inherited by the project. F4/F5 adds stable dimensions and failure fallbacks. Final image delivery, caching, source replacement and route bundle budgets remain F11 work.

## Deferred findings and owners

- Full product gallery, variant inventory, size availability and PDP purchase flow: F6
- Cart page and frontend checkout flow: F7
- Advanced card/page transitions and motion tuning: F9
- Filter canonical/noindex strategy and structured data: F10
- Remote product-media delivery and bundle budgets: F11
- Physical screen-reader, forced-colors, real-touch and final release certification: F12
- Authoritative inventory, price, policy and commercial content: Backend/business owner

## Final evidence

The exact final branch SHA, CI run, command outcomes and supervisor decision are recorded in Pull Request #5 after immutable exact-head validation. A commit cannot truthfully embed its own final SHA.

## Working tree

Must be clean after the complete cumulative quality gate. Runtime reports, logs and screenshots remain ignored and are not committed.

## Ready for supervisor review

No. This status changes to Yes only after source audit, browser behavior, Typecheck, Lint, formatting, production build, Visual QA, aggregate `check` and clean-tree verification pass on the exact final head.
