import { readFile } from "node:fs/promises";

const failures = [];

async function text(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    failures.push(`missing ${path}`);
    return "";
  }
}

const [constitution, roadmap, registryRaw, service, workflow, packageRaw] = await Promise.all([
  text("docs/production/PRODUCTION-ENGINEERING-CONSTITUTION.md"),
  text("docs/roadmaps/SOLE-PRODUCTION-COMPLETION-PROGRAM.md"),
  text("contracts/production-phase-registry.json"),
  text("deploy/systemd/sole-frontend.service.example"),
  text(".github/workflows/frontend-ci.yml"),
  text("package.json"),
]);

let registry;
let pkg;
try {
  registry = JSON.parse(registryRaw);
} catch {
  failures.push("production phase registry must be valid JSON");
}
try {
  pkg = JSON.parse(packageRaw);
} catch {
  failures.push("package.json must be valid JSON");
}

const requiredRules = [
  "Direct work on `main` is forbidden",
  "/var/www/sole/",
  "development",
  "preview",
  "production",
  "typecheck",
  "Playwright regression",
  "KillMode=control-group",
  "canonical URL policy",
  "Core Web Vitals",
  "CURRENT_SHA",
  "NEW_SHA",
  "RELEASE_PATH",
  "ROLLBACK_TARGET",
  "HEALTH_CHECK_RESULT",
];
for (const rule of requiredRules) {
  if (!constitution.includes(rule)) failures.push(`constitution missing: ${rule}`);
}

if (registry?.baseline?.sha !== "6bb540d84ef3952937e03fee5b657b1446b02f47") {
  failures.push("program baseline SHA changed unexpectedly");
}
if (registry?.phases?.length !== 15) failures.push("registry must contain P00-P14");
for (const [index, phase] of (registry?.phases ?? []).entries()) {
  const expected = `P${String(index).padStart(2, "0")}`;
  if (phase.id !== expected) failures.push(`expected ${expected} at registry index ${index}`);
  if (phase.status !== "registered") failures.push(`${phase.id} must begin as registered`);
  if (!roadmap.includes(`### ${phase.id}`)) failures.push(`roadmap missing ${phase.id}`);
}

for (const field of ["START_SHA", "END_SHA", "QA_RESULT", "ROLLBACK_IMPACT"]) {
  if (!registry?.requiredPhaseEvidence?.includes(field)) {
    failures.push(`phase evidence missing ${field}`);
  }
}
for (const field of [
  "CURRENT_SHA",
  "NEW_SHA",
  "RELEASE_PATH",
  "ROLLBACK_TARGET",
  "HEALTH_CHECK_RESULT",
]) {
  if (!registry?.requiredReleaseEvidence?.includes(field)) {
    failures.push(`release evidence missing ${field}`);
  }
}

if (!/KillMode=control-group/.test(service)) {
  failures.push("systemd service must use KillMode=control-group");
}
if (!/Production program contract audit[\s\S]*audit:production-program/.test(workflow)) {
  failures.push("CI must run the production program audit");
}
if (pkg?.scripts?.["audit:production-program"] !== "node scripts/audit-production-program.mjs") {
  failures.push("package script audit:production-program is missing");
}

if (failures.length) {
  console.error("Production program audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production program audit passed: P00-P14 and binding release rules are registered.");
