# F12 — Performance & Media Optimization

Status: Candidate — exact-head CI pending

Baseline branch: `integration/sole-frontend-v2`
Baseline SHA: `4e08af6f1b0ac6bde85f400601c27a22fd69506f`
Phase branch: `phase/sole-f12-performance-media`

## Mission

Make the accepted F0–F11 frontend materially lighter and more predictable without changing commercial truth, accessibility, RTL behavior, SEO semantics, purchasing flows, or the visual identity.

## Baseline evidence

Accepted Integration CI #758 showed the client build at:

- homepage `index` chunk: ~603.14 kB minified / 184.64 kB gzip
- opt-in `model-viewer` chunk: ~884.19 kB minified / 252.47 kB gzip
- global app CSS: ~119.90 kB minified / 20.23 kB gzip
- largest local homepage image: ~159.83 kB
- hero poster: ~66.81 kB

The 3D library is already dynamically imported only after explicit user activation. F12 must preserve that progressive policy.

## F12 budgets

Hard CI budgets are build-output budgets, not synthetic Lighthouse scores:

- no non-3D client JS chunk may exceed 650 kB minified
- homepage route chunk must not exceed 610 kB minified or 190 kB gzip
- global CSS must not exceed 125 kB minified or 22 kB gzip
- local raster media must not exceed 180 kB per file
- model-viewer must remain an isolated opt-in chunk and must not be imported statically

These are regression ceilings around the accepted baseline. Future phases may tighten them after measured real-user data exists.

## Implementation targets

- preserve eager/high-priority hero poster and fixed dimensions
- keep non-critical homepage media lazy with async decoding
- add browser-native render containment for below-fold homepage sections
- keep 3D opt-in, in-view and document-visibility gated
- add deterministic build-budget reporting to CI
- add image/media source-contract checks
- add F12 evidence to the cumulative verifier

## Truth and accessibility constraints

No performance optimization may remove semantic headings, keyboard controls, reduced-motion behavior, image fallbacks, alt text, or storefront demo disclosures.

## Validation

Pending exact-head CI and cumulative acceptance.
