import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const failures = [];
const read = (file) => readFile(file, "utf8").catch(() => (failures.push(`missing ${file}`), ""));
const [release, rollback, ledger, health, validator, runtime, service, handoff, pkgRaw] =
  await Promise.all([
    read("scripts/deployment/release-immutable.sh"),
    read("scripts/deployment/rollback-release.sh"),
    read("scripts/deployment/release-ledger.mjs"),
    read("scripts/deployment/health-check-release.mjs"),
    read("scripts/deployment/validate-environment.mjs"),
    read("scripts/qa/production-runtime.mjs"),
    read("deploy/systemd/sole-frontend.service.example"),
    read("docs/handoffs/P00-PRODUCTION-FOUNDATION.md"),
    read("package.json"),
  ]);
const workflow = await read(".github/workflows/frontend-ci.yml");
const retryGate = await read("scripts/qa/retry-gate.mjs");

const requireText = (name, source, patterns) => {
  for (const pattern of patterns)
    if (!pattern.test(source)) failures.push(`${name} missing ${pattern}`);
};
requireText("immutable release", release, [
  /releases\/\$NEW_SHA/,
  /checkout --detach FETCH_HEAD/,
  /mv -Tf .*current/,
  /trap rollback ERR INT TERM/,
  /validate-environment\.mjs/,
  /health-check-release\.mjs/,
  /release-ledger\.mjs/,
]);
requireText("rollback", rollback, [
  /rollback target must be a full SHA/,
  /mv -Tf .*current/,
  /systemctl restart/,
]);
requireText("ledger", ledger, [
  /CURRENT_SHA/,
  /NEW_SHA/,
  /RELEASE_PATH/,
  /ROLLBACK_TARGET/,
  /HEALTH_CHECK_RESULT/,
]);
requireText("health", health, [/loopback-origin/, /public-origin/, /response\.status === 200/]);
requireText("environment", validator, [/unknown key/, /forbidden value/, /40-character Git SHA/]);
requireText("runtime", runtime, [
  /assertPortFree\("before QA"\)/,
  /terminateTree/,
  /assertPortFree\("after QA"\)/,
]);
if (!/KillMode=control-group/.test(service))
  failures.push("systemd process-group termination missing");
if (!handoff.includes("6566bdcb259cae3a853162f2072ce7a700f28845"))
  failures.push("P00 START_SHA missing");

let pkg = {};
try {
  pkg = JSON.parse(pkgRaw);
} catch {
  failures.push("invalid package.json");
}
if (pkg.scripts?.["audit:p00"] !== "node scripts/audit-p00-production-foundation.mjs")
  failures.push("audit:p00 script missing");
if (pkg.scripts?.["qa:production-runtime"] !== "node scripts/qa/production-runtime.mjs")
  failures.push("qa runtime script missing");
if (!/Production runtime smoke and port-leak gate[\s\S]*qa:production-runtime/.test(workflow))
  failures.push("CI production runtime and port-leak gate missing");
if ((workflow.match(/scripts\/qa\/retry-gate\.mjs/g) ?? []).length < 20)
  failures.push("browser and visual gates must use bounded retry orchestration");
requireText("retry gate", retryGate, [/attempt <= 2/, /spawnSync/, /attempt === 2/]);

for (const script of [
  "scripts/deployment/release-immutable.sh",
  "scripts/deployment/rollback-release.sh",
]) {
  try {
    execFileSync("bash", ["-n", script]);
  } catch {
    failures.push(`${script} syntax failed`);
  }
}

const temp = await mkdtemp(path.join(tmpdir(), "sole-p00-env-"));
try {
  const valid = path.join(temp, "production.env");
  await writeFile(
    valid,
    [
      "NODE_ENV=production",
      "SOLE_ENVIRONMENT=production",
      "SOLE_SITE_URL=https://sole.example.ir",
      "SOLE_API_URL=https://api.sole.example.ir",
      "SOLE_RELEASE_SHA=6566bdcb259cae3a853162f2072ce7a700f28845",
    ].join("\n"),
  );
  try {
    execFileSync(process.execPath, [
      "scripts/deployment/validate-environment.mjs",
      "production",
      valid,
    ]);
  } catch {
    failures.push("valid production environment rejected");
  }
  const invalid = path.join(temp, "invalid.env");
  await writeFile(
    invalid,
    "NODE_ENV=production\nSOLE_ENVIRONMENT=production\nSOLE_SITE_URL=http://localhost:3000\nSOLE_API_URL=https://example.com\nSOLE_RELEASE_SHA=test\n",
  );
  let rejected = false;
  try {
    execFileSync(process.execPath, [
      "scripts/deployment/validate-environment.mjs",
      "production",
      invalid,
    ]);
  } catch {
    rejected = true;
  }
  if (!rejected) failures.push("mock/test production environment was accepted");
} finally {
  await rm(temp, { recursive: true, force: true });
}

if (failures.length) {
  console.error("P00 production foundation audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("P00 production foundation audit passed.");
