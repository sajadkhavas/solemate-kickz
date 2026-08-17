import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BASELINE = "f4048c9af4d43960b67e08a72f9592e4f7d89354";
const REPORT = path.join(ROOT, "artifacts/audits/f18-final-acceptance.json");
const checks = [];
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
const record = (name, pass, evidence = null) =>
  checks.push({ name, pass: Boolean(pass), evidence });

const branch = process.env.GITHUB_HEAD_REF || git("branch", "--show-current").stdout.trim();
const packageJson = JSON.parse(read("package.json"));
const workflow = read(".github/workflows/frontend-ci.yml");
const verifier = read("scripts/verify-cumulative-quality.mjs");
const handoff = read("docs/handoffs/F18-FINAL-FRONTEND-ACCEPTANCE.md");

record(
  "controlled F18 lineage",
  /^phase\/sole-f18-/.test(branch) ||
    branch === "integration/sole-frontend-v2" ||
    branch === "main" ||
    process.env.CI === "true",
  branch,
);
record(
  "accepted F17 Integration is an ancestor",
  git("merge-base", "--is-ancestor", BASELINE, "HEAD").status === 0,
  BASELINE,
);
record(
  "all permanent phase audits are in the aggregate command",
  [
    "audit:f0-f1",
    "audit:f2",
    "audit:f8",
    "audit:f4-f5",
    "audit:f6",
    "audit:f7",
    "audit:f9",
    "audit:f10",
    "audit:f11",
    "audit:f12",
    "audit:f13",
    "audit:f14",
    "audit:f15",
    "audit:f16",
    "audit:f17",
    "audit:f18",
  ].every((script) => packageJson.scripts.check.includes(`bun run ${script}`)),
);
record(
  "F13 hardening behavior is in the aggregate command",
  packageJson.scripts.check.includes("bun run test:f13"),
);
record(
  "CI uses pinned project runtimes",
  workflow.includes('node-version: "22.23.1"') && workflow.includes('bun-version: "1.3.14"'),
);
record(
  "CI is read-only and covers final release gates",
  workflow.includes("contents: read") &&
    workflow.includes("F18 final frontend acceptance audit") &&
    workflow.includes("VPS Node-server build") &&
    workflow.includes("bun run verify:cumulative"),
);
record(
  "cumulative verifier requires F0 through F18 evidence",
  [
    "f0-f1-foundation",
    "f13-full-code-audit",
    "f17-production-content",
    "f18-final-acceptance",
  ].every((fragment) => verifier.includes(`"${fragment}"`)),
);
record(
  "release handoff preserves production truth boundaries",
  handoff.includes("Backend and server acceptance remain separate") &&
    handoff.includes("does not claim production commerce readiness"),
);
record(
  "runtime evidence remains untracked",
  git("ls-files", "artifacts", ".output", "node_modules").stdout.trim() === "",
);
record(
  "no lockfile drift in F18",
  git("diff", "--name-only", BASELINE, "HEAD", "--", "bun.lock").stdout.trim() === "",
);

const failed = checks.filter((check) => !check.pass);
const report = {
  schemaVersion: 1,
  suite: "f18-final-acceptance",
  generatedAt: new Date().toISOString(),
  baseline: BASELINE,
  branch,
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failed.length) process.exitCode = 1;
