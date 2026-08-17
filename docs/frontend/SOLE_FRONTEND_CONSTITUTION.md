# SOLE Frontend Constitution

Status: normative  
Scope: all customer-facing frontend work  
Language direction: Persian-first, RTL-first  
Baseline: `main@137344f1d89373a55e3bf4bb4d82b48d8247b45f`

This document is the single decision source for SOLE visual direction, interaction quality, accessibility, performance, SEO foundation, and commercial truthfulness. Page-specific phases may extend these rules but must not contradict them without an explicit architecture decision recorded in a handoff.

## 1. Product positioning

SOLE is a high-end sneaker commerce frontend combining:

- streetwear editorial energy;
- luxury-footwear restraint;
- experimental presentation where it improves product understanding;
- a dark premium identity without sacrificing readability;
- product-first commerce rather than effect-first spectacle;
- mobile-first purchasing flows;
- Persian RTL as a first-class interface, not a translated afterthought.

The primary product promise is confident product discovery and purchase. Visual experimentation is supporting evidence, not the product itself.

## 2. Visual north star

### Identity signals

SOLE is recognizable through deep neutral surfaces, high-contrast typography, a controlled acid-lime action accent, occasional warm orange editorial accents, tactile product media, assertive display type, and precise mono-spaced numeric information.

### Patterns that must not be copied

Do not reproduce another retailer's navigation, hero composition, card geometry, product-gallery choreography, trademarked campaign language, or distinctive branded motion. References may inform principles such as hierarchy, pacing, density, and product framing only.

### Cinematic versus transactional surfaces

Cinematic treatment is allowed on the homepage hero, curated brand stories, campaign modules, and optional product storytelling below the purchase decision area.

Fast, low-friction treatment is required for navigation, search, catalog controls, product selection, cart, authentication, checkout-adjacent flows, errors, and account tasks.

### Effect limits

- Glow: one dominant glow source per viewport; never behind body copy.
- Blur: decorative blur must not reduce text contrast; interactive glass surfaces require an opaque fallback.
- Grain: maximum visual opacity `0.04`; decorative and non-interactive.
- 3D: optional enhancement, lazy-loaded, never required to understand or purchase a product.
- Motion: one primary motion idea per section; no universal fade-and-translate template.
- Glass: reserved for transient overlays or small elevated controls, not long reading surfaces.

Remove an effect when it delays input, obscures content, causes contrast failure, creates continuous GPU work, competes with product media, breaks at 200% zoom, or cannot respect reduced motion.

## 3. Color architecture

Colors are selected by semantic role. Components must consume semantic tokens rather than raw palette names.

| Role               | Default intent               | Minimum requirement                       |
| ------------------ | ---------------------------- | ----------------------------------------- |
| `background`       | page canvas                  | readable with primary and muted text      |
| `surface`          | standard card/panel          | visibly separated from background         |
| `surface-elevated` | overlay or raised panel      | clear border/shadow boundary              |
| `interactive`      | neutral interactive surface  | visible hover, pressed, selected states   |
| `primary`          | principal conversion action  | text contrast suitable for normal text    |
| `secondary`        | lower-emphasis action        | distinct from disabled state              |
| `text`             | primary content              | WCAG AA against used surface              |
| `text-muted`       | secondary content            | WCAG AA for essential text                |
| `border`           | structural divider           | visible without becoming dominant         |
| `border-strong`    | interactive/selected divider | visually distinct from default border     |
| `success`          | completed/available          | paired with text or icon, not color alone |
| `warning`          | caution/low-stock            | paired with explicit label                |
| `danger`           | destructive/error            | paired with clear language                |
| `stock-in`         | available                    | truthful data only                        |
| `stock-low`        | low availability             | requires a real threshold/source          |
| `stock-out`        | unavailable                  | disables invalid purchase action          |
| `sale`             | verified price reduction     | requires original and current price       |
| `focus`            | keyboard focus indicator     | minimum 2px visible outline/ring          |
| `selection`        | text/control selection       | legible foreground/background pair        |
| `disabled`         | unavailable interaction      | state remains readable and identifiable   |
| `overlay`          | modal backdrop               | content beneath is visually de-emphasized |

Contrast targets:

- normal text: at least `4.5:1`;
- large text: at least `3:1`;
- focus indicators and essential graphical controls: at least `3:1` against adjacent colors;
- disabled content is exempt only when it is genuinely unavailable and still understandable.

Raw brand palette tokens may exist for art direction, but reusable components must reference semantic roles.

## 4. Typography system

### Families

