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

### Catastrophic SSR fallback

The catastrophic fallback is now:

- Persian-first;
- `lang="fa"` and `dir="rtl"`;
- explicitly `noindex, nofollow`;
- free of inline JavaScript event handlers;
- keyboard-focus visible;
- returned with `Cache-Control: no-store`.

The server-entry lazy import also clears its cached promise after an import rejection so a transient module-load failure does not poison every later request until process restart.

## Permanent audit evidence

`scripts/audit-f13-full-code.mjs` inventories all tracked code and creates `artifacts/audits/f13-full-code-audit.json`.

Its hard gates cover high-risk source escape hatches, SSR fallback semantics, server-entry recovery, cart/state boundaries, bounded catalog search, F13 CI registration, cumulative evidence registration, baseline ancestry and artifact hygiene.

The report also records review-only architecture evidence instead of deleting code blindly:

- unreachable TypeScript/JavaScript source modules from the application/server entry graph;
- route files that still declare local `head` metadata while centralized F11 SEO ownership exists;
- largest tracked code files;
- direct runtime dependency surface not observed from reachable source imports.

Review-only findings are evidence for supervised cleanup; they are not silently treated as defects when the generated/imported/config ownership model may explain them.

## Runtime regression evidence

`scripts/test-f13-hardening.mjs` injects malformed persisted state and oversized catalog input through the real browser application. It verifies that quantity arithmetic remains bounded and finite, unknown wishlist IDs are discarded, persisted profile text is bounded, oversized catalog queries fall back safely, and the flow emits no browser runtime errors.

## Validation status

F13 must pass its own audit/runtime gates and every inherited Frontend CI gate on the exact final head before PR acceptance. Final CI run IDs, residual review findings, PR number and Integration merge SHA are recorded at closure rather than predeclared here.

## Repository-history note

During F13 execution, one connector write used the contents API without the explicit `branch` field and therefore created a single file on the default branch. The mistake was detected immediately. A normal follow-up commit removed exactly that file; the resulting `main` tree SHA returned to the pre-write tree `b366d8b1dec1884be472f0c264aa38dc2bb5d490`. No force-push, reset, rebase or history rewrite was used. All F13 delivery changes after that correction are explicitly scoped to the F13 branch.
