# SOLE Design System

Status: normative implementation contract  
Constitution: `docs/frontend/SOLE_FRONTEND_CONSTITUTION.md`

## 1. Token architecture

SOLE uses semantic tokens. Reusable components must not depend on visual palette names such as `purple-500` or hard-coded campaign colors.

### Color tokens

- `--color-background`: page canvas.
- `--color-surface`: standard panel/card.
- `--color-surface-elevated`: dialogs, drawers, menus, and raised controls.
- `--color-interactive`: neutral interactive surface.
- `--color-primary`: principal action.
- `--color-primary-hover`: principal hover state.
- `--color-primary-foreground`: content on principal action.
- `--color-secondary`: lower-emphasis action.
- `--color-muted`: quiet surface.
- `--color-text`: primary text.
- `--color-text-muted`: secondary text.
- `--color-border`: default structural border.
- `--color-border-strong`: selected/elevated border.
- `--color-success`, `--color-warning`, `--color-danger`: semantic feedback.
- `--color-stock-in`, `--color-stock-low`, `--color-stock-out`: verified inventory states.
- `--color-sale`: verified price-reduction state.
- `--color-focus`: keyboard focus.
- `--color-selection`: text/control selection.
- `--color-disabled`: unavailable controls.
- `--color-overlay`: modal backdrop.

Legacy visual aliases (`neon`, `ink`, etc.) may remain temporarily for existing page work, but new shared primitives consume semantic roles.

### Typography tokens

- `--font-display`, `--font-sans`, `--font-fa`, `--font-mono`.
- `--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-body`, `--text-label`, `--text-caption`, `--text-price`.
- Fluid steps use `clamp()` and remain bounded.
- Numeric tokens use tabular figures.

### Spacing and size

Spacing follows a 4px-derived scale with semantic aliases:

- compact control gap: `--space-control`;
- card padding: `--space-card`;
- section block spacing: `--space-section`;
- page gutter: `--space-page-gutter`;
- minimum interactive size: `--size-touch` (`44px`);
- compact icon control: never below `36px`, with a 44px hit area where layout permits.

### Radius, border, shadow, and opacity

- radius: `xs`, `sm`, `md`, `lg`, `xl`, `pill`;
- border: default and strong;
- shadow: surface, elevated, overlay;
- opacity: muted, disabled, backdrop, decorative grain.

### Z-index contract

| Layer | Token |
| --- | --- |
| base content | `--z-base` |
| sticky page controls | `--z-sticky` |
| dropdown/popover | `--z-popover` |
| backdrop | `--z-overlay` |
| dialog/drawer panel | `--z-modal` |
| toast | `--z-toast` |
| accessibility emergency layer | `--z-a11y` |

No shared component may introduce arbitrary values above the toast layer.

### Motion tokens

- durations: instant, fast, normal, slow, story;
- easings: standard, standard-out, emphasized, emphasized-out;
- maximum standard travel: `24px`;
- reduced-motion mode sets non-essential duration and distance to effectively zero.

### Containers and safe areas

- compact: `40rem`;
- standard: `80rem`;
- wide: `96rem`;
- page gutters are fluid;
- bottom-fixed surfaces include `env(safe-area-inset-bottom)` and `--safe-bottom-nav`.

## 2. Root document contract

The root document owns:

- `lang="fa"`;
- `dir="rtl"`;
- UTF-8, responsive viewport, theme color, and safe-area viewport behavior;
- the first skip-navigation link;
- route focus management and a polite route announcement;
- global focus-visible and forced-colors behavior;
- reduced-motion CSS foundation;
- non-blocking font strategy;
- global toaster placement and direction.

Each route owns its main landmark. The root focus manager targets the first `main`, assigns `id="main-content"` when necessary, and focuses it after a completed route change without affecting pointer navigation.

## 3. Primitive inventory

### Existing Radix/Shadcn-backed primitives

- Button
- Input
- Textarea
- Select
- Checkbox
- RadioGroup
- Switch
- Range/Slider
- Badge
- Skeleton
- Alert
- Toast
- Tooltip
- Popover
- Dialog
- Drawer
- Accordion
- Tabs
- Breadcrumb
- Pagination

### SOLE commerce primitives

Implemented in `src/components/ui/commerce-primitives.tsx`:

- IconButton
- TextLink
- SearchInput
- Price
- DiscountPrice
- StockState
- QuantityStepper
- Spinner
- EmptyState
- ErrorState
- VisuallyHidden

Shared primitives must support:

