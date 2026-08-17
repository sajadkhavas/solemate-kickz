# F7 — Cart & Checkout Experience

## Repository

`sajadkhavas/solemate-kickz`

## Phase branch

`phase/sole-f7-cart-checkout`

## Baseline

Accepted Integration baseline:

`e870dfe7ea06e5967810391f67ce083035d34ad1`

The phase branch was verified at this exact SHA before implementation began.

## Final SHA

The authoritative final SHA is the final PR head reported in the supervisor summary. A Git commit cannot embed its own future content-addressed SHA without changing that SHA, so this handoff intentionally avoids a stale self-reference.

## Scope

F7 owns the frontend-only journey:

`Product → Add to Cart → Cart → Checkout → Review`

Implemented scope:

- variant-aware local cart identity using product id + explicit size;
- validated add-to-cart against the current `SHOES` Dataset;
- duplicate exact variants merge quantities while different sizes stay independent lines;
- quantity increase/decrease without a fabricated inventory cap;
- remove and clear-cart behavior;
- resilient persisted cart with explicit hydration and localStorage failure containment;
- stale persisted product/size/unavailable states remain visible and block Review instead of disappearing silently;
- shared Cart state across Cart Drawer and `/cart`;
- accessible Cart Drawer with Radix modal semantics, focus trap, initial focus, Escape, focus restoration and scroll lock;
- broken cart image fallback and long-name wrapping;
- dedicated `/cart` route with responsive line items and truthful summary;
- dedicated `/checkout` route with customer/contact/address validation;
- free-text province/city inputs because no verified province/city service is present in the repository;
- Persian/Arabic digit normalization for phone/postal input paths;
- session-scoped Checkout draft persistence for refresh resilience;
- focused error summary with associated field errors;
- explicit Order Review with items, quantities, sizes, subtotal, customer and address summary;
- `/cart` and `/checkout` use `noindex, follow`;
- permanent F7 audit, browser behavior and visual regression gates.

## Truthfulness boundaries

F7 intentionally does **not** invent business or backend facts.

Removed from the previous Cart implementation:

- fake free-shipping presentation;
- hard-coded 9% tax calculation;
- fake `SOLE10` coupon behavior;
- unsupported “secure payment”, “fast shipping” and “7 day return” trust badges;
- fake final payable total based on unavailable shipping/tax rules.

Current boundaries:

- product-level sold-out state and sizes come only from the existing project Dataset;
- the Dataset does not provide per-size inventory, so F7 does not impose stock-derived quantity limits;
- shipping option, shipping cost and delivery time are not fabricated;
- payment method, gateway logo, card flow and transaction success are not fabricated;
- the frontend never claims that a real order was created;
- the final Review action is intentionally disabled and says `ادامه پس از اتصال سرویس سفارش`;
- subtotal is only the sum of currently reviewable Dataset item prices; final order total is not computed without real backend rules.

## Accessibility

The implementation targets WCAG 2.2 AA behavior within F7:

- native buttons/links/form controls and explicit labels;
- 44px minimum interactive targets in Cart/Checkout paths;
- `aria-invalid` + `aria-describedby` error association;
- focused error summary and focus recovery after Cart removal;
- semantic Radix Cart dialog with focus containment/restoration;
- non-color-only error text and icons/labels;
- RTL document behavior with isolated LTR numeric/contact values;
- reduced-motion inheritance;
- forced-colors focus foundation retained;
- mobile safe-area/bottom-navigation clearance;
- visual gates for 200% page scale, keyboard-height viewport and long Persian content.

## Permanent quality gates

Added:

- `scripts/audit-f7-cart-checkout.mjs`
- `scripts/test-f7-cart-checkout.mjs`
- `scripts/visual-qa-f7-cart-checkout.mjs`
- `scripts/f7-browser-runner.mjs`

Registered commands:

- `bun run audit:f7`
- `bun run test:f7`
- `bun run qa:visual:f7`

F7 evidence is included in:

- `bun run check`
- `bun run verify:cumulative`
- `.github/workflows/frontend-ci.yml`

The F2 generated-route guard was not removed or bypassed. It strips only the authorized generated `/checkout` additions and byte-compares all remaining generated route content against the accepted F2 foundation tree.

## Test coverage

Browser behavior coverage includes:

- explicit product size → add-to-cart;
- exact duplicate merge and different-size identity;
- Drawer quantity/count, focus containment, body scroll lock, Escape and trigger focus restoration;
- persisted `/cart` state and hard refresh;
- quantity minimum behavior;
- remove focus recovery;
- stale missing-product and invalid-size persistence;
- broken image fallback;
- direct `/checkout` deep-link;
- empty Checkout;
- noindex metadata;
- invalid contact/address fields and focused error summary;
- Persian phone digits accepted/normalized;
- valid local Review and disabled real-order action;
- sessionStorage Checkout draft refresh persistence;
- localStorage failure containment;
- hydration/runtime error detection.

## Visual QA

The permanent visual gate covers both `/cart` and `/checkout` at:

`320, 375, 390, 430, 768, 1024, 1280, 1440, 1920`

Additional visual states:

- Cart Drawer at 320px;
- reduced motion;
- forced colors;
- 200% page scale;
- 390×500 keyboard-height viewport;
- long Persian Checkout address + Review;
- remote product image failure fallback.

Release-blocking checks include horizontal overflow, clipped Drawer, heading count, unnamed buttons, sub-44px targets, hydration failures and runtime exceptions.

## Backend boundaries

Still intentionally unimplemented until real services/contracts exist:

- order creation API;
- inventory reservation or per-variant stock limits;
- authoritative product/price synchronization;
- province/city API or authoritative geographic Dataset;
- shipping methods, rates, eligibility and delivery estimates;
- tax rules;
- payment methods/gateway session creation;
- payment success/failure callbacks;
- real order confirmation/receipt.

## Validation

Required exact-head validation is defined in Frontend CI with Node `22.23.1` and Bun `1.3.14` and includes inherited F0/F1, F2, F3, F4/F5, F6 and F8 gates plus F7.

Required F7 release validation is:

- `audit:f7`;
- `test:f7`;
- `typecheck`;
- `lint`;
- `format:check`;
- `build`;
- `qa:visual:f7`;
- `verify:cumulative`;
- all inherited frontend gates.

### Current external CI blocker

PR #9 triggered Frontend CI on the implementation head, but GitHub did not start the `quality` job. The check-run annotation reported:

`The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings`

Observed evidence from the first exact-head attempt:

- PR: `#9`;
- blocked workflow run: `31180237954`;
- blocked check-run/job: `92871499634`;
- result: the job never started, so no repository test/build/visual step executed.

This is an account/billing blocker, not a passing validation result. F7 must remain **Implementation Complete / Validation Blocked**, and the PR must remain Draft until the final PR head passes every required Frontend CI gate after billing/spending access is restored.

## Release state

- Implementation: complete for the requested F7 frontend scope.
- Truthfulness boundary: implemented.
- Permanent F7 gates: implemented and registered.
- GitHub Actions execution: blocked before job start by account billing/spending state.
- Accepted: **No**.
- Current classification: **Implementation Complete / Validation Blocked**.
- Merge into `main`: not performed.
- Intended PR base: `integration/sole-frontend-v2` only.
