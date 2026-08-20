# P00 — Production Foundation Handoff

## Evidence identity

- `START_SHA`: `6566bdcb259cae3a853162f2072ce7a700f28845`
- Branch: `phase/sole-p00-production-foundation`
- `END_SHA`: assigned after final acceptance

## Scope

P00 owns environment separation, immutable SHA-keyed releases, atomic activation, rollback, release evidence, internal/public health, systemd process-group termination and production-like QA runtime ownership. It does not add product, backend, payment or content capability.

## Baseline exception carried into P00

The program-registration PR ran the exact same head repeatedly. Source, type, lint, build, SEO and individual browser/visual gates passed, but failures moved between F7, F10 and F4/F5 dev-server suites. This is evidence of orchestration instability, not permission to waive P00. P00 cannot close until the consolidated production-like gate passes without leaked ports or moving runtime failures.

## Release contract

The server layout is `/var/www/sole/{releases,current,shared}`. `release-immutable.sh` verifies the remote full SHA, rejects existing candidate paths, checks out detached, validates the selected environment, bootstraps pinned runtimes, performs a frozen install/build, atomically switches `current`, restarts the reviewed service and verifies loopback plus optional public origin. Any error or signal invokes rollback and captures the service journal.

Each successful activation appends the required fields to `shared/releases.jsonl`. Direct edits to `current` and repair of an incomplete release are forbidden.

## Exit gates

- environment validators accept valid development/preview/production configurations and reject mock/test production values;
- release and rollback scripts pass static audit and isolated filesystem simulation;
- systemd uses `KillMode=control-group`;
- the production Node output passes controlled runtime smoke with the port free before and after;
- all inherited source, browser, visual, SEO and performance gates pass on the exact head;
- final worktree is clean and `END_SHA` is recorded.