- default, hover, focus-visible, active/pressed, selected, disabled, loading, and error where applicable;
- forced/high-contrast mode;
- reduced motion;
- RTL layout and mixed-direction content;
- 320px narrow mobile layouts;
- accessible names and state announcements.

## 4. Button contract

- Native `button` by default.
- Default `type="button"` to prevent accidental form submission.
- `asChild` is allowed only when the child is one interactive element and the resulting semantics remain correct.
- Loading state preserves width, disables duplicate activation, and exposes busy state.
- Icon-only actions use `IconButton` and require an accessible label.
- Links are not rendered as buttons unless the visual treatment is explicitly link-like and navigation semantics remain a link.

## 5. Form contract

- Every field has a programmatically associated label.
- Placeholder is supplemental, never the only label.
- Errors are connected through `aria-describedby` and invalid state.
- Inputs inherit Persian direction; email, phone, SKU, and other direction-sensitive values may use isolated LTR rendering.
- Search input uses a search landmark/form in the owning feature and exposes a clear action when content exists.
- Touch targets and inline actions remain usable at 200% zoom.

## 6. Commerce data contract

### Price

- Uses a numeric/mono style and direction isolation.
- Currency is explicit.
- A discount requires both verified current and original values.
- Fake markdown pricing is forbidden.

### Stock

`StockState` accepts only `in-stock`, `low-stock`, or `out-of-stock`. Low-stock language requires an authoritative threshold or source. State is expressed by text plus icon/shape, never color alone.

### Quantity

`QuantityStepper` has labelled decrement and increment controls, a live but non-noisy numeric value, valid min/max behavior, disabled boundary controls, and no hidden negative values.

## 7. Overlay contract

Dialog, drawer, search overlay, and cart drawer share these requirements:

- focus is trapped inside while open;
- Escape dismisses unless a destructive confirmation explicitly prevents it;
- backdrop click policy is deliberate and documented;
- an initial focus target is selected;
- focus returns to the trigger after dismissal;
- page scroll is locked without causing layout jump;
- nested overlay interaction does not close a parent incorrectly;
- title and description are available to assistive technology;
- mobile panels account for safe areas and virtual keyboards;
- reduced motion removes large travel and spring effects;
- browser back behavior is owned by the feature phase when an overlay creates navigable state.

Radix Dialog is the default modal primitive. Vaul Drawer is used for mobile sheet interactions only when its gesture behavior does not conflict with scrolling or assistive technology.

## 8. Interaction integrity rules

Repository-wide release blockers:

- `button` inside a link or link inside a button;
- click handlers on non-interactive elements without equivalent keyboard semantics;
- controls without accessible names;
- positive `tabIndex`;
- essential hover-only actions;
- removed focus indicators;
- placeholder `href="#"`;
- `javascript:` URLs;
- informative images without meaningful alt text;
- dialogs without a title;
- icon-only controls without a label.

Foundation work may make minimal structural repairs in page-specific files but must not redesign those features.

## 9. Responsive component rules

Every shared primitive must remain operable at 320px wide. Inline control groups wrap or collapse intentionally. Dialogs use viewport-aware maximum dimensions. Drawers never hide their close affordance beneath a safe area. Long Persian labels and mixed Latin model names are tested without fixed-width clipping.

## 10. Accessibility states

- Focus ring: visible 2px outline/ring plus offset, preserved in forced colors.
- Disabled: native disabled semantics where available; no pointer-only disabling.
- Loading: `aria-busy` and visible progress; avoid repeated live announcements.
- Error: explicit text and `aria-invalid` where applicable.
- Selected/pressed: native or ARIA state plus visual state.
- Reduced motion: state changes remain understandable without spatial animation.

## 11. Performance rules

- Shared primitives are dependency-light and tree-shakeable.
- No primitive imports the 3D model, product dataset, or route-only media.
- Overlays render only when needed.
- Animation wrappers avoid permanent observers and clean up listeners/RAF.
- The custom cursor is progressive enhancement for fine pointers only and never removes the native cursor before its own nodes are ready.

## 12. Testing and audit

Permanent commands:

- `bun run audit:f0-f1`: machine-readable foundation audit.
- `bun run test:foundation`: sensitive primitive contract tests.
- `bun run typecheck`: TypeScript validation.
- `bun run lint`: repository lint.
- `bun run build`: production build.
- `bun run check`: ordered aggregate gate.

Audit output: `artifacts/audits/f0-f1-foundation.json`.

The audit checks documents, root direction/language, skip navigation, focus and motion foundations, unsafe URLs/tab order, semantic tokens, primitive inventory, font loading, performance budgets, truthfulness policy, and handoff presence.
