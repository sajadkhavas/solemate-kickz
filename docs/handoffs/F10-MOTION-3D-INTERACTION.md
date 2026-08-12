# F10 — Motion, 3D & Interaction Polish

## Final status

F10 is complete and registered in `integration/sole-frontend-v2`.

- Repository: `sajadkhavas/solemate-kickz`
- Original accepted baseline: `integration/sole-frontend-v2@f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4`
- Original phase branch: `phase/sole-f10-motion-3d-interaction`
- Final original F10 phase SHA: `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa`
- Original PR: `#11 — F10: Motion, 3D & Interaction Polish`
- Original Integration merge SHA: `6da6036da3b7825ff7fa11bcd191d8872ddeb85c`
- Original merge date: 2026-08-08
- Final registration-cleanup baseline: `integration/sole-frontend-v2@30b44421ba7b30c0e8f64ae11c3cafcc75980d61`
- Registration-cleanup branch: `phase/sole-f10-final-registration-cleanup`
- Clean cumulative validation precursor SHA: `b6a236fb7e1e2c61a1387d6529d5129067d795d5`
- Clean cumulative CI run: Frontend CI `#804`, run `31573603726`, conclusion `success`
- Target: `integration/sole-frontend-v2`
- `main` was not changed by F10 or the final registration cleanup.

The Integration branch advanced through later accepted frontend work after the F10 merge. The F10 merge commit remains in the ancestry of the current Integration line.

## Motion architecture

F10 established one reusable motion grammar instead of component-local animation choices. The shared implementation lives in `src/lib/motion-system.ts` and `src/motion.css`.

| Category | Runtime target | Rule |
| --- | ---: | --- |
| feedback | 140ms | immediate state/color feedback |
| navigation | 220ms | non-blocking route feedback |
| content reveal | 360ms | restrained travel, maximum 18px in shared reveal |
| product | 320ms | controlled media/product transition |
| cart | 100ms | transaction-first feedback |
| dialog/drawer | 240ms ceiling | never blocks Escape/focus behavior |
| storytelling | 640ms ceiling | only for intentional editorial choreography |
| 3D | direct manipulation | explicit opt-in; no idle auto-rotation |

Reduced motion is semantic: spatial travel, parallax, idle 3D motion and decorative choreography are removed rather than merely accelerated.

## Removed and normalized effects

F10 deliberately removed effects that were decorative, wasteful or interaction-hostile:

- retired the legacy magnetic/custom cursor and restored the native platform pointer;
- removed the cursor's continuous `requestAnimationFrame` ownership;
- replaced perpetual pointer-parallax RAF work with event-driven scheduling and cleanup;
- disabled legacy continuous decorative loops such as marquee, float, pulse-glow, slow-spin and hero particles;
- reduced shared reveal travel from large component-local values to a controlled maximum of 18px;
- removed the large kinetic-text 3D flip and replaced it with a small reveal only when motion is allowed;
- removed Search content lifecycle animation after it proved capable of delaying Radix interaction/focus lifecycle;
- reduced Cart Drawer lifecycle motion to a short functional cue so Commerce remains immediate;
- avoided universal fade-up, scroll-jacking, cinematic Checkout, excessive blur/glow and always-on GPU work.

## Interaction polish

The retained and added motion is product-first and functional:

- route transition feedback is non-interactive and does not delay navigation;
- Homepage uses restrained Hero/editorial choreography rather than uniform section animation;
- Product Cards retain concise hover/image/wishlist/pressed feedback while mobile remains fully usable without hover;
- PDP feedback covers media, selected size, quantity, wishlist and add-to-cart without delaying purchase actions;
- Cart/Checkout use only state-change feedback needed for add/remove/quantity/drawer/error/progress clarity;
- Wishlist/Account interactions remain truth-safe and do not imply backend synchronization for local-only state;
- Radix remains authoritative for focus trap, Escape, focus restoration and scroll locking.

## Progressive 3D decision

The accepted F10 baseline contained `public/models/shoe.glb` at approximately `8,094,868` bytes, which exceeded the Constitution hard-review threshold of 5MB. F10 removed that shipped asset.

The replacement is a compact procedural GLB path in `src/lib/create-shoe-model.ts`, loaded only after explicit user activation. `@google/model-viewer` is also dynamically imported only when needed.

The final 3D contract is:

1. the static product poster is always primary and meaningful;
2. 3D is never required to understand, select or purchase the product;
3. no 3D runtime is imported on the initial route solely for decoration;
4. activation is explicit through a native control;
5. WebGL/model failure falls back to the static poster;
6. reduced-motion keeps the static experience and avoids 3D motion;
7. offscreen work is stopped/unmounted;
8. `document.hidden` stops active work;
9. observers, listeners and object URLs are cleaned up;
10. `auto-rotate` is not used;
11. touch keeps `pan-y`, preserving page scrolling;
12. the 3D layer is not exposed as duplicate semantic product content to assistive technology.

## Performance decisions

F10 reduced continuous and initial-route work rather than trading usability for spectacle:

- removed the ~8.09MB baseline GLB from the shipped asset path;
- lazy-loaded both model-viewer and procedural model generation;
- removed continuous custom-cursor RAF;
- removed perpetual pointer-parallax RAF;
- disabled unnecessary infinite CSS animation loops;
- retained only one-shot RAF work needed for focus/accessibility timing;
- added IntersectionObserver/document-visibility lifecycle controls;
- added explicit event/listener/object-URL cleanup;
- kept Commerce animation short and non-cinematic;
- preserved transform/opacity-oriented animation instead of animation that depends on repeated layout mutation.

