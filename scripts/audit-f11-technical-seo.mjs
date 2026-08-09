import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "6da6036da3b7825ff7fa11bcd191d8872ddeb85c";
const OWNER_BRANCH = "phase/sole-f11-technical-seo";
const INTEGRATION_BRANCH = "integration/sole-frontend-v2";
const FORMAT_COMMIT_MESSAGE = "Normalize cumulative Prettier formatting";
const F3_FORMAT_FILE = "scripts/audit-f3-homepage.mjs";
const F3_FORMAT_COMMIT_MESSAGE = "Normalize F3 homepage audit formatting";
const REPORT = path.join(ROOT, "artifacts/audits/f11-technical-seo.json");
const checks = [];

const PHASE_FILES = new Set([
  ".github/workflows/frontend-ci.yml",
  "docs/handoffs/F11-TECHNICAL-SEO.md",
  "package.json",
  "scripts/audit-f2-navigation-search.mjs",
  F3_FORMAT_FILE,
  "scripts/audit-f7-cart-checkout.mjs",
  "scripts/audit-f11-technical-seo.mjs",
  "scripts/diagnose-f7-checkout-submit.mjs",
  "scripts/f11-browser-runner.mjs",
  "scripts/f11-seo-test-utils.mjs",
  "scripts/seo-qa-f11.mjs",
  "scripts/test-f11-technical-seo.mjs",
  "scripts/test-f4-f5-catalog-product-card.mjs",
  "scripts/test-f7-cart-checkout.mjs",
  "scripts/visual-qa-f6-product-detail.mjs",
  "scripts/test-f9-wishlist-account-orders.mjs",
  "scripts/verify-cumulative-quality.mjs",
  "src/router.tsx",
  "src/server.ts",
  "src/routes/product.$id.tsx",
  "src/routes/products.tsx",
  "src/seo/seo-config.ts",
  "src/seo/seo-head.ts",
  "src/seo/seo-server.ts",
]);

