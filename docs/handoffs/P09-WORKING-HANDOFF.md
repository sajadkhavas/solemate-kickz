# P09 Working Handoff — Loyalty, CRM & Notifications

Status: `STARTED / SAFE CHECKPOINT / NOT IMPLEMENTED / NOT PR-READY / NOT CLOSED`

Updated: 2026-09-02

## Exact baselines

- Frontend START_SHA: `d92aa3affe02b24ce40a3ed6062e8c333087b806`
- Backend START_SHA: `63409594be2b60083401c997fe71bbacb7209e5f`
- Branch in both repositories: `phase/sole-p09-loyalty-crm-notifications`
- Tracking issue: `sajadkhavas/solemate-kickz#55`

## Registered scope

1. P09.1 durable authenticated wishlist with ownership and safe migration from local state.
2. P09.2 channel consent/preferences, unsubscribe, quiet hours and frequency caps.
3. P09.3 back-in-stock, price-drop and lifecycle signals through a durable outbox.
4. P09.4 delivery-attempt audit and fail-closed adapters without fabricated delivery.
5. P09.5 idempotent loyalty ledger with explicit earn, redeem, release and expire rules.
6. P09.6 Production UI, permanent adversarial QA, registry/handoff closure and merges.

## Completed checkpoint work

- Live P08 final-record frontend `main` and backend `main` were fetched and verified before branching.
- Both remote P09 branches were created from the exact baselines above.
- Issue #55 was created with six unchecked acceptance parts and production guardrails.
- Backend checkpoint commit `d1663c5eff35c9824d0d8efbf55a7b098ac0a4d3` was published to the P09 branch.
- The checkpoint adds the first migration and model layer for:
  - `customer_wishlist_items`;
  - `notification_preferences`;
  - `notification_signals`;
  - append-only `notification_delivery_attempts`;
  - append-only `loyalty_ledger_entries`;
  - authenticated ownership/unsubscribe/signal timestamps on existing `back_in_stock_intents`.

## Important truth about the checkpoint

The Backend checkpoint is deliberately **not accepted implementation evidence**. PHP/Pint/migrations/tests/CI have not yet run on it. No controller, service, scheduler, command, operator resource, Frontend API/UI or permanent P09 gate has been implemented yet. No PR has been created. P09 must remain `registered` in the phase registry and every Issue #55 checkbox must remain unchecked.

## Mandatory next actions

1. Fetch both P09 branches and verify the exact heads; Backend must be `d1663c5eff35c9824d0d8efbf55a7b098ac0a4d3`, Frontend contains this handoff commit.
2. Review the migration against Laravel 13/MySQL and run Pint before adding behavior; fix checkpoint schema rather than treating it as final.
3. Implement Backend domain services and owner-scoped API for wishlist, preferences/unsubscribe, signals/delivery audit and loyalty balance/history/redeem/release/expire.
4. Bind signal generation only to authoritative inventory/price/order facts. Missing consent, configured adapter, frequency allowance or quiet-hour eligibility must fail closed and create truthful audit evidence.
5. Add adversarial Backend tests for cross-user access, idempotency, duplicate delivery, revoked consent, caps, quiet hours, ledger overspend, expiry and concurrent redemption.
6. Pass exact-head Backend Quality before merging its PR.
7. Replace Production local wishlist/notification authority with owner-scoped Backend surfaces while keeping development fixtures deterministic. Add loyalty history/balance and explicit non-cash terms without cosmetic points.
8. Add `audit:p09`, `test:p09`, cumulative report requirement, format list and handoff. Run full 137-step Frontend CI with unchanged F12 budgets.
9. Only after exact-head green runs: update registry/PROJECT_STATUS/README, merge both PRs, close Issue #55 as completed, remove this working-status wording or convert this file into the final P09 handoff.

## Guardrails

No production activation, production-data mutation, credential enrollment, live provider delivery, inferred consent, fabricated price drop/delivery, quiet-hour or cap bypass, client-authoritative points, negative balance, or unreviewed loyalty promise is authorized in P09.
