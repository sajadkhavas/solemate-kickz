import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REPORT = path.join(ROOT, "artifacts/audits/f17-production-content.json");
const checks = [];
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
const record = (name, pass) => checks.push({ name, pass: Boolean(pass) });

const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").stdout.trim();
const doc = read("docs/content/PRODUCTION-CONTENT-CONTRACT.md");
const schema = JSON.parse(read("contracts/production-content.schema.json"));
const manifest = JSON.parse(read("content/production-content.json"));
const handoff = read("docs/handoffs/F17-PRODUCTION-CONTENT-CONTRACT.md");

record(
  "controlled lineage",
  /^phase\/sole-f17-/.test(branch) ||
    branch === "integration/sole-frontend-v2" ||
    process.env.CI === "true",
);
record(
  "F16 ancestor",
  git("merge-base", "--is-ancestor", "bb8fcad", "HEAD").status === 0 || process.env.CI === "true",
);
record(
  "publication states",
  ["draft", "in_review", "approved", "published", "archived"].every((state) =>
    JSON.stringify(schema).includes(`\"${state}\"`),
  ),
);
record(
  "source authority boundary",
  doc.includes("F16 is authoritative") && doc.includes("cannot override commercial truth"),
);
record(
  "commercial evidence gates",
  ["product-authority", "price-authority", "inventory-authority"].every(
    (kind) => JSON.stringify(schema).includes(kind) && doc.includes(kind),
  ),
);
record(
  "media rights and accessibility",
  doc.includes("ownership") &&
    doc.includes("license") &&
    doc.includes("alternative text") &&
    JSON.stringify(schema).includes("rightsEvidence"),
);
record(
  "safe editorial commerce linking",
  doc.includes("immutable backend product IDs") &&
    doc.includes("plain editorial content") &&
    doc.includes("must not expose price"),
);
record(
  "preview cache webhook safety",
  ["noindex", "cache", "signed", "replay-protected", "allowlist renderer"].every((term) =>
    doc.includes(term),
  ),
);
record(
  "demo fixtures fail closed",
  manifest.environment === "review" &&
    manifest.entries.length === 0 &&
    manifest.sources.every((source) => source.productionEligible === false),
);
record(
  "no fake production claim",
  handoff.includes("no CMS or production content is claimed") && doc.includes("does not claim"),
);
record(
  "lockfile unchanged",
  git("diff", "--name-only", "bb8fcad", "HEAD", "--", "bun.lock").stdout.trim() === "",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f17-production-content",
  generatedAt: new Date().toISOString(),
  branch,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) process.exitCode = 1;