const FORMAT_CLEANUP_FILES = new Set([
  "docs/handoffs/F10-MOTION-3D-INTERACTION.md",
  "docs/handoffs/F11-TECHNICAL-SEO.md",
  "scripts/audit-deployment-readiness.mjs",
  "scripts/audit-f10-motion-3d.mjs",
  "scripts/audit-f11-technical-seo.mjs",
  "scripts/audit-f6-product-detail.mjs",
  "scripts/audit-f7-cart-checkout.mjs",
  "scripts/deployment/build-node-server.mjs",
  "scripts/deployment/smoke-node-server.mjs",
  "scripts/f11-browser-runner.mjs",
  "scripts/f11-seo-test-utils.mjs",
  "scripts/f6-browser-runner.mjs",
  "scripts/f7-browser-runner.mjs",
  "scripts/run-browser-check.mjs",
  "scripts/seo-qa-f11.mjs",
  "scripts/test-f10-motion-3d.mjs",
  "scripts/test-f11-technical-seo.mjs",
  "scripts/test-f4-f5-catalog-product-card.mjs",
  "scripts/test-f6-product-detail.mjs",
  "scripts/test-f7-cart-checkout.mjs",
  "scripts/visual-qa-f10-motion-3d.mjs",
  "scripts/visual-qa-f6-product-detail.mjs",
  "scripts/visual-qa-f7-cart-checkout.mjs",
  "src/cart/cart-domain.ts",
  "src/checkout/checkout-domain.ts",
  "src/components/CartDrawer.tsx",
  "src/components/KineticText.tsx",
  "src/components/ShoeViewer3D.tsx",
  "src/components/product/ProductGallery.tsx",
  "src/components/product/ProductPurchasePanel.tsx",
  "src/components/product/SizeGuideDialog.tsx",
  "src/components/ui/commerce-primitives.tsx",
  "src/lib/create-shoe-model.ts",
  "src/lib/motion-system.ts",
  "src/routes/cart.tsx",
  "src/routes/checkout.tsx",
  "src/routes/product.$id.tsx",
  "src/seo/seo-config.ts",
  "src/seo/seo-head.ts",
  "src/store/index.ts",
]);

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
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function lines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBaselineFile(relativePath) {
  const baseline = spawnSync("git", ["show", `${BASELINE}:${relativePath}`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (baseline.status !== 0) {
    return { pass: false, reason: baseline.stderr.trim() || "baseline file unavailable" };
  }

  const prettierBin = path.join(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prettier.cmd" : "prettier",
  );
  const formatted = spawnSync(prettierBin, ["--stdin-filepath", relativePath], {
    cwd: ROOT,
    encoding: "utf8",
    input: baseline.stdout,
  });
  if (formatted.status !== 0) {
    return { pass: false, reason: formatted.stderr.trim() || "Prettier failed" };
  }

  const current = read(relativePath);
  return {
    pass: formatted.stdout === current,
    reason:
      formatted.stdout === current ? null : "final file differs from formatted accepted baseline",
  };
}

const f3FormatComparison = formatBaselineFile(F3_FORMAT_FILE);
record(
  "F3 homepage audit final content is formatting-only versus the accepted baseline",
  f3FormatComparison.pass,
  f3FormatComparison,
);
const f3FormatSubjects = lines(
  git("log", "--format=%s", `${BASELINE}..HEAD`, "--", F3_FORMAT_FILE).stdout,
);
record(
  "F3 homepage audit changed only through the supervised formatting commit",
  f3FormatSubjects.length === 1 && f3FormatSubjects[0] === F3_FORMAT_COMMIT_MESSAGE,
  f3FormatSubjects,
);

const requiredFiles = [
  "src/seo/seo-config.ts",
  "src/seo/seo-head.ts",
  "src/seo/seo-server.ts",
  "src/server.ts",
  "src/routes/products.tsx",
  "scripts/f11-browser-runner.mjs",
  "scripts/f11-seo-test-utils.mjs",
  "scripts/audit-f11-technical-seo.mjs",
  "scripts/test-f11-technical-seo.mjs",
  "scripts/seo-qa-f11.mjs",
  "docs/handoffs/F11-TECHNICAL-SEO.md",
];
for (const file of requiredFiles) record(`${file} exists`, exists(file), file);

const branchResult = git("branch", "--show-current");
const branch =
  process.env.GITHUB_HEAD_REF || branchResult.stdout || process.env.GITHUB_REF_NAME || "detached";
record(
  "controlled F11 or Integration branch",
  branch === OWNER_BRANCH || branch === INTEGRATION_BRANCH || process.env.CI === "true",
  branch,
);
record(
  "accepted F10 Integration baseline is ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
record(
  "generated route tree is untouched",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "src/routeTree.gen.ts").stdout === "",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "src/routeTree.gen.ts").stdout,
);
record(
  "lockfile is untouched",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout === "",
);
record(
  "shared browser harness remains exactly at the accepted baseline",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "scripts/browser-harness.mjs").stdout === "",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "scripts/browser-harness.mjs").stdout,
);

const formatCommits = lines(
  git("log", "--format=%H", `--grep=^${FORMAT_COMMIT_MESSAGE}$`, `${BASELINE}..HEAD`).stdout,
);
record(
  "exactly one supervisor cumulative formatting commit exists",
  formatCommits.length === 1,
  formatCommits,
);
const formatCommit = formatCommits[0] ?? null;
const formatCommitFiles = formatCommit
  ? lines(git("diff-tree", "--no-commit-id", "--name-only", "-r", formatCommit).stdout).sort()
  : [];
const expectedFormatCommitFiles = [
  ".github/workflows/f11-format-once.yml",
  ...FORMAT_CLEANUP_FILES,
].sort();
record(
  "formatter commit changed only the reported cumulative files and removed its one-time workflow",
  JSON.stringify(formatCommitFiles) === JSON.stringify(expectedFormatCommitFiles),
  { expected: expectedFormatCommitFiles, actual: formatCommitFiles },
);

const inheritedFormatFiles = [...FORMAT_CLEANUP_FILES].filter((file) => !PHASE_FILES.has(file));
const inheritedFormatComparisons = inheritedFormatFiles.map((file) => ({
  file,
  ...formatBaselineFile(file),
}));
const inheritedFormatViolations = inheritedFormatComparisons.filter((entry) => !entry.pass);
record(
  "inherited cumulative-format files equal the Prettier-formatted accepted baseline",
  inheritedFormatViolations.length === 0,
  inheritedFormatViolations,
);
const purchasePanelComparison = inheritedFormatComparisons.find(
  (entry) => entry.file === "src/components/product/ProductPurchasePanel.tsx",
);
record(
  "ProductPurchasePanel final content is formatting-only versus the accepted baseline",
  purchasePanelComparison?.pass === true,
  purchasePanelComparison ?? null,
);
record(
  "one-time formatting workflow is absent from final tree",
  git("ls-files", ".github/workflows/f11-format-once.yml").stdout === "",
  git("ls-files", ".github/workflows/f11-format-once.yml").stdout,
);

