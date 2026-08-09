# F10 — Motion, 3D & Interaction Polish

## Repository and baseline

- Repository: `sajadkhavas/solemate-kickz`
- Phase branch: `phase/sole-f10-motion-3d-interaction`
- Accepted Integration baseline: `integration/sole-frontend-v2@f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4`
- Target for registration: `integration/sole-frontend-v2`
- `main` is not an F10 target.

F10 was branched from the accepted Integration head after the combined F7 + F9 registration. The baseline commit is `Integrate F7 + F9 frontend wave`.

## Motion audit summary

F10 treats transaction surfaces differently from editorial surfaces.

### Removed or normalized

- The legacy magnetic cursor hid the native cursor and owned a continuous `requestAnimationFrame` loop. F10 retires it and restores the platform cursor.
- The old pointer parallax perpetual RAF is replaced by event-driven scheduling with at most one queued frame per pointer update and complete cleanup.
- Legacy ambient loops (`marquee`, float, pulse-glow, slow-spin and hero particles) are disabled because they created continuous decorative GPU work.
- Shared reveal travel is capped at 18px and uses a 360ms emphasized-out transition instead of large/slow component-local entrances.
- Kinetic text no longer performs a large 3D flip; it uses a compact 10px reveal only when motion is allowed.
- Product media timing is normalized to 320ms.
- Cart mutation feedback is non-spatial and deliberately short.

### Deliberately retained

- Radix owns focus trap, Escape, focus restoration and scroll lock for dialogs/drawers.
- Catalog/PDP/cart/wishlist/account state remains authoritative and truth-safe; F10 does not fabricate backend synchronization.
- Homepage storytelling is limited to one controlled hero entrance plus direct product/media interaction rather than universal fade-up animation.

## Motion architecture

`src/lib/motion-system.ts` and `src/motion.css` define the shared grammar.

| Category       |    Runtime duration | Rule                                   |
| -------------- | ------------------: | -------------------------------------- |
| feedback       |               140ms | short state/color response             |
| navigation     |               220ms | non-blocking route feedback            |
| content reveal |               360ms | max 18px shared travel                 |
| product        |               320ms | restrained media transition            |
| cart           |               100ms | immediate transaction feedback         |
| dialog/drawer  |               240ms | never delays Escape/focus behavior     |
| storytelling   |       640ms ceiling | reserved for intentional editorial use |
| 3D             | direct manipulation | opt-in; no idle auto-rotation          |

Reduced motion removes spatial choreography rather than merely shortening it.

## Navigation, commerce and accessibility

- Route changes use a 2px non-interactive feedback line and do not delay navigation.
- Search/Mobile Navigation/Cart retain Radix keyboard and focus semantics.
- Checkout receives no cinematic treatment beyond global non-blocking navigation feedback.
- Wishlist/Profile/Address controls use short feedback timing only.
- `MotionConfig reducedMotion="user"` remains at the application root.
- Native cursor is restored.
- 3D is `aria-hidden`; the meaningful static poster retains the product alternative text.
- The 3D activation control is a native button with a minimum 44px height.

## 3D strategy

The accepted baseline shipped `public/models/shoe.glb` at `8,094,868` bytes, above the Constitution's 5MB hard-review threshold. F10 removes that asset.

The replacement is `src/lib/create-shoe-model.ts`, a compact procedural GLB builder imported only after user activation. The 3D path is progressive enhancement:

1. the static poster is always primary;
2. `@google/model-viewer` is not imported on initial render;
3. activation is explicit;
4. the component must be near the viewport and the document visible before mounting;
5. leaving the viewport or hiding the document unmounts active 3D;
6. reduced motion disables activation/runtime and keeps the poster;
7. WebGL failure/model failure falls back truthfully to the poster;
8. `auto-rotate` is removed;
9. touch keeps `pan-y`, so vertical scrolling is not trapped;
10. 3D is never required to understand, select or purchase a product.

## Performance and lifecycle cleanup

- Removed shipped 8.09MB GLB.
- `model-viewer` and procedural model code are dynamically imported after activation.
- Legacy custom-cursor RAF removed.
- Perpetual parallax RAF removed.
- IntersectionObserver, visibility listeners and model event listeners are cleaned up.
- Continuous decorative CSS loops are disabled.
- One-shot RAFs used for accessibility/focus work are retained because they do not create continuous animation work.

## F10 permanent quality gates

Added:

- `scripts/audit-f10-motion-3d.mjs`
- `scripts/test-f10-motion-3d.mjs`
- `scripts/visual-qa-f10-motion-3d.mjs`
- `scripts/f10-browser-runner.mjs`

Registered commands:

- `bun run audit:f10`
- `bun run test:f10`
- `bun run qa:visual:f10`

F10 is registered in `check`, `verify:cumulative` and Frontend CI. Inherited F0/F1, F2, F3, F4/F5, F6, F7, F8 and F9 gates remain present.

Behavior coverage includes lazy 3D, opt-in activation, offscreen pause/resume, native pointer, Cart Escape, reduced-motion static fallback, touch overflow, hydration mismatch and runtime exception detection.

Visual QA permanently covers widths `320, 375, 390, 430, 768, 1024, 1280, 1440, 1920` plus reduced-motion, touch, slow-device and offscreen-infinite-animation probes.

