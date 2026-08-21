# P00 — Production Foundation Handoff

## Evidence identity

- `START_SHA`: `6566bdcb259cae3a853162f2072ce7a700f28845`
- Branch: `phase/sole-p00-production-foundation`
- `END_SHA`: `4a62f760ba4f4dee25075a9e9f39183d6b27d896`
- Acceptance: Frontend CI run 990 (`32499055842`) — PASS
- Evidence convention: `END_SHA` is the last accepted implementation commit. The later closure-only commit records that immutable SHA and does not change runtime behavior.

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


## Final QA result

The exact accepted implementation SHA passed the complete inherited gate: source contracts, browser behavior, technical SEO, typecheck, lint, formatting, production build, performance budgets, Node-server build, controlled production-runtime smoke with the port free after shutdown, desktop/mobile visual QA and aggregate evidence verification.

The intermittent failures were traced to incomplete descendant termination in the browser/catalog runners and a responsive visibility-to-click race. P00 now terminates the complete process tree and performs the mobile cart activation atomically. No gate was removed, skipped or converted into a waiver.

## Official engineering references

- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) — deployment output and hosting model.
- [Nitro Node.js runtime](https://nitro.build/deploy/runtimes/node) — the `node_server` preset produces a standalone `.output` server and documents `HOST`/`PORT` runtime configuration.
- [systemd process-kill behavior](https://www.freedesktop.org/software/systemd/man/systemd.kill.html) — `KillMode=control-group` terminates the service control group rather than only the main process.
- [Git rev-parse verification](https://git-scm.com/docs/git-rev-parse) — `--verify <rev>^{commit}` validates an exact commit object before release.
- [Git detached checkout](https://git-scm.com/docs/git-checkout) — checking out an exact commit detaches HEAD from a moving branch.
