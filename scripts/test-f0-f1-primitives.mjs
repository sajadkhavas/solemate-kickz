import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const source = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const button = source("src/components/ui/button.tsx");
const commerce = source("src/components/ui/commerce-primitives.tsx");
const cartDrawer = source("src/components/CartDrawer.tsx");
const root = source("src/routes/__root.tsx");
const styles = source("src/styles.css");

test("Button defaults to non-submitting behavior", () => {
  assert.match(button, /type=\{type \?\? "button"\}/);
});

test("Button exposes loading and disabled semantics", () => {
  assert.match(button, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(button, /disabled=\{unavailable\}/);
  assert.match(button, /loadingLabel/);
});

test("Button asChild preserves the Radix single-child contract", () => {
  assert.match(button, /if \(asChild\)/);
  assert.match(button, /React\.Children\.only\(children\)/);
  assert.doesNotMatch(button, /<Slot[\s\S]*absolute size-4[\s\S]*<\/Slot>/);
});

test("IconButton requires an accessible label", () => {
  assert.match(commerce, /type IconButtonProps[\s\S]*label: string/);
  assert.match(commerce, /aria-label=\{label\}/);
});

test("QuantityStepper clamps values and disables boundaries", () => {
  assert.match(commerce, /Math\.min\(max, Math\.max\(min, value\)\)/);
  assert.match(commerce, /disabled=\{!canDecrease\}/);
  assert.match(commerce, /disabled=\{!canIncrease\}/);
  assert.match(commerce, /aria-live="polite"/);
});

test("Price content isolates mixed-direction numeric values", () => {
  assert.match(commerce, /<bdi dir="ltr">\{formattedValue\}<\/bdi>/);
  assert.match(commerce, /Intl\.NumberFormat/);
});

test("Cart drawer uses a modal primitive with an accessible name", () => {
  assert.match(cartDrawer, /DialogPrimitive\.Root/);
  assert.match(cartDrawer, /DialogPrimitive\.Title/);
  assert.match(cartDrawer, /DialogPrimitive\.Description/);
  assert.match(cartDrawer, /DialogPrimitive\.Close/);
});

test("Root document owns stable RTL skip navigation and route focus", () => {
  assert.match(root, /<html lang="fa" dir="rtl"/);
  assert.match(root, /href="#main-content"/);
  assert.match(root, /id="main-content"/);
  assert.match(root, /ref=\{focusTargetRef\}/);
  assert.match(root, /focusTargetRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(root, /aria-live="polite"/);
  assert.doesNotMatch(root, /\.id = "main-content"/);
  assert.doesNotMatch(root, /\.tabIndex = -1/);
});

test("Global CSS preserves focus and reduced-motion behavior", () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /animation-duration: 0\.01ms !important/);
});
