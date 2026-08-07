# F7 + F9 Supervisor Integration Candidate

## Purpose

This record reconciles the parallel F7 and F9 phase branches before either phase is registered in `integration/sole-frontend-v2`.

F10 is intentionally out of scope.

## Accepted common baseline

`integration/sole-frontend-v2@e870dfe7ea06e5967810391f67ce083035d34ad1`

## Phase heads reconciled

- F7 Cart & Checkout: `phase/sole-f7-cart-checkout@e2a1433f0320d9ffea165011013536ac7f76b3dc`
- F9 Wishlist, Account & Orders: `phase/sole-f9-wishlist-account-orders@59fdbc234dece5c1f1b3d55f590bcb87e173b670`

The supervisor candidate is a two-parent merge descendant of both phase heads so neither implementation lineage is discarded.

## Integration corrections

### Shared Zustand persistence

F7 introduced the production-safe Cart persistence contract: variant-aware Cart records, storage failure containment, explicit hydration and persisted-state sanitization. F9 introduced browser-local Wishlist/Account/Profile/Address persistence.

The integrated store keeps both contracts. The F7 persistence `merge` sanitizes and restores F9 demo account fields instead of silently dropping them, and `partialize` persists both phase domains.

### Generated route tree

The combined route tree registers all authorized additive routes:

- `/checkout` from F7;
- `/wishlist` from F9;
- `/account` from F9.

The F2 audit now verifies that the generated full-path set is exactly the accepted Foundation route set plus those three authorized additions. Any other route addition or route loss remains a failing condition.

### Cumulative quality pipeline

The integrated package scripts, Frontend CI workflow and cumulative verifier require both F7 and F9:

- `audit:f7`, `test:f7`, `qa:visual:f7`;
- `audit:f9`, `test:f9`, `qa:visual:f9`;
- all inherited F0/F1, F2, F3, F4/F5, F6 and F8 gates;
- Typecheck, Lint, Prettier, Production Build and cumulative evidence verification.

The workflow remains read-only (`contents: read`).

## Truthfulness boundary

No real authentication, order, payment, shipping, inventory mutation or account API is invented by this reconciliation. F7 checkout remains frontend-only and blocked before a fake real-order action; F9 Account/Orders remain explicitly local/sample UI states.

## Current validation blocker

On 2026-08-07, exact-head reruns for both phase PRs again failed before a runner was assigned. GitHub reported that recent account payments had failed or the Actions spending limit needed to be increased. The jobs had no executed steps.

Therefore the combined candidate must not be called Accepted and must not be registered into Integration until an exact-head Frontend CI run actually executes and every cumulative gate passes.

## Registration rule

When GitHub Actions execution is restored:

1. run Frontend CI on the exact supervisor candidate head;
2. fix any real code/test/visual regression without weakening gates;
3. require all cumulative gates to pass;
4. only then merge/register the candidate in `integration/sole-frontend-v2`;
5. do not modify `main`.
