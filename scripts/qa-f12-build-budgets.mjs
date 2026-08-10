import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, ".output/public/assets");
const REPORT = path.join(ROOT, "artifacts/reports/f12-performance-media-budget.json");

if (!fs.existsSync(ASSETS)) {
  throw new Error("Production client assets are missing; run bun run build first.");
}

const files = fs
  .readdirSync(ASSETS)
  .filter((file) => fs.statSync(path.join(ASSETS, file)).isFile());

function metric(file) {
  const bytes = fs.readFileSync(path.join(ASSETS, file));
  return {
    file,
    bytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
  };
}

const js = files.filter((file) => file.endsWith(".js")).map(metric);
const css = files.filter((file) => file.endsWith(".css")).map(metric);
const home = js
  .filter((item) => /^index-.*\.js$/.test(item.file))
  .sort((a, b) => b.bytes - a.bytes)[0];
const modelViewer = js.find((item) => /^model-viewer-.*\.js$/.test(item.file));
const globalCss = css
  .filter((item) => /^styles-.*\.css$/.test(item.file))
  .sort((a, b) => b.bytes - a.bytes)[0];
const non3dMax = js
  .filter((item) => !/^model-viewer-/.test(item.file))
  .sort((a, b) => b.bytes - a.bytes)[0];

const checks = [
  { name: "homepage route chunk exists", pass: Boolean(home), evidence: home ?? null },
  {
    name: "homepage minified budget <= 610 kB",
    pass: Boolean(home && home.bytes <= 610_000),
    evidence: home ?? null,
  },
  {
    name: "homepage gzip budget <= 190 kB",
    pass: Boolean(home && home.gzipBytes <= 190_000),
    evidence: home ?? null,
  },
  {
    name: "largest non-3D JS chunk <= 650 kB",
    pass: Boolean(non3dMax && non3dMax.bytes <= 650_000),
    evidence: non3dMax ?? null,
  },
  {
    name: "model-viewer remains isolated",
    pass: Boolean(modelViewer),
    evidence: modelViewer ?? null,
  },
  {
    name: "global CSS minified budget <= 125 kB",
    pass: Boolean(globalCss && globalCss.bytes <= 125_000),
    evidence: globalCss ?? null,
  },
  {
    name: "global CSS gzip budget <= 22 kB",
    pass: Boolean(globalCss && globalCss.gzipBytes <= 22_000),
    evidence: globalCss ?? null,
  },
];

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f12-performance-media-budget",
  generatedAt: new Date().toISOString(),
  budgets: {
    homeBytes: 610_000,
    homeGzipBytes: 190_000,
    maxNon3dBytes: 650_000,
    globalCssBytes: 125_000,
    globalCssGzipBytes: 22_000,
  },
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  },
  metrics: { home, modelViewer, globalCss, non3dMax },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
if (failed.length) process.exitCode = 1;