## Real VPS preview findings — 2026-08-08

A private preview was run on a constrained VPS that also hosts critical VPN services. The preview was bound only to `127.0.0.1:4173`; x-ui, Xray, Nginx and firewall configuration were not modified.

Observed deployment facts:

- server Node was `v24.19.0`, while the project requires Node `22.23.1`;
- the server CPU exposed SSE4.2 + AVX but not AVX2;
- standard Bun 1.3.14 x64 terminated with `Illegal instruction` (exit 132);
- Bun 1.3.13 x64-baseline executed successfully on that CPU;
- dependency installation succeeded inside a constrained systemd cgroup;
- Vite development preview ran only on loopback;
- static/Vite client checks returned HTTP 200;
- the first successful home SSR request returned HTTP 200 with 102,101 bytes and took about 9.26s while development dependency optimization was occurring;
- VPN listeners stayed unchanged throughout preview and cleanup;
- `/opt/sole-demo` was removed and port 4173 was closed after review.

The slow first request was a development-server/Vite optimizer observation, not a production Node-server target.

## Deployment hardening added after the VPS preview

The preview exposed deployment-path risks that are now encoded permanently rather than left as manual knowledge.

### Exact and isolated runtimes

- `.nvmrc` and `.node-version` pin Node `22.23.1`.
- `scripts/deployment/bootstrap-node-vps.sh` downloads Node `22.23.1`, verifies `SHASUMS256.txt`, and installs it only under `.runtime/node`.
- `scripts/deployment/node-vps.sh` refuses the wrong local Node version.
- Global Node does not need to be replaced on a shared server.
- `scripts/deployment/bootstrap-bun-vps.sh` selects standard x64 only when AVX2 is present, otherwise x64-baseline on SSE4.2-capable CPUs.
- The Bun bootstrap disables core dumps during compatibility probing and has an isolated fallback to the VPS-validated 1.3.13 baseline if the pinned 1.3.14 baseline cannot execute on an older CPU.
- Global Bun is not installed/replaced.

### Correct production artifact

Normal Lovable behavior remains unchanged. `vite.config.ts` only selects Nitro `node-server` when `SOLE_DEPLOY_TARGET=node-server`.

Deployment commands:

- `bun run build:vps` -> exact Node-server builder;
- `bun run start:vps` -> `.output/server/index.mjs` on an exact development/build runtime;
- `bun run smoke:vps` -> loopback smoke test;
- `bun run audit:deploy` -> permanent deployment source contract.

For a shared VPS, `scripts/deployment/build-vps-safe.sh` uses the project-local Node instead of system Node and applies cgroup limits.

### Shared-server containment

- `scripts/deployment/vps-preflight.sh` is read-only and checks CPU, memory, disk, utilities, local/system Node and port availability.
- `scripts/deployment/install-vps-safe.sh` applies CPU/RAM/swap/task limits and isolates `HOME` plus Bun cache inside `.home`/`.bun-cache`.
- `scripts/deployment/build-vps-safe.sh` applies build limits and isolates build `HOME`.
- `.runtime`, `.home` and `.bun-cache` are ignored by Git.
- No SOLE deployment helper changes firewall, Nginx, Xray or x-ui.
- The reviewed systemd template runs the local Node production output on `127.0.0.1:4173` with CPU/memory/swap/task limits and hardening.
- Production must not run `vite dev` or `vite preview`.
- Private preview remains loopback + SSH tunnel until a deliberate reverse-proxy configuration is approved.

The full contract is in `docs/frontend/SOLE_VPS_DEPLOYMENT.md`.

## Deployment quality gate

`scripts/audit-deployment-readiness.mjs` verifies that:

- Node/Bun pins remain intentional;
- node-server is opt-in so Lovable behavior is not overwritten;
- Node/Bun bootstrap remains local and CPU-aware;
- checksum verification and core-dump protection remain present;
- install/build cgroup and local-HOME/cache isolation remain present;
- production service uses local Node, loopback and hard memory limits;
- no Vite development process is used as the production service;
- Frontend CI keeps both the deployment contract audit and VPS Node-server build step.

## Validation and acceptance model

GitHub Actions is useful evidence when runners execute, but external Actions billing/runner availability is not an acceptance prerequisite for this repository workflow.

Supervisor acceptance is based on the combination of:

- exact branch ancestry and controlled diff review;
- F10 source-contract audit design and browser/visual regression gates retained in-repo;
- code-level review of Motion, 3D, reduced-motion, pointer, lifecycle and Commerce interactions;
- the real loopback VPS preview described above;
- deployment source-contract and exact-runtime hardening added after that preview;
- no unresolved PR review threads/comments;
- mergeability against the accepted Integration baseline.

No claim is made that the post-preview production Node-server helper scripts were executed on the VPN server after cleanup. They are deliberately designed so the next real deployment can use an exact, isolated runtime and production artifact without altering the server's global Node/Bun or VPN stack.

## Registration rule

F10 may be registered only into `integration/sole-frontend-v2` after supervisor review of the final immutable PR head. `main` remains unchanged. The Integration merge SHA becomes the baseline for the next phase.
