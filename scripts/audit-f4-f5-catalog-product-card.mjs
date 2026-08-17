import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE = "f51bd1b110491887da6007a25ec3bfd30e3ed06b";
const REPORT = path.join(ROOT, "artifacts/audits/f4-f5-catalog-product-card.json");

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

const branch =
  process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || git("branch", "--show-current");
const allowedBranch =
  branch === "phase/sole-f4-f5-catalog-product-card" ||
  branch === "integration/sole-frontend-v2" ||
  branch === "release/sole-frontend-v2-rc" ||
  branch.startsWith("phase/sole-f");

const products = read("src/routes/products.tsx");
const card = read("src/components/ShoeCard.tsx");
const state = read("src/catalog/catalog-state.ts");
const filters = read("src/components/catalog/CatalogFilters.tsx");
const quickView = read("src/components/catalog/QuickViewDialog.tsx");
const packageJson = JSON.parse(read("package.json"));
const trackedArtifacts = git("ls-files", "artifacts").split("\n").filter(Boolean);

const checks = [];
const check = (name, pass, evidence) => checks.push({ name, pass: Boolean(pass), evidence });

let baselineAncestor = false;
try {
  execFileSync("git", ["merge-base", "--is-ancestor", BASELINE, "HEAD"], { cwd: ROOT });
  baselineAncestor = true;
} catch {
  baselineAncestor = false;
}

check("branch is controlled", allowedBranch, branch);
check("accepted Integration baseline is an ancestor", baselineAncestor, BASELINE);
check("catalog state module exists", exists("src/catalog/catalog-state.ts"));
check("filter component exists", exists("src/components/catalog/CatalogFilters.tsx"));
check("quick view component exists", exists("src/components/catalog/QuickViewDialog.tsx"));
check("handoff exists", exists("docs/handoffs/F4-F5-CATALOG-PRODUCT-CARD.md"));
check(
  "all catalog filters are URL modeled",
  ["brand", "category", "q", "sort", "sizes", "priceMax", "quick", "view"].every((key) =>
    state.includes(`${key}:`),
  ),
);
check("catalog uses permanent filter function", products.includes("filterCatalog(SHOES, search)"));
check(
  "sizes are serialized in URL",
  products.includes("serialiseSizes") && state.includes("parseSizeParam"),
);
check(
  "catalog search draft synchronizes from URL",
  products.includes('useEffect(() => setLocalQuery(search.q ?? "")'),
);
check(
  "mobile filter uses an accessible dialog",
  products.includes("DialogPrimitive.Content") &&
    products.includes('data-testid="mobile-filter-dialog"'),
);
check("filter controls expose pressed state", filters.includes("aria-pressed"));
check("filter touch targets meet shared contract", filters.includes("min-h-11"));
check("catalog result count is announced", products.includes('aria-live="polite"'));
check("empty result state is implemented", products.includes("<EmptyState"));
check(
  "canonical catalog link exists",
  products.includes('rel: "canonical"') && products.includes('href: "/products"'),
);
check(
  "product card does not add arbitrary size",
  !card.includes("addToCart") && !card.includes("Math.floor(shoe.sizes.length / 2)"),
);
check(
  "quick view requires explicit size",
  quickView.includes("selectedSize === null") &&
    quickView.includes('data-testid="quick-view-size"'),
);
check("quick view add is guarded", quickView.includes("shoe.isSoldOut || selectedSize === null"));
check(
  "wishlist controls expose pressed state",
  card.includes("aria-pressed={isWishlisted}") && quickView.includes("aria-pressed={wishlisted}"),
);
check(
  "Product Card detail links meet the 44px target contract",
  card.includes("mt-1 flex min-h-11 w-full items-center rounded-sm") &&
    card.includes("mt-2 flex min-h-11 flex-col justify-center rounded-sm"),
);
check(
  "image failure states are present",
  card.includes("تصویر در دسترس نیست") && quickView.includes("پیش‌نمایش تصویر در دسترس نیست"),
);
check(
  "format gate includes F4-F5 files",
  String(packageJson.scripts?.["format:check"] ?? "").includes("catalog-state.ts"),
);
check(
  "aggregate gate includes F4-F5",
  String(packageJson.scripts?.check ?? "").includes("audit:f4-f5"),
);
check("runtime artifacts are not tracked", trackedArtifacts.length === 0, trackedArtifacts);

const failed = checks.filter((item) => !item.pass);
const report = {
  phase: "F4/F5",
  branch,
  baseline: BASELINE,
  head: git("rev-parse", "HEAD"),
  total: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  pass: failed.length === 0,
  checks,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);

for (const item of checks) {
  console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
}
console.log(`F4/F5 audit: ${report.passed}/${report.total}`);
if (failed.length) process.exit(1);
