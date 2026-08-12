import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "953d03405ff21d02620a2b7ac3428713ac62de20";
const REPORT = path.join(ROOT, "artifacts/audits/f13-full-code-audit.json");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"]);
const MODULE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const checks = [];

function git(...args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function record(name, pass, evidence = null) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function trackedFiles() {
  const result = git("ls-files");
  if (result.status !== 0) throw new Error(result.stderr || "git ls-files failed");
  return result.stdout.split("\n").filter(Boolean);
}

const tracked = trackedFiles();
const codeFiles = tracked.filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)));
const shippingCode = codeFiles.filter(
  (file) => file.startsWith("src/") && file !== "src/routeTree.gen.ts",
);

const riskyPatterns = [
  { id: "dangerously-set-inner-html", regex: /dangerouslySetInnerHTML/g },
  { id: "direct-inner-html-write", regex: /\.innerHTML\s*=/g },
  { id: "javascript-url", regex: /javascript\s*:/gi },
  { id: "placeholder-hash-link", regex: /href\s*=\s*["']#["']/g },
  { id: "ts-ignore", regex: /@ts-ignore/g },
  { id: "ts-expect-error", regex: /@ts-expect-error/g },
];

const riskyFindings = [];
for (const file of shippingCode) {
  const source = read(file);
  for (const pattern of riskyPatterns) {
    const matches = source.match(pattern.regex);
    if (matches?.length) riskyFindings.push({ file, pattern: pattern.id, count: matches.length });
  }
}
record("shipping source has no high-risk escape hatches", riskyFindings.length === 0, riskyFindings);

const errorPage = read("src/lib/error-page.ts");
record(
  "catastrophic SSR fallback is Persian RTL and scriptless",
  errorPage.includes('<html lang="fa" dir="rtl">') &&
    errorPage.includes('name="robots" content="noindex, nofollow"') &&
    !/onclick\s*=|onload\s*=|<script/i.test(errorPage),
);

const server = read("src/server.ts");
record(
  "SSR entry import can recover after a transient import rejection",
  server.includes("serverEntryPromise = undefined") && server.includes(".catch((error) =>"),
);
record(
  "catastrophic SSR response is never cached",
  server.includes('"cache-control": "no-store"'),
);

const cartDomain = read("src/cart/cart-domain.ts");
const store = read("src/store/index.ts");
record(
  "persisted cart has safe quantity and line-count boundaries",
  cartDomain.includes("MAX_CART_ITEM_QUANTITY = 99") &&
    cartDomain.includes("MAX_PERSISTED_CART_LINES = 50") &&
    cartDomain.includes("Number.isSafeInteger") &&
    cartDomain.includes("Math.min(MAX_CART_ITEM_QUANTITY"),
);
record(
  "Zustand rehydration sanitizes persisted product IDs text and demo records",
  store.includes("sanitizeProductIds") &&
    store.includes("sanitizeSearchHistory") &&
    store.includes("sanitizeAuthUser") &&
    store.includes("sanitizeDemoAddresses") &&
    store.includes("MAX_SEARCH_HISTORY_TERM_LENGTH"),
);
record(
  "all cart write paths share the item quantity ceiling",
  store.includes("MAX_CART_ITEM_QUANTITY") &&
    store.includes("Math.min(MAX_CART_ITEM_QUANTITY, existing.qty + safeQty)"),
);

const purchasePanel = read("src/components/product/ProductPurchasePanel.tsx");
record(
  "PDP quantity control exposes the same cart ceiling",
  purchasePanel.includes("MAX_CART_ITEM_QUANTITY") &&
    purchasePanel.includes("max={MAX_CART_ITEM_QUANTITY}"),
);

const catalog = read("src/catalog/catalog-state.ts");
record(
  "catalog query strings are bounded before filtering",
  catalog.includes("CATALOG_QUERY_MAX_LENGTH = 120") &&
    catalog.includes("max(CATALOG_QUERY_MAX_LENGTH)"),
);

const importRegex = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const sourceModules = new Set(
  codeFiles.filter((file) => file.startsWith("src/") && MODULE_EXTENSIONS.includes(path.extname(file))),
);

function resolveModule(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? path.join("src", specifier.slice(2))
    : path.normalize(path.join(path.dirname(fromFile), specifier));
  const candidates = [
    base,
    ...MODULE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...MODULE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ].map((candidate) => candidate.split(path.sep).join("/"));
  return candidates.find((candidate) => sourceModules.has(candidate)) ?? null;
}

const edges = new Map();
const bareImports = new Set();
for (const file of sourceModules) {
  const source = read(file);
  const local = new Set();
  importRegex.lastIndex = 0;
  for (let match = importRegex.exec(source); match; match = importRegex.exec(source)) {
    const specifier = match[1] ?? match[2];
    const resolved = resolveModule(file, specifier);
    if (resolved) local.add(resolved);
    else if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
      const packageName = specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0];
      bareImports.add(packageName);
    }
  }
  edges.set(file, local);
}

