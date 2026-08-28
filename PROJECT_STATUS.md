# SOLE Project Status — Authoritative Chat Handoff

**Repository:** [sajadkhavas/solemate-kickz](https://github.com/sajadkhavas/solemate-kickz)  
**Status last reconciled:** 2026-08-28  
**Document baseline:** `main@0881fe19e8c92c36aca61f29f235d99888bf21d6`  
**Purpose:** A new contributor or AI chat must be able to continue SOLE without asking the owner to repeat project history.

## 1. Reading order and source of truth

Before any planning or change:

1. Read this file completely.
2. Read root [AGENTS.md](./AGENTS.md).
3. Read the selected phase entry in [the production roadmap](./docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md).
4. Read [the production engineering constitution](./docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md).
5. Read the relevant detailed handoff under [docs/handoffs](./docs/handoffs/).
6. Verify the live default-branch SHA and the selected phase's dependencies on GitHub.
7. Treat [contracts/production-phase-registry.json](./contracts/production-phase-registry.json) as the machine-readable status registry.

If this document and live GitHub history disagree, GitHub commit/PR history and verified CI evidence win; correct this document in the same phase PR.

## 2. Product and architecture decision

SOLE is a sneaker commerce product.

- **Frontend:** TanStack Start with React, full-document SSR, streaming/server capabilities, Vite-based build, Node production runtime.
- **Backend target:** a new independent repository, intended name `sajadkhavas/sole-backend`, using Laravel 12 + Filament, MySQL, and an API consumed by the TanStack SSR frontend.
- **Primary backend donor:** `sajadkhavas/lbb-backend`, reviewed baseline `integration/backend-final-push-reviewed@bc6f53f9cc9b79d8e089fe35b543ad32f5c33217`.
- **Selective donor:** `sajadkhavas/winimi-bakery-backend`, reviewed media baseline `phase-21/media-release-v1@19d294d8dd835571ee73b9330dff830ed1dda0ed`.
- **Rule:** do not fork/copy either donor blindly. Build fresh SOLE migrations and copy only reviewed domain modules. Never copy donor data, secrets, bakery/ToolMaster legacy, prototype routes, or test placeholders.

### Donor reuse boundary

Use LBB primarily for catalog, variants, sizes, inventory ledger/reservations, checkout quote, orders/payments, returns/exchanges/refunds/shipments, content, OTP and push patterns.

Use Winimi selectively for hardened media processing, import manifest/dry-run patterns, and useful content/SEO operations.

Mandatory donor cleanup:

- Never expose `two_factor_secret` in Filament resources.
- Production must reject `APP_DEBUG=true`, sandbox payment defaults, mock/test/prototype values and placeholder secrets.
- Remove duplicate/legacy migration histories and duplicate Sanctum migrations.
- The client never owns price or stock truth.
- Media validation must check magic bytes, MIME, decode success, bytes, pixels/frames and checksum.

## 3. Completed work

### Frontend F0–F18

| Phase | Scope | Accepted phase head / record | PR | State |
|---|---|---:|---:|---|
| F0–F1 | Foundation and design/runtime baseline | `a908b2723322dde27699fa4c92fa9c0de95e0c75` | [#1](https://github.com/sajadkhavas/solemate-kickz/pull/1) | Completed |
| F2 | Global shell, navigation and search | `175e9fa8046884f8da702bbe9c369cb94bf1a288` | [#2](https://github.com/sajadkhavas/solemate-kickz/pull/2) | Completed |
| F3 | Homepage experience | `d5cebcd00599e3b6ff31331a8f0c372b5c031223` | [#3](https://github.com/sajadkhavas/solemate-kickz/pull/3) | Completed |
| F4–F5 | Catalog and product-card experience | `4e3d53324af15956d9a958150eab9f5173bcc7a7` | [#5](https://github.com/sajadkhavas/solemate-kickz/pull/5) | Completed |
| F6 | Product detail experience | `c421c1c7aa0fcaf3b723f0f28e5f902a9dd37e46` | [#7](https://github.com/sajadkhavas/solemate-kickz/pull/7) | Completed |
| F7 | Cart and checkout frontend | cumulative acceptance | [#9](https://github.com/sajadkhavas/solemate-kickz/pull/9) | Completed |
| F8 | Brand, editorial, trust and supporting pages | `564e144c742fa7e21d0ea09e26e65e2ab776648c` | [#4](https://github.com/sajadkhavas/solemate-kickz/pull/4) | Completed |
| F9 | Wishlist, account and orders frontend | cumulative acceptance | [#9](https://github.com/sajadkhavas/solemate-kickz/pull/9) | Completed |
| F10 | Motion, 3D and interaction polish | `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa` | [#11](https://github.com/sajadkhavas/solemate-kickz/pull/11) | Completed |
| F11 | Technical SEO and search readiness | `d9c3da95b0e931000b3358f1803ebcbdd511c66c` | [#12](https://github.com/sajadkhavas/solemate-kickz/pull/12) | Completed |
| F12 | Performance and media optimization | `952251800618b6bab9b883ef473b9d5bca19fbc8` | [#15](https://github.com/sajadkhavas/solemate-kickz/pull/15) | Completed |
| F13 | Full code audit and hardening | `08f0f12522ade44d5dda6b4517a86a0a62ecc74a` | [#17](https://github.com/sajadkhavas/solemate-kickz/pull/17) | Completed |
| F14 | PWA foundation | `56a469557d4564a10b827efa83ba5e178f6bcfb2` | [#18](https://github.com/sajadkhavas/solemate-kickz/pull/18) | Completed |
| F15 | Push frontend and consent contract | `7ec521ad15f5f8019a0fa26b062ca6c5788d624a` | [#19](https://github.com/sajadkhavas/solemate-kickz/pull/19) | Completed |
| F16 | Commerce backend contract | `1887213c039a588a026d2f34fea874c84cd10b61` | [#20](https://github.com/sajadkhavas/solemate-kickz/pull/20) | Completed |
| F17 | Production content contract | `4dc00fb4bc37709ffde6c6873caaccbcdbaa3998` | [#21](https://github.com/sajadkhavas/solemate-kickz/pull/21) | Completed |
| F18 | Final frontend acceptance | `338f744ce907eb9a250f3f407062c8c04c08d368` | [#22](https://github.com/sajadkhavas/solemate-kickz/pull/22) | Completed |

Frontend F0–F18 was released from Integration through [PR #23](https://github.com/sajadkhavas/solemate-kickz/pull/23), merge SHA `6bb540d84ef3952937e03fee5b657b1446b02f47`.

### Production program

| Phase | Scope | Evidence | State |
|---|---|---|---|
| Program registration | P00–P14 roadmap and registry | [PR #24](https://github.com/sajadkhavas/solemate-kickz/pull/24), merge `6566bdcb259cae3a853162f2072ce7a700f28845` | Completed |
| P00 | Immutable production foundation | start `6566bdc...`; accepted implementation `4a62f760...`; closure head `dc2fe5e...`; [PR #25](https://github.com/sajadkhavas/solemate-kickz/pull/25); main merge `0881fe19...` | Completed |

P00 delivered environment separation, immutable release/rollback contracts, runtime process ownership, health/reachability evidence, production-like QA and the registered production program. The final recorded CI run was Frontend CI #996, run ID `32500367177`, successful.

## 4. Remaining production phases

P01–P14 remain. The step counts below are the agreed execution breakdown; a phase may be split into smaller PRs only when the phase handoff preserves a single acceptance gate.

| Phase | Scope | Planned steps | Depends on | Server required? |
|---|---|---:|---|---|
| P01 | Backend, admin and product truth | 7 | P00 | No |
| P02 | Media and catalog ingestion | 6 | P01 | No |
| P03 | Authentication and customer security | 6 | P01 | No |
| P04 | Size and fit intelligence | 5 | P02, P03 | No |
| P05 | Discovery and PDP conversion | 6 | P02, P04 | No |
| P06 | Cart, checkout and orders | 7 | P02, P03 | No |
| P07 | Payment, shipping and returns | 7 | P06 | No; gateways mocked only in non-production |
| P08 | Trust, support and post-purchase | 5 | P07 | No |
| P09 | Loyalty, CRM and notifications | 6 | P03, P07 | No |
| P10 | SEO, content and merchant feeds | 6 | P02, P08 | No |
| P11 | Observability, RUM and CRO | 6 | P07, P10 | No |
| P12 | Production readiness | 7 | P00–P11 | **Activate server here** |
| P13 | Staging acceptance | 6 | P12 | Yes |
| P14 | Production release | 7 | P13 | Yes |

**Total remaining: 14 phases and 87 planned steps.**

### Phase acceptance outcomes

- **P01:** independent SOLE backend repository; clean Laravel/Filament baseline; product/category/collection/variant/size/inventory truth; admin permissions; API contracts; tests and handoff.
- **P02:** secure media pipeline; deterministic conversions; catalog import manifest and dry run; idempotency/checksum; failure recovery; frontend media contract.
- **P03:** customer identity, Sanctum/session boundary, OTP lifecycle, rate limits, secret handling, authorization and security regression.
- **P04:** size charts, measurement definitions, fit data and truthful recommendation boundary with admin/API/frontend integration.
- **P05:** real catalog discovery and PDP integration, URL state, stock/price truth, structured product data, conversion UX and regression.
- **P06:** server-owned quote, inventory reservation, cart, checkout, order state machine, idempotency, concurrency/oversell tests.
- **P07:** payment adapter and verified callback, shipping state, returns/exchanges/refunds, audit trail and failure recovery.
- **P08:** truthful policies, support cases, order tracking/post-purchase surfaces and operational admin flows.
- **P09:** consented notifications, loyalty/CRM boundaries, template/event delivery, preferences, retry/idempotency and privacy controls.
- **P10:** per-route metadata, canonical/robots/schema/sitemap behavior, content operations, merchant feed and validation.
- **P11:** structured logs, errors, metrics, traces/RUM, privacy-safe analytics, conversion funnel and actionable alerts.
- **P12:** pinned runtime/server definitions, secrets, backups, immutable deploy scripts, release/rollback drill, health checks and full gate.
- **P13:** production-like staging deploy, migrations, smoke/regression, mobile/desktop visual QA, performance/security acceptance and sign-off.
- **P14:** release approval, exact SHA release, migration/deploy, public health check, evidence, monitoring window and tested rollback target.

## 5. Cost and server strategy

Do **not** keep a paid VPS running during P01–P11. Use GitHub Actions and controlled local/CI services for MySQL/Redis and production-like builds. Activate the server at P12, then perform P13 staging and P14 production. This keeps server time focused on real infrastructure validation instead of application development.

No prototype, mock, test OTP, sandbox gateway or fake product truth may cross into production.

## 6. Mandatory engineering rules

1. Never work directly on `main`.
2. Every phase gets its own branch matching `phase/sole-pNN-<slug>`.
3. Record exact `START_SHA` before changes and exact `END_SHA` after the accepted implementation.
4. Never force-push, rebase, amend or rewrite published history; this repository is connected to Lovable.
5. Development, preview/staging and production are separate environments.
6. Before deploy, record release strategy, exact SHA and rollback strategy. QA release is not production release.
7. Production deploys are immutable:

   ```text
   /var/www/project/
     releases/
     current -> active release
     shared/
   ```

   Never edit `current` directly.
8. Before acceptance/deploy, pass typecheck, lint, build, production-like preview, Playwright regression and mobile/desktop visual QA.
9. Playwright/runtime processes must be owned and fully terminated. Detached processes and port leaks are forbidden; systemd services use `KillMode=control-group`.
10. Every route owns title, description, canonical, robots, schema and sitemap behavior from development onward.
11. Before production, verify Core Web Vitals, images, bundle size and SSR performance.
12. Before deploy, pin Node/runtime versions and prepare environment validation, service definition and health checks.
13. Every deploy record includes `CURRENT_SHA`, `NEW_SHA`, `RELEASE_PATH`, `ROLLBACK_TARGET` and `HEALTH_CHECK_RESULT` plus the registry's remaining required release fields.
14. Use authoritative official documentation for architecture and commands; include the consulted links in each phase handoff.
15. Do not claim a gate passed without an exact command/run and result.

## 7. Required workflow for every future phase/chat

### Start

- Fetch live GitHub state.
- Confirm the phase is the earliest dependency-ready phase.
- Read this status, registry, constitution, roadmap, relevant handoffs and repository instructions.
- Capture `START_SHA`.
- Create a phase branch; do not change `main`.
- Write scope, exclusions, acceptance criteria, rollback impact and official references before implementation.

### During implementation

- Keep the phase bounded.
- Update tests and contracts with implementation.
- Record out-of-scope discoveries; do not silently expand scope.
- Use production-like services in CI where practical.
- Never introduce production placeholders or donor secrets/data.

### Close

- Run the complete relevant gate.
- Capture `END_SHA`, exact commands, CI run IDs, results, changed files, known limitations and rollback impact.
- Update all of the following in the **same PR**:

  1. `PROJECT_STATUS.md`
  2. `contracts/production-phase-registry.json`
  3. `docs/handoffs/Pxx-<PHASE>.md`
  4. Roadmap when scope/dependencies change
  5. Root `README.md` only when the headline state changes

- Open a PR to the correct protected base.
- Merge only after required CI/review evidence passes.
- After merge, replace the document baseline with the new live `main` SHA and set the next dependency-ready phase.

### Mandatory handoff fields

`PHASE`, `STATUS`, `START_SHA`, `END_SHA`, `BRANCH`, `PR`, `SCOPE`, `EXCLUSIONS`, `FILES_CHANGED`, `DEPENDENCIES`, `COMMANDS`, `QA_RESULT`, `CI_RUN_IDS`, `ROUTES_VIEWPORTS`, `ACCESSIBILITY`, `PERFORMANCE`, `SECURITY`, `KNOWN_LIMITATIONS`, `OUT_OF_SCOPE_FINDINGS`, `ROLLBACK_IMPACT`, `OFFICIAL_REFERENCES`, `NEXT_PHASE`.

## 8. Next action

The next dependency-ready phase is **P01 — Backend, Admin and Product Truth**.

Before coding P01, verify whether `sajadkhavas/sole-backend` already exists. If it does not, create it as an independent repository and register its initial SHA in the P01 handoff. The frontend repository must retain API/OpenAPI contracts and cross-repository integration evidence.

## 9. Official references

- [GitHub protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub service containers](https://docs.github.com/actions/tutorials/communicating-with-docker-service-containers)
- [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [TanStack Start environment variables](https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables)
- [Laravel 12 deployment](https://laravel.com/docs/12.x/deployment)
- [Playwright web server](https://playwright.dev/docs/test-webserver)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Filament 3 resources](https://filamentphp.com/docs/3.x/panels/resources/getting-started)
- [Spatie Media Library v11 conversions](https://spatie.be/docs/laravel-medialibrary/v11/converting-images/defining-conversions)
