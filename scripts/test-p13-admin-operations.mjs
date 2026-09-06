import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contract = JSON.parse(
  fs.readFileSync(path.join(root, "contracts/p13-admin-operations.json"), "utf8"),
);
const checks = [];
const check = (name, callback) => {
  try {
    callback();
    checks.push({ name, pass: true });
  } catch (error) {
    checks.push({
      name,
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

check("all ten operational resources are registered once", () => {
  assert.equal(contract.resources.length, 10);
  assert.equal(new Set(contract.resources).size, 10);
});
check("P13 is pre-server", () => assert.equal(contract.serverRequired, false));
check("generic financial/state editing is forbidden", () => {
  assert.equal(contract.mutationRules.genericEditForbidden, true);
  assert.equal(contract.mutationRules.genericDeleteForbidden, true);
  assert.equal(contract.mutationRules.browserFinancialAuthority, false);
});
check("mutations require authorization, locks, state machines and audit", () => {
  assert.equal(contract.mutationRules.explicitPermissionRequired, true);
  assert.equal(contract.mutationRules.databaseLockRequired, true);
  assert.equal(contract.mutationRules.domainStateMachineRequired, true);
  assert.equal(contract.mutationRules.appendOnlyAuditRequired, true);
});

const failed = checks.filter((entry) => !entry.pass);
const report = {
  schemaVersion: 1,
  suite: "p13-admin-operations-contract",
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  pass: failed.length === 0,
};
fs.mkdirSync(path.join(root, "artifacts/reports"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/reports/p13-admin-operations-contract.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report));
if (failed.length) process.exit(1);