const routeTree = read("src/routeTree.gen.ts");
const routeSet = [
  "/",
  "/about",
  "/account",
  "/auth",
  "/brands",
  "/cart",
  "/checkout",
  "/products",
  "/wishlist",
  "/product/$id",
];
record(
  "current route surface is preserved",
  routeSet.every((route) => routeTree.includes(`'${route}'`)),
  routeSet.filter((route) => !routeTree.includes(`'${route}'`)),
);

const config = read("src/seo/seo-config.ts");
const head = read("src/seo/seo-head.ts");
const serverSeo = read("src/seo/seo-server.ts");
const serverEntry = read("src/server.ts");
const router = read("src/router.tsx");
const catalogRoute = read("src/routes/products.tsx");
const productRoute = read("src/routes/product.$id.tsx");
const shoeCard = read("src/components/ShoeCard.tsx");
const rootRoute = read("src/routes/__root.tsx");
const packageJson = read("package.json");
const workflow = read(".github/workflows/frontend-ci.yml");
const cumulative = read("scripts/verify-cumulative-quality.mjs");
const f11TestUtils = read("scripts/f11-seo-test-utils.mjs");
const f11Runtime = read("scripts/test-f11-technical-seo.mjs");
const catalogBehavior = read("scripts/test-f4-f5-catalog-product-card.mjs");
const f7Audit = read("scripts/audit-f7-cart-checkout.mjs");
const f6Visual = read("scripts/visual-qa-f6-product-detail.mjs");
const f7Behavior = read("scripts/test-f7-cart-checkout.mjs");
const f9Behavior = read("scripts/test-f9-wishlist-account-orders.mjs");
const handoff = read("docs/handoffs/F11-TECHNICAL-SEO.md");

const utilityStart = head.indexOf("function utilityHead");
const utilityEnd = head.indexOf("function productHead");
const utilitySegment =
  utilityStart >= 0 && utilityEnd > utilityStart ? head.slice(utilityStart, utilityEnd) : "";

