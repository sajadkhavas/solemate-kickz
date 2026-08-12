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
- Clean cumulative CI: Frontend CI `#804`, run `31573603726`, `success`
- Target: `integration/sole-frontend-v2`
- `main` was not changed by F10 or the registration cleanup.

The Integration branch later advanced through accepted F11/F12 work. The F10 merge commit remains in the ancestry of the current Integration line.

## Motion architecture

F10 established one reusable motion grammar instead of component-local animation choices. The shared implementation lives in `src/lib/motion-system.ts` and `src/motion.css`.

- Feedback: 140ms, immediate state and color feedback
- Navigation: 220ms, non-blocking route feedback
- Content reveal: 360ms, controlled travel with a shared maximum of 18px
- Product: 320ms, controlled media and product transition
- Cart: 100ms, transaction-first feedback
- Dialog and drawer: 240ms ceiling, never blocking Escape or focus behavior
- Storytelling: 640ms ceiling, only for intentional editorial choreography
- 3D: direct manipulation after explicit opt-in, with no idle auto-rotation

Reduced motion is semantic. Spatial travel, parallax, idle 3D motion and decorative choreography are removed rather than merely accelerated.

## Removed and normalized effects

F10 deliberately removed effects that were decorative, wasteful or interaction-hostile.

- Retired the legacy magnetic/custom cursor and restored the native platform pointer
- Removed the cursor's continuous `requestAnimationFrame` ownership
- Replaced perpetual pointer-parallax RAF work with event-driven scheduling and cleanup
- Disabled legacy continuous decorative loops such as marquee, float, pulse-glow, slow-spin and hero particles
- Reduced shared reveal travel from large component-local values to a controlled maximum of 18px
- Removed the large kinetic-text 3D flip and replaced it with a small reveal only when motion is allowed
- Removed Search content lifecycle animation after it proved capable of delaying Radix interaction/focus lifecycle
- Reduced Cart Drawer lifecycle motion to a short functional cue so Commerce remains immediate
- Avoided universal fade-up, scroll-jacking, cinematic Checkout, excessive blur/glow and always-on GPU work

## Interaction polish

The retained and added motion is product-first and functional.

- Route transition feedback is non-interactive and does not delay navigation
- Homepage uses restrained Hero/editorial choreography rather than uniform section animation
- Product Cards retain concise hover, image, wishlist and pressed feedback while mobile remains usable without hover
- PDP feedback covers media, selected size, quantity, wishlist and add-to-cart without delaying purchase actions
- Cart and Checkout use only state-change feedback needed for add, remove, quantity, drawer, error and progress clarity
- Wishlist and Account interactions remain truth-safe and do not imply backend synchronization for local-only state
- Radix remains authoritative for focus trap, Escape, focus restoration and scroll locking

## Progressive 3D decision

The accepted F10 baseline contained `public/models/shoe.glb` at approximately `8,094,868` bytes. It exceeded the Constitution hard-review threshold of 5MB and was removed.

The replacement is a compact procedural GLB path in `src/lib/create-shoe-model.ts`, loaded only after explicit user activation. `@google/model-viewer` is also dynamically imported only when needed.

The final 3D contract is:

- The static product poster is always primary and meaningful
- 3D is never required to understand, select or purchase the product
- No 3D runtime is imported on the initial route solely for decoration
- Activation is explicit through a native control
- WebGL or model failure falls back to the static poster
- Reduced motion keeps the static experience and avoids 3D motion
- Offscreen work is stopped or unmounted
- `document.hidden` stops active work
- Observers, listeners and object URLs are cleaned up
- `auto-rotate` is not used
- Touch keeps `pan-y`, preserving page scrolling
- The 3D layer is not exposed as duplicate semantic product content to assistive technology

## Performance decisions

F10 reduced continuous and initial-route work rather than trading usability for spectacle.

- Removed the approximately 8.09MB baseline GLB from the shipped asset path
- Lazy-loaded model-viewer and procedural model generation
- Removed continuous custom-cursor RAF
- Removed perpetual pointer-parallax RAF
- Disabled unnecessary infinite CSS animation loops
- Retained only one-shot RAF work needed for focus/accessibility timing
- Added IntersectionObserver and document-visibility lifecycle controls
- Added explicit event, listener and object-URL cleanup
- Kept Commerce animation short and non-cinematic
- Preserved transform/opacity-oriented motion instead of repeated layout mutation