- Persian body, labels, buttons, and headings: local/system Persian-capable sans stack led by Vazirmatn when self-hosted.
- Latin display and model names: Space Grotesk-compatible local/system display stack.
- Prices, SKU, sizes, and technical metadata: DM Mono-compatible local/system mono stack with tabular numbers.

Remote render-blocking font stylesheets are prohibited. Fonts must be self-hosted, bundled, or safely fall back to system fonts. Font loading must not block meaningful paint.

### Roles

| Role               | Use                          |
| ------------------ | ---------------------------- |
| Display            | editorial moments only       |
| Heading            | page and section structure   |
| Body               | descriptions and guidance    |
| Label              | controls and form fields     |
| Price              | current selling price        |
| Numeric            | size, quantity, SKU, metrics |
| Caption            | supporting metadata          |
| Button             | concise actions              |
| Technical metadata | SKU, model code, dimensions  |

Typography uses controlled fluid sizing with `clamp()` between documented minimum and maximum values. Line height must grow enough for Persian diacritics and stacked glyphs. Latin model names, prices, and mixed-direction strings must be tested with long unbroken values and explicit direction isolation where needed.

Rules:

- do not justify Persian body text;
- do not force uppercase on Persian strings;
- use `dir="ltr"` only on isolated Latin/numeric fragments that require it;
- use `unicode-bidi: plaintext` or `<bdi>` for user/data-driven mixed-direction values;
- prices must not wrap between value and currency unless space requires a deliberate two-line price layout;
- truncate only when the complete value remains available through accessible text or a non-hover-only detail.

## 5. Layout system

### Containers

- compact reading/form container: `40rem` maximum;
- standard commerce container: `80rem` maximum;
- wide editorial container: `96rem` maximum;
- full bleed: media/storytelling only, with inner content returned to a container.

### Grid and gutters

- 320–479: 4-column conceptual grid, `16px` gutter;
- 480–767: 4-column conceptual grid, `20px` gutter;
- 768–1023: 8-column conceptual grid, `24px` gutter;
- 1024+: 12-column conceptual grid, `32px` gutter, capped by container.

Spacing follows semantic steps and uses fluid section spacing. Components may use compact internal spacing; sections may not create arbitrary one-off gaps.

### Sticky and fixed elements

- sticky controls must declare top/bottom offsets through shared tokens;
- a sticky purchase bar must not cover form errors, focused fields, or native browser UI;
- mobile bottom navigation clearance must be provided through `--safe-bottom-nav` plus `env(safe-area-inset-bottom)`;
- only one dominant sticky layer may occupy each viewport edge;
- overlays always outrank page sticky elements through the z-index contract.

## 6. Shape, border, and surface system

### Radius

- `xs`: compact tags and technical controls;
- `sm`: inputs and compact buttons;
- `md`: standard buttons and cards;
- `lg`: product cards and panels;
- `xl`: editorial panels;
- `pill`: badges and deliberate capsule controls.

### Borders and shadows

- default border: subtle structural separation;
- strong border: selected, focused, or elevated state;
- shadows communicate elevation only; they are not decorative glow substitutes;
- focus rings never rely on box shadow that disappears in forced-colors mode.

### Surface levels

1. canvas;
2. standard surface;
3. elevated/interactive surface;
4. overlay panel;
5. critical transient feedback.

Hover, pressed, and selected states must each be visually distinct. Pressed state may use a subtle scale only when reduced motion is respected and layout does not shift.

## 7. Motion grammar

| Purpose               | Duration            | Easing                   | Distance/scale     | Reduced motion               |
| --------------------- | ------------------- | ------------------------ | ------------------ | ---------------------------- |
| feedback              | 100–180ms           | standard-out             | 0–2px              | color/state only             |
| navigation transition | 180–260ms           | standard                 | max 12px           | instant or short dissolve    |
| content reveal        | 240–480ms           | emphasized-out           | max 24px           | content visible immediately  |
| product transition    | 240–420ms           | emphasized               | max 16px or 0.98–1 | no spatial travel            |
| cart feedback         | 160–260ms           | standard-out             | max 12px           | immediate state update       |
| dialog/drawer         | 180–300ms           | emphasized-out           | edge-relative      | no spring/large travel       |
| storytelling          | 400–800ms           | bespoke documented curve | section-specific   | static composition           |
| 3D interaction        | direct manipulation | critically damped        | user-driven        | static poster/media fallback |

Shared easing tokens:

- standard: `cubic-bezier(0.2, 0, 0, 1)`;
- standard-out: `cubic-bezier(0, 0, 0, 1)`;
- emphasized: `cubic-bezier(0.2, 0.8, 0.2, 1)`;
- emphasized-out: `cubic-bezier(0.16, 1, 0.3, 1)`.

