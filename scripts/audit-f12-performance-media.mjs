import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "4e08af6f1b0ac6bde85f400601c27a22fd69506f";
const REPORT = path.join(ROOT, "artifacts/audits/f12-performance-media.json");
const checks = [];

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });

function record(name, pass, evidence = null) {
  checks.push({ name, pass: Boolean(pass), evidence });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}

const branch =
  process.env.GITHUB_HEAD_REF ||
  git("branch", "--show-current").stdout.trim() ||
  process.env.GITHUB_REF_NAME ||
  "detached";

record(
  "F12 runs on a controlled phase or Integration branch",
  /^phase\/sole-f12-/.test(branch) ||
    branch === "integration/sole-frontend-v2" ||
    process.env.CI === "true",
  branch,
);
record(
  "accepted F11 plus homepage Integration baseline is ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);

const shoes = read("src/data/shoes.ts");
const card = read("src/components/ShoeCard.tsx");
const gallery = read("src/components/product/ProductGallery.tsx");
const home = read("src/routes/index.tsx");
const viewer = read("src/components/ShoeViewer3D.tsx");
const workflow = read(".github/workflows/frontend-ci.yml");
const pkg = read("package.json");
const cumulative = read("scripts/verify-cumulative-quality.mjs");
const handoff = read("docs/handoffs/F12-PERFORMANCE-MEDIA.md");

record(
  "remote sneaker media requests modern negotiated formats",
  shoes.includes("auto=format") && shoes.includes("q=78"),
);
record(
  "catalog prioritizes only initial images and async-decodes all cards",
  card.includes('loading={priority ? "eager" : "lazy"}') &&
    card.includes('fetchPriority={priority ? "high" : "auto"}') &&
    card.includes('decoding="async"') &&
    (card.match(/priority=\{index < 2\}/g) ?? []).length >= 2,
);
record(
  "PDP main image is eager/high while thumbnails stay lazy/low",
  gallery.includes('testId="product-main-image"') &&
    gallery.includes('loading="eager"') &&
    gallery.includes('fetchPriority="high"') &&
    gallery.includes('fetchPriority="low"') &&
    gallery.includes('decoding="async"'),
);
record(
  "below-fold homepage work uses browser-native content visibility",
  home.includes('data-f12-content-visibility="auto"') &&
    home.includes("[content-visibility:auto]") &&
    home.includes("[contain-intrinsic-size:auto_900px]") &&
    [
      "<MerchandisingShowcase />",
      "<Categories />",
      "<BrandWall />",
      "<HypeSection />",
      "<TrustBadges />",
      "<Newsletter />",
    ].every((token) => home.includes(token)),
);
record(
  "hero 3D remains explicit opt-in and dynamically isolated",
  viewer.includes('data-testid="shoe-viewer-enable-3d"') &&
    viewer.includes('import("@google/model-viewer")') &&
    viewer.includes('import("@/lib/create-shoe-model")') &&
    viewer.includes("activated && inView && documentVisible") &&
    !viewer.includes('from "@google/model-viewer"'),
);

const assetDir = path.join(ROOT, "src/assets");
const raster = fs
  .readdirSync(assetDir)
  .filter((file) => /\.(?:jpe?g|png|webp|avif)$/i.test(file))
  .map((file) => ({ file, bytes: fs.statSync(path.join(assetDir, file)).size }));
const oversized = raster.filter((item) => item.bytes > 180_000);
record("local raster media stays under 180 kB per file", oversized.length === 0, {
  largest: [...raster].sort((a, b) => b.bytes - a.bytes).slice(0, 3),
  oversized,
});

record("F12 scripts are registered", pkg.includes('"audit:f12"') && pkg.includes('"qa:perf:f12"'));
record(
  "Frontend CI enforces F12 source and build budgets",
  workflow.includes("F12 performance/media source audit") &&
    workflow.includes("F12 build performance budgets"),
);
record("cumulative verifier requires F12 evidence", cumulative.includes('"f12-performance-media"'));
record(
  "handoff records baseline and budgets",
  handoff.includes("Baseline SHA") && handoff.includes("F12 budgets") && handoff.includes(BASELINE),
);
record(
  "lockfile is untouched",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout.trim() === "",
);
record("runtime artifacts are not tracked", git("ls-files", "artifacts").stdout.trim() === "");
record(
  "temporary F12 helpers are absent from the candidate tree",
  !fs.existsSync(path.join(ROOT, ".github/workflows/f12-implementation-once.yml")) &&
    !fs.existsSync(path.join(ROOT, ".github/workflows/f12-implementation-retry.yml")) &&
    !fs.existsSync(path.join(ROOT, "scripts/f12-apply-retry.py")),
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f12-performance-media",
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
if (failed.length) process.exitCode = 1;
