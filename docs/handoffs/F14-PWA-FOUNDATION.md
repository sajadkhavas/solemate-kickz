# SOLE F14 — PWA Foundation

## Lineage

- Baseline branch: `integration/sole-frontend-v2`
- Baseline SHA: `389bcc5cdd3bec51dea2bcd4b3c7cb6772657b9b`
- Phase branch: `phase/sole-f14-pwa-foundation`
- Target branch: `integration/sole-frontend-v2`

## Delivered

- Persian RTL web-app manifest with install, maskable and shortcut metadata.
- Deterministic local 192px and 512px icons plus a maskable icon.
- Intent-driven Chromium install prompt and an accurate Safari/iOS Add to Home Screen guide.
- Versioned service worker with public-navigation network-first fallback and static-asset resilience.
- Dedicated Persian noindex offline fallback with an explicit stale-price/inventory warning.
- Online/offline status, user-approved update activation and app-badge synchronization with the local cart.
- Existing Web Share product behavior remains the product-share owner.

## Truth and security boundary

The service worker never handles `/api`, `/auth`, `/account`, `/checkout`, `/cart` or `/wishlist`. It does not cache mutation requests, cross-origin requests, payment state, order state, shipping state, final prices or inventory truth. Public cached pages are historical views only and the UI states that price and inventory must be revalidated online.

No notification permission is requested in F14. Push consent and subscription are owned by F15.

## Validation

- `bun run audit:f14`
- `bun run test:f14`
- `bun run typecheck`
- `bun run lint`
- `bun run build`
- cumulative Frontend CI, including F0–F13 gates and VPS build

HTTPS install/upgrade behavior and device-specific Safari/Android acceptance remain deployment gates because localhost/CI cannot prove production origin, certificates or OS-level installation behavior.
