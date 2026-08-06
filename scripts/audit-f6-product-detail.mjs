import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "35c0d16b0243e927523a2e715a78a4e7e9c68046";
const REPORT = path.join(ROOT, "artifacts/audits/f6-product-detail.json");

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
  "src/routes/product.$id.tsx",
  "src/components/product/ProductGallery.tsx",
  "src/components/product/ProductPurchasePanel.tsx",
  "src/components/product/SizeGuideDialog.tsx",
  "scripts/f6-browser-runner.mjs",
  "scripts/audit-f6-product-detail.mjs",
  "scripts/test-f6-product-detail.mjs",
  "scripts/visual-qa-f6-product-detail.mjs",
  "docs/handoffs/F6-PRODUCT-DETAIL.md",
];

const branch = git("branch", "--show-current");
record(
  "branch is controlled",
  branch.stdout === "phase/sole-f6-product-detail" || process.env.CI === "true",
  branch,
);

const ancestry = git("merge-base", "--is-ancestor", BASELINE, "HEAD");
record("accepted Integration baseline is an ancestor", ancestry.status === 0, ancestry);

for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const route = read("src/routes/product.$id.tsx");
const gallery = read("src/components/product/ProductGallery.tsx");
const purchase = read("src/components/product/ProductPurchasePanel.tsx");
const sizeGuide = read("src/components/product/SizeGuideDialog.tsx");
const packageJson = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");

record(
  "product route delegates gallery and purchase panel",
  route.includes("<ProductGallery") && route.includes("<ProductPurchasePanel"),
  null,
);
record(
  "product route provides related and recently viewed collections",
  route.includes('testId="related-products"') &&
    route.includes('testId="recently-viewed-products"') &&
    route.includes("addRecentlyViewed"),
  null,
);
record(
  "size selection starts empty",
  purchase.includes("useState<number | null>(null)") &&
    !route.includes("Math.floor(shoe.sizes.length / 2)"),
  null,
);
record(
  "add to cart requires an explicit size",
  purchase.includes("selectedSize === null") &&
    purchase.includes('data-testid="product-add-to-cart"') &&
    purchase.includes("disabled={!canAdd}"),
  null,
);
record(
  "quantity stepper is wired to cart quantity",
  purchase.includes("<QuantityStepper") &&
    purchase.includes("addToCart(shoe.id, selectedSize, quantity)"),
  null,
);
record(
  "sold-out behavior uses only the dataset flag",
  purchase.includes("shoe.isSoldOut") &&
    !route.includes("soldOutSizes") &&
    !route.includes("lowStock"),
  null,
);
record(
  "mobile purchase bar is implemented",
  purchase.includes('data-testid="product-mobile-purchase"') &&
    purchase.includes('data-testid="product-mobile-add-to-cart"'),
  null,
);
record(
  "wishlist exposes pressed state",
  purchase.includes("aria-pressed={isWishlisted}") &&
    purchase.includes('data-testid="product-wishlist"'),
  null,
);
record(
  "gallery supports keyboard and pointer navigation",
  gallery.includes('event.key === "ArrowLeft"') &&
    gallery.includes('event.key === "ArrowRight"') &&
    gallery.includes("onPointerDown") &&
    gallery.includes("onPointerUp"),
  null,
);
record(
  "gallery exposes image fallback and zoom dialog",
  gallery.includes("product-main-image-fallback") ||
    (gallery.includes("SafeImage") && gallery.includes("product-gallery-dialog")),
  null,
);
record(
  "gallery thumbnails expose selection semantics",
  gallery.includes('role="tablist"') &&
    gallery.includes('role="tab"') &&
    gallery.includes("aria-selected={selected}"),
  null,
);
record(
  "size guide is an accessible dialog",
  sizeGuide.includes("DialogPrimitive.Root") &&
    sizeGuide.includes('data-testid="size-guide-dialog"') &&
    sizeGuide.includes('data-testid="size-guide-trigger"'),
  null,
);
record(
  "size guide avoids fabricated conversion data",
  sizeGuide.includes("نمودار رسمی") &&
    !sizeGuide.includes("<table"),
  null,
);

const forbiddenClaims = [
  "فقط ۳ جفت باقی مونده",
  "ارسال رایگان",
  "۷ روز بازگشت",
  "اصالت تضمینی",
  "چرم طبیعی + مش",
  "لاستیک ولکانیزه",
  "۳۴۰ گرم",
  "کشور سازنده: ویتنام",
  "DRAG TO ROTATE",
];
record(
  "unsupported commerce and specification claims are absent",
  forbiddenClaims.every((claim) => !route.includes(claim) && !purchase.includes(claim)),
  forbiddenClaims.filter((claim) => route.includes(claim) || purchase.includes(claim)),
);
record(
  "dataset boundary is explicit",
  purchase.includes("Dataset فعلی اطلاعاتی درباره موجودی هر سایز") &&
    purchase.includes("Variant مستقل موجودی نیستند"),
  null,
);
record(
  "phase scripts are registered",
  packageJson.includes('"audit:f6"') &&
    packageJson.includes('"test:f6"') &&
    packageJson.includes('"qa:visual:f6"') &&
    packageJson.includes('"verify:cumulative"'),
  null,
);
record(
  "workflow runs F6 once and verifies evidence",
  workflow.includes("F6 product detail completion audit") &&
    workflow.includes("F6 product detail browser behavior tests") &&
    workflow.includes("F6 product detail Visual QA") &&
    workflow.includes("Aggregate cumulative evidence verification"),
  null,
);

const trackedArtifacts = git("ls-files", "artifacts");
record("runtime artifacts are not tracked", trackedArtifacts.stdout === "", trackedArtifacts.stdout);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f6-product-detail-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
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