record(
  "Site URL is environment configured normalized and rejects local origins",
  config.includes('SITE_URL_ENV_NAME = "VITE_SITE_URL"') &&
    config.includes("import.meta.env.VITE_SITE_URL") &&
    config.includes("normalizeHostname") &&
    config.includes('hostname.endsWith(".localhost")') &&
    config.includes('hostname.endsWith(".local")') &&
    config.includes("isPrivateIpv4") &&
    config.includes("isNonPublicIpv6") &&
    !config.includes("example.com"),
  null,
);
record(
  "JSON-LD serializer escapes script-breaking less-than characters",
  config.includes("safeJsonLd") && /replace\(\/<\/g/.test(config) && config.includes("u003c"),
  null,
);
record(
  "indexation matrix explicitly covers every route",
  routeSet.every((route) => head.includes(`"${route}"`)) &&
    head.includes('"/products": "demo-catalog"') &&
    head.includes('"/product/$id": "demo-product"'),
  null,
);
record(
  "utility routes are noindex without homepage canonical",
  utilitySegment.length > 0 &&
    ["/auth", "/cart", "/checkout", "/wishlist", "/account"].every((route) =>
      head.includes(`"${route}"`),
    ) &&
    utilitySegment.includes('{ name: "robots", content: "noindex, follow" }') &&
    !utilitySegment.includes('rel: "canonical"'),
  utilitySegment || "utilityHead segment missing",
);
record(
  "demo catalog and products are held out of index and sitemap",
  head.includes('pathname !== "/products"') &&
    head.includes('{ name: "robots", content: "noindex, follow" }') &&
    serverSeo.includes('SITEMAP_PATHS = ["/", "/about", "/brands"]'),
  null,
);
record(
  "catalog strips default search values from generated URLs",
  catalogRoute.includes("stripSearchParams") &&
    catalogRoute.includes('sort: "newest"') &&
    catalogRoute.includes('quick: "all"') &&
    catalogRoute.includes('view: "grid"') &&
    catalogRoute.includes("middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)]"),
  null,
);
record(
  "canonical and OG URL are emitted only from validated Site URL",
  head.includes("const canonical = toSiteUrl") &&
    head.includes('links.push({ rel: "canonical", href: canonical })') &&
    head.includes('{ property: "og:url", content: canonical }'),
  null,
);
record(
  "route-specific title description OG and Twitter metadata exist",
  head.includes('name: "description"') &&
    head.includes('property: "og:title"') &&
    head.includes('property: "og:description"') &&
    head.includes('name: "twitter:card"') &&
    head.includes('name: "twitter:title"') &&
    head.includes('name: "twitter:description"'),
  null,
);
record(
  "structured data is minimal and SSR-head managed",
  head.includes('type: "application/ld+json"') &&
    head.includes('"@type": "WebSite"') &&
    head.includes('"@type": "BreadcrumbList"') &&
    head.includes("safeJsonLd"),
  null,
);
const forbiddenSchema = [
  "Offer",
  "AggregateRating",
  "Review",
  "availability",
  "priceCurrency",
  "shippingDetails",
  "hasMerchantReturnPolicy",
  "seller",
];
record(
  "no fake merchant or review structured data",
  forbiddenSchema.every((key) => !head.includes(`"${key}"`)),
  forbiddenSchema.filter((key) => head.includes(`"${key}"`)),
);
record(
  "robots and sitemap are server-served without route-tree additions",
  serverEntry.includes("createSeoInfrastructureResponse") &&
    serverSeo.includes('url.pathname === "/robots.txt"') &&
    serverSeo.includes('url.pathname === "/sitemap.xml"') &&
    serverSeo.includes('"Allow: /"') &&
    !serverSeo.includes('"Disallow: /"'),
  null,
);
record(
  "baseline catastrophic SSR error normalization is preserved",
  serverEntry.includes('import "./lib/error-capture"') &&
    serverEntry.includes("consumeLastCapturedError") &&
    serverEntry.includes("renderErrorPage") &&
    serverEntry.includes("normalizeCatastrophicSsrResponse") &&
    serverEntry.includes("withErrorNoindex(normalized)"),
  null,
);
record(
  "4xx and 5xx responses receive X-Robots-Tag noindex",
  serverEntry.includes("withErrorNoindex") &&
    serverSeo.includes('headers.set("x-robots-tag", "noindex, follow")'),
  null,
);
record(
  "SEO heads are installed centrally without generated route edits",
  router.includes("installSeoRouteHeads();") && router.includes("routeTree"),
  null,
);
record(
  "invalid products use TanStack notFound semantics",
  productRoute.includes("throw notFound()") && productRoute.includes("SHOES.find"),
  null,
);
record(
  "global skip target is unique and PDP keeps semantic main landmarks",
  rootRoute.includes('href="#main-content"') &&
    rootRoute.includes('id="main-content"') &&
    !productRoute.includes('id="main-content"') &&
    !productRoute.includes("tabIndex={-1}") &&
    productRoute.includes("function ProductNotFound") &&
    productRoute.includes("function ProductPage") &&
    (productRoute.match(/<main/g) ?? []).length >= 2,
  null,
);
record(
  "catalog product discovery remains crawlable through real Links",
  shoeCard.includes("<Link") && shoeCard.includes('to: "/product/$id"'),
  null,
);
record(
  "Persian RTL document contract remains intact",
  rootRoute.includes('<html lang="fa" dir="rtl"'),
);
record(
  "F11 SSR helper only follows bounded same-origin redirects",
  f11TestUtils.includes("target.origin !== base.origin") &&
    f11TestUtils.includes("Unsafe cross-origin redirect") &&
    f11TestUtils.includes("maxRedirects = 5") &&
    f11TestUtils.includes('redirect: "manual"') &&
    f11TestUtils.includes("redirects.push"),
  null,
);
record(
  "F11 runtime verifies clean catalog URLs and safe redirect normalization",
  f11Runtime.includes("clean catalog URL is direct 200") &&
    f11Runtime.includes("default sort is removed from final URL") &&
    f11Runtime.includes("unknown query is removed from final URL") &&
    f11Runtime.includes("redirect chain never masquerades as homepage"),
  null,
);
record(
  "inherited mobile catalog gate uses scoped visible-event activation",
  catalogBehavior.includes("async function activateVisibleText") &&
    catalogBehavior.includes("mobile-filter-trigger") &&
    catalogBehavior.includes("mobile-filter-dialog") &&
    catalogBehavior.includes("apply-mobile-filters"),
  null,
);
record(
  "inherited F7 branch guard remains strict and forward-compatible",
  f7Audit.includes("const CONTROLLED_PHASE = /^phase\\/sole-f") &&
    f7Audit.includes("CONTROLLED_PHASE.test(branch)") &&
    f7Audit.includes('git("merge-base", "--is-ancestor", BASELINE, "HEAD")'),
  null,
);
record(
  "F6 fallback visual QA deterministically exercises image-error fallback",
  f6Visual.includes("async function ensureMainImageFallback") &&
    f6Visual.includes("aria-selected") &&
    f6Visual.includes("Product gallery did not hydrate before fallback QA") &&
    f6Visual.includes("data:image/png;base64,@@@") &&
    f6Visual.includes("await ensureMainImageFallback(client)") &&
    f6Visual.includes("product-main-image-fallback"),
  null,
);

record(
  "inherited F7 variant selection remains committed before add",
  f7Behavior.includes("async function selectProductSize") &&
    f7Behavior.includes("getAttribute('aria-pressed') === 'true'") &&
    f7Behavior.includes("Duplicate product and size merge into one line") &&
    f7Behavior.includes("Cart identity is variant-aware by product and size"),
  null,
);
record(
  "inherited F9 keyboard and hydration assertions remain strict",
  f9Behavior.includes('type: "keyDown"') &&
    f9Behavior.includes("windowsVirtualKeyCode") &&
    f9Behavior.includes('const text = key === "Enter" ? "\\r"') &&
    f9Behavior.includes("Wishlist clear action works from keyboard and persists") &&
    f9Behavior.includes("getAttribute('aria-pressed') === 'true'") &&
    f9Behavior.includes("ProductCard reflects PDP wishlist state"),
  null,
);
record(
  "F11 package commands and aggregate check are registered",
  packageJson.includes('"audit:f11": "node scripts/audit-f11-technical-seo.mjs"') &&
    packageJson.includes('"test:f11": "node scripts/test-f11-technical-seo.mjs"') &&
    packageJson.includes('"qa:seo:f11": "node scripts/seo-qa-f11.mjs"') &&
    packageJson.includes("bun run audit:f11") &&
    packageJson.includes("bun run test:f11") &&
    packageJson.includes("bun run qa:seo:f11"),
  null,
);
record(
  "Frontend CI runs all F11 gates",
  workflow.includes("F11 technical SEO completion audit") &&
    workflow.includes("F11 SSR SEO runtime tests") &&
    workflow.includes("F11 SEO safety QA"),
  null,
);
record("cumulative verifier requires F11 evidence", cumulative.includes('"f11-technical-seo"'));
record(
  "handoff records required F11 policies and validation sections",
  /Baseline SHA/.test(handoff) &&
    /Route indexation matrix/.test(handoff) &&
    /Canonical policy/.test(handoff) &&
    /Site URL configuration/.test(handoff) &&
    /Query\/facet policy/.test(handoff) &&
    /robots\.txt policy/.test(handoff) &&
    /Sitemap policy/.test(handoff) &&
    /Structured data policy/.test(handoff) &&
    /SSR validation/.test(handoff) &&
    /Regression audit/.test(handoff),
  handoff ? "content checked" : "missing",
);

const changed = lines(git("diff", "--name-only", BASELINE, "HEAD").stdout);
const allowedFiles = new Set([...PHASE_FILES, ...FORMAT_CLEANUP_FILES]);
const outOfScope = changed.filter((file) => !allowedFiles.has(file));
record(
  "diff stays inside F11 regression scope plus the constrained formatter cleanup",
  outOfScope.length === 0,
  outOfScope,
);
record(
  "runtime artifacts are not tracked",
  git("ls-files", "artifacts").stdout === "",
  git("ls-files", "artifacts").stdout,
);
record(
  "no temporary F11 development or formatter workflow is tracked",
  git(
    "ls-files",
    ".github/workflows/*f11*dev*",
    ".github/workflows/*acceptance*dev*",
    ".github/workflows/f11-format-once.yml",
  ).stdout === "",
  null,
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f11-technical-seo-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  branch,
  formatCommit,
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
