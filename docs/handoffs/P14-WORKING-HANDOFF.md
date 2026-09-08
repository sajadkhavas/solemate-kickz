---
document: SOLE P14 authoritative working handoff
schema_version: 1
phase: P14
status: IN_PROGRESS
last_reconciled_utc: 2026-09-08
tracking_issue: https://github.com/sajadkhavas/solemate-kickz/issues/70
frontend_repository: sajadkhavas/solemate-kickz
backend_repository: sajadkhavas/sole-backend
branch: phase/sole-p14-vps-final-acceptance
frontend_start_sha: 2afbd0cef3c97a42ca7aee1086d59e3d96ad66b3
backend_start_sha: c65830c6eeae24ef42989feadffd8f4b22e99230
backend_candidate_sha: 766c818441b3e35b956ddb02bdc3963e0de6b822
next: P14.7-D1-R1_CATALOG_MEDIA_ACCEPTANCE_CONTRACT_RECOVERY
---

# P14 — Integration VPS Activation & Final Acceptance

This is the authoritative working checkpoint for P14. A new contributor or AI chat must read this file, root `AGENTS.md`, `PROJECT_STATUS.md`, the P14 roadmap/registry entry, and issue #70 before issuing another command.

P14 is **in progress**. It must not be described as completed, accepted, merged, or closed until every remaining gate below has exact evidence.

## 1. Goal and operating decision

Deploy and fully test SOLE on the owner's shared integration VPS before seeking a customer.

- Host capacity: 1 vCPU, 1 GB RAM, 2 GB swap.
- The host already runs VPN services; SOLE must not break or reconfigure them.
- Intended presentation domains: `sole.testwebs.ir` and `api.sole.testwebs.ir`.
- The public storefront must keep final sales copy. Runtime/provider availability must not introduce demo, waiting, phase, dataset, or placeholder copy.
- Initial public presentation may use temporary `noindex`.
- Customer production onboarding and transfer remain a separate post-contract phase, C01.

## 2. Immutable baselines and current GitHub state

