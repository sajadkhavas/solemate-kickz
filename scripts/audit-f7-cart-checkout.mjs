import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "e870dfe7ea06e5967810391f67ce083035d34ad1";
const OWNER_BRANCH = "phase/sole-f7-cart-checkout";
const INTEGRATION_BRANCH = "integration/sole-frontend-v2";
const SUPERVISOR_BRANCH = "supervisor/sole-f7-f9-integration";
const CONTROLLED_PHASE = /^phase\/sole-f(?:\d+)(?:-f\d+)?-[a-z0-9-]+$/;
const CONTROLLED_PRODUCTION_PHASE = /^phase\/sole-p(?:0[0-9]|1[0-4])-[a-z0-9-]+$/;
const REPORT = path.join(ROOT, "artifacts/audits/f7-cart-checkout.json");
const checks = [];

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
function record(name, pass, evidence = null) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}
function normalizeSourceText(source) {
  return source.replace(/\s+/g, " ");
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
const branch =
  process.env.GITHUB_HEAD_REF || branchResult.stdout || process.env.GITHUB_REF_NAME || "detached";
const controlledBranch =
  branch === OWNER_BRANCH ||
  branch === INTEGRATION_BRANCH ||
  branch === SUPERVISOR_BRANCH ||
  branch === "phase/sole-p0-production-program" ||
  CONTROLLED_PHASE.test(branch) ||
  CONTROLLED_PRODUCTION_PHASE.test(branch);
record("branch is controlled", controlledBranch, {
  owner: OWNER_BRANCH,
  integration: INTEGRATION_BRANCH,
  supervisor: SUPERVISOR_BRANCH,
  phasePattern: String(CONTROLLED_PHASE),
  actual: branch,
});
record(
  "accepted Integration baseline is an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const store = read("src/store/index.ts");
const cartDomain = read("src/cart/cart-domain.ts");
const checkoutDomain = read("src/checkout/checkout-domain.ts");
const drawer = read("src/components/CartDrawer.tsx");
const cartRoute = read("src/routes/cart.tsx");
const checkoutRoute = read("src/routes/checkout.tsx");
const purchase = read("src/components/product/ProductPurchasePanel.tsx");
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
const handoff = read("docs/handoffs/F7-CART-CHECKOUT.md");
const f13Handoff = exists("docs/handoffs/F13-FULL-CODE-AUDIT-HARDENING.md")
  ? read("docs/handoffs/F13-FULL-CODE-AUDIT-HARDENING.md")
  : "";
const drawerText = normalizeSourceText(drawer);
const cartRouteText = normalizeSourceText(cartRoute);
const checkoutRouteText = normalizeSourceText(checkoutRoute);

record(
  "cart persistence is hydration-safe and storage failures are contained",
  store.includes("skipHydration: true") &&
    store.includes("safeStorage") &&
    store.includes("sanitizePersistedCart(persisted.cart)") &&
    store.includes("hasHydrated: false") &&
    root.includes("useStore.persist.rehydrate()") &&
    root.includes("setHasHydrated(true)"),
);
record(
  "F7 hydration merge preserves F9 local account persistence",
  store.includes("demoAccountMode: sanitizeDemoMode(persisted.demoAccountMode)") &&
    store.includes("demoProfile: sanitizeDemoProfile(persisted.demoProfile)") &&
    store.includes("demoAddresses: sanitizeDemoAddresses(persisted.demoAddresses)") &&
    store.includes("demoAccountMode: state.demoAccountMode") &&
    store.includes("demoProfile: state.demoProfile") &&
    store.includes("demoAddresses: state.demoAddresses"),
);
record(
  "cart identity is variant-aware duplicate-safe and bounded after persistence",
  cartDomain.includes("new Map<string, CartItem>()") &&
    cartDomain.includes("`${id}:${size}`") &&
    cartDomain.includes("MAX_PERSISTED_CART_LINES = 50") &&
    cartDomain.includes("Math.min(MAX_CART_ITEM_QUANTITY, (existing?.qty ?? 0) + qty)"),
);
record(
  "add-to-cart validates product availability and explicit size",
  store.includes("isCartSelectionValid(id, size)") &&
    cartDomain.includes("!shoe.isSoldOut") &&
    cartDomain.includes("shoe.sizes.includes(size)") &&
    purchase.includes("selectedSize === null"),
);
record(
  "quantity ceiling is documented as client safety rather than inventory",
  !purchase.includes("max={10}") &&
    commerce.includes('typeof max !== "number" || safeValue < max') &&
    purchase.includes("max={MAX_CART_ITEM_QUANTITY}") &&
    cartDomain.includes("MAX_CART_ITEM_QUANTITY = 99") &&
    f13Handoff.includes("not inventory claims"),
);
record(
  "stale persisted states stay visible and block review",
  cartDomain.includes('"missing-product"') &&
    cartDomain.includes('"invalid-size"') &&
    cartDomain.includes('"unavailable"') &&
    drawer.includes("cart-drawer-stale-warning") &&
    cartRoute.includes("cart-stale-warning") &&
    cartRoute.includes("cart-checkout-blocked"),
);
record(
  "Cart Drawer preserves modal accessibility contracts",
  drawer.includes("DialogPrimitive.Root") &&
    drawer.includes("DialogPrimitive.Overlay") &&
    drawer.includes("DialogPrimitive.Content") &&
    drawer.includes('data-foundation-overlay="cart"') &&
    drawer.includes('data-foundation-dialog="cart"') &&
    drawer.includes("onOpenAutoFocus") &&
    drawer.includes("onCloseAutoFocus") &&
    drawer.includes('data-cart-trigger="true"'),
);
record(
  "Cart Drawer covers hydration, images, quantity, remove, subtotal and checkout",
  drawer.includes("cart-drawer-hydrating") &&
    drawer.includes("CartProductImage") &&
    drawer.includes("کاهش تعداد") &&
    drawer.includes("افزایش تعداد") &&
    drawer.includes("removeItem") &&
    drawer.includes("cart-drawer-subtotal") &&
    drawer.includes('to="/checkout"'),
);
record(
  "dedicated Cart route is noindex and shares the store",
  cartRoute.includes('createFileRoute("/cart")') &&
    cartRoute.includes('{ name: "robots", content: "noindex, follow" }') &&
    cartRoute.includes("useStore") &&
    cartRoute.includes("resolveCart(cart)") &&
    cartRoute.includes("cart-page-subtotal"),
);
record(
  "Checkout route is noindex and blocks empty or stale carts",
  checkoutRoute.includes('createFileRoute("/checkout")') &&
    checkoutRoute.includes('{ name: "robots", content: "noindex, follow" }') &&
    checkoutRoute.includes("checkout-empty-state") &&
    checkoutRoute.includes("checkout-blocked-state"),
);
record(
  "Checkout validates customer and free-text address fields",
  checkoutRoute.includes('id="checkout-firstName"') &&
    checkoutRoute.includes('id="checkout-phone"') &&
    checkoutRoute.includes('id="checkout-province"') &&
    checkoutRoute.includes('id="checkout-city"') &&
    checkoutRoute.includes('id="checkout-address"') &&
    !checkoutRoute.includes("<option") &&
    checkoutDomain.includes("validateCheckoutDraft") &&
    checkoutDomain.includes("normalizeDigits"),
);
record(
  "Checkout errors are associated and summarized",
  checkoutRoute.includes('role="alert"') &&
    checkoutRoute.includes("aria-invalid") &&
    checkoutRoute.includes("aria-describedby") &&
    checkoutRoute.includes("checkout-error-summary"),
);
record(
  "Checkout refresh persistence is failure-safe",
  checkoutRoute.includes("sessionStorage.getItem") &&
    checkoutRoute.includes("sessionStorage.setItem") &&
    checkoutRoute.includes("sanitizeCheckoutDraft") &&
    checkoutRoute.includes("catch {") &&
    checkoutRoute.includes("draftHydrated"),
);
record(
  "delivery payment and order remain explicit backend boundaries",
  checkoutRoute.includes("checkout-delivery-boundary") &&
    checkoutRoute.includes("هیچ گزینه، هزینه یا زمان تحویل") &&
    checkoutRoute.includes("checkout-payment-boundary") &&
    checkoutRoute.includes("هیچ کارت بانکی، درگاه، لوگوی پرداخت یا تراکنش") &&
    checkoutRoute.includes("ادامه پس از اتصال سرویس سفارش"),
);
record(
  "authorized F7 and F9 routes are registered together",
  routeTree.includes("CheckoutRouteImport") &&
    routeTree.includes("WishlistRouteImport") &&
    routeTree.includes("AccountRouteImport") &&
    routeTree.includes("'/checkout': typeof CheckoutRoute") &&
    routeTree.includes("'/wishlist': typeof WishlistRoute") &&
    routeTree.includes("'/account': typeof AccountRoute"),
);
record(
  "F2 route gate remains strict for the integrated authorized route set",
  f2Audit.includes("exact Foundation plus authorized F7/F9 additions") &&
    f2Audit.includes('const authorizedAdditions = ["/account", "/checkout", "/wishlist"]') &&
    f2Audit.includes("JSON.stringify(currentRoutes) === JSON.stringify(expectedRoutes)"),
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
const commerceSource = `${drawer}\n${cartRoute}\n${checkoutRoute}`;
record(
  "unsupported commerce promises and fake success claims are absent",
  forbiddenClaims.every((claim) => !commerceSource.includes(claim)),
  forbiddenClaims.filter((claim) => commerceSource.includes(claim)),
);
record(
  "truthfulness boundary is explicit across F7",
  drawerText.includes("سفارش، ارسال و پرداخت واقعی متصل نیستند") &&
    cartRouteText.includes("سفارش، ارسال یا پرداخت واقعی متصل نیست") &&
    checkoutRouteText.includes("هیچ سفارش واقعی ایجاد نمی‌شود"),
);
record(
  "44px forced-colors and reduced-motion foundations are retained",
  drawer.includes("size-11") &&
    cartRoute.includes("size-11") &&
    checkoutRoute.includes("min-h-11") &&
    styles.includes("@media (forced-colors: active)") &&
    styles.includes("@media (prefers-reduced-motion: reduce)"),
);
record(
  "Visual QA covers required widths zoom forced colors and keyboard-height viewport",
  [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920].every((width) =>
    visual.includes(`[${width},`),
  ) &&
    visual.includes("setPageScaleFactor") &&
    visual.includes('forced-colors", value: "active"') &&
    visual.includes("checkout-keyboard-viewport") &&
    visual.includes("checkout-long-persian-review"),
);
record(
  "behavior suite covers persistence variants stale state validation and storage failure",
  behavior.includes("Duplicate product and size merge") &&
    behavior.includes("Cart survives a hard refresh") &&
    behavior.includes("Stale persisted items remain visible") &&
    behavior.includes("Invalid Checkout fields") &&
    behavior.includes("Checkout draft survives refresh") &&
    behavior.includes("localStorage operations fail"),
);
record(
  "F7 commands are permanent and included in cumulative check",
  packageJson.includes('"audit:f7": "node scripts/audit-f7-cart-checkout.mjs"') &&
    packageJson.includes('"test:f7": "node scripts/test-f7-cart-checkout.mjs"') &&
    packageJson.includes('"qa:visual:f7": "node scripts/visual-qa-f7-cart-checkout.mjs"') &&
    packageJson.includes("bun run audit:f7") &&
    packageJson.includes("bun run test:f7") &&
    packageJson.includes("bun run qa:visual:f7") &&
    packageJson.includes("bun run audit:f9"),
);
record(
  "Frontend CI runs F7 and F9 permanent gates together",
  workflow.includes("F7 cart and checkout completion audit") &&
    workflow.includes("F7 cart and checkout browser behavior tests") &&
    workflow.includes("F7 cart and checkout Visual QA") &&
    workflow.includes("F9 wishlist account and orders completion audit") &&
    workflow.includes("F9 wishlist account and orders Visual QA"),
);
record(
  "cumulative verifier requires F7 and F9 evidence",
  cumulative.includes('"f7-cart-checkout"') && cumulative.includes('"f9-wishlist-account-orders"'),
);
record(
  "handoff records baseline scope truthfulness validation and backend boundaries",
  handoff.includes(BASELINE) &&
    /Scope/.test(handoff) &&
    /Truthfulness/.test(handoff) &&
    /Validation/.test(handoff) &&
    /Backend boundaries/.test(handoff),
);
record("runtime artifacts are not tracked", git("ls-files", "artifacts").stdout === "");
record(
  "no temporary write-enabled F7 workflow is tracked",
  git("ls-files", ".github/workflows/*f7*", ".github/workflows/*acceptance*dev*").stdout === "",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 2,
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
