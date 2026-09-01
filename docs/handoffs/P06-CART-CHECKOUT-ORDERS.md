# P06 — Cart, Checkout & Orders Handoff

## Phase record

- PHASE: P06
- STATUS: COMPLETED / REGISTERED / MERGED / CLOSED
- START_SHA: `1b7798e94dc4cb9b8b03972e26e8e9dcf8dafb0f`
- END_SHA: `cbb5c014a22878f0efde05fccbf3995e89c5570a`
- BRANCH: `phase/sole-p06-cart-checkout-orders`
- PR: https://github.com/sajadkhavas/solemate-kickz/pull/45
- CLOSURE_SHA: `b520b51fffb2fc020c21e66eb1cee8396dd3d726`
- FRONTEND_MERGE_SHA: `93d145deac79aebcdfd406f44aefc0da170cb494`
- BACKEND_START_SHA: `8be9f01223908eb3359512b213a0b835f43cadfa`
- BACKEND_END_SHA: `752e044337b24cbc4b3c1e84f72d466bc186a1ce`
- BACKEND_MERGE_SHA: `269616149acbd8977fd55c2bfde6fd65bffbe45a`
- BACKEND_PR: https://github.com/sajadkhavas/sole-backend/pull/10
- TRACKING_ISSUE: https://github.com/sajadkhavas/solemate-kickz/issues/44

## Scope

- P06.1 capability-scoped guest cart with authenticated ownership adoption
- P06.2 server-authoritative variant price, availability, quantity and cart totals
- P06.3 authenticated checkout with owned address and authoritative shipping policy
- P06.4 UUID idempotency fingerprint and deterministic checkout recovery
- P06.5 transactional multi-location inventory reservation and automatic expiry release
- P06.6 durable append-only order state/events plus customer order history
- P06.7 production-only cart/checkout/account integration, permanent gates and closure evidence

## Exclusions

P07 owns payment providers, payment success, shipping quotes/adapters, fulfillment, refunds and returns. P06 does not activate a production server, mutate production data, enroll credentials, fabricate discounts or claim payment success.

## Files changed and dependencies

Backend adds the cart/order schema, models, services, state/expiry command, API controller/routes, factories, OpenAPI contract and feature tests. Frontend adds the allow-listed commerce BFF, typed Zod client, Production cart/checkout/order surfaces and permanent P06 audit/test evidence. Existing Laravel 13, Sanctum, MySQL, TanStack Start and Zod dependencies are reused; no new runtime package or provider credential was added.

## Commands and acceptance evidence

- Backend local: P06 feature tests `5 tests / 33 assertions`; full suite `55 tests / 264 assertions`; Pint, PHP syntax, strict Composer validation, route/operator boot and locked production dependency audit passed.
- Backend exact-head: Backend quality #36 / run `33530472189` passed on `752e044337b24cbc4b3c1e84f72d466bc186a1ce`; PR #10 merged as `269616149acbd8977fd55c2bfde6fd65bffbe45a`.
- Frontend local: P06 source audit, P06 behavior contract `5/5`, F2 `27/27`, F7 `40/40`, P03 audit, typecheck, lint, production build and unchanged F12 budgets passed. Local browser execution was unavailable because the workspace had no Chrome/Chromium; GitHub CI owns exact browser and visual acceptance.
- Frontend exact-head: Frontend CI #1181 / run `33532454934` passed the complete cumulative gate on END_SHA, including P06, production/VPS builds, runtime smoke, browser/visual suites, aggregate evidence and clean-tree verification.
- Frontend closure: Frontend CI #1183 / run `33533963751` passed on exact closure SHA; PR #45 merged as `93d145deac79aebcdfd406f44aefc0da170cb494`, with zero unresolved review threads, and issue #44 closed as completed.
- Earlier CI #1175, #1177 and #1179 exposed and then verified controlled evolution of historical F2/F7/P03 assertions; no gate was removed or relaxed and the accepted evidence is exact-head CI #1181.

## Routes and viewports

Production `/cart`, `/checkout` and `/account?section=orders` use backend-authoritative state through the exact allow-listed `/api/commerce/$` BFF. Existing mobile/desktop F7 and F9 browser/visual suites remain cumulative and passed in the accepted Frontend CI.

## Accessibility

Existing keyboard/focus/semantic controls remain enforced. Loading, empty, unavailable and error states are textual; cart quantity controls are labelled; checkout does not claim payment success.

## Performance

Accepted F12 limits remain unchanged. Production route swapping retains lightweight customer/cart shells and no P06 budget increase was introduced.

## Security and privacy

The guest cart identifier is an opaque UUID stored only in an HttpOnly, SameSite=Lax cookie; authenticated checkout requires an owned address. Server price/inventory/shipping policy are authoritative, checkout uses a UUID Idempotency-Key and fingerprint, inventory rows are locked transactionally, order state/events are protected, and production policy fails closed. No card/payment data is accepted in P06.

## Known limitations and out-of-scope findings

Payment capture, shipping-provider quotes, fulfillment, refunds and returns remain P07. Reservation expiry is implemented and scheduled but no paid production worker/server is activated before P12. The IETF Idempotency-Key draft was used as a design reference only; the API contract remains project-owned.

## Official references

- https://laravel.com/docs/13.x/database#database-transactions
- https://laravel.com/docs/13.x/queries#pessimistic-locking
- https://laravel.com/docs/13.x/sanctum
- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/

## Rollback impact

Frontend rollback target is START_SHA. Backend rollback target is BACKEND_START_SHA. No production activation or production data mutation occurs in P06.

## Next phase

P07 — Payment, Shipping & Returns after P06 exact-head acceptance and merge.
