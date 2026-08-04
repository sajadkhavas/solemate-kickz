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
const foundationCss = source("src/foundation.css");

// These are source-contract audits. Interactive behavior is verified by
// scripts/test-f0-f1-behavior.mjs in a real browser session.
test("source-contract: Button keeps non-submitting and loading semantics", () => {
  assert.match(button, /type=\{type \?\? "button"\}/);
  assert.match(button, /disabled=\{unavailable\}/);
  assert.match(button, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(button, /React\.Children\.only\(children\)/);
});

test("source-contract: commerce primitives expose required semantics", () => {
  assert.match(commerce, /type IconButtonProps[\s\S]*label: string/);
  assert.match(commerce, /aria-label=\{label\}/);
  assert.match(commerce, /Math\.min\(max, Math\.max\(min, value\)\)/);
  assert.match(commerce, /<bdi dir="ltr">\{formattedValue\}<\/bdi>/);
});

test("source-contract: Cart Drawer uses a modal primitive and testable overlay policy", () => {
  assert.match(cartDrawer, /DialogPrimitive\.Root/);
  assert.match(cartDrawer, /DialogPrimitive\.Overlay/);
  assert.match(cartDrawer, /DialogPrimitive\.Content/);
  assert.match(cartDrawer, /data-foundation-overlay="cart"/);
  assert.match(cartDrawer, /data-foundation-dialog="cart"/);
});

test("source-contract: root owns stable RTL focus and skip-link targets", () => {
  assert.match(root, /<html lang="fa" dir="rtl"/);
  assert.match(root, /href="#main-content"/);
  assert.match(root, /id="main-content"/);
  assert.match(root, /document\.getElementById\("main-content"\)\?\.focus/);
  assert.match(root, /foundation\.css\?url/);
  assert.doesNotMatch(root, /\.id = "main-content"/);
  assert.doesNotMatch(root, /\.tabIndex = -1/);
});

test("source-contract: foundation CSS defines global overflow, focus, touch and motion rules", () => {
  assert.match(foundationCss, /#main-content[\s\S]*overflow-x:\s*clip/);
  assert.match(foundationCss, /:focus-visible/);
  assert.match(foundationCss, /min-block-size:\s*var\(--size-touch\)/);
  assert.match(foundationCss, /@media \(prefers-reduced-motion: reduce\)/);
});
