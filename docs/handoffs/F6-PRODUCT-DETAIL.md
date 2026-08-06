# F6 — Product Detail Experience

## Repository

`sajadkhavas/solemate-kickz`

## Phase branch

`phase/sole-f6-product-detail`

## Accepted Integration baseline

`35c0d16b0243e927523a2e715a78a4e7e9c68046`

## Scope completed

### Gallery and product selection

- Product gallery with explicit previous/next controls.
- Arrow-key, Home/End and horizontal swipe navigation.
- Semantic thumbnail tablist and selected-state announcement.
- Designed image-failure fallback for remote media.
- Accessible zoom dialog.
- Explicit size selection; no automatic size is chosen.
- Truthful size guide based only on measuring the foot and the sizes present in the current dataset.

### Purchase and states

- Quantity stepper wired to local cart quantity.
- Add-to-cart remains disabled until a size is explicitly selected.
- Dataset-level sold-out products cannot be added.
- Mobile sticky purchase bar follows the same selection and sold-out rules.
- Wishlist exposes `aria-pressed`.
- Share uses the platform share API or clipboard fallback.
- Related products and recently viewed products use the existing `SHOES` dataset and shared Product Card.
- Unsupported claims about per-size inventory, materials, origin, authenticity, shipping or returns were removed.
- Color values are presented as a recorded palette, not as independently purchasable variants.

### Permanent quality evidence

- `scripts/audit-f6-product-detail.mjs`
- `scripts/test-f6-product-detail.mjs`
- `scripts/visual-qa-f6-product-detail.mjs`
- `scripts/f6-browser-runner.mjs`
- F6 commands registered in `package.json`.
- F6 audit, browser behavior and Visual QA registered as direct single-pass CI steps.
- The cumulative verifier reads generated JSON evidence instead of rerunning browser suites.

## Expected evidence

- F6 source and truthfulness audit.
- Browser behavior coverage for selection, quantity, cart, gallery controls, keyboard, swipe, image fallback, size guide, wishlist, mobile sticky purchase, sold-out handling, related products and recently viewed products.
- Visual QA across nine standard viewports plus selected, size-guide, zoom, sold-out and reduced-motion states.
- Horizontal overflow, heading count, unnamed controls, touch targets, hydration and runtime failures are release-blocking.

## Boundaries

- Backend inventory, checkout, payment, shipping rules, returns policies and authenticity verification are not implemented or simulated.
- Technical structured data and final canonical strategy remain owned by F10.
- Bundle optimization and remote media migration remain owned by F11.
- Release-wide accessibility regression remains owned by F12.

## Supervisor correction record

- Exact-head run `31123281366` failed only the permanent check `size guide avoids fabricated conversion data`.
- The failure was caused by wording drift: the content said `نمودار یا جدول رسمی`, while both the audit and browser test intentionally required the explicit phrase `نمودار رسمی`.
- The truthful content was aligned to `نمودار رسمی یا جدول رسمی برند` without adding any conversion values, table, brand-specific size claims or backend data.
- The audit was not removed, skipped or weakened.
- Final acceptance still requires a successful exact-head CI run and a successful post-merge Integration CI run.

## Validation

Final phase SHA, exact-head workflow run, counts, Integration merge SHA and post-merge CI result will be recorded after all gates pass.
