# SOLE Production Engineering Constitution

Status: binding from 2026-08-20
Baseline: `main@6bb540d84ef3952937e03fee5b657b1446b02f47`

This constitution converts the server-stage lessons from LBB into non-negotiable SOLE delivery rules. A phase is not complete when its UI looks finished; it is complete only when its application, QA, release, rollback, observability, SEO and production contracts are reproducible from Git.

## LBB lessons carried forward

LBB exposed deployment drift only after server access: the active `current` link could be missing, the expected server build could be absent, service identities differed from assumptions, local health did not prove public HTTPS reachability, and the original browser harness did not behave like the production server. Later fixes introduced exact-SHA releases, a production-like Playwright web server, controlled rollback and post-deploy health polling.

SOLE therefore treats the following as design-time requirements:

- source, preview and production are separate trust boundaries;
- a successful local process is not proof of a healthy release;
- build output, service identity, reverse proxy and public reachability are independently verified;
- browser-test processes are owned and terminated as a complete process tree;
- release and rollback information is evidence, not tribal knowledge;
- the server never becomes an editor or an architecture-debugging environment.

## 1. Git and phase evidence

- Direct work on `main` is forbidden. Every phase uses `phase/sole-pNN-*` and a pull request.
- Every phase record contains `START_SHA`, `END_SHA`, scope, exclusions, test evidence and rollback impact.
- The phase starts from the exact accepted SHA of its dependency, never from an assumed branch tip.
- Repository ownership and `safe.directory` are resolved during server bootstrap. Deploy scripts must not silently change ownership of unrelated paths.
- A merge is allowed only after the exact PR head SHA passes its required gates.

## 2. Environment boundaries

SOLE has exactly three runtime classes:

| Environment           | Purpose                    | Data policy                                  | Release authority          |
| --------------------- | -------------------------- | -------------------------------------------- | -------------------------- |
| `development`         | local implementation       | fixtures allowed and visibly marked          | none                       |
| `preview` / `staging` | production-like acceptance | seeded or isolated non-production data       | no production activation   |
| `production`          | customer traffic           | approved real configuration and content only | reviewed immutable release |

Prototype, mock, demo, test gateway, test OTP, placeholder inventory and fabricated reviews or scarcity must fail the production gate. Environment validation must use an allowlist schema; missing or unknown production values stop the release.

## 3. Immutable deployment

Production layout:

```text
/var/www/sole/
  releases/<NEW_SHA>/
  current -> /var/www/sole/releases/<active-sha>
  shared/
```

- A release directory is keyed by the full Git SHA and is never modified after activation.
- Build and verification occur in the candidate release. Nothing edits `current` directly.
- `shared` contains only explicitly documented mutable runtime data such as approved environment files and persistent uploads.
- Activation is an atomic symlink switch followed by service restart and health verification.
- An existing incomplete release directory is rejected, not repaired in place.
- Failed activation switches back to `ROLLBACK_TARGET`, restarts the service and captures the journal.

## 4. Required release record

Every preview and production attempt emits an append-only record containing:

```text
ENVIRONMENT
RELEASE_STRATEGY
CURRENT_SHA
NEW_SHA
RELEASE_PATH
ROLLBACK_TARGET
HEALTH_CHECK_RESULT
PUBLIC_REACHABILITY_RESULT
STARTED_AT
FINISHED_AT
ACTOR
```

Production release evidence must be distinct from QA evidence. QA may qualify a SHA; only the production release workflow may activate it.

## 5. Mandatory pre-deploy gate

The exact candidate SHA must pass:

1. frozen-lockfile install with pinned Node/Bun;
2. production environment contract audit;
3. `typecheck`;
4. `lint` and formatting;
5. production Node-server build and output verification;
6. production-like preview on an owned loopback port;
7. Playwright regression with deterministic process cleanup;
8. reviewed mobile and desktop visual regression;
9. SEO route matrix and rendered-HTML checks;
10. performance budgets, Core Web Vitals laboratory checks and SSR smoke;
11. dependency, secrets and unsupported-claim audits;
12. a clean worktree after all gates.

Snapshots are never updated as a side effect of the final gate. A snapshot change is a separately reviewed source change.

## 6. Playwright runtime ownership

- Detached preview or browser processes are forbidden.
- The harness owns one process group, waits for readiness and terminates the full tree on success, failure, signal and timeout.
- Port availability is checked before and after the suite; a leaked port fails QA.
- The systemd unit uses `KillMode=control-group`.
- QA uses the built production server, not `vite dev` and not a behaviorally different static preview.

## 7. SEO is a route contract

Every route is registered with:

- title and description;
- canonical URL policy;
- robots policy;
- relevant schema or an explicit `none` decision;
- sitemap inclusion/exclusion behavior;
- valid and invalid-state HTTP behavior.

These checks are part of the phase that creates or changes the route. The first SSR response must contain the required metadata without client hydration.

## 8. Performance is a release constraint

Before production, verify Core Web Vitals budgets, image dimensions/formats/loading, route and shared bundle size, third-party cost, and SSR latency. Heavy 3D or interaction modules remain lazy and must not enter the initial route bundle without an approved budget change.

## 9. Server readiness

Before the first production release, Git must be safe for the deployment user, Node and Bun must match repository pins, environment files must validate, the systemd unit and reverse proxy must be reviewed, the loopback and public health endpoints must exist, log and disk policies must be defined, and a rollback drill must have passed on staging.

## 10. Stop conditions

Deployment stops when a SHA differs, a required variable is absent, a mock/test value is detected, a release path is incomplete, the port is occupied, any gate fails, the worktree changes during QA, rollback cannot be identified, local health fails, or public reachability fails. No manual patch on the server may override these conditions.
