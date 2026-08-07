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
- Explicit frontend-only disclosure; Wishlist is browser-local and not attached to a real account.

### Account states and dashboard

- Dedicated `/account` route with URL-backed sections for overview, profile, addresses and orders.
- Explicit guest, active-demo-session and expired-demo-session states.
- Synthetic local demo session is intentionally separate from `/auth`; credentials are never turned into a fake real login.
- Profile edits persist only in the local Zustand store.
- Address add/remove flows persist only in the local Zustand store.
- Desktop and mobile account navigation now lead to the Account dashboard.

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
- F9 commands registered in `package.json`.
- F9 audit, behavior and Visual QA registered in cumulative Frontend CI.
- F9 JSON evidence registered in `scripts/verify-cumulative-quality.mjs`.

## Truthfulness boundaries

- No real account is created.
- No credential entered on `/auth` is persisted by F9.
- No real session, refresh token, OTP or password recovery is simulated as successful.
- No order, payment, shipment, inventory mutation or account API exists in F9.
- Profile and address data are local-only demo state.
- Demo orders are static interface fixtures and cannot be mistaken for transaction history.

## Expected validation

- F9 source/truthfulness audit.
- Browser behavior coverage for Wishlist persistence/clear, guest-to-active demo session, profile persistence, address persistence, order list/detail/missing, expired session and mobile account navigation.
- Visual QA across the nine standard viewports plus Wishlist empty/populated, guest, profile, addresses, orders, order detail, expired and reduced-motion states.
- Horizontal overflow, multiple/missing H1, unnamed buttons, targets below 44px, hydration failures and runtime failures are release-blocking.

## Deferred boundaries

- Real authentication/session handling remains a Backend integration concern.
- Real order history/payment/shipping remains a Backend and checkout integration concern.
- Technical SEO remains owned by F11.
- Release-wide performance and accessibility regression remain owned by later dedicated phases.

## Validation record

Final phase SHA, workflow run, gate counts and Integration registration SHA are recorded in the supervising PR after exact-head validation.
