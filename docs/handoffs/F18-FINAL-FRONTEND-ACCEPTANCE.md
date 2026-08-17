# F18 — Final Frontend Acceptance

## Release lineage

- Accepted baseline: `integration/sole-frontend-v2@f4048c9af4d43960b67e08a72f9592e4f7d89354`
- Phase branch: `phase/sole-f18-final-frontend-acceptance`
- Final target: `main`, only through a reviewed Integration release PR
- History rewriting and force-push are prohibited.

## Closure scope

F18 is the final cumulative frontend release gate. It verifies the accepted F0–F17 implementation,
repairs inherited release-blocking quality gaps, and records reproducible source, browser, visual,
SEO, performance, PWA, deployment-build, and cumulative evidence gates.

The release candidate does not claim production commerce readiness. Product, price, inventory,
authentication, OTP, payment, notification delivery, CMS publication, monitoring, backup, and
production-device acceptance require their real backend or server dependencies.

Backend and server acceptance remain separate from frontend source acceptance.

## F18 corrections

- Removed an inherited F17 ESLint failure without weakening its publication-state assertion.
- Restored the missing F13 audit and hardening scripts to the aggregate local release command.
- Added F16, F17, and F18 audits to the aggregate command so future releases cannot bypass them.
- Made inherited F14–F17 lineage checks valid on later controlled phases and the final promotion.
- Replaced F17's local-only ancestor reference with the accepted F16 Integration merge SHA.
- Added a permanent F18 audit and cumulative evidence requirement.

## Acceptance gates

- Frozen Bun lockfile installation with Node `22.23.1` and Bun `1.3.14`
- Every permanent phase audit and browser behavior suite
- TypeScript, ESLint, formatting, and production build
- F12 bundle and media budgets
- VPS Node-server build and smoke test
- All visual QA suites and F11 SEO safety QA
- Cumulative report verification and clean tracked worktree

## Promotion rule

The F18 phase is first registered in `integration/sole-frontend-v2`. The exact accepted Integration
head is then compared with `main` and promoted through one final reviewable PR. No direct push to
`main` is part of this phase.
