# F10 — Motion, 3D & Interaction Polish

## Repository

`sajadkhavas/solemate-kickz`

## Phase branch

`phase/sole-f10-motion-3d-interaction`

## Integration baseline

F10 was branched directly from the accepted Integration head after the combined F7 + F9 registration:

`integration/sole-frontend-v2@f1bd39e348d4fb4774874ccfdabe491bc9b2d0a4`

The baseline commit message is `Integrate F7 + F9 frontend wave`. No older phase branch was used as the F10 base and `main` is not an F10 target.

## Motion audit summary

The route-by-route audit treated transaction surfaces differently from editorial surfaces.

### Findings removed or normalized

- The legacy magnetic cursor hid the native cursor and owned a continuous `requestAnimationFrame` loop even while pointer input was idle. It did not improve product understanding, so F10 retires it rather than preserving decorative input interception.
- The old mouse parallax hook also owned an endless RAF. It is now event-driven and queues at most one frame per pointer update, with visibility cleanup.
- Legacy ambient loops (`marquee`, float, pulse-glow, slow-spin and hero particles) are disabled by the F10 motion layer because they created continuous decorative work with no purchasing value.
- The old generic reveal utility travelled roughly 60px and used component-local 700ms timing. F10 caps reveal travel at 18px, uses a shared 360ms emphasized-out transition, and makes reduced-motion content immediately visible.
- Kinetic text no longer performs a large `rotateX(-60deg)` flip. It uses a compact 10px reveal only when motion is allowed.
- Existing product-card media transitions that were as long as 500–700ms are normalized to the shared 320ms product timing.
- The F7 Cart Drawer item animation previously used a 32px lateral removal travel. F10 makes cart item mutation feedback opacity/layout-only through the motion layer so the commerce surface remains immediate.

### Deliberately retained

- Radix dialog/drawer ownership of focus trap, Escape, focus restoration and scroll lock remains unchanged. F10 only normalizes their visual timing.
- Existing catalog/PDP/cart/account state logic remains authoritative; F10 does not turn local state into a backend synchronization claim.
- Homepage motion is deliberately limited to one entrance concept around the hero plus direct product/media interaction. Sections are not wrapped in a universal fade-up pattern.

## Motion architecture

F10 adds a reusable grammar in `src/lib/motion-system.ts` and CSS counterparts in `src/motion.css`.

| Category | Runtime duration | Spatial rule |
| --- | ---: | --- |
| feedback | 140ms | color/state; at most a tiny pressed response |
| navigation | 220ms | non-blocking route indicator / max small travel |
| content reveal | 360ms | max 18px in the shared reveal utility |
| product transition | 320ms | media crossfade/scale near 1.0 |
| cart feedback | 200ms | opacity/layout only in the Drawer |
| dialog/drawer | 240ms | edge-relative or top-relative, never blocks Escape |
| storytelling | 640ms ceiling | reserved for intentional editorial composition |
| 3D | direct manipulation | user-activated; no idle auto-rotation |

Shared easing values match the Frontend Constitution. Framer Motion consumes `motionTransitions`; CSS surfaces consume the same semantic durations/easing through F10 custom properties.

## Navigation and overlay decisions

- Route changes expose a 2px, non-interactive feedback line. It does not delay navigation and disappears entirely under reduced motion.
- Mobile Navigation, Search and Cart keep existing Radix semantics; animation durations/easing are normalized to the shared dialog category.
- No overlay change alters DOM order, tab order, focus trap, Escape behavior or scroll lock.

## Homepage polish

- Hero copy/CTA/media receive one controlled entrance choreography only when `prefers-reduced-motion: no-preference`.
- Travel is capped at 14px; media uses a 0.985→1 scale rather than a large spatial entrance.
- Product media hover timing is shortened to the product motion category.
- Decorative infinite loops are removed instead of adding more ambient animation.

## Product interaction

