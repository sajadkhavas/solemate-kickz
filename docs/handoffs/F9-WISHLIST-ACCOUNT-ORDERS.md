# F9 — Wishlist, Account & Orders Experience

## Repository

`sajadkhavas/solemate-kickz`

## Phase branch

`phase/sole-f9-wishlist-account-orders`

## Accepted Integration baseline

`e870dfe7ea06e5967810391f67ce083035d34ad1`

## Scope completed

### Wishlist

- Dedicated `/wishlist` route using the existing persisted Zustand wishlist.
- Shared Product Cards keep wishlist state synchronized with catalog and Product Detail interactions.
- Designed loading, empty and populated states.
- Clear-all action and persisted item count.
- Desktop global wishlist entry point with local item count.
- Mobile primary navigation now exposes a direct Wishlist route as well.
- Product Card image failure has an explicit non-network fallback.
- Explicit frontend-only disclosure; Wishlist is browser-local and not attached to a real account.

### Account states and dashboard

- Dedicated `/account` route with URL-backed sections for overview, profile, addresses and orders.
- Explicit guest, active-demo-session and expired-demo-session states.
- Synthetic local demo session is intentionally separate from `/auth`; credentials are never turned into a fake real login.
- Profile edits persist only in the local Zustand store.
- Address add/remove flows persist only in the local Zustand store.
- Desktop and mobile account navigation lead to the Account dashboard.

### Orders

- Designed demo order list and detail states.
- Unknown-order state performs no Backend request and explains the dataset boundary.
- Order IDs, dates and statuses are explicitly marked as sample data.
- Payment and shipping are explicitly shown as unavailable/not performed rather than fabricated.

### Permanent quality evidence

- `scripts/audit-f9-wishlist-account-orders.mjs`
- `scripts/test-f9-wishlist-account-orders.mjs`
- `scripts/visual-qa-f9-wishlist-account-orders.mjs`
- `scripts/f9-browser-runner.mjs`
- F9 commands are registered in `package.json`.
- F9 audit, behavior and Visual QA are registered in cumulative Frontend CI.
- F9 JSON evidence is registered in `scripts/verify-cumulative-quality.mjs`.

The supervisor hardening pass expanded the permanent behavior gate to cover keyboard Wishlist clearing, PDP/ProductCard Wishlist synchronization, profile validation and long Persian values, empty optional profile values, address validation/add/remove, no Fetch/XHR persistence claims, direct URLs, browser Back/Forward order state and mobile Wishlist navigation.

The Visual QA gate now covers all nine required viewport widths plus Wishlist empty/populated, guest, active overview, profile, long profile, addresses, long address, orders list, order detail, missing order, expired session and reduced-motion states. It treats horizontal overflow, incorrect H1 count, unnamed buttons, sub-44px targets, horizontally clipped controls, focus-probe failure, broken Wishlist images, hydration errors and runtime errors as critical findings.

## Truthfulness boundaries

- No real account is created.
- No credential entered on `/auth` is persisted by F9.
- No real session, refresh token, OTP or password recovery is simulated as successful.
- No order, payment, shipment, inventory mutation or account API exists in F9.
- Profile and address data are local-only demo state.
- Demo orders are static interface fixtures and cannot be mistaken for transaction history.
- Profile/address saves are required by the behavior gate to perform no Fetch/XHR Backend synchronization.

## Supervisor audit record — 2026-08-07

### Baseline and code-final SHA

- Accepted Integration baseline: `e870dfe7ea06e5967810391f67ce083035d34ad1`
- Supervisor code-final SHA before this documentation-only record: `296363fd4e3cb1cad60ecfa878deea6f0aef9577`
- Target branch remains `integration/sole-frontend-v2`.
- `main` was not a target and was not modified by the F9 supervisor pass.

### Bugs/gaps found and corrected

1. Mobile primary navigation did not expose a direct Wishlist route; `/wishlist` is now present in the mobile menu.
2. `test:f9` did not prove several required behaviors. The permanent gate now covers keyboard interaction, cross-surface Wishlist synchronization, profile/address edge cases and local-only persistence, order Back/Forward/deep-link behavior and mobile Wishlist navigation.
3. `qa:visual:f9` omitted the required missing-order state and did not explicitly gate clipped controls/focus/broken Wishlist images or long local values. Those checks and captures are now permanent.
4. `audit:f9` previously checked only the existence/registration of several gates. It now asserts that the required F9 behavior and Visual QA coverage is present in the permanent scripts.

### GitHub Actions evidence

- Code-final Frontend CI run: `31178490452`
- Run number: `510`
- Exact head for that run: `296363fd4e3cb1cad60ecfa878deea6f0aef9577`
- Job: `quality` / job id `92865870068`
- Job execution state: completed as failure before any step started (`steps: []`, no runner assigned).
- GitHub annotation: `The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings`.

This is an external GitHub Billing/Spending Limit blocker and is **not** recorded as a code failure.

### Gate results

The exact-head workflow did not start its steps, therefore the following automated results are intentionally **not claimed as passed** for the supervisor code-final SHA:

- frozen install
- inherited source audits
- inherited browser behavior tests
- `audit:f9`
- `test:f9`
- typecheck
- lint
- format check
- production build
- inherited Visual QA
- `qa:visual:f9`
- Foundation completion audit
- `verify:cumulative`
- clean tracked working-tree gate

The supervisor performed source-level review of the F9 implementation, truthfulness boundaries, route registration, shared Wishlist state, permanent gate registration and the CI definition. That source review does not substitute for the blocked executable gates.

### Acceptance state

- PR #8 remains open and unmerged.
- Integration remains at the accepted baseline until an exact-head Frontend CI run actually executes and all gates pass.
- No Integration SHA is registered for F9 because no merge is permitted while the external blocker remains.
- Final supervisor decision at this record: `IMPLEMENTATION COMPLETE — NOT ACCEPTED`.

## Deferred boundaries

- Real authentication/session handling remains a Backend integration concern.
- Real order history/payment/shipping remains a Backend and checkout integration concern.
- Technical SEO remains owned by F11.
- Release-wide performance and accessibility regression remain owned by later dedicated phases.
