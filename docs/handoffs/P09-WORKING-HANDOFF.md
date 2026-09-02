# P09 Final Handoff — Loyalty, CRM & Notifications

Status: `COMPLETED / IMPLEMENTATION MERGED / FINAL CLOSURE RECORD`

Updated: 2026-09-02

## Exact evidence

- Frontend START_SHA: `d92aa3affe02b24ce40a3ed6062e8c333087b806`
- Frontend accepted implementation END_SHA: `11e84a91da8c516504389f4f3374eb014cb707a7`
- Frontend implementation CI: Frontend CI #1247 / run `33636810572` — PASS on the exact accepted head after a runner-only F10 rerun; all 137 steps passed.
- Frontend implementation PR: `sajadkhavas/solemate-kickz#56`
- Frontend implementation merge SHA: `2a0802624ebd2e477d6c0cf89dce27bf25d8e6ed`
- Backend START_SHA: `63409594be2b60083401c997fe71bbacb7209e5f`
- Backend accepted implementation END_SHA: `293f6432e790a9874b979ae30961fb9cd258bad7`
- Backend Quality #54 / run `33611927354` — PASS on the exact accepted backend head.
- Backend PR: `sajadkhavas/sole-backend#13`
- Backend merge SHA: `6b9fef79ee0585423b7f763974f87c82a67c9cf1`
- Tracking issue: `sajadkhavas/solemate-kickz#55`
- Open review threads at merge: `0` on both implementation PRs.

## Accepted scope

### P09.1 — Durable authenticated wishlist

- Wishlist truth is backend-owned and customer-scoped.
- Production cards, PDP and wishlist page use the backend-authoritative engagement boundary.
- Legacy local wishlist state is migrated only after backend acceptance; malformed local fixtures do not become production authority.
- Cross-customer access is rejected by the backend ownership boundary.

### P09.2 — Consent, preferences, unsubscribe, quiet hours and caps

- Notification preferences are explicit per channel.
- Unsubscribe is durable and authoritative.
- Quiet-hour and daily-cap policy is backend-owned; the browser cannot declare delivery eligibility.
- Production UI exposes the current server policy instead of inventing local consent state.

### P09.3 — Durable lifecycle signal orchestration

- Back-in-stock, price-drop and lifecycle signals use durable backend records/outbox orchestration.
- Signals are created only from authoritative inventory, price or lifecycle facts.
- Missing consent or policy eligibility fails closed.

### P09.4 — Delivery-attempt audit and fail-closed providers

- Delivery attempts are auditable and append-only.
- No external provider is claimed as successful without provider evidence.
- P09 does not enroll credentials, activate a live provider, or fabricate delivery state.

### P09.5 — Server-authoritative loyalty ledger

- Loyalty is an idempotent backend ledger with explicit earn, redeem, release and expire semantics.
- Balance and history are derived from server ledger truth.
- Production UI is read-only for balance/history and does not implement cosmetic/client-authoritative points.
- Negative balance, replay and concurrent overspend are guarded by backend tests and transaction/locking behavior.

### P09.6 — Production UI and permanent QA

- Production wishlist, notification center and loyalty surfaces are connected through the controlled engagement BFF.
- `audit:p09` / `test:p09` are permanently chained into the production-program audit.
- The accepted Frontend CI preserved TypeScript, lint, format, production build, VPS build/runtime smoke, all visual QA, aggregate evidence and clean-tree verification.
- Existing F12 performance limits were not increased or relaxed.

## QA notes

The first cumulative frontend attempt exposed a stale P03 source guard that matched the generic string `NotificationCenter`; it was corrected to continue forbidding the legacy/demo notification component while allowing the P09 production component. A later F10 browser attempt failed on one runner despite zero F10 source changes and no runtime/module exception. The exact same accepted commit was rerun on a fresh runner and F10 behavior passed without weakening the F10 test or changing 3D code. The final accepted implementation run `33636810572` completed every step successfully.

## Rollback impact

- Frontend rollback target: `d92aa3affe02b24ce40a3ed6062e8c333087b806` (pre-P09 accepted `main`).
- Backend rollback target: `63409594be2b60083401c997fe71bbacb7209e5f` (pre-P09 backend `main`).
- Rollback removes P09 wishlist ownership/migration, notification policy/orchestration/audit and loyalty-ledger extensions while preserving P08 and earlier accepted phases.
- No production deployment, production-data mutation, live notification-provider activation, provider credential enrollment or fabricated delivery occurred during P09.

## Guardrails carried forward

No production activation, production-data mutation, credential enrollment, inferred consent, fabricated price-drop/delivery claim, quiet-hour/cap bypass, client-authoritative loyalty balance, negative ledger balance or unreviewed loyalty promise is authorized by this phase.

## Next phase

P10 — SEO, Content & Merchant — remains registered and must start from the final accepted P09 `main` after this closure PR itself passes cumulative CI and merges.