- Product-card essentials remain visible without hover and usable on touch.
- Existing card reveal values already fit the Constitution content-reveal envelope; F10 normalizes long image transitions through `motion.css` rather than adding another animation wrapper.
- PDP primary images get a keyed 320ms media entrance as the active gallery image changes; reduced motion removes the animation.
- Size, wishlist, quick-view and add-to-cart controls use feedback-category timing while their existing functional state logic remains unchanged.

## Commerce, Wishlist and Account

Transactional surfaces intentionally receive no cinematic treatment.

- Cart item mutation feedback is kept short and non-spatial.
- Drawer open/close timing is normalized while Radix Escape/focus behavior remains authoritative.
- Checkout receives no decorative route choreography beyond the global non-blocking route indicator.
- Wishlist/Profile/Address controls receive short state timing only; no UI claims server synchronization.

## 3D strategy and asset decision

The baseline `public/models/shoe.glb` was `8,094,868` bytes, exceeding the Constitution's 5MB hard-review threshold.

F10 removes that shipped GLB entirely. The replacement is a compact procedural sneaker builder in `src/lib/create-shoe-model.ts`, dynamically imported only after activation. It creates a small in-memory GLB `Blob` from simple indexed box geometry and three PBR materials. No texture/model payload is shipped in `public/`, so the previous 8.09MB initial repository asset cost becomes zero; the lazy model-factory source itself is only a few kilobytes and is far below the 3MB preferred budget.

The 3D runtime is now progressive enhancement:

1. the static product poster is always the primary experience;
2. `@google/model-viewer` is not imported on initial render;
3. the user must explicitly choose `فعال‌کردن نمای سه‌بعدی`;
4. the component must also be near the viewport and the document visible before the module/model mounts;
5. leaving the viewport unmounts the model while preserving the poster;
6. hiding the document unmounts active 3D work;
7. reduced motion never exposes the activation control and never mounts 3D;
8. WebGL failure or model error leaves the truthful static fallback in place;
9. `auto-rotate` is removed; 3D is direct manipulation only;
10. touch keeps `pan-y` available so the product viewer does not trap vertical page scrolling.

The 3D model is not required to understand, select or purchase a product.

## Pointer strategy

The custom magnetic pointer was removed from runtime behavior. SOLE now uses the platform cursor on fine pointers and touch behavior remains native. This eliminates input lag risk, click/focus interference and the previous permanent RAF.

The remaining reusable parallax hook is event-driven and visibility-aware; it has no self-scheduling animation loop.

## Reduced motion

F10 does more than shorten duration:

- route transition feedback is hidden;
- shared content/kinetic reveals render visible immediately;
- hero spatial entrance is removed;
- product media transitions are removed;
- 3D activation and runtime are disabled in favor of the static poster;
- legacy ambient loops are disabled entirely;
- dialog/content transforms are removed where the F10 layer owns them.

## Performance and cleanup decisions

- The shipped ~8.09MB GLB is removed; the replacement model is generated from a small lazy code chunk only after activation.
- `model-viewer` changed from idle-time eager enhancement to explicit user activation.
- Legacy custom-cursor perpetual RAF removed.
- Parallax perpetual RAF removed.
- IntersectionObserver disconnects on unmount.
- Visibility listeners are removed on unmount.
- 3D event listeners are removed on unmount/state changes.
- Existing one-shot RAF used for route focus and cart focus recovery remains because it schedules accessibility work once rather than running continuously.
- Continuous legacy decorative CSS animations are disabled.

## Accessibility decisions

- Native cursor restored.
- `MotionConfig reducedMotion="user"` remains at the application root.
- Route focus/announcement behavior remains unchanged.
- 3D is `aria-hidden` and the meaningful poster keeps the product alternative text; 3D status is exposed separately through polite text.
- 3D activation is a native button with an existing minimum 44px control height.
- Search/Mobile/Cart continue to rely on Radix for dialog semantics and keyboard containment.
- Reduced-motion, touch, focus probes, target minimums, horizontal clipping and runtime/hydration issues are release-blocking checks in the F10 gates.