A real private VPS preview later exposed CPU/runtime compatibility constraints. The repository therefore also retains the deployment hardening added during the F10 line: exact project-local Node runtime support, CPU-aware local Bun bootstrap, Node-server production build helpers, loopback-safe service defaults and `audit:deploy`. These helpers do not alter global Node/Bun, firewall, Nginx, Xray or x-ui configuration.

## Accessibility decisions

F10 keeps motion subordinate to the accessibility contract:

- `prefers-reduced-motion` is respected across the shared grammar and 3D path;
- focus is never intentionally hidden by animation;
- native pointer remains available;
- dialogs/drawers retain keyboard, focus trap, Escape and focus restoration semantics;
- 3D activation uses a native control with a minimum usable touch target;
- static poster alternative text remains the meaningful product representation;
- 3D is treated as progressive visual enhancement rather than duplicate semantic content;
- touch scrolling is preserved;
- no flashing/seizure-risk effect was introduced;
- route/browser QA includes hydration/runtime-error detection and interaction readiness.

## Permanent F10 quality gates

Permanent files:

- `scripts/audit-f10-motion-3d.mjs`
- `scripts/test-f10-motion-3d.mjs`
- `scripts/visual-qa-f10-motion-3d.mjs`
- `scripts/f10-browser-runner.mjs`

Permanent commands:

- `bun run audit:f10`
- `bun run test:f10`
- `bun run qa:visual:f10`

They are registered in the repository quality workflow together with inherited regression gates. F10 did not delete or weaken F0/F1, F2, F3, F4/F5, F6, F7, F8 or F9 coverage.

## Visual QA coverage

F10 Visual QA permanently covers the required widths:

`320`, `375`, `390`, `430`, `768`, `1024`, `1280`, `1440`, `1920`.

It also covers reduced-motion, touch, slow-device behavior and offscreen/infinite-animation checks. The cumulative Frontend CI additionally runs inherited route/browser/Visual QA for Foundation, Navigation/Search, Content, Homepage, Catalog, PDP, Cart/Checkout, Wishlist/Account/Orders, plus later F11/F12 gates on the current Integration line.

## Validation evidence

### Historical original F10 PR validation

The final original F10 phase head was `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa`. Historical Frontend CI run `#568` (`31277241309`) did not complete green: it stopped at an inherited F4/F5 browser behavior failure before reaching the later F10 steps. This handoff does not rewrite that historical result.

PR #11 was subsequently supervisor-reviewed and merged into Integration on 2026-08-08 as merge commit `6da6036da3b7825ff7fa11bcd191d8872ddeb85c`.

### Final cumulative closure validation

A final cleanup branch was created from the then-current accepted Integration SHA `30b44421ba7b30c0e8f64ae11c3cafcc75980d61`. It removed only temporary F7 debugging infrastructure left from the original stabilization work:

- removed `scripts/diagnose-f7-checkout-submit.mjs`;
- removed `scripts/diagnose-f7-product-add.mjs`;
- removed their conditional diagnostic steps from `.github/workflows/frontend-ci.yml`.

No product/runtime component was changed by this cleanup.

On cleanup precursor SHA `b6a236fb7e1e2c61a1387d6529d5129067d795d5`, Frontend CI run `#804` (`31573603726`) completed successfully. The run passed:

- Foundation source-contract and browser behavior;
- Homepage audit/browser behavior;
- Navigation/Search audit/browser behavior;
- Content pages audit/browser behavior;
- F4/F5 catalog audit/browser behavior;
- F6 PDP audit/browser behavior;
- F7 Cart/Checkout audit/browser behavior;
- F9 Wishlist/Account/Orders audit/browser behavior;
- F10 audit/browser behavior;
- F11 audit, SSR SEO tests and SEO safety QA;
- F12 source/performance audit;
- deployment readiness audit;
- TypeScript typecheck;
- lint;
- format checks;
- production build;
- F12 build performance budgets;
- VPS Node-server build;
- Foundation Visual QA;
- Navigation/Search Visual QA;
- Content Visual QA;
- Homepage Visual QA;
- F4/F5 Visual QA;
- F6 Visual QA;
- F7 Visual QA;
- F9 Visual QA;
- F10 Visual QA;
- Foundation completion audit;
- aggregate cumulative evidence verification;
- clean working-tree verification.

This provides a full green cumulative validation of the F10 implementation on the current accepted frontend lineage after removal of temporary diagnostics.

## Registration record

F10 registration is complete:

- original accepted baseline: `f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4`;
- final original phase SHA: `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa`;
- PR: `#11`;
- Integration merge SHA: `6da6036da3b7825ff7fa11bcd191d8872ddeb85c`;
- merge date: 2026-08-08;
- F10 remains in the ancestry of the later Integration line;
- final cleanup removes temporary debugging workflow/scripts without changing product behavior;
- `main` remains outside the F10 registration path.

The final registration-cleanup PR records the documentation/CI hygiene closure on top of the later accepted Integration head. Its exact final head and merge SHA are recorded by GitHub history and the final completion report rather than self-referentially rewriting this document after merge.