const entrypoints = ["src/router.tsx", "src/server.ts"];
const reachable = new Set();
const queue = entrypoints.filter((entry) => sourceModules.has(entry));
while (queue.length) {
  const current = queue.shift();
  if (!current || reachable.has(current)) continue;
  reachable.add(current);
  for (const dependency of edges.get(current) ?? []) {
    if (!reachable.has(dependency)) queue.push(dependency);
  }
}

const unreachableModules = [...sourceModules]
  .filter((file) => !reachable.has(file) && file !== "src/routeTree.gen.ts")
  .sort();

const routeFiles = tracked.filter((file) => /^src\/routes\/.*\.tsx$/.test(file));
const duplicateRouteHeadOwners = routeFiles
  .filter((file) => /\bhead\s*:\s*\(/.test(read(file)))
  .sort();

const fileMetrics = codeFiles
  .map((file) => {
    const source = read(file);
    return {
      file,
      bytes: Buffer.byteLength(source),
      lines: source.split("\n").length,
    };
  })
  .sort((a, b) => b.bytes - a.bytes);

const packageJson = JSON.parse(read("package.json"));
const directDependencies = Object.keys(packageJson.dependencies ?? {});
const runtimePackagesNotImportedByReachableSource = directDependencies
  .filter((dependency) => !bareImports.has(dependency))
  .sort();

const workflow = read(".github/workflows/frontend-ci.yml");
const verifier = read("scripts/verify-cumulative-quality.mjs");
record(
  "F13 permanent audit and runtime gates are registered in Frontend CI",
  workflow.includes("F13 full-code source audit") && workflow.includes("F13 hardening browser behavior"),
);
record(
  "cumulative verifier requires both F13 evidence reports",
  verifier.includes('"f13-full-code-audit"') && verifier.includes('"f13-hardening"'),
);
record(
  "accepted Integration baseline remains an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
record(
  "runtime artifacts remain untracked",
  git("ls-files", "artifacts").stdout.trim() === "",
  git("ls-files", "artifacts").stdout.trim(),
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f13-full-code-audit",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  inventory: {
    trackedFiles: tracked.length,
    codeFiles: codeFiles.length,
    shippingCodeFiles: shippingCode.length,
    sourceModules: sourceModules.size,
    reachableSourceModules: reachable.size,
  },
  architecture: {
    entrypoints,
    unreachableModules,
    duplicateRouteHeadOwners,
    largestCodeFiles: fileMetrics.slice(0, 20),
    runtimePackagesNotImportedByReachableSource,
  },
  findings: {
    critical: riskyFindings,
    review: [
      ...unreachableModules.map((file) => ({ type: "unreachable-module", file })),
      ...duplicateRouteHeadOwners.map((file) => ({ type: "duplicate-route-head-owner", file })),
    ],
  },
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    reviewFindings: unreachableModules.length + duplicateRouteHeadOwners.length,
  },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (!report.pass) process.exitCode = 1;
