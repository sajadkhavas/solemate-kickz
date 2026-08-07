import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "e870dfe7ea06e5967810391f67ce083035d34ad1";
const OWNER_BRANCH = "phase/sole-f7-cart-checkout";
const INTEGRATION_BRANCH = "integration/sole-frontend-v2";
const REPORT = path.join(ROOT, "artifacts/audits/f7-cart-checkout.json");
const checks = [];

function record(name, pass, evidence) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function git(...args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

const requiredFiles = [
  "src/cart/cart-domain.ts",
  "src/checkout/checkout-domain.ts",
  "src/components/cart/CartProductImage.tsx",
  "src/components/CartDrawer.tsx",
  "src/routes/cart.tsx",
  "src/routes/checkout.tsx",
  "scripts/f7-browser-runner.mjs",
  "scripts/audit-f7-cart-checkout.mjs",
  "scripts/test-f7-cart-checkout.mjs",
  "scripts/visual-qa-f7-cart-checkout.mjs",
  "docs/handoffs/F7-CART-CHECKOUT.md",
];

const branchResult = git("branch", "--show-current");
const branch = process.env.GITHUB_HEAD_REF || branchResult.stdout || process.env.GITHUB_REF_NAME || "detached";
record(
  "branch is controlled",
  branch === OWNER_BRANCH || branch === INTEGRATION_BRANCH,
  { expected: [OWNER_BRANCH, INTEGRATION_BRANCH], actual: branch },
);

const ancestry = git("merge-base", "--is-ancestor", BASELINE, "HEAD");
record("accepted Integration baseline is an ancestor", ancestry.status === 0, ancestry);

for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const store = read("src/store/index.ts");
const cartDomain = read("src/cart/cart-domain.ts");
const checkoutDomain = read("src/checkout/checkout-domain.ts");
const drawer = read("src/components/CartDrawer.tsx");
const cartRoute = read("src/routes/cart.tsx");
const checkoutRoute = read("src/routes/checkout.tsx");
const productPurchase = read("src/components/product/ProductPurchasePanel.tsx");
const commerce = read("src/components/ui/commerce-primitives.tsx");
const root = read("src/routes/__root.tsx");
const routeTree = read("src/routeTree.gen.ts");
const packageJson = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const cumulative = read("scripts/verify-cumulative-quality.mjs");
const f2Audit = read("scripts/audit-f2-navigation-search.mjs");
const visual = read("scripts/visual-qa-f7-cart-checkout.mjs");
const behavior = read("scripts/test-f7-cart-checkout.mjs");
const styles = `${read("src/styles.css")}\n${read("src/foundation.css")}`;
const handoff = exists("docs/handoffs/F7-CART-CHECKOUT.md")
  ? read("docs/handoffs/F7-CART-CHECKOUT.md")
  : "";

record(
  "cart persistence is hydration-safe and storage failures are contained",
  store.includes("skipHydration: true") &&
    store.includes("safeStorage") &&
    store.includes("try {") &&
    store.includes("sanitizePersistedCart(persisted.cart)") &&
    store.includes("hasHydrated: false") &&
    root.includes("useStore.persist.rehydrate()") &&
    root.includes("setHasHydrated(true)"),
  null,
);
record(
  "persisted cart sanitation keeps variant identity and merges exact duplicates",
  cartDomain.includes("new Map<string, CartItem>()") &&
    cartDomain.includes("`${id}:${size}`") &&
    cartDomain.includes("qty: (existing?.qty ?? 0) + qty"),
  null,
);
record(
  "add-to-cart validates product, sold-out state and selected size",
  store.includes("isCartSelectionValid(id, size)") &&
    cartDomain.includes("!shoe.isSoldOut") &&
    cartDomain.includes("shoe.sizes.includes(size)") &&
    productPurchase.includes("selectedSize === null"),
  null,
);
record(
  "quantity has no fabricated default inventory maximum",
  !productPurchase.includes("max={10}") &&
    /max,\n  disabled/.test(commerce) &&
    commerce.includes('typeof max !== "number" || safeValue < max'),
  null,
);
record(
  "stale and unavailable cart entries stay reviewable instead of disappearing",
  cartDomain.includes('"missing-product"') &&
    cartDomain.includes('"invalid-size"') &&
    cartDomain.includes('"unavailable"') &&
    drawer.includes("cart-drawer-stale-warning") &&
    cartRoute.includes("cart-stale-warning") &&
    cartRoute.includes("cart-checkout-blocked"),
  null,
);
record(
  "Cart Drawer remains a modal with focus, dismissal and restoration contracts",
  drawer.includes("DialogPrimitive.Root") &&
    drawer.includes("DialogPrimitive.Overlay") &&
    drawer.includes("DialogPrimitive.Content") &&
    drawer.includes('data-foundation-overlay="cart"') &&
    drawer.includes('data-foundation-dialog="cart"') &&
    drawer.includes("onOpenAutoFocus") &&
    drawer.includes("onCloseAutoFocus") &&
    drawer.includes('data-cart-trigger="true"'),
  null,
);
record(
  "Cart Drawer includes hydration, broken-image, quantity, remove, subtotal and Checkout states",
  drawer.includes("cart-drawer-hydrating") &&
    drawer.includes("CartProductImage") &&
    drawer.includes("کاهش تعداد") &&
    drawer.includes("افزایش تعداد") &&
    drawer.includes("removeItem") &&
    drawer.includes("cart-drawer-subtotal") &&
    drawer.includes('to="/checkout"'),
  null,
);
record(
  "dedicated Cart route is noindex and uses shared store",
  cartRoute.includes('createFileRoute("/cart")') &&
    cartRoute.includes('{ name: "robots", content: "noindex, follow" }') &&
    cartRoute.includes("useStore") &&
    cartRoute.includes("resolveCart(cart)") &&
    cartRoute.includes("cart-page-subtotal"),
  null,
);
record(
  "Checkout route is noindex and blocks empty or stale carts",
  checkoutRoute.includes('createFileRoute("/checkout")') &&
    checkoutRoute.includes('{ name: "robots", content: "noindex, follow" }') &&
    checkoutRoute.includes("checkout-empty-state") &&
    checkoutRoute.includes("checkout-blocked-state"),
  null,
);
record(
  "Checkout collects validated customer and free-text address data without fabricated region options",
  checkoutRoute.includes('id="checkout-firstName"') &&
    checkoutRoute.includes('id="checkout-phone"') &&
    checkoutRoute.includes('id="checkout-province"') &&
    checkoutRoute.includes('id="checkout-city"') &&
    checkoutRoute.includes('id="checkout-address"') &&
    checkoutRoute.includes("هیچ") &&
    !checkoutRoute.includes("<option") &&
    checkoutDomain.includes("validateCheckoutDraft") &&
    checkoutDomain.includes("normalizeDigits"),
  null,
);
record(
  "Checkout errors are associated and summarized without color-only reliance",
  checkoutRoute.includes('role="alert"') &&
    checkoutRoute.includes("aria-invalid") &&
    checkoutRoute.includes("aria-describedby") &&
    checkoutRoute.includes("checkout-error-summary") &&
    checkoutRoute.includes("● "),
  null,
);
record(
  "Checkout draft refresh persistence is failure-safe",
  checkoutRoute.includes("sessionStorage.getItem") &&
    checkoutRoute.includes("sessionStorage.setItem") &&
    checkoutRoute.includes("sanitizeCheckoutDraft") &&
    checkoutRoute.includes("catch {") &&
    checkoutRoute.includes("draftHydrated"),
  null,
);
record(
  "delivery and payment are explicit backend boundaries",
  checkoutRoute.includes("checkout-delivery-boundary") &&
    checkoutRoute.includes("هیچ گزینه، هزینه یا زمان تحویل") &&
    checkoutRoute.includes("checkout-payment-boundary") &&
    checkoutRoute.includes("هیچ کارت بانکی، درگاه، لوگوی پرداخت یا تراکنش"),
  null,
);
record(
  "Order Review exists and final real-order action is intentionally disabled",
  checkoutRoute.includes("checkout-review") &&
    checkoutRoute.includes("checkout-review-item") &&
    checkoutRoute.includes("checkout-subtotal") &&
    checkoutRoute.includes("ادامه پس از اتصال سرویس سفارش") &&
    /data-testid="checkout-final-action"[\s\S]*disabled/.test(checkoutRoute),
  null,
);
record(
  "Checkout route is present in generated TanStack route tree",
  routeTree.includes("CheckoutRouteImport") &&
    routeTree.includes("'/checkout': typeof CheckoutRoute") &&
    routeTree.includes("CheckoutRoute: CheckoutRoute"),
  null,
);
record(
  "F2 generated-route gate remains strict for every pre-F7 route",
  f2Audit.includes("stripF7CheckoutRoute") &&
    f2Audit.includes("normalizedCurrentRouteTree === normalizedFoundationRouteTree") &&
    f2Audit.includes("only adds F7 checkout"),
  null,
);

const forbiddenClaims = [
  "ارسال رایگان",
  "تحویل امروز",
  "تحویل ۲ ساعته",
  "ارسال سراسری قطعی",
  "SOLE10",
  "۹٪ مالیات",
  "پرداخت امن",
  "ارسال سریع",
  "۷ روز بازگشت",
  "پرداخت موفق",
  "سفارش با موفقیت",
  "تراکنش موفق",
];
const f7CommerceSource = `${drawer}\n${cartRoute}\n${checkoutRoute}`;
record(
  "unsupported commerce promises and fake success claims are absent",
  forbiddenClaims.every((claim) => !f7CommerceSource.includes(claim)),
  forbiddenClaims.filter((claim) => f7CommerceSource.includes(claim)),
);
record(
  "truthfulness boundary remains explicit throughout F7",
  drawer.includes("سفارش، ارسال و پرداخت واقعی متصل نیستند") &&
    cartRoute.includes("سفارش، ارسال یا پرداخت واقعی متصل نیست") &&
    checkoutRoute.includes("هیچ سفارش واقعی ایجاد نمی‌شود"),
  null,
);
record(
  "44px controls, forced colors and reduced-motion foundations are retained",
  cartRoute.includes("size-11") &&
    checkoutRoute.includes("min-h-11") &&
    styles.includes("@media (forced-colors: active)") &&
    styles.includes("@media (prefers-reduced-motion: reduce)"),
  null,
);
record(
  "Visual QA covers all required responsive widths plus zoom and forced colors",
  [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920].every((width) => visual.includes(`[${width},`)) &&
    visual.includes("setPageScaleFactor") &&
    visual.includes('forced-colors", value: "active"') &&
    visual.includes("checkout-keyboard-viewport") &&
    visual.includes("checkout-long-persian-review"),
  null,
);
record(
  "behavior suite covers persistence, duplicate identity, stale state, Checkout validation and storage failure",
  behavior.includes("Duplicate product and size merge") &&
    behavior.includes("Cart survives a hard refresh") &&
    behavior.includes("Stale persisted items remain visible") &&
    behavior.includes("Invalid Checkout fields") &&
    behavior.includes("Checkout draft survives refresh") &&
    behavior.includes("localStorage operations fail"),
  null,
);
record(
  "phase scripts are registered and F7 is part of check",
  packageJson.includes('"audit:f7": "node scripts/audit-f7-cart-checkout.mjs"') &&
    packageJson.includes('"test:f7": "node scripts/test-f7-cart-checkout.mjs"') &&
    packageJson.includes('"qa:visual:f7": "node scripts/visual-qa-f7-cart-checkout.mjs"') &&
    packageJson.includes("bun run audit:f7") &&
    packageJson.includes("bun run test:f7") &&
    packageJson.includes("bun run qa:visual:f7"),
  null,
);
record(
  "Frontend CI runs F7 audit, behavior and Visual QA",
  workflow.includes("F7 cart and checkout completion audit") &&
    workflow.includes("F7 cart and checkout browser behavior tests") &&
    workflow.includes("F7 cart and checkout Visual QA"),
  null,
);
record(
  "cumulative verifier requires F7 evidence",
  cumulative.includes('"f7-cart-checkout"'),
  null,
);
record(
  "handoff records baseline, scope, truth boundaries, validation and backend boundaries",
  handoff.includes(BASELINE) &&
    /Scope/.test(handoff) &&
    /Truthfulness/.test(handoff) &&
    /Validation/.test(handoff) &&
    /Backend boundaries/.test(handoff),
  handoff ? "content checked" : "missing",
);

const changed = git("diff", "--name-only", BASELINE, "HEAD").stdout.split("\n").filter(Boolean);
const allowedPrefixes = [
  ".github/workflows/frontend-ci.yml",
  "docs/handoffs/F7-CART-CHECKOUT.md",
  "package.json",
  "scripts/audit-f2-navigation-search.mjs",
  "scripts/audit-f7-cart-checkout.mjs",
  "scripts/f7-browser-runner.mjs",
  "scripts/test-f7-cart-checkout.mjs",
  "scripts/verify-cumulative-quality.mjs",
  "scripts/visual-qa-f7-cart-checkout.mjs",
  "src/cart/cart-domain.ts",
  "src/checkout/checkout-domain.ts",
  "src/components/CartDrawer.tsx",
  "src/components/cart/CartProductImage.tsx",
  "src/components/product/ProductPurchasePanel.tsx",
  "src/components/ui/commerce-primitives.tsx",
  "src/routes/__root.tsx",
  "src/routes/cart.tsx",
  "src/routes/checkout.tsx",
  "src/store/index.ts",
  "src/routeTree.gen.ts",
];
const outOfScope = changed.filter((file) => !allowedPrefixes.includes(file));
record(
  "diff remains inside F7 and necessary regression scope",
  branch !== OWNER_BRANCH || outOfScope.length === 0,
  branch === OWNER_BRANCH ? outOfScope : "scope gate applies on the owner phase branch",
);

const trackedArtifacts = git("ls-files", "artifacts");
record("runtime artifacts are not tracked", trackedArtifacts.stdout === "", trackedArtifacts.stdout);
const temporaryWorkflows = git("ls-files", ".github/workflows/*f7*", ".github/workflows/*acceptance*dev*");
record("no temporary write-enabled F7 workflow is tracked", temporaryWorkflows.stdout === "", temporaryWorkflows.stdout);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f7-cart-checkout-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  branch,
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;