Continuous animations must pause when off-screen or the document is hidden. Generic repeated fade/translate wrappers across every section are prohibited.

## 8. Responsive principles

Mobile is not a scaled desktop layout.

- 320–374: single-column priority, compact labels, no decorative side content, 44px minimum touch targets.
- 375–479: comfortable single-column commerce, bottom-safe fixed actions.
- 480–767: richer media without introducing desktop-only multi-column assumptions.
- 768–1023: tablet-specific navigation and two-column decisions only where content remains readable.
- 1024–1439: full desktop commerce structure with restrained density.
- 1440–1919: wider gutters; content does not stretch without purpose.
- 1920+: capped containers, intentional full-bleed media, no oversized empty layout by accident.

Every responsive component must define content priority, reflow behavior, sticky behavior, and overflow policy. Horizontal page scrolling is a release blocker unless the surface is an explicitly labelled horizontal scroller.

## 9. Accessibility constitution

Target: WCAG 2.2 AA.

Required rules:

- keyboard-visible focus for every interactive element;
- logical DOM/tab order matching the visual order;
- screen-reader names for icon-only controls;
- minimum `44×44px` touch target where practical, with no target below `24×24px`;
- reduced-motion support at both CSS and component levels;
- meaningful behavior in forced/high-contrast modes;
- usable layout and content at 200% browser zoom;
- no hover-only essential action;
- no color-only state communication;
- dialogs/drawers require labelled title, focus trap, initial focus, Escape behavior, focus restoration, and scroll lock;
- one skip-navigation link before repeated site navigation;
- route changes move focus to the main landmark and announce the new route title;
- decorative images use empty alt text; informative product media uses concise truthful alt text;
- loading indicators expose status without repeatedly interrupting assistive technology.

## 10. Performance constitution

Initial budgets are guardrails and must be refined with measured production data.

| Budget                       | Target                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| initial route JS, compressed | ≤ 220KB preferred; 300KB hard review threshold                    |
| lazy route JS, compressed    | ≤ 120KB per route preferred                                       |
| CSS, compressed              | ≤ 60KB                                                            |
| initial fonts, compressed    | ≤ 120KB total                                                     |
| hero media                   | ≤ 350KB mobile, ≤ 700KB desktop                                   |
| product-list image           | ≤ 160KB each at delivered size                                    |
| PDP primary image            | ≤ 450KB each at delivered size                                    |
| 3D model                     | ≤ 3MB preferred, 5MB hard threshold; never initial-route blocking |
| animation main-thread cost   | ≤ 4ms average work per frame during active motion                 |
| LCP                          | ≤ 2.5s at p75                                                     |
| INP                          | ≤ 200ms at p75                                                    |
| CLS                          | ≤ 0.1 at p75                                                      |

The current multi-megabyte 3D asset must remain optional and lazy. Product media requires dimensions/aspect ratio to prevent layout shifts. Client listeners, observers, and animation frames require cleanup.

## 11. SEO foundation rules

- root document is `lang="fa"` and `dir="rtl"`;
- pages use semantic landmarks and one clear primary heading;
- navigation and product discovery use crawlable links;
- finished surfaces contain no placeholder `href="#"` or `javascript:` URL;
- each route owns its title, description, canonical decision, and indexing policy;
- filtered/faceted URLs define canonical and noindex responsibility in their owning phase;
- structured data must represent visible, verified commercial facts only;
- route metadata must not claim counts, stock, ratings, delivery promises, or brands not backed by source data;
- image-alt ownership belongs to the component receiving the content record, not to a generic image wrapper;
- error and not-found pages remain understandable but are not indexed as valid commerce destinations.

## 12. Truthfulness policy

The final interface must not present the following as real unless backed by an authoritative business source:

- fabricated reviews or ratings;
- fabricated stock or urgency;
- fabricated customer or order counts;
- unsupported delivery guarantees;
- invented certification or authenticity claims;
- test addresses or phone numbers;
- payment badges for unavailable methods;
- unverified trust claims;
- fake brand/product counters;
- fake original prices or sale percentages.

Demo records must be explicitly identifiable in code and replaceable through a data boundary. During prototype phases, metadata and UI copy must avoid presenting demo values as verified business facts.

## Governance

A later phase that needs an exception must document:

1. the rule being changed;
2. the user or business need;
3. accessibility, performance, SEO, and maintenance impact;
4. the approved replacement contract;
5. regression tests or audit coverage.
