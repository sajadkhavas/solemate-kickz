# F13 — Full Code Audit & Hardening

## Scope

F13 audits the complete accepted SOLE frontend lineage from `integration/sole-frontend-v2@953d03405ff21d02620a2b7ac3428713ac62de20` and hardens concrete defects without weakening inherited F0–F12 gates.

The audit covers tracked source inventory, import reachability, client persistence, commerce domain boundaries, catalog URL inputs, catastrophic SSR behavior, truth-safety, accessibility-sensitive fallbacks, code escape hatches, CI evidence and residual architecture debt.

## Controlled branch

- Owner branch: `phase/sole-f13-full-code-audit-hardening`
- Target: `integration/sole-frontend-v2`
- Baseline: `953d03405ff21d02620a2b7ac3428713ac62de20`
- `main` is not a delivery target for F13.

## Implemented hardening

### Persisted cart

The previous sanitizer accepted any positive finite quantity. A tampered `sole-store` record could therefore restore extreme quantities and produce unusable counts or non-finite monetary arithmetic.

F13 adds client-safety boundaries that are explicitly not inventory claims:

- maximum 99 units per local cart line;
- maximum 50 restored local cart lines;
- safe-integer validation before quantity use;
- duplicate restored lines are merged only up to the same ceiling;
- all Zustand cart write paths share the same quantity ceiling;
- the PDP quantity control exposes the same ceiling.

These limits protect local UI/state integrity only. They do not claim backend stock or purchase limits.

### Persisted account and discovery state

F13 bounds and normalizes persisted strings before they reach the UI, removes unknown product IDs from wishlist/recently-viewed state, deduplicates search history, caps demo address records and sanitizes legacy persisted `user` records.

This prevents malformed or manually modified localStorage from becoming an unbounded rendering/input surface while retaining the frontend-only demo-account contract.

### Catalog URL state

Catalog query and free-text filter parameters now have explicit maximum lengths before filtering. Oversized URL input falls back through the existing validated search contract instead of entering product filtering state.

### Search control and browser-gate stability

The global search field no longer exposes Chromium's native `type=search` cancel sub-control alongside the product-owned clear button. Search semantics remain owned by the surrounding search form, accessible label, keyboard handling and the single 44px custom clear control.

Repeated CI runs also proved that the inherited F2 test's local `visibleClick` helper could single-sample the DOM between React render frames after the target had first appeared. F13 therefore makes that F2-local helper wait for a visible, enabled target and perform the click in the same evaluation. The behavioral assertion remains unchanged: the real control must still cause the expected UI transition. The shared `scripts/browser-harness.mjs` remains exactly under its accepted F11 ownership and is not modified by this stabilization.

### Touch-target rendering margin

A later exact-head Visual QA run exposed a fractional-layout edge on product color-preview swatches that were specified at exactly 44px. One runner measured the raw target infinitesimally below the 44px release threshold. The swatches and their row are now 48px, preserving the permanent 44px gate while adding deterministic accessibility margin instead of weakening the threshold.

### Catastrophic SSR fallback

The catastrophic fallback is now:

- Persian-first;
- `lang="fa"` and `dir="rtl"`;
- explicitly `noindex, nofollow`;
- free of inline JavaScript event handlers;
- keyboard-focus visible;
- returned with `Cache-Control: no-store`.

The server-entry lazy import also clears its cached promise after an import rejection so a transient module-load failure does not poison every later request until process restart.

### Dead unsafe scaffold removal

`src/components/ui/chart.tsx` was unreachable from the application/server entry graph and contained a `dangerouslySetInnerHTML` escape hatch. Because the graph proved that it was unused shipping scaffold, F13 removes it instead of carrying an unnecessary unsafe surface.

## Permanent audit evidence

`scripts/audit-f13-full-code.mjs` inventories all tracked code and creates `artifacts/audits/f13-full-code-audit.json`.

Its hard gates cover high-risk source escape hatches, SSR fallback semantics, server-entry recovery, cart/state boundaries, bounded catalog search, F13 CI registration, cumulative evidence registration, baseline ancestry and artifact hygiene.

The code-final audit report contains:

- 221 tracked files;
- 168 tracked code files;
- 113 shipping source files;
- 110 TypeScript/JavaScript source modules;
- 65 modules reachable from the application/server entry graph;
- 13 hard F13 audit checks, all passing;
- zero critical findings.

The report also records 56 review-only architecture findings instead of deleting code blindly:

- 45 TypeScript/JavaScript modules not reachable from the current application/server entry graph;
- 11 route files that still declare local `head` metadata while centralized F11 SEO ownership exists.

These are cleanup candidates, not release blockers. Generated/config/tooling ownership and reusable UI scaffolding must be resolved deliberately before removal.

## Runtime regression evidence

`scripts/test-f13-hardening.mjs` injects malformed persisted state and oversized catalog input through the real browser application. It verifies that quantity arithmetic remains bounded and finite, unknown wishlist IDs are discarded, persisted profile text is bounded, oversized catalog queries fall back safely, and the flow emits no browser runtime errors.

## Validation evidence

The first code-final precursor head was `df9fae26ca1dc4ef5113d6142c371721f8722384`.

Frontend CI run `#841` / workflow run `31585391796` completed successfully on that exact SHA. The finalized initial handoff head `599db55e1bb35c1cfff084c1fbb715dc7373f288` also completed the full suite successfully in Frontend CI run `#842` / workflow run `31596256631`.

Those successful runs covered every inherited and F13 gate, including:

- F0/F1 foundation source and browser behavior;
- Homepage source and browser behavior;
- F2 Navigation/Search source and browser behavior;
- Content, Catalog, PDP, Cart/Checkout and Wishlist/Account/Orders source/browser suites;
- F10 Motion/3D source and browser suite;
- F11 Technical SEO source, SSR runtime and SEO safety QA;
- F12 performance/media audit and build budgets;
- F13 full-code audit and malformed-state browser behavior;
- VPS deployment contract audit;
- TypeScript, ESLint and all format gates;
- production build and VPS Node-server build;
- all permanent Visual QA suites;
- Foundation completion audit;
- aggregate cumulative evidence verification;
- clean working-tree verification.

Subsequent repeated exact-head/PR executions surfaced the two nondeterministic boundary conditions described above: the exact-44px swatch and F2 single-sample click readiness. Both are corrected in the final PR tree. The authoritative final head SHA, final PR-event CI, PR number and Integration merge SHA are intentionally recorded in GitHub metadata/final registration rather than self-referenced inside this content-addressed Git document.

The cumulative evidence artifact from the fully successful code-final runs reports zero F13 critical findings.

## Residual work boundary

F13 closes release-blocking frontend code hardening. The 56 review-only architecture findings may be handled in a later cleanup phase, but they are not required before frontend deployment once the final PR tree passes the same cumulative runtime, build, SEO, accessibility-sensitive and visual gates.

Real authentication, authoritative inventory, order creation, payment, shipping, tax and transactional account/order synchronization remain Backend integration work and are not fabricated by F13.

## Repository-history note

During F13 execution, one connector write used the contents API without the explicit `branch` field and therefore created a single file on the default branch. The mistake was detected immediately. A normal follow-up commit removed exactly that file; the resulting `main` tree SHA returned to the pre-write tree `b366d8b1dec1884be472f0c264aa38dc2bb5d490`. No force-push, reset, rebase or history rewrite was used.

Two later empty no-op files were accidentally created only on the F13 phase branch while invoking the GitHub connector and were immediately removed by normal follow-up commits. They produce no final tree/diff change and never targeted Integration or main. All F13 delivery changes are scoped to the controlled phase branch and PR into Integration.