A private VPS preview later exposed CPU/runtime compatibility constraints. The F10 line therefore also retains project-local deployment hardening: exact Node runtime support, CPU-aware local Bun bootstrap, Node-server production build helpers, loopback-safe service defaults and `audit:deploy`. These helpers do not alter global Node/Bun, firewall, Nginx, Xray or x-ui configuration.

## Accessibility decisions

F10 keeps motion subordinate to the accessibility contract.

- `prefers-reduced-motion` is respected across the shared grammar and 3D path
- Focus is never intentionally hidden by animation
- The native pointer remains available
- Dialogs and drawers retain keyboard, focus trap, Escape and focus restoration semantics
- 3D activation uses a native control with a usable touch target
- Static poster alternative text remains the meaningful product representation
- 3D is progressive visual enhancement rather than duplicate semantic content
- Touch scrolling is preserved
- No flashing or seizure-risk effect was introduced
- Route/browser QA detects hydration/runtime errors and interaction-readiness regressions

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

- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920

It also covers reduced motion, touch, slow-device behavior and offscreen/infinite-animation checks. The cumulative Frontend CI runs inherited route, browser and Visual QA suites plus the later F11/F12 gates on the current Integration line.

## Validation evidence

### Historical original F10 validation

The final original F10 phase head was `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa`.

Historical Frontend CI run `#568` (`31277241309`) did not complete green. It stopped at an inherited F4/F5 browser behavior failure before reaching the later F10 steps. This handoff preserves that historical result rather than rewriting it.

PR #11 was subsequently supervisor-reviewed and merged into Integration on 2026-08-08 as merge commit `6da6036da3b7825ff7fa11bcd191d8872ddeb85c`.

### Final cumulative closure validation

A final cleanup branch was created from accepted Integration SHA `30b44421ba7b30c0e8f64ae11c3cafcc75980d61`.

It removed only temporary F7 debugging infrastructure left from stabilization:

- `scripts/diagnose-f7-checkout-submit.mjs`
- `scripts/diagnose-f7-product-add.mjs`
- Their conditional diagnostic steps from `.github/workflows/frontend-ci.yml`

No product/runtime component was changed by this cleanup.

On cleanup precursor SHA `b6a236fb7e1e2c61a1387d6529d5129067d795d5`, Frontend CI run `#804` (`31573603726`) completed successfully.

That run passed:

- Foundation source-contract and browser behavior
- Homepage audit and browser behavior
- Navigation/Search audit and browser behavior
- Content pages audit and browser behavior
- F4/F5 catalog audit and browser behavior
- F6 PDP audit and browser behavior
- F7 Cart/Checkout audit and browser behavior
- F9 Wishlist/Account/Orders audit and browser behavior
- F10 audit and browser behavior
- F11 audit, SSR SEO tests and SEO safety QA
- F12 source/performance audit
- Deployment readiness audit
- TypeScript typecheck
- Lint
- Format checks
- Production build
- F12 build performance budgets
- VPS Node-server build
- Foundation Visual QA
- Navigation/Search Visual QA
- Content Visual QA
- Homepage Visual QA
- F4/F5 Visual QA
- F6 Visual QA
- F7 Visual QA
- F9 Visual QA
- F10 Visual QA
- Foundation completion audit
- Aggregate cumulative evidence verification
- Clean working-tree verification

This is the full green cumulative validation of F10 on the current accepted frontend lineage after removing temporary diagnostics.

## Registration record

F10 registration is complete.

- Original accepted baseline: `f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4`
- Final original phase SHA: `d3a48c7ac47edfe8fe9677dbc1f84bf8347a9eaa`
- Original PR: `#11`
- Original Integration merge SHA: `6da6036da3b7825ff7fa11bcd191d8872ddeb85c`
- Original merge date: 2026-08-08
- F10 remains in the ancestry of the later Integration line
- Final cleanup removes temporary debugging workflow/scripts without changing product behavior
- `main` remains outside the F10 registration path

The final registration-cleanup PR records the documentation and CI-hygiene closure on top of the later accepted Integration head. Its exact final head and merge SHA are recorded by GitHub history and the final completion report rather than through a self-referential post-merge rewrite.
