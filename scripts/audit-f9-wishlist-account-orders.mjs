import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "e870dfe7ea06e5967810391f67ce083035d34ad1";
const REPORT = path.join(ROOT, "artifacts/audits/f9-wishlist-account-orders.json");
const checks = [];

function record(name, pass, evidence = null) {
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
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

const requiredFiles = [
  "src/routes/wishlist.tsx",
  "src/routes/account.tsx",
  "scripts/f9-browser-runner.mjs",
  "scripts/audit-f9-wishlist-account-orders.mjs",
  "scripts/test-f9-wishlist-account-orders.mjs",
  "scripts/visual-qa-f9-wishlist-account-orders.mjs",
  "docs/handoffs/F9-WISHLIST-ACCOUNT-ORDERS.md",
];

const branch = git("branch", "--show-current");
record(
  "branch is controlled",
  branch.stdout === "phase/sole-f9-wishlist-account-orders" || process.env.CI === "true",
  branch,
);
record(
  "accepted Integration baseline is an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const wishlist = read("src/routes/wishlist.tsx");
const account = read("src/routes/account.tsx");
const store = read("src/store/index.ts");
const navbar = read("src/components/Navbar.tsx");
const mobileBottom = read("src/components/MobileBottomNav.tsx");
const mobileNavigation = read("src/components/navigation/MobileNavigation.tsx");
const productCard = read("src/components/ShoeCard.tsx");
const purchasePanel = read("src/components/product/ProductPurchasePanel.tsx");
const auth = read("src/routes/auth.tsx");
const routeTree = read("src/routeTree.gen.ts");
const packageJson = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const verifier = read("scripts/verify-cumulative-quality.mjs");
const behavior = read("scripts/test-f9-wishlist-account-orders.mjs");
const visual = read("scripts/visual-qa-f9-wishlist-account-orders.mjs");

record(
  "wishlist route uses the persisted shared wishlist",
  wishlist.includes("state.wishlist") &&
    wishlist.includes("<ShoeCard") &&
    store.includes("clearWishlist"),
);
record(
  "wishlist has loading, empty, populated and clear states",
  wishlist.includes('data-testid="wishlist-empty"') &&
    wishlist.includes('data-testid="wishlist-grid"') &&
    wishlist.includes('data-testid="wishlist-clear"') &&
    wishlist.includes("در حال خواندن"),
);
record(
  "wishlist synchronization is shared across ProductCard and PDP",
  productCard.includes("state.wishlist.includes(shoe.id)") &&
    productCard.includes("state.toggleWishlist") &&
    purchasePanel.includes("state.wishlist.includes(shoe.id)") &&
    purchasePanel.includes("state.toggleWishlist"),
);
record(
  "wishlist product images expose an error fallback",
  productCard.includes("onError={() => setFailed(true)}") &&
    productCard.includes("تصویر در دسترس نیست"),
);
record(
  "account exposes guest, active and expired session states",
  store.includes('DemoAccountMode = "guest" | "active" | "expired"') &&
    account.includes('data-testid="account-guest-state"') &&
    account.includes('data-testid="account-expired-state"') &&
    account.includes('data-testid="account-overview"'),
);
record(
  "profile and addresses persist local-only data",
  store.includes("demoProfile") &&
    store.includes("demoAddresses") &&
    account.includes('data-testid="account-profile-save"') &&
    account.includes('data-testid="account-address-add"') &&
    /localStorage/.test(account),
);
record(
  "orders provide list, detail and missing states without backend claims",
  account.includes('data-testid="account-orders"') &&
    account.includes('data-testid="account-order-detail"') &&
    account.includes('data-testid="account-order-missing"') &&
    account.includes("هیچ درخواست Backend انجام نشد") &&
    account.includes("تراکنش واقعی نیستند"),
);
record(
  "existing auth boundary remains truthful",
  auth.includes("هیچ حساب، نشست") &&
    auth.includes("اطلاعات واردشده ارسال یا در localStorage و sessionStorage ذخیره نمی‌شوند"),
);
record(
  "global navigation reaches F9 account and wishlist on desktop and mobile",
  navbar.includes('to="/wishlist"') &&
    navbar.includes('to="/account"') &&
    mobileBottom.includes('to="/account"') &&
    mobileNavigation.includes('{ to: "/wishlist", label: "علاقه‌مندی‌ها" }'),
);
record(
  "route tree includes account and wishlist routes",
  routeTree.includes("'/account': typeof AccountRoute") &&
    routeTree.includes("'/wishlist': typeof WishlistRoute"),
);
record(
  "F9 pages are noindex frontend-only surfaces",
  wishlist.includes('name: "robots", content: "noindex, nofollow"') &&
    account.includes('name: "robots", content: "noindex, nofollow"') &&
    account.includes("حساب، احراز هویت، سفارش"),
);
record(
  "phase commands and cumulative verifier are registered",
  packageJson.includes('"audit:f9"') &&
    packageJson.includes('"test:f9"') &&
    packageJson.includes('"qa:visual:f9"') &&
    verifier.includes('"f9-wishlist-account-orders"'),
);
record(
  "workflow runs F9 audit behavior and visual gates",
  workflow.includes("F9 wishlist account and orders completion audit") &&
    workflow.includes("F9 wishlist account and orders browser behavior tests") &&
    workflow.includes("F9 wishlist account and orders Visual QA"),
);
record(
  "F9 browser gate covers keyboard sync persistence URL history and local-only writes",
  behavior.includes("Wishlist clear action works from keyboard and persists") &&
    behavior.includes("ProductCard reflects PDP wishlist state") &&
    behavior.includes("PDP reflects ProductCard wishlist removal") &&
    behavior.includes("Long Persian profile values and an empty optional phone persist locally") &&
    behavior.includes("Address removal persists locally") &&
    behavior.includes("Profile save performs no Fetch/XHR backend synchronization") &&
    behavior.includes("Address add performs no Fetch/XHR backend synchronization") &&
    behavior.includes("Browser back restores the orders list URL state") &&
    behavior.includes("Browser forward restores the order detail URL state") &&
    behavior.includes("Mobile global navigation exposes Wishlist"),
);
record(
  "F9 Visual QA covers required viewports and release-blocking states",
  [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920].every((width) =>
    visual.includes(`[${width},`),
  ) &&
    visual.includes('"wishlist-empty"') &&
    visual.includes('"wishlist-populated-mobile"') &&
    visual.includes('"account-guest"') &&
    visual.includes('"account-profile"') &&
    visual.includes('"account-addresses"') &&
    visual.includes('"account-orders"') &&
    visual.includes('"account-order-detail"') &&
    visual.includes('"account-order-missing"') &&
    visual.includes('"account-expired"') &&
    visual.includes('"account-reduced-motion"') &&
    visual.includes("horizontal-overflow") &&
    visual.includes("horizontally-clipped-controls") &&
    visual.includes("focus-probe-failed") &&
    visual.includes("broken-wishlist-images"),
);
record(
  "runtime artifacts are not tracked",
  git("ls-files", "artifacts").stdout === "",
  git("ls-files", "artifacts").stdout,
);

const forbiddenClaims = [
  "سفارش واقعی شما",
  "پرداخت موفق",
  "ارسال شده توسط پست",
  "احراز هویت موفق",
  "حساب شما ساخته شد",
];
record(
  "fabricated account commerce claims are absent",
  forbiddenClaims.every((claim) => !account.includes(claim) && !wishlist.includes(claim)),
  forbiddenClaims.filter((claim) => account.includes(claim) || wishlist.includes(claim)),
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f9-wishlist-account-orders-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;