| Item | Exact evidence | State |
| --- | --- | --- |
| Frontend P14 START/current server SHA | `2afbd0cef3c97a42ca7aee1086d59e3d96ad66b3` | Active internally |
| Backend P14 START SHA | `c65830c6eeae24ef42989feadffd8f4b22e99230` | Rollback target |
| Backend low-memory implementation commit | `b2d265b8941038f751f799b29d45e61729533929` | Superseded by formatting fix |
| Backend exact accepted head | `766c818441b3e35b956ddb02bdc3963e0de6b822` | CI green; active internally |
| Backend PR | [#18](https://github.com/sajadkhavas/sole-backend/pull/18) | Draft/open; do not merge yet |
| Backend first CI attempt | Backend Quality #78 / `34162488679` | Failed only at Pint |
| Backend accepted exact-head CI | Backend Quality #79 / `34162662838` | PASS |
| Frontend tracking issue | [#70](https://github.com/sajadkhavas/solemate-kickz/issues/70) | Open |

## 3. Verified server topology

### Active application state

| Component | Verified state |
| --- | --- |
| Frontend active release | `/var/www/sole/releases/2afbd0cef3c97a42ca7aee1086d59e3d96ad66b3` |
| Backend active release | `/var/www/sole-backend/releases/766c818441b3e35b956ddb02bdc3963e0de6b822` |
| Backend rollback release | `/var/www/sole-backend/releases/c65830c6eeae24ef42989feadffd8f4b22e99230` |
| Frontend listener | `127.0.0.1:4173` |
| Backend Nginx listener | `127.0.0.1:8081` |
| MySQL | Loopback only |
| Redis | Loopback/Unix-local only |
| API readiness | HTTP 200 at internal `/api/ready` |
| Frontend home | Internal HTTP 200 |
| Database | 15 migration rows; 72 tables |
| Runtime | PHP 8.5, exact Node 22.23.1 for SOLE |
| Memory snapshot | 961 MiB RAM; 2 GiB swap |
| Disk snapshot | 30 GB filesystem; about 19 GB available |

### Active services

The following were verified active after the latest recovery:

- `sole-frontend.service`
- `sole-backend-queue.service`
- `sole-backend-scheduler.service`
- `php8.5-fpm.service`
- `nginx.service`
- `mysql.service`
- `redis-server.service`
- `x-ui.service`
- `wg-quick@wg0.service`

### VPN preservation lock

These existing TCP listeners remained present throughout the latest verified step:

- 443
- 2087
- 8443
- 9443
- 11111

Do not alter Xray, X-UI, WireGuard, Cloudflared, existing Nginx panel routing, SSH, or these listeners without a separate explicit and verified plan.

## 4. Completed P14 work

### P14.1 — Real-host inventory and capacity

Status: **verified complete for current host baseline**.

- Ubuntu 24.04 host inspected.
- CPU/RAM/swap/disk and relevant processes captured.
- Shared-host constraints identified.
- Kernel update warning was observed; no uncontrolled reboot was performed.
- Existing VPN and edge services were treated as protected dependencies.

### P14.2 — VPN-preserving topology

Status: **verified complete for internal topology**.

- SOLE application, MySQL and Redis are not publicly bound.
- Frontend uses `127.0.0.1:4173`.
- Backend uses Nginx at `127.0.0.1:8081`.
- VPN listeners and services remained healthy.
- Public Cloudflare/domain activation has not happened yet.

### P14.3 — Low-memory runtime

Status: **verified complete**.

- MySQL 8, Redis 7, PHP-FPM and required PHP extensions installed.
- PHP aligned to 8.5 because the exact Composer lock contains Symfony 8.1 packages requiring PHP >=8.4.1.
- The attempted `php8.5-opcache` package was correctly classified: OPcache is supplied through the PHP common package in this repository layout.
- MySQL, Redis and PHP-FPM received bounded low-memory profiles.
- MySQL and Redis remain private.
- SOLE uses exact Node 22.23.1 without replacing the server-wide Node 24 installation.
- Composer 2.7.1 emits PHP 8.5 deprecation notices; these are warnings, not the cause of the resolved build failures.

### P14.4 — Identity, database and immutable releases

Status: **verified complete for inactive/internal releases**.

- Dedicated `sole` runtime/deploy identity exists.
- Immutable frontend and backend release paths exist.
- Shared backend environment and writable runtime paths exist.
- Database migrations are present and production readiness passes.
- Backend candidate `766c8184…` was fetched by exact SHA.
- Candidate Composer dependencies were installed from the unchanged lock:
  `31f54fb6fc698081f4e07df8653aba2361ca91408744e4a84fc692fb6b413513`.
- Candidate `storage` and `bootstrap/cache` are deliberately isolated from the active release during proof.
- No candidate activation has occurred.

### P14.5 — Backend internal readiness and services

Status: **verified complete for the active internal backend**.

- Nginx active configuration includes the loopback API server.
- A traversal permission failure was diagnosed and repaired.
- Unexpected deployment drift in the earlier release was classified and exact tracked files were restored.
- Backend production invariant suite passes.
- API readiness returns HTTP 200.
- Queue and scheduler services are active.
- Frontend internal runtime returns HTTP 200.
- No public activation or Cloudflare mutation occurred.

### P14.6 — Admin/media/low-memory work completed so far

Status: **partially complete**.

- Production admin was provisioned separately; no password or credential is recorded here.
- Catalog and media truth remained empty until controlled test data is approved.
- ClamAV 1.5.3 signatures were installed and one-shot updating worked.
- Persistent FreshClam is disabled and clamd is not installed.
- Two synchronous `clamscan` trials exceeded 180 seconds, including a low-load trial with application services stopped.
- No OOM occurred and no ClamAV process remained.
- All application and VPN services were restored.
- Conclusion: synchronous ClamAV is incompatible with this shared 1 GB host.
- Accepted low-memory design:
  - authenticated privileged-admin uploads only;
  - private quarantine;
  - allow-listed MIME validation;
  - dimensions, pixel budget and animation validation;
  - real GD decode;
  - public derivatives re-encoded to WebP;
  - raw originals remain non-public;
  - evidence truthfully records `malware_scan=not_performed`;
  - ClamAV driver remains available for stronger future hosts.
- Backend implementation is in PR #18 at exact head `766c8184…`.
- Backend Quality #79 passed on that exact head.
- Candidate application boot and production invariants pass as both `sole` and `www-data`.
- The resolved scanner is `App\Services\Media\TrustedAdminImageScanner`.
- Candidate source has no tracked drift.
- A parent traversal regression introduced during candidate preparation was repaired:
  `/var/www/sole-backend/releases` is again traversable by `www-data`.
- Active API recovered and returned HTTP 200 afterward.
- Active backend/frontend symlinks did not change.

## 5. Resolved failures — do not repeat

| Failure | Classification | Resolution |
| --- | --- | --- |
| Redis validation invoked as a config directive | Command misuse | Do not append `--test-memory` to a config-file invocation |
| PHP 8.3 incompatible with exact lock | Runtime mismatch | PHP upgraded/aligned to 8.5 |
| `php8.5-opcache` package unavailable | Packaging assumption | Use OPcache supplied by the installed PHP common package |
| Frontend `package-lock.json` missing | Wrong package manager assumption | Project uses `bun@1.3.14` and `bun.lock` |
| Bun binary permission denied | Runtime installation permission | Exact Bun runtime path/permissions repaired |
| API `/api/ready` returned 404/permission denied | Filesystem traversal | Scoped `www-data` traversal/read repair |
| Backend tracked files modified/deleted | Deployment-side drift | Exact tracked files restored; shared-path drift classified separately |
| Composer generated two Filament asset diffs | `filament:upgrade` post-autoload behavior | Restore only the two known assets from exact commit; fail on any other drift |
| Candidate artisan unreadable by `www-data` | Parent `releases` group changed to `sole` | Restore parent to `sole:www-data 0750`; active API revalidated |
| Synchronous ClamAV >180 seconds | Host capacity incompatibility | Use trusted-admin structural validation + WebP re-encoding with truthful evidence |

Do not run the current backend `prepare-release.sh` blindly against the active shared bootstrap cache. Its shared `bootstrap/cache` topology can modify runtime cache while preparing an inactive release and must be corrected before final closure.

## 6. Remaining work and exact order

### NEXT — P14.6-R5: isolated candidate media pipeline proof

Status: **PASS — functional proof and final integrity recovery verified**.

Required acceptance:

- install/verify PHP SQLite support for a disposable database;
- migrate a disposable SQLite database only;
- generate a controlled PNG;
- process it through the real candidate `MediaProcessor`;
- produce exactly `thumb`, `card`, and `pdp` WebP derivatives;
- verify MIME, dimensions and SHA-256;
- verify raw source is private;
- verify quarantine upload removal;
- verify `security_driver=trusted-admin-reencode`;
- verify `malware_scan=not_performed`;
- persist evidence under `/root/sole-p14-backups/`;
- confirm active application symlinks, services and VPN remain unchanged.

Attempt evidence from 2026-09-08 UTC:

- PHP 8.5 SQLite support was installed and verified.
- A disposable SQLite database migrated all 15 migrations successfully; the Production database was not mutated.
- The real candidate pipeline processed a controlled 96x72 PNG.
- Exactly three physical WebP derivatives passed MIME and SHA-256 validation: `card` 640x800, `pdp` 1200x1200, and `thumb` 320x320.
- The private source SHA-256 was `aca7e5ca8524553f569682eff98995f974e4aaef71f52643843c07fd0105909f`.
- Evidence reported `security_driver=trusted-admin-reencode`, `structural_validation=passed`, `public_derivatives_reencoded=true`, and truthful `malware_scan=not_performed` with no scan timestamp.
- Evidence directory: `/root/sole-p14-backups/p14-6-media-proof-20260908T090312Z`.
- Functional media report and physical output checks passed.
- Final R5 result did not pass because candidate cleanup deleted tracked `storage/app/public/.gitignore`.
- The first `SHA256SUMS` manifest also included itself while being written and therefore recorded an invalid empty-file hash for the manifest.
- No unexpected PHP/application failure occurred. The PHP warning about importing non-compound `RuntimeException` in the one-off stdin proof script was harmless.

Required bounded recovery R5-R1:

1. Confirm the only tracked drift is `storage/app/public/.gitignore`.
2. Restore that one file from exact candidate commit `766c8184…`.
3. Regenerate `SHA256SUMS` while excluding the manifest itself.
4. Revalidate evidence, active symlinks, API/frontend health, services and VPN.
5. Completed: R5 is PASS and the continuation advances to R6.

Final R5-R1 evidence:

- Tracked status contained only the expected deletion of `storage/app/public/.gitignore`.
- That sentinel was restored from exact candidate SHA and final tracked drift is none.
- `SHA256SUMS` was regenerated without self-reference and every evidence file verified successfully.
- All three physical WebP derivatives revalidated against the report SHA-256 values.
- Private source SHA-256 revalidated and no raw source exists in public storage.
- Candidate production readiness and low-memory scanner binding passed again.
- Active backend remained `c65830c…`; active frontend remained `2afbd0c…`.
- API and frontend returned HTTP 200; all SOLE/VPN services and protected ports remained healthy.
- Final R5 evidence directory: `/root/sole-p14-backups/p14-6-media-proof-20260908T090312Z`.

### P14.6-R6: persist driver and activate backend candidate

Status: **PASS — exact backend candidate activated with rollback evidence**.

R6-D1 evidence:

- Active backend remains `c65830c…`; candidate is exact `766c8184…` with no tracked drift.
- Media driver line is absent from shared environment; shared env is `root:www-data 0640`.
- Active release uses shared storage and the legacy shared bootstrap cache.
- Candidate currently uses isolated storage and a release-local bootstrap cache.
- Shared storage and all required subdirectories are `sole:www-data 2770` and writable by both runtime identities.
- Public storage links are currently missing in both releases; candidate link must be created during controlled activation.
- Queue and scheduler resolve `/var/www/sole-backend/current`, so both must restart after the atomic switch.
- All 15 Production migrations are already applied; no migration is required for this candidate.
- Candidate production readiness passes as both `sole` and `www-data`.
- Active API/admin/frontend returned HTTP 200 and all SOLE/VPN services and protected ports passed.
- No mutation occurred during D1.

R6-R1 activation evidence:

- Shared environment was backed up without exposing its contents.
- `SOLE_MEDIA_MALWARE_SCANNER_DRIVER=trusted-admin-reencode` was persisted with `root:www-data 0640` permissions.
- Candidate caches were built release-locally; shared bootstrap cache was not mutated.
- All 15 migrations were already applied and no Production migration ran.
- Candidate isolated proof storage was archived in the root-only activation evidence directory.
- Durable shared storage and `public/storage` were connected.
- Atomic current switch activated exact backend SHA `766c818441b3e35b956ddb02bdc3963e0de6b822`.
- Rollback target is `c65830c6eeae24ef42989feadffd8f4b22e99230`.
- PHP-FPM reloaded; queue and scheduler restarted and remained active.
- API readiness and admin login returned HTTP 200; frontend remained unchanged and returned HTTP 200.
- Active scanner resolved to `App\\Services\\Media\\TrustedAdminImageScanner`.
- Production invariants passed; pending migrations were zero.
- All protected VPN listeners/services remained healthy.
- Activation evidence: `/root/sole-p14-backups/p14-6-backend-activation-20260908T115757Z`.
- Public activation remained NO.

Completed:

- back up the shared environment without exposing secrets;
- persist `SOLE_MEDIA_MALWARE_SCANNER_DRIVER=trusted-admin-reencode`;
- fix the release preparation/cache contract;
- connect the accepted candidate to durable shared storage using a controlled topology;
- run production invariants;
- activate exact SHA with rollback target `c65830c…`;
- reload PHP-FPM and restart queue safely;
- verify API, admin, queue, scheduler and rollback metadata;
- perform an immediate rollback if health fails.

### P14.7: controlled catalog and media acceptance data

D1 attempt evidence (2026-09-08 UTC):

- Exact active backend `766c8184…` and frontend `2afbd0c…` locks passed.
- Production readiness invariants passed.
- Schema discovery confirmed all 11 inspected catalog/media tables exist.
- Every inspected table reported `row_count=0`; no presentation catalog data currently exists.
- The diagnostic then stopped at `CATALOG_ROW_COUNTS` because its one-off PHP stdin block had a quoting parse error: `unexpected single-quoted string "%s=MISSING_TABLE%s"`.
- This is a diagnostic-script failure only. The command was read-only; no database, source, service, symlink, Nginx, Cloudflare, or VPN mutation occurred.
- D1 is not accepted yet. Remaining row/state, model/resource, route, media-config, storage and final health evidence must be rerun with corrected quoting.

Exact next recovery: `P14.7-D1-R1_CATALOG_MEDIA_ACCEPTANCE_CONTRACT_RECOVERY`.

Pending:

- create/import controlled categories, products, variants, price, inventory, size guide and images;
- publish only intentional presentation records;
- prove manager CRUD and media attachment;
- keep all records clearly removable/auditable;
- do not fabricate orders, payments, reviews, scarcity or provider delivery.

### P14.8: frontend production correction and integration

Pending:

- replace loopback-only frontend API configuration with the final HTTPS authority;
- remove visible Demo/Dataset/Phase/waiting/placeholder copy while retaining final sales copy;
- keep unavailable providers fail-closed without changing storefront sales language;
- run the full 137-step frontend CI and unchanged performance budgets;
- build a new immutable frontend release;
- activate it internally with rollback evidence.

### P14.9: public edge and temporary noindex

Pending:

- verify Cloudflare ownership/configuration;
- route `sole.testwebs.ir` and `api.sole.testwebs.ir` through the existing tunnel without disrupting VPN;
- use HTTPS end to end;
- add temporary `noindex` for presentation;
- verify security headers, cookies, CORS/CSRF, canonical/robots behavior and public reachability from another device.

### P14.10: complete customer and admin browser acceptance

Pending:

- customer registration/login/logout;
- profile/address/privacy;
- catalog/search/filter/PDP/size guidance;
- cart and checkout;
- controlled order path with payment/provider-disabled truth;
- account order/support/returns paths;
- manager login, catalog, inventory, content, order and operational actions;
- mobile and desktop browser checks;
- accessibility and visual regression evidence.

### P14.11: operational drills on the 1 GB host

Pending:

- bounded light-load test;
- memory/swap/CPU pressure evidence;
- queue and scheduler proof;
- controlled reboot and auto-start verification;
- encrypted backup with checksum;
- disposable restore drill;
- application rollback drill;
- log/telemetry and failure-mode validation;
- VPN survival after every drill.

### P14.12: GitHub reconciliation and closure

Pending:

- exact server SHAs and evidence inventory;
- correct backend deployment scripts/cache topology in source;
- final Backend CI and zero unresolved review threads;
- merge backend PR #18 only after server acceptance;
- frontend implementation/closure commits and full CI;
- merge frontend PR only after exact-head acceptance;
- update `PROJECT_STATUS.md`;
- update `contracts/production-phase-registry.json`;
- convert this working handoff to final;
- update and close issue #70 as completed;
- record merge SHAs and post-merge CI;
- do not close P14 while any gate is missing.

## 7. Current completion map

| Acceptance item | State |
| --- | --- |
| P14.1 Real-host inventory and capacity | Complete |
| P14.2 VPN-preserving topology | Complete |
| P14.3 Low-memory runtime | Complete |
| P14.4 Identity/database/inactive releases | Complete |
| P14.5 Backend configuration/migration/readiness | Complete |
| P14.6 Frontend build/runtime and integration | In progress |
| P14.7 Private/public edge activation | Pending |
| P14.8 Customer/admin browser acceptance | Pending |
| P14.9 Backup/reboot/rollback/resource drills | Pending |
| P14.10 GitHub closure | Pending |

## 8. Update protocol after every server step

After each command:

1. Preserve the complete raw server output outside GitHub if it contains operational detail.
2. Add only secret-safe evidence to this document.
3. Update `last_reconciled_utc`, the completed subsection, and the single `next` value.
4. Update issue #70 checkboxes only when the complete acceptance item is evidenced.
5. Record exact SHA, CI run ID, service health, mutation scope and rollback target.
6. Never record passwords, tokens, database credentials, provider secrets, tunnel credentials, private keys or customer PII.
7. Never state PASS from an intended command; PASS requires returned output.
8. Keep P14 open until the final exact-head CI, merge, post-merge evidence and registry reconciliation all pass.

## 9. New-chat continuation contract

A new chat should begin with:

> Read `PROJECT_STATUS.md`, `docs/handoffs/P14-WORKING-HANDOFF.md`, issue #70, backend PR #18, and live GitHub CI. Continue only from the exact `next` field. Do not repeat completed commands and do not claim P14 complete without final merge/closure evidence.

Current exact continuation:

`P14.7-D1-R1_CATALOG_MEDIA_ACCEPTANCE_CONTRACT_RECOVERY`

The first D1 attempt confirmed exact active SHAs, production invariants, all 11 tables and zero rows, then stopped on a read-only PHP quoting error. D1-R1 must complete the remaining contract discovery before any catalog write. Backend activation is PASS at exact SHA `766c8184…`. Before writing controlled presentation data, inspect the live catalog/media schema, manager authority, current row counts, public API requirements and rollback identifiers without mutation.