## Permanent quality gates

Added:

- `scripts/audit-f10-motion-3d.mjs`
- `scripts/test-f10-motion-3d.mjs`
- `scripts/visual-qa-f10-motion-3d.mjs`
- `scripts/f10-browser-runner.mjs`

Registered commands:

- `bun run audit:f10`
- `bun run test:f10`
- `bun run qa:visual:f10`

F10 is also registered in:

- `bun run check`;
- `bun run verify:cumulative`;
- `.github/workflows/frontend-ci.yml`.

`check` now explicitly includes the inherited F3 audit/behavior/visual suites as well, rather than relying only on Frontend CI for that phase.

## F10 browser behavior coverage

- 3D remains absent and the GLB is not requested before explicit activation;
- activation mounts the 3D viewer on a supported visible desktop surface;
- offscreen 3D unmounts and resumes when returned onscreen;
- the native cursor remains available;
- Cart Drawer Escape behavior remains immediate;
- reduced-motion keeps the static poster and suppresses route spatial feedback/3D;
- touch mode has no custom pointer and checks horizontal overflow;
- hydration/runtime exceptions are release blockers.

## F10 Visual QA

Required widths are permanent test inputs:

`320, 375, 390, 430, 768, 1024, 1280, 1440, 1920`

The suite additionally captures representative:

- Products;
- Product Detail;
- Cart;
- Checkout;
- Wishlist;
- Account;
- Brands;
- About;
- reduced-motion;
- touch;
- 4× CPU throttled slow-device behavior.

It checks horizontal overflow, heading count, unnamed buttons, sub-24px absolute target failures, clipped controls, focusability, native pointer behavior, eager 3D mounting and continuous animations. A dedicated offscreen probe fails if an infinite animation continues running outside the viewport.

## Files changed

- `.github/workflows/frontend-ci.yml`
- `package.json`
- `public/models/shoe.glb` (removed: 8,094,868-byte legacy asset)
- `src/lib/create-shoe-model.ts`
- `scripts/audit-f10-motion-3d.mjs`
- `scripts/f10-browser-runner.mjs`
- `scripts/test-f10-motion-3d.mjs`
- `scripts/verify-cumulative-quality.mjs`
- `scripts/visual-qa-f10-motion-3d.mjs`
- `src/components/KineticText.tsx`
- `src/components/MagneticCursor.tsx`
- `src/components/RevealOnScroll.tsx`
- `src/components/ShoeViewer3D.tsx`
- `src/hooks/useMouseParallax.ts`
- `src/lib/motion-system.ts`
- `src/motion.css`
- `src/routes/__root.tsx`
- `docs/handoffs/F10-MOTION-3D-INTERACTION.md`

## Validation model

Required release validation remains:

- `audit:f10`;
- `test:f10`;
- `typecheck`;
- `lint`;
- `format:check`;
- `build`;
- `qa:visual:f10`;
- `verify:cumulative`;
- every inherited F0/F1, F2, F3, F4/F5, F6, F7, F8 and F9 gate.

Local container network/tooling does not have the repository checkout, Bun, or GitHub CLI, so no local `bun run` result is claimed as release evidence. The permanent gates are designed to execute on the exact GitHub branch/PR head under the repository's pinned Node/Bun Frontend CI. Node syntax checks were used only as a pre-publication sanity check for the new `.mjs` files; they are not a substitute for CI.

## Final SHA, PR, CI and Integration registration

The authoritative final branch SHA and exact-head CI run belong to GitHub/PR metadata. A commit cannot embed its own future content-addressed SHA in its contents without changing that SHA, so the supervisor report must use the final PR head as the authoritative SHA.

F10 must not be registered into `integration/sole-frontend-v2` unless the exact final PR head actually executes and passes every cumulative gate. No merge to `main` is permitted.
